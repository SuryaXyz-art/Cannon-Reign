export default function ReactivityStatus({ connected, error }) {
    if (error) {
        return (
            <div className="flex items-center gap-2 text-xs font-inter">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400">Reactivity Error</span>
            </div>
        );
    }

    if (connected) {
        return (
            <div className="flex items-center gap-2 text-xs font-inter">
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                <span className="text-neon-green">Reactivity Live</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-xs font-inter">
            <span className="w-2 h-2 rounded-full bg-neon-yellow animate-pulse" />
            <span className="text-gray-500">Connecting...</span>
        </div>
    );
}
