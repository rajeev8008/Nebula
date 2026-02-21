'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50">
                    <div className="bg-slate-900/80 border border-orange-500/50 p-8 rounded-2xl shadow-2xl max-w-md text-center">
                        <h2 className="text-2xl font-bold text-orange-400 mb-4">The Engine experienced a spatial anomaly.</h2>
                        <p className="text-slate-300 mb-6 text-sm">
                            {this.state.error?.message || "An unexpected error occurred in the WebGL context."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-black font-semibold rounded-lg hover:from-orange-400 hover:to-amber-400 transition-all font-sans"
                        >
                            Recalibrate Engine
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
