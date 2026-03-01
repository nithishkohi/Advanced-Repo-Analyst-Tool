"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Network, FileCode2, Zap, ShieldAlert, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { CodeNode, UserRole } from "@/types";
import axios from "axios";

type ImpactReport = {
    blastRadius: string[];
    analysis: {
        risk_level: string;
        explanation: string;
        broken_features: string[];
    };
};

type NodeOverlayProps = {
    node: CodeNode;
    onClose: () => void;
    onSimulationComplete: (targetId: string, dependentIds: string[], riskLevel: string) => void;
};

import { Send, Bot } from "lucide-react";

export default function NodeOverlay({ node, onClose, onSimulationComplete }: NodeOverlayProps) {
    const isCore = node.is_core_node;
    const [chatInput, setChatInput] = useState("");
    const [isChatting, setIsChatting] = useState(false);
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);

    // Simulation State
    const [isSimulating, setIsSimulating] = useState(false);
    const [impactReport, setImpactReport] = useState<ImpactReport | null>(null);
    const [codeContent, setCodeContent] = useState(node.raw_text || "// Source code not available for this node");

    const handleChatSubmit = async () => {
        if (!chatInput.trim()) return;

        const question = chatInput.trim();
        setChatInput("");
        setChatHistory(prev => [...prev, { role: 'user', text: question }]);
        setIsChatting(true);

        try {
            const res = await axios.post("http://localhost:8000/api/v1/sandbox/file-chat", {
                file_id: node.id,
                question: question,
                raw_text: node.raw_text || ""
            });

            setChatHistory(prev => [...prev, { role: 'ai', text: res.data.answer }]);
        } catch (err) {
            console.error(err);
            setChatHistory(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error connecting to the AI." }]);
        }
        setIsChatting(false);
        setIsChatting(false);
    };

    const handleSimulate = async () => {
        setIsSimulating(true);
        try {
            const res = await axios.post("http://localhost:8000/api/v1/sandbox/simulate-impact", {
                file_id: node.id,
                new_code: codeContent
            });
            const rawAi = res.data.report;

            setImpactReport({
                blastRadius: res.data.dependents || [],
                analysis: { risk_level: res.data.risk_level || "Determined by AI", explanation: rawAi, broken_features: [] }
            });

            onSimulationComplete(node.id, res.data.dependents || [], res.data.risk_level || "Determined by AI");
        } catch (err) {
            console.error(err);
            setImpactReport({
                blastRadius: [],
                analysis: { risk_level: "Error", broken_features: [], explanation: "Simulation failed to connect to backend." }
            });
        }
        setIsSimulating(false);
    };

    return (
        <motion.div
            initial={{ x: 500, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 500, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-6 right-6 bottom-6 w-[450px] bg-teal-950/95 backdrop-blur-md border border-teal-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-40"
        >
            <div className="p-4 border-b border-teal-800 flex items-start justify-between bg-teal-900">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCore ? 'bg-pink-500/20 text-pink-400' : 'bg-teal-800 text-teal-400'}`}>
                        <FileCode2 size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-orange-50 truncate max-w-[200px]" title={node.name}>{node.name}</h3>
                        <p className="text-xs font-mono text-teal-300 truncate max-w-[200px]" title={node.path}>{node.path}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 text-teal-400 hover:text-orange-50 rounded-lg hover:bg-teal-800 transition-colors">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 flex flex-col">
                {/* Core AI Narrative */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Zap size={14} className="text-pink-400" />
                        <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">AI Narrative</h4>
                    </div>
                    <div className="bg-teal-950/50 rounded-xl p-4 border border-teal-800/50">
                        <p className="text-sm text-orange-100 leading-relaxed">
                            {node.summary}
                        </p>
                    </div>
                </div>

                {/* Structural Graph Data */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Network size={14} className="text-teal-300" />
                        <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Structural Context</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard label="Complexity" value={node.cyclomatic_complexity.toString()} icon="⚡" />
                        <MetricCard label="Centrality" value={node.centrality_score.toFixed(3)} icon="🎯" highlight={isCore} />
                    </div>
                </div>

                {/* Impact Analysis Results */}
                <AnimatePresence>
                    {impactReport && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 border-t border-teal-800 pt-3">
                            <div className="flex items-center gap-2">
                                <ShieldAlert size={14} className={impactReport.analysis.risk_level === 'High' ? "text-red-400" : "text-amber-400"} />
                                <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Blast Radius Report</h4>
                            </div>

                            <div className={`p-4 rounded-xl border ${impactReport.analysis.risk_level === 'High' ? "bg-red-950/40 border-red-900/50" : "bg-amber-950/40 border-amber-900/50"}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm font-medium text-orange-100">Risk Level</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${impactReport.analysis.risk_level === 'High' ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                                        {impactReport.analysis.risk_level}
                                    </span>
                                </div>
                                <p className="text-xs text-orange-50 mb-3">{impactReport.analysis.explanation}</p>
                                <div className="text-xs font-mono text-teal-300 bg-black/30 p-2 rounded max-h-24 overflow-y-auto">
                                    Affected: {impactReport.blastRadius.length} files
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Live Code Editor Simulator */}
                <div className="pt-4 border-t border-teal-800 flex flex-col gap-2">
                    <label className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                        <FileCode2 size={14} />
                        Live Architecture Editor
                    </label>
                    <textarea
                        className="w-full min-h-[100px] bg-teal-950 text-orange-50 font-mono text-xs p-3 rounded-lg border border-teal-800 focus:outline-none focus:border-pink-500/50 resize-y transition-colors custom-scrollbar"
                        value={codeContent}
                        onChange={(e) => setCodeContent(e.target.value)}
                        placeholder="Edit code to simulate architectural changes..."
                    />
                    {!impactReport ? (
                        <button onClick={handleSimulate} disabled={isSimulating} className="w-full bg-orange-600/80 hover:bg-orange-600 text-orange-50 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 mt-2">
                            {isSimulating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="text-orange-100" />}
                            {isSimulating ? "Analyzing Changes..." : "Simulate Change Impact"}
                        </button>
                    ) : (
                        <button onClick={() => setImpactReport(null)} className="w-full bg-teal-800/80 hover:bg-teal-700 text-orange-50 font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2">
                            Clear Simulation
                        </button>
                    )}
                </div>

                {/* Interactive AI File Chatbot */}
                <div className="mt-auto pt-4 border-t border-teal-800 flex flex-col flex-1 min-h-[250px] max-h-[300px]">
                    <div className="flex items-center gap-2 mb-3">
                        <Bot size={14} className="text-pink-400" />
                        <h4 className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Ask AI about this file</h4>
                    </div>

                    <div className="flex-1 bg-teal-950/50 border border-teal-800 rounded-xl p-3 overflow-y-auto mb-3 space-y-3 custom-scrollbar">
                        {chatHistory.length === 0 ? (
                            <div className="text-xs text-teal-500 text-center mt-8 italic">
                                "What does this file do?"<br />"How does it connect to the database?"<br />Ask me anything!
                            </div>
                        ) : (
                            chatHistory.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-xl p-2.5 text-xs ${msg.role === 'user' ? 'bg-pink-600/20 text-orange-50 border border-pink-500/30' : 'bg-teal-900 border border-teal-700 text-orange-100'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                        {isChatting && (
                            <div className="flex justify-start">
                                <div className="bg-teal-900 border border-teal-700 rounded-xl p-2.5 flex items-center gap-2 text-teal-400">
                                    <Loader2 size={12} className="animate-spin" /> <span className="text-[10px]">AI is thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 isolate">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleChatSubmit(); }}
                            placeholder="Ask a question..."
                            className="flex-1 bg-teal-900 border border-teal-700 rounded-lg px-3 py-2 text-sm text-orange-50 focus:outline-none focus:border-pink-500/50 transition-colors"
                        />
                        <button
                            onClick={handleChatSubmit}
                            disabled={isChatting || !chatInput.trim()}
                            className="bg-pink-600 hover:bg-pink-500 disabled:opacity-50 disabled:hover:bg-pink-600 text-white rounded-lg px-3 flex items-center justify-center transition-colors"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function MetricCard({ label, value, icon, highlight = false, className = "" }: { label: string, value: string, icon: string, highlight?: boolean, className?: string }) {
    return (
        <div className={`bg-teal-900 border ${highlight ? 'border-pink-500/30 shadow-[0_0_15px_rgba(244,114,182,0.1)]' : 'border-teal-800'} rounded-xl p-3 flex flex-col gap-1 ${className}`}>
            <span className="text-xs text-teal-400 flex items-center gap-1">
                <span>{icon}</span> {label}
            </span>
            <span className={`font-mono font-medium ${highlight ? 'text-pink-400' : 'text-orange-50'}`}>
                {value}
            </span>
        </div>
    );
}
