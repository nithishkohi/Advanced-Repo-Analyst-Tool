"use client";

import { motion } from "framer-motion";
import { Loader2, Zap, Brain, Crosshair } from "lucide-react";

type LoadingStateProps = {
    phase: string;
};

export default function LoadingState({ phase }: LoadingStateProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-teal-950/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-teal-900 border border-teal-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-8"
            >
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full" />
                        <Loader2 className="w-12 h-12 text-pink-400 animate-spin relative z-10" />
                    </div>
                    <h2 className="text-xl font-bold text-orange-50 text-center">Ingesting Codebase</h2>
                </div>

                <div className="space-y-4">
                    <Step
                        icon={<Zap size={18} className="text-pink-400" />}
                        label="Extracting AST via Tree-sitter"
                        active={phase === "ast"}
                        done={phase === "graph" || phase === "ai"}
                    />
                    <Step
                        icon={<Crosshair size={18} className="text-teal-400" />}
                        label="Calculating 3D Graph Centrality"
                        active={phase === "graph"}
                        done={phase === "ai"}
                    />
                    <Step
                        icon={<Brain size={18} className="text-pink-500" />}
                        label="Synthesizing AI Narratives (Groq)"
                        active={phase === "ai"}
                        done={false}
                    />
                </div>
            </motion.div>
        </div>
    );
}

function Step({ icon, label, active, done }: { icon: React.ReactNode, label: string, active: boolean, done: boolean }) {
    return (
        <div className={`flex items-center gap-4 transition-opacity duration-300 ${active || done ? "opacity-100" : "opacity-30"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${active ? "bg-teal-800 border border-teal-700 animate-pulse" : done ? "bg-teal-800/50" : "bg-transparent"}`}>
                {icon}
            </div>
            <span className={`text-sm ${active ? "text-orange-50 font-medium" : "text-teal-400"}`}>
                {label}
                {done && <span className="ml-2 text-xs text-pink-400">(Done)</span>}
            </span>
        </div>
    );
}
