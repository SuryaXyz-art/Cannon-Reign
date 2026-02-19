export default function WalletConnect({ account, isConnecting, error, onConnect }) {
    if (account) {
        return (
            <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 font-inter">
                    Somnia Testnet
                </span>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
                    <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                    <span className="font-inter text-xs text-neon-cyan">
                        {account.slice(0, 6)}...{account.slice(-4)}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            {error && (
                <span className="text-xs text-red-400 font-inter max-w-[180px] truncate">
                    {error}
                </span>
            )}
            <button
                onClick={onConnect}
                disabled={isConnecting}
                className="btn-neon text-xs"
            >
                {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
        </div>
    );
}
