import { useRef, useEffect, useCallback, useState } from "react";

const W = 800, H = 600, BALL_R = 6, BALL_SPEED = 11, GRAVITY = 0.06;
const BLK_W = 56, BLK_H = 34, BLK_GAP = 4, MAX_BALLS = 8;
const START_LIVES = 3, CRIT_CHANCE = 0.12, CHARGE_RATE = 0.02;
const MAX_POWER = 2.0, MIN_POWER = 0.6, CANNON_SPEED = 5;
const CANNON_Y = H - 55, CANNON_R = 20, CANNON_DECEL = 0.88;
const HEAT_PER_SHOT = 0.14, HEAT_DECAY = 0.003, OVERHEAT_TH = 1.0, OVERHEAT_LOCK = 130;
const DESCENT_BASE = 0.04, DEATH_LINE = H - 90;
const MISS_COMBO = 3, MISS_LIFE = 5;
const SPIKE_INTERVAL = 1800, SPIKE_DUR = 300;
const ENEMY_BASE_INTERVAL = 180, ENEMY_R = 8;
const SHIELD_DUR = 60, SHIELD_CD = 300;

const SKIN_VIS = [
    { barrel: "#00b8cc", glow: "#00f0ff", particles: false, trail: false, aura: false },
    { barrel: "#cd7f32", glow: "#daa520", particles: false, trail: false, aura: false },
    { barrel: "#c0c0c0", glow: "#e8e8ff", particles: false, trail: true, aura: false },
    { barrel: "#ffd700", glow: "#ffaa00", particles: true, trail: true, aura: false },
    { barrel: "#ff00ff", glow: "#cc00ff", particles: true, trail: true, aura: true },
    { barrel: "#00ffcc", glow: "#00ff88", particles: true, trail: true, aura: true },
];

function genTower(level, adapt) {
    const rows = Math.min(3 + level, 9), cols = Math.min(2 + Math.floor(level / 2), 6);
    const blocks = [], tw = cols * (BLK_W + BLK_GAP) - BLK_GAP, sx = (W - tw) / 2, gap = 170 + level * 12;
    const sc = 0.05 + (adapt?.shield || 0);
    for (let r = 0; r < rows; r++)for (let c = 0; c < cols; c++) {
        const hp = level + 1 + Math.floor(r / 2), osc = level >= 3 && r % 3 === 0;
        let bt = 0; const rng = Math.random();
        if (level >= 2 && rng < 0.08) bt = 1; else if (level >= 3 && rng < 0.08 + sc) bt = 2;
        else if (level >= 4 && rng < 0.18 + sc) bt = 3; else if (level >= 5 && rng < 0.24 + sc) bt = 4;
        const cols2 = { 0: `hsl(${(r * 40 + c * 60 + level * 20) % 360},80%,55%)`, 1: "#ff3333", 2: "#3399ff", 3: "#aa44ff", 4: "#ffcc00" };
        blocks.push({
            x: sx + c * (BLK_W + BLK_GAP), baseX: sx + c * (BLK_W + BLK_GAP), y: CANNON_Y - gap - r * (BLK_H + BLK_GAP),
            w: BLK_W, h: BLK_H, hp, maxHp: hp + (bt === 2 ? 3 : 0), color: cols2[bt], osc, oscP: Math.random() * Math.PI * 2,
            oscS: 0.02 + level * 0.004, oscR: 12 + level * 2.5, bt, shieldHits: 0, shieldWin: 0, regenT: 0
        });
    }
    return blocks;
}

