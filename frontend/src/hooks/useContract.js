import { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, SOMNIA_TESTNET } from "../utils/contract";

export function useContract() {
    const [account, setAccount] = useState(null);
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    // Auto-connect if already connected
    useEffect(() => {
        if (window.ethereum?.selectedAddress) {
            connectWallet();
        }
    }, []);

    const switchToSomnia = useCallback(async () => {
        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: SOMNIA_TESTNET.chainIdHex }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: "wallet_addEthereumChain",
                    params: [
                        {
                            chainId: SOMNIA_TESTNET.chainIdHex,
                            chainName: SOMNIA_TESTNET.name,
                            nativeCurrency: SOMNIA_TESTNET.currency,
                            rpcUrls: [SOMNIA_TESTNET.rpcUrl],
                            blockExplorerUrls: [SOMNIA_TESTNET.explorer],
                        },
                    ],
                });
            } else {
                throw switchError;
            }
        }
    }, []);

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            setError("MetaMask not found");
            return;
        }
        try {
            setIsConnecting(true);
            setError(null);
            await window.ethereum.request({ method: "eth_requestAccounts" });
            await switchToSomnia();
            const p = new ethers.BrowserProvider(window.ethereum);
            const s = await p.getSigner();
            const addr = await s.getAddress();
            setProvider(p);
            setSigner(s);
            setAccount(addr);
            setContract(new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, s));
        } catch (err) {
            setError(err.message || "Connection failed");
        } finally {
            setIsConnecting(false);
        }
    }, [switchToSomnia]);

    // Listen for account/chain changes
    useEffect(() => {
        if (!window.ethereum) return;
        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                setAccount(null); setContract(null);
            } else {
                connectWallet();
            }
        };
        const handleChainChanged = () => { connectWallet(); };
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
        return () => {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
    }, [connectWallet]);

    // ── Contract Interactions ──

    const startGame = useCallback(async () => {
        if (!contract) throw new Error("Not connected");
        const tx = await contract.startGame();
        await tx.wait();
        return tx;
    }, [contract]);

    const submitScore = useCallback(async (score, level, maxCombo, usedOverdrive) => {
        if (!contract) throw new Error("Not connected");
        const tx = await contract.submitScore(score, level || 1, maxCombo || 0, usedOverdrive || false);
        await tx.wait();
        return tx;
    }, [contract]);

    const purchaseSkin = useCallback(async (tier) => {
        if (!contract) throw new Error("Not connected");
        const price = await contract.getSkinPrice(tier);
        const tx = await contract.purchaseSkin(tier, { value: price });
        await tx.wait();
        return tx;
    }, [contract]);

    const getTopPlayers = useCallback(async () => {
        if (!contract) return { players: [], scores: [] };
        const result = await contract.getTopPlayers();
        return { players: result.players || result[0], scores: result.scores || result[1] };
    }, [contract]);

    const getPlayerStats = useCallback(async (address) => {
        if (!contract) return {};
        const result = await contract.getPlayerStats(address || account);
        return {
            highScore: result.highScore || result[0],
            curScore: result.curScore || result[1],
            skinTier: result.skinTier || result[2],
            maxCombo: result.maxCombo || result[3],
            usedOverdrive: result.usedOverdrive || result[4],
        };
    }, [contract, account]);

    const getPlayerSkin = useCallback(async (address) => {
        if (!contract) return 0;
        const skin = await contract.getPlayerSkin(address || account);
        return Number(skin);
    }, [contract, account]);

    const getGlobalLeader = useCallback(async () => {
        if (!contract) return { leader: null };
        const leader = await contract.globalLeader();
        return { leader };
    }, [contract]);

    return {
        account,
        isConnecting,
        error,
        connectWallet,
        startGame,
        submitScore,
        purchaseSkin,
        getTopPlayers,
        getPlayerStats,
        getPlayerSkin,
        getGlobalLeader,
        contract,
        provider,
    };
}
