/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'neon-cyan': '#00f0ff',
                'neon-magenta': '#ff00aa',
                'neon-yellow': '#ffe100',
                'dark-bg': '#0a0a1a',
                'dark-panel': '#1a1a2e',
                'dark-card': '#16213e',
                'dark-border': '#0f3460',
            },
            fontFamily: {
                'orbitron': ['Orbitron', 'sans-serif'],
                'inter': ['Inter', 'sans-serif'],
            },
            animation: {
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
                'slide-up': 'slide-up 0.5s ease-out',
                'badge-pop': 'badge-pop 0.6s ease-out',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                'glow-pulse': {
                    '0%': { boxShadow: '0 0 5px #00f0ff, 0 0 10px #00f0ff' },
                    '100%': { boxShadow: '0 0 20px #00f0ff, 0 0 40px #00f0ff, 0 0 60px #00f0ff' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'badge-pop': {
                    '0%': { transform: 'scale(0)', opacity: '0' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
        },
    },
    plugins: [],
}