export default function GameCanvas({ onScoreUpdate, onGameOver, isPlaying, skinTier = 0 }) {
    const canvasRef = useRef(null), sRef = useRef(null), animRef = useRef(null);
    const [hud, setHud] = useState({ score: 0, level: 1, combo: 0, lives: START_LIVES, heat: 0, overdrive: false, suddenDeath: false, precision: 100, shieldReady: true });

    const init = useCallback(() => ({
        balls: [], blocks: [], enemyBalls: [], cannonX: W / 2, cannonVX: 0, angle: -Math.PI / 2, tAngle: -Math.PI / 2,
        mx: W / 2, my: H / 2, score: 0, level: 1, particles: [], combo: 0, maxCombo: 0,
        hitCount: 0, critHits: 0, totalShots: 0, missStreak: 0, lastHit: 0, shake: 0,
        charging: false, power: 1.0, lives: START_LIVES, heat: 0, overheated: false, ohTimer: 0,
        overdrive: false, odUsed: false, moveL: false, moveR: false, isMoving: false,
        recoil: 0, floats: [], frame: 0, active: 0, moveAcc: 0, spikeTimer: 0, inSpike: false,
        suddenDeath: false, adapt: { shield: 0, speedMod: 0, heatMod: 0 },
        enemyTimer: 0, shieldActive: false, shieldTimer: 0, shieldCooldown: 0, flashRed: 0,
    }), []);

    const initGame = useCallback(() => {
        sRef.current = init(); sRef.current.blocks = genTower(1, null);
        setHud({ score: 0, level: 1, combo: 0, lives: START_LIVES, heat: 0, overdrive: false, suddenDeath: false, precision: 100, shieldReady: true });
    }, [init]);

    useEffect(() => { if (isPlaying) initGame(); }, [isPlaying, initGame]);

    useEffect(() => {
        const cv = canvasRef.current; if (!cv) return;
        const gc = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height) }; };
        const onMv = (e) => { const s = sRef.current; if (!s) return; const { x, y } = gc(e); s.mx = x; s.my = y; let a = Math.atan2(y - CANNON_Y, x - s.cannonX); if (a > -0.15) a = -0.15; if (a < -Math.PI + 0.15) a = -Math.PI + 0.15; s.tAngle = a; };
        const onDn = () => { if (!isPlaying || !sRef.current) return; sRef.current.charging = true; sRef.current.power = MIN_POWER; };
        const onUp = () => {
            const s = sRef.current; if (!isPlaying || !s || !s.charging) return; s.charging = false;
            if (s.overheated || s.active >= MAX_BALLS) return;
            const acc = s.moveAcc * 0.15, jit = (Math.random() - 0.5) * acc, a = s.angle + jit;
            const sp = BALL_SPEED * s.power * (s.overdrive ? 1.3 : 1);
            s.balls.push({ x: s.cannonX + Math.cos(a) * 42, y: CANNON_Y + Math.sin(a) * 42, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, alive: true, trail: [], power: s.power, hitSomething: false });
            s.active++; s.totalShots++; s.heat += HEAT_PER_SHOT * (s.overdrive ? 2 : 1) * (1 + s.adapt.heatMod);
            s.recoil = s.power * 6 + (s.overdrive ? 3 : 0); s.power = 1.0;
        };
        const onKD = (e) => {
            const s = sRef.current; if (!s) return;
            if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") s.moveL = true;
            if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") s.moveR = true;
            if ((e.key === "e" || e.key === "E") && isPlaying) { s.overdrive = !s.overdrive; if (s.overdrive) s.odUsed = true; }
            if (e.key === " " && isPlaying && !s.shieldActive && s.shieldCooldown <= 0) {
                s.shieldActive = true; s.shieldTimer = SHIELD_DUR; s.heat += 0.15;
            }
        };
        const onKU = (e) => {
            const s = sRef.current; if (!s) return;
            if (e.key === "a" || e.key === "A" || e.key === "ArrowLeft") s.moveL = false;
            if (e.key === "d" || e.key === "D" || e.key === "ArrowRight") s.moveR = false;
        };
        cv.addEventListener("mousemove", onMv); cv.addEventListener("mousedown", onDn); cv.addEventListener("mouseup", onUp);
        window.addEventListener("keydown", onKD); window.addEventListener("keyup", onKU);
        return () => { cv.removeEventListener("mousemove", onMv); cv.removeEventListener("mousedown", onDn); cv.removeEventListener("mouseup", onUp); window.removeEventListener("keydown", onKD); window.removeEventListener("keyup", onKU); };
    }, [isPlaying]);

    const spawnP = useCallback((x, y, col, n = 6) => { const s = sRef.current; if (!s) return; for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n + Math.random() * 0.5; s.particles.push({ x, y, vx: Math.cos(a) * (2 + Math.random() * 3), vy: Math.sin(a) * (2 + Math.random() * 3), life: 1, color: col, size: 3 + Math.random() * 4 }); } }, []);
    const addF = useCallback((x, y, t, c) => { if (sRef.current) sRef.current.floats.push({ x, y, text: t, color: c, life: 1, vy: -2 }); }, []);

    const spawnEnemy = useCallback((s) => {
        const alive = s.blocks.filter(b => b.hp > 0); if (alive.length === 0) return;
        const src = alive[Math.floor(Math.random() * alive.length)];
        const rng = Math.random(); let etype = 0;
        if (s.level >= 6 && rng < 0.1) etype = 2;// splitting
        else if (s.level >= 4 && rng < 0.2) etype = 1;// heavy
        else if (rng < 0.35) etype = 0;// fast
        const speed = etype === 0 ? 3.5 + s.level * 0.15 : etype === 1 ? 1.8 : 2.5;
        s.enemyBalls.push({ x: src.x + src.w / 2, y: src.y + src.h, vx: (Math.random() - 0.5) * 1.5, vy: speed, etype, r: etype === 1 ? 12 : ENEMY_R, alive: true });
    }, []);

    useEffect(() => {
        const cv = canvasRef.current; if (!cv) return; const ctx = cv.getContext("2d");
        const skin = SKIN_VIS[skinTier] || SKIN_VIS[0];

        const loop = () => {
            const s = sRef.current; if (!s) { animRef.current = requestAnimationFrame(loop); return; }
            s.frame++;

            if (isPlaying && s.lives > 0) {
                // Cannon
                if (s.moveL) s.cannonVX -= CANNON_SPEED * 0.3; if (s.moveR) s.cannonVX += CANNON_SPEED * 0.3;
                s.cannonVX *= CANNON_DECEL; s.cannonX += s.cannonVX; s.cannonX = Math.max(30, Math.min(W - 30, s.cannonX));
                s.isMoving = Math.abs(s.cannonVX) > 0.5; s.moveAcc = s.isMoving ? Math.min(1, s.moveAcc + 0.05) : Math.max(0, s.moveAcc - 0.03);
                s.angle += (s.tAngle - s.angle) * 0.15; if (s.recoil > 0) s.recoil *= 0.85;
                if (s.charging && !s.overheated) { s.power += CHARGE_RATE; if (s.power > MAX_POWER) s.power = MAX_POWER; }

                // Shield
                if (s.shieldActive) { s.shieldTimer--; if (s.shieldTimer <= 0) { s.shieldActive = false; s.shieldCooldown = SHIELD_CD; } }
                if (s.shieldCooldown > 0) s.shieldCooldown--;

                // Heat
                const hd = s.suddenDeath ? 0 : (s.overdrive ? 0.5 : 1);
                if (!s.overheated) {
                    s.heat = Math.max(0, s.heat - HEAT_DECAY * hd);
                    if (s.heat >= OVERHEAT_TH) {
                        s.overheated = true; s.ohTimer = OVERHEAT_LOCK; s.combo = 0; addF(s.cannonX, CANNON_Y - 30, "OVERHEAT", "#ff3333"); s.shake = 10;
                        if (s.overdrive) { s.lives--; s.overdrive = false; addF(s.cannonX, CANNON_Y - 50, "LIFE LOST", "#ff0000"); s.flashRed = 20; }
                    }
                }
                else { s.ohTimer--; s.heat = Math.max(0, s.heat - 0.015); if (s.ohTimer <= 0) { s.overheated = false; s.heat = 0; } }

                if (s.level >= 10 && !s.suddenDeath) { s.suddenDeath = true; s.lives = 1; addF(W / 2, H / 2 - 60, "SUDDEN DEATH", "#ff0000"); s.shake = 15; }

                // Speed spike
                s.spikeTimer++;
                if (s.spikeTimer >= SPIKE_INTERVAL && !s.inSpike) { s.inSpike = true; s.spikeTimer = 0; addF(W / 2, 80, "SPEED SPIKE", "#ff4400"); s.shake = 6; }
                if (s.inSpike && s.spikeTimer >= SPIKE_DUR) { s.inSpike = false; s.spikeTimer = 0; }

                // Adaptive
                if (s.frame % 300 === 0) { const ac = s.totalShots > 0 ? s.hitCount / s.totalShots : 1; s.adapt.shield = s.maxCombo > 8 ? 0.08 : 0; s.adapt.speedMod = ac < 0.4 ? 0.3 : 0; s.adapt.heatMod = s.odUsed && s.overdrive ? 0.2 : 0; }

                // Descent
                let dsp = DESCENT_BASE * (1 + s.level * 0.18 + s.adapt.speedMod); if (s.inSpike) dsp *= 2.5; if (s.suddenDeath) dsp *= 2;
                for (let b of s.blocks) {
                    if (b.hp <= 0) continue;
                    if (b.osc) { b.oscP += b.oscS; b.x = b.baseX + Math.sin(b.oscP) * b.oscR; }
                    b.y += dsp; if (b.bt === 4) { b.regenT++; if (b.regenT > 180 && b.hp < b.maxHp) { b.hp++; b.regenT = 0; } }
                    if (b.bt === 2 && b.shieldWin > 0) b.shieldWin--;
                    if (b.y + b.h >= DEATH_LINE) { b.hp = 0; s.lives--; s.shake = 10; s.flashRed = 15; addF(b.x + b.w / 2, b.y, "BREACH", "#ff0000"); spawnP(b.x + b.w / 2, b.y + b.h / 2, "#ff3333", 12); }
                }

                // Enemy ball spawning
                const interval = Math.max(60, ENEMY_BASE_INTERVAL - s.level * 12 - (s.combo > 5 ? 30 : 0) - (s.overdrive ? 20 : 0));
                s.enemyTimer++; if (s.enemyTimer >= interval) { s.enemyTimer = 0; spawnEnemy(s); }

                // Enemy ball update
                for (let eb of s.enemyBalls) {
                    if (!eb.alive) continue;
                    eb.y += eb.vy; eb.x += eb.vx; eb.vy += 0.02;// accelerate
                    eb.vx += (Math.random() - 0.5) * 0.15;// unpredictable bounce
                    if (eb.x < eb.r) { eb.x = eb.r; eb.vx *= -0.8; } if (eb.x > W - eb.r) { eb.x = W - eb.r; eb.vx *= -0.8; }
                    if (eb.y > H + 30) { eb.alive = false; continue; }
                    // Hit cannon check
                    const cdx = eb.x - s.cannonX, cdy = eb.y - CANNON_Y, cd = Math.sqrt(cdx * cdx + cdy * cdy);
                    if (cd < CANNON_R + eb.r) {
                        if (s.shieldActive) { eb.alive = false; addF(eb.x, eb.y, "BLOCKED", "#00ccff"); spawnP(eb.x, eb.y, "#00ccff", 8); s.score += 25; onScoreUpdate?.(s.score); }
                        else {
                            eb.alive = false; const dmg = eb.etype === 1 ? 2 : 1; s.lives -= dmg; s.shake = 12; s.flashRed = 25;
                            addF(s.cannonX, CANNON_Y - 30, dmg > 1 ? "HEAVY HIT -2" : "HIT -1", "#ff0000"); spawnP(s.cannonX, CANNON_Y, "#ff3333", 15);
                            if (s.lives <= 1 && s.lives > 0) addF(W / 2, H / 2, "CRITICAL LIFE", "#ff4444");
                        }
                        continue;
                    }
                    // Intercept: player ball hits enemy ball
                    for (let pb of s.balls) {
                        if (!pb.alive) continue;
                        const idx = eb.x - pb.x, idy = eb.y - pb.y, id = Math.sqrt(idx * idx + idy * idy);
                        if (id < BALL_R + eb.r) {
                            eb.alive = false; pb.hitSomething = true;
                            // Splitting ball
                            if (eb.etype === 2) {
                                s.enemyBalls.push({ x: eb.x - 10, y: eb.y, vx: -1.5, vy: eb.vy * 0.7, etype: 0, r: 6, alive: true });
                                s.enemyBalls.push({ x: eb.x + 10, y: eb.y, vx: 1.5, vy: eb.vy * 0.7, etype: 0, r: 6, alive: true });
                                addF(eb.x, eb.y, "SPLIT", "#ffcc00");
                            } else {
                                const bon = eb.etype === 1 ? 100 : 50; s.score += bon; onScoreUpdate?.(s.score);
                                addF(eb.x, eb.y, `INTERCEPT +${bon}`, "#00ff88");
                                s.combo++; if (s.combo > s.maxCombo) s.maxCombo = s.combo; s.lastHit = Date.now();
                            }
                            spawnP(eb.x, eb.y, eb.etype === 1 ? "#aa44ff" : eb.etype === 2 ? "#ffcc00" : "#ff3333", 8);
                            break;
                        }
                    }
                }
                s.enemyBalls = s.enemyBalls.filter(e => e.alive);

                // Player balls
                for (let b of s.balls) {
                    if (!b.alive) continue;
                    b.trail.push({ x: b.x, y: b.y }); if (b.trail.length > 10) b.trail.shift();
                    b.x += b.vx; b.y += b.vy; b.vy += GRAVITY;
                    if (b.x < BALL_R) { b.x = BALL_R; b.vx *= -0.9; } if (b.x > W - BALL_R) { b.x = W - BALL_R; b.vx *= -0.9; }
                    if (b.y < BALL_R) { b.y = BALL_R; b.vy *= -0.9; }
                    if (b.y > H + 20) {
                        b.alive = false; s.active--;
                        if (!b.hitSomething) {
                            s.missStreak++;
                            if (s.overdrive) { s.heat = OVERHEAT_TH; addF(s.cannonX, CANNON_Y - 30, "MISS OH", "#ff4400"); }
                            if (s.missStreak >= MISS_LIFE) { s.lives--; s.missStreak = 0; addF(W / 2, H / 2, "MISS PENALTY", "#ff0000"); s.shake = 8; s.flashRed = 15; }
                            else if (s.missStreak >= MISS_COMBO) { s.combo = 0; addF(W / 2, H / 2 + 20, "COMBO LOST", "#ff8800"); }
                        } continue;
                    }
                    for (let blk of s.blocks) {
                        if (blk.hp <= 0) continue;
                        if (b.x + BALL_R > blk.x && b.x - BALL_R < blk.x + blk.w && b.y + BALL_R > blk.y && b.y - BALL_R < blk.y + blk.h) {
                            b.hitSomething = true; s.missStreak = 0;
                            if (blk.bt === 2) { blk.shieldHits++; blk.shieldWin = 120; if (blk.shieldHits < 3 || blk.shieldWin <= 0) { b.vy *= -1; spawnP(b.x, b.y, "#3399ff", 3); addF(b.x, b.y - 10, "SHIELD", "#3399ff"); break; } blk.shieldHits = 0; }
                            if (blk.bt === 3) { b.vx += (Math.random() - 0.5) * 1.8; }
                            const isCrit = Math.random() < CRIT_CHANCE * (b.power || 1); const dmg = (isCrit ? 3 : 1) * (s.overdrive ? 2 : 1);
                            blk.hp = Math.max(0, blk.hp - dmg); blk.regenT = 0;
                            const dx = b.x - (blk.x + blk.w / 2), dy = b.y - (blk.y + blk.h / 2);
                            if (Math.abs(dx / blk.w) > Math.abs(dy / blk.h)) b.vx *= -1; else b.vy *= -1;
                            s.hitCount++; s.shake = isCrit ? 6 : 3; const now = Date.now();
                            if (now - s.lastHit < 600) { s.combo++; if (s.combo > s.maxCombo) s.maxCombo = s.combo; } else s.combo = 1; s.lastHit = now;
                            const prec = s.totalShots > 0 ? s.hitCount / s.totalShots : 1;
                            const cMult = s.overdrive ? s.combo * 1.5 : s.combo; const rMult = s.overdrive ? 2 : 1;
                            const pts = Math.floor(10 * s.level * cMult * (isCrit ? 3 : 1) * rMult * Math.max(0.3, prec));
                            s.score += pts; onScoreUpdate?.(s.score);
                            if (isCrit) { s.critHits++; addF(b.x, b.y - 10, `CRIT +${pts}`, "#ff3366"); spawnP(b.x, b.y, "#ff3366", 10); }
                            else if (s.combo > 2) { addF(b.x, b.y - 10, `x${s.combo} +${pts}`, "#ffe100"); spawnP(b.x, b.y, blk.color, 5); }
                            else spawnP(b.x, b.y, blk.color, 3);
                            if (blk.hp <= 0) {
                                spawnP(blk.x + blk.w / 2, blk.y + blk.h / 2, blk.color, 15);
                                if (blk.bt === 1) { for (let ob of s.blocks) { if (ob.hp <= 0 || ob === blk) continue; const edx = Math.abs((ob.x + ob.w / 2) - (blk.x + blk.w / 2)), edy = Math.abs((ob.y + ob.h / 2) - (blk.y + blk.h / 2)); if (edx < BLK_W * 1.8 && edy < BLK_H * 1.8) { ob.hp = Math.max(0, ob.hp - 2); spawnP(ob.x + ob.w / 2, ob.y + ob.h / 2, "#ff6633", 5); } } addF(blk.x + blk.w / 2, blk.y, "EXPLODE", "#ff4400"); s.shake = 12; if (blk.y + blk.h > DEATH_LINE - 60) { s.lives--; s.flashRed = 15; addF(s.cannonX, CANNON_Y - 40, "TOO CLOSE", "#ff0000"); } }
                                const bon = 50 * s.level; s.score += bon; onScoreUpdate?.(s.score); addF(blk.x + blk.w / 2, blk.y, `+${bon}`, "#00f0ff");
                            } break;
                        }
                    }
                }
                s.balls = s.balls.filter(b => b.alive);

                // Level clear
                if (s.blocks.filter(b => b.hp > 0).length === 0 && s.blocks.length > 0) {
                    s.level++; s.blocks = genTower(s.level, s.adapt); s.enemyBalls = [];
                    const lb = 200 * s.level; s.score += lb; onScoreUpdate?.(s.score);
                    addF(W / 2, H / 2 - 40, `LEVEL ${s.level}`, "#00f0ff");
                    for (let i = 0; i < 30; i++)spawnP(W / 2 + (Math.random() - 0.5) * 300, H / 2 + (Math.random() - 0.5) * 200, `hsl(${Math.random() * 360},90%,60%)`, 2);
                    if (s.lives < START_LIVES && !s.suddenDeath) { s.lives++; addF(W / 2, H / 2, "+1 LIFE", "#00ff88"); }
                }
                if (s.lives <= 0) { addF(W / 2, H / 2 - 20, "GAME OVER", "#ff3333"); onGameOver?.(); }

                for (let f of s.floats) { f.y += f.vy; f.vy *= 0.98; f.life -= 0.02; } s.floats = s.floats.filter(f => f.life > 0);
                for (let p of s.particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.02; p.size *= 0.98; } s.particles = s.particles.filter(p => p.life > 0);
                if (s.shake > 0) s.shake -= 0.5; if (s.flashRed > 0) s.flashRed--;
                if (s.frame % 3 === 0) { const pr = s.totalShots > 0 ? Math.round(s.hitCount / s.totalShots * 100) : 100; setHud({ score: s.score, level: s.level, combo: s.combo, lives: s.lives, heat: s.heat, overdrive: s.overdrive, suddenDeath: s.suddenDeath, precision: pr, shieldReady: !s.shieldActive && s.shieldCooldown <= 0 }); }
            }

            // ── RENDER ──
            ctx.save();
            if (s.shake > 0) ctx.translate((Math.random() - 0.5) * 3 * s.shake, (Math.random() - 0.5) * 3 * s.shake);
            const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, s.suddenDeath ? "#1a0000" : "#08081a"); bg.addColorStop(1, s.suddenDeath ? "#0d0000" : "#0d0d2b");
            ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
            // Red flash
            if (s.flashRed > 0) { ctx.fillStyle = `rgba(255,0,0,${s.flashRed * 0.02})`; ctx.fillRect(0, 0, W, H); }
            // Grid
            ctx.strokeStyle = `rgba(${s.suddenDeath ? "255,0,0" : "0,240,255"},0.03)`; ctx.lineWidth = 1;
            for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
            for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
            ctx.strokeStyle = s.frame % 60 < 30 ? "rgba(255,0,0,0.3)" : "rgba(255,0,0,0.1)"; ctx.lineWidth = 1; ctx.setLineDash([8, 8]);
            ctx.beginPath(); ctx.moveTo(0, DEATH_LINE); ctx.lineTo(W, DEATH_LINE); ctx.stroke(); ctx.setLineDash([]);
            if (s.inSpike) { ctx.fillStyle = `rgba(255,68,0,${0.05 + Math.sin(s.frame * 0.2) * 0.03})`; ctx.fillRect(0, 0, W, H); }
            ctx.strokeStyle = skin.glow; ctx.lineWidth = 2; ctx.shadowColor = skin.glow; ctx.shadowBlur = 15;
            ctx.beginPath(); ctx.moveTo(0, H - 38); ctx.lineTo(W, H - 38); ctx.stroke(); ctx.shadowBlur = 0;

            // Blocks
            for (let blk of s.blocks) {
                if (blk.hp <= 0) continue; const hr = blk.hp / blk.maxHp;
                ctx.fillStyle = blk.color; ctx.globalAlpha = 0.25 + 0.75 * hr;
                if (hr < 1 && s.frame % 40 < 3) { ctx.fillStyle = "#fff"; ctx.globalAlpha = 0.5; }
                ctx.fillRect(blk.x + 1, blk.y + 1, blk.w - 2, blk.h - 2); ctx.globalAlpha = 1;
                ctx.strokeStyle = blk.color; ctx.lineWidth = 2; ctx.shadowColor = blk.color; ctx.shadowBlur = hr > 0.5 ? 8 : 2;
                ctx.strokeRect(blk.x + 1, blk.y + 1, blk.w - 2, blk.h - 2); ctx.shadowBlur = 0;
                ctx.fillStyle = "#fff"; ctx.font = "bold 12px Orbitron,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(blk.hp, blk.x + blk.w / 2, blk.y + blk.h / 2);
                if (blk.bt === 1) { ctx.fillStyle = "#ff6633"; ctx.font = "8px Orbitron,sans-serif"; ctx.fillText("EXP", blk.x + blk.w / 2, blk.y + blk.h - 5); }
                if (blk.bt === 2) { ctx.strokeStyle = "#66bbff"; ctx.lineWidth = 3; ctx.strokeRect(blk.x - 1, blk.y - 1, blk.w + 2, blk.h + 2); }
                if (blk.bt === 3) { ctx.strokeStyle = "#cc66ff"; ctx.setLineDash([4, 4]); ctx.strokeRect(blk.x, blk.y, blk.w, blk.h); ctx.setLineDash([]); }
                if (blk.bt === 4 && s.frame % 60 < 30) { ctx.fillStyle = "rgba(255,204,0,0.2)"; ctx.fillRect(blk.x, blk.y, blk.w, blk.h); }
            }

            // Enemy balls
            for (let eb of s.enemyBalls) {
                if (!eb.alive) continue;
                const ec = eb.etype === 0 ? "#ff3333" : eb.etype === 1 ? "#aa44ff" : "#ffcc00";
                ctx.fillStyle = ec; ctx.shadowColor = ec; ctx.shadowBlur = 10;
                ctx.beginPath(); ctx.arc(eb.x, eb.y, eb.r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.arc(eb.x - 2, eb.y - 2, eb.r * 0.3, 0, Math.PI * 2); ctx.fill();
                // Danger indicator line toward cannon
                ctx.strokeStyle = `rgba(255,0,0,${Math.min(0.3, 0.05 + eb.y / H * 0.3)})`; ctx.lineWidth = 1; ctx.setLineDash([4, 8]);
                ctx.beginPath(); ctx.moveTo(eb.x, eb.y + eb.r); ctx.lineTo(eb.x, CANNON_Y); ctx.stroke(); ctx.setLineDash([]);
            }

            // Cannon
            const cx = s.cannonX, ca = s.angle; ctx.save(); ctx.translate(cx, CANNON_Y);
            if (skin.aura) { const ap = s.frame * 0.03; for (let i = 0; i < 3; i++) { ctx.strokeStyle = `rgba(${skinTier >= 5 ? "0,255,136" : "200,0,255"},${0.08 + Math.sin(ap + i) * 0.05})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 32 + i * 6 + Math.sin(ap + i * 2) * 3, 0, Math.PI * 2); ctx.stroke(); } }
            // Shield bubble
            if (s.shieldActive) { ctx.strokeStyle = `rgba(0,200,255,${0.4 + Math.sin(s.frame * 0.15) * 0.2})`; ctx.lineWidth = 3; ctx.shadowColor = "#00ccff"; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
            if (s.overdrive) { ctx.strokeStyle = `rgba(255,100,0,${0.4 + Math.sin(s.frame * 0.1) * 0.3})`; ctx.lineWidth = 3; ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0; }
            if (s.charging && !s.overheated) { const cr = (s.power - MIN_POWER) / (MAX_POWER - MIN_POWER); ctx.strokeStyle = `rgba(255,225,0,${0.3 + cr * 0.7})`; ctx.lineWidth = 3; ctx.shadowColor = "#ffe100"; ctx.shadowBlur = 15 * cr; ctx.beginPath(); ctx.arc(0, 0, 28, -Math.PI, -Math.PI + Math.PI * cr); ctx.stroke(); ctx.shadowBlur = 0; }
            ctx.fillStyle = s.overdrive ? "#2a1005" : "#12122e"; ctx.strokeStyle = s.overheated ? (s.frame % 10 < 5 ? "#ff0000" : "#880000") : skin.glow;
            ctx.lineWidth = 2; ctx.shadowColor = skin.glow; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(0, 0, CANNON_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
            ctx.rotate(ca); const ro = -s.recoil;
            const bG = ctx.createLinearGradient(ro, -5, 42 + ro, 5); bG.addColorStop(0, skin.barrel); bG.addColorStop(1, skin.glow);
            ctx.fillStyle = bG; ctx.fillRect(ro, -5, 42, 10); ctx.strokeStyle = skin.glow; ctx.shadowColor = skin.glow; ctx.shadowBlur = 8; ctx.strokeRect(ro, -5, 42, 10); ctx.shadowBlur = 0;
            const mg = s.charging ? (s.power / MAX_POWER) : 0.4; ctx.fillStyle = `rgba(255,225,0,${mg})`; ctx.shadowColor = "#ffe100"; ctx.shadowBlur = 10 * mg; ctx.beginPath(); ctx.arc(44 + ro, 0, 4, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
            if (skin.particles && s.frame % 4 === 0) spawnP(cx + Math.cos(ca) * 20, CANNON_Y + Math.sin(ca) * 20, skin.glow, 1);
            ctx.restore();

            // Aim guide
            if (isPlaying && s.lives > 0) { const gl = s.charging ? 100 + s.power * 80 : 130; ctx.setLineDash([3, 6]); ctx.strokeStyle = s.overheated ? "rgba(255,50,50,0.2)" : `rgba(0,240,255,${s.charging ? 0.35 : 0.12})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ca) * 48, CANNON_Y + Math.sin(ca) * 48); ctx.lineTo(cx + Math.cos(ca) * gl, CANNON_Y + Math.sin(ca) * gl); ctx.stroke(); ctx.setLineDash([]); const chX = cx + Math.cos(ca) * gl, chY = CANNON_Y + Math.sin(ca) * gl; ctx.beginPath(); ctx.arc(chX, chY, 5, 0, Math.PI * 2); ctx.stroke(); }

            // Player balls
            for (let b of s.balls) { if (!b.alive) continue; if (skin.trail) { for (let i = 0; i < b.trail.length; i++) { const t = b.trail[i], a = (i / b.trail.length) * 0.35; ctx.fillStyle = `rgba(255,225,0,${a})`; ctx.beginPath(); ctx.arc(t.x, t.y, BALL_R * (i / b.trail.length) * 0.8, 0, Math.PI * 2); ctx.fill(); } } ctx.fillStyle = "#ffe100"; ctx.shadowColor = "#ffe100"; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
            for (let p of s.particles) { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; ctx.shadowBlur = 0;
            for (let f of s.floats) { ctx.globalAlpha = f.life; ctx.fillStyle = f.color; ctx.font = "bold 14px Orbitron,sans-serif"; ctx.textAlign = "center"; ctx.shadowColor = f.color; ctx.shadowBlur = 6; ctx.fillText(f.text, f.x, f.y); } ctx.globalAlpha = 1; ctx.shadowBlur = 0;

            // HUD
            if (isPlaying) {
                ctx.fillStyle = "#00f0ff"; ctx.font = "bold 13px Orbitron,sans-serif"; ctx.textAlign = "left";
                ctx.fillText(`SCORE ${s.score}`, 14, 24); ctx.fillStyle = "#c084fc"; ctx.fillText(`LEVEL ${s.level}`, 14, 42);
                const pr = s.totalShots > 0 ? Math.round(s.hitCount / s.totalShots * 100) : 100;
                ctx.fillStyle = pr < 50 ? "#ff4444" : pr < 75 ? "#ffaa00" : "#00ff88"; ctx.font = "10px Inter,sans-serif";
                ctx.fillText(`Precision: ${pr}%  |  Hits: ${s.hitCount}  |  Miss: ${s.missStreak}`, 14, 58);
                ctx.textAlign = "right";
                for (let i = 0; i < START_LIVES; i++) { ctx.fillStyle = i < s.lives ? "#00ff88" : "#333"; ctx.fillRect(W - 20 - i * 22, 12, 16, 16); ctx.strokeStyle = i < s.lives ? "#00ff88" : "#555"; ctx.lineWidth = 1; ctx.strokeRect(W - 20 - i * 22, 12, 16, 16); }
                const hX = W - 120, hY = 36; ctx.fillStyle = "#1a1a2e"; ctx.fillRect(hX, hY, 100, 8);
                const hc = s.heat > 0.7 ? "#ff3333" : s.heat > 0.4 ? "#ff8800" : "#00f0ff";
                ctx.fillStyle = s.overheated ? (s.frame % 10 < 5 ? "#ff0000" : "#880000") : hc; ctx.fillRect(hX, hY, 100 * Math.min(1, s.heat), 8);
                ctx.fillStyle = "#666"; ctx.font = "9px Inter,sans-serif"; ctx.textAlign = "right"; ctx.fillText("HEAT", W - 16, 56);
                ctx.fillText(`Ammo: ${MAX_BALLS - s.active}/${MAX_BALLS}`, W - 16, 70);
                // Shield CD
                ctx.fillStyle = s.shieldActive ? "#00ccff" : s.shieldCooldown > 0 ? "#555" : "#00ccff";
                ctx.fillText(s.shieldActive ? "SHIELD ON" : s.shieldCooldown > 0 ? `SHIELD ${Math.ceil(s.shieldCooldown / 60)}s` : "SHIELD [SPACE]", W - 16, 84);
                if (s.suddenDeath) { ctx.fillStyle = `rgba(255,0,0,${0.5 + Math.sin(s.frame * 0.08) * 0.3})`; ctx.font = "bold 11px Orbitron,sans-serif"; ctx.textAlign = "center"; ctx.fillText("SUDDEN DEATH", W / 2, 16); }
                if (s.overdrive) { ctx.fillStyle = `rgba(255,68,0,${0.4 + Math.sin(s.frame * 0.15) * 0.3})`; ctx.font = "bold 11px Orbitron,sans-serif"; ctx.textAlign = "center"; ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 8; ctx.fillText("OVERDRIVE", W / 2, H - 12); ctx.shadowBlur = 0; }
                if (s.combo > 1 && Date.now() - s.lastHit < 1200) { const ca2 = Math.min(1, (1200 - (Date.now() - s.lastHit)) / 400); ctx.globalAlpha = ca2; ctx.fillStyle = "#ffe100"; ctx.font = `bold ${16 + Math.min(s.combo, 10)}px Orbitron,sans-serif`; ctx.textAlign = "center"; ctx.shadowColor = "#ffe100"; ctx.shadowBlur = 10; ctx.fillText(`COMBO x${s.combo}`, W / 2, 34); ctx.shadowBlur = 0; ctx.globalAlpha = 1; }
                if (s.charging) { const cr = (s.power - MIN_POWER) / (MAX_POWER - MIN_POWER); const pwX = W - 120; ctx.fillStyle = "#1a1a2e"; ctx.fillRect(pwX, 94, 100, 5); ctx.fillStyle = cr > 0.7 ? "#ff3366" : cr > 0.4 ? "#ffe100" : "#00f0ff"; ctx.fillRect(pwX, 94, 100 * cr, 5); }
                if (s.inSpike) { ctx.fillStyle = "#ff4400"; ctx.font = "bold 10px Orbitron,sans-serif"; ctx.textAlign = "center"; ctx.fillText("SPEED SPIKE", W / 2, H - 28); }
            }
            if (!isPlaying || s.lives <= 0) {
                ctx.fillStyle = "rgba(8,8,26,0.75)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = s.lives <= 0 && isPlaying ? "#ff3333" : "#00f0ff"; ctx.font = "bold 22px Orbitron,sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 20; ctx.fillText(s.lives <= 0 && isPlaying ? "GAME OVER" : "READY", W / 2, H / 2 - 30); ctx.shadowBlur = 0;
                if (s.lives <= 0 && isPlaying) { const pr = s.totalShots > 0 ? Math.round(s.hitCount / s.totalShots * 100) : 100; ctx.fillStyle = "#aaa"; ctx.font = "13px Inter,sans-serif"; ctx.fillText(`Score: ${s.score.toLocaleString()}  |  Level ${s.level}`, W / 2, H / 2 + 5); ctx.fillStyle = "#666"; ctx.font = "11px Inter,sans-serif"; ctx.fillText(`Combo x${s.maxCombo}  |  ${s.critHits} Crits  |  ${pr}% Precision`, W / 2, H / 2 + 25); if (s.suddenDeath) { ctx.fillStyle = "#ff4444"; ctx.font = "bold 11px Orbitron,sans-serif"; ctx.fillText("HARDCORE CLEAR", W / 2, H / 2 + 48); } }
                else { ctx.fillStyle = "#888"; ctx.font = "11px Inter,sans-serif"; ctx.fillText("A/D Move | Hold Charge | E Overdrive | SPACE Shield", W / 2, H / 2 + 5); ctx.fillStyle = "#555"; ctx.font = "10px Inter,sans-serif"; ctx.fillText("3 Lives | Dodge enemy balls | Intercept for bonus", W / 2, H / 2 + 25); }
            }
            ctx.restore(); animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, [isPlaying, onScoreUpdate, onGameOver, spawnP, addF, skinTier, spawnEnemy]);

    return (
        <div className="relative">
            <canvas ref={canvasRef} width={W} height={H} className="rounded-xl border border-neon-cyan/20 shadow-lg shadow-neon-cyan/10 cursor-crosshair w-full max-w-[800px] focus:outline-none" tabIndex={0} />
            <div className="flex justify-between items-center mt-3 px-2">
                <div className="flex gap-4">
                    <div className="text-neon-cyan font-orbitron text-sm">SCORE <span className="text-white text-lg ml-1">{hud.score}</span></div>
                    <div className="text-purple-400 font-orbitron text-sm">LVL <span className="text-white text-lg ml-1">{hud.level}</span></div>
                    {hud.combo > 1 && <div className="text-neon-yellow font-orbitron text-sm animate-pulse">x{hud.combo}</div>}
                    {hud.overdrive && <div className="text-orange-400 font-orbitron text-xs animate-pulse">OVERDRIVE</div>}
                    {hud.suddenDeath && <div className="text-red-500 font-orbitron text-xs animate-pulse">SUDDEN DEATH</div>}
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-inter text-gray-500">Precision: <span className={hud.precision < 50 ? "text-red-400" : hud.precision < 75 ? "text-yellow-400" : "text-green-400"}>{hud.precision}%</span></div>
                    <div className={`text-xs font-orbitron ${hud.shieldReady ? "text-cyan-400" : "text-gray-600"}`}>{hud.shieldReady ? "SHIELD RDY" : "SHIELD CD"}</div>
                    <div className="flex gap-1">{Array.from({ length: START_LIVES }).map((_, i) => (<div key={i} className={`w-3 h-3 rounded-sm ${i < hud.lives ? "bg-neon-green" : "bg-gray-700"}`} />))}</div>
                </div>
            </div>
        </div>
    );
}
