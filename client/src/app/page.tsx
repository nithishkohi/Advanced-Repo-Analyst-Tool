"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import CodebaseFlow from "@/components/2d/CodebaseFlow";
import LoadingState from "@/components/ui/LoadingState";
import NodeOverlay from "@/components/ui/NodeOverlay";
import SearchBar from "@/components/ui/SearchBar";
import { useAuthStore } from "@/store/auth";
import { CodebasePayload } from "@/types";
import { AnimatePresence } from "framer-motion";
import { Layers, EyeOff, Eye, LogOut, UploadCloud, Github, X, UserPlus, FileText } from "lucide-react";
import axios from "axios";

// Helper components for Modals
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-teal-950/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg bg-teal-900 border border-teal-700/50 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 text-teal-400 hover:bg-teal-800 rounded-lg transition-colors">
                    <X size={16} />
                </button>
                {children}
            </div>
        </div>
    );
}

export default function Dashboard() {
    // For non-tech audience, everyone is a "Manager" by default, bypassing auth
    const user = "Guest";
    const role = "Manager";

    // Pipeline State
    const [loadingPhase, setLoadingPhase] = useState<"idle" | "ast" | "graph" | "ai" | "complete">("idle");
    const [payload, setPayload] = useState<CodebasePayload | null>(null);

    // Flowchart UI State
    const [focusMode, setFocusMode] = useState<boolean>(true); // Defaults to ON for Junior Devs
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [blastRadii, setBlastRadii] = useState<string[]>([]);
    const [simulatedNodeId, setSimulatedNodeId] = useState<string | null>(null);
    const [simulationRisk, setSimulationRisk] = useState<string | null>(null);

    // Modal State
    const [activeModal, setActiveModal] = useState<"upload" | "prs" | "team" | null>(null);
    const [prs, setPrs] = useState<{ id: string, title: string, impact: string }[]>([]);
    const [loadingPrs, setLoadingPrs] = useState(false);
    const [githubUrl, setGithubUrl] = useState("");

    // Provisioning State
    const [newDevId, setNewDevId] = useState("");
    const [newDevPass, setNewDevPass] = useState("");

    useEffect(() => {
        if (activeModal === "prs") {
            setLoadingPrs(true);
            const targetRepo = githubUrl || "https://github.com/OCA/crm";
            axios.get(`http://127.0.0.1:8000/api/v1/sandbox/github-prs?repo_url=${encodeURIComponent(targetRepo)}`)
                .then(res => setPrs(res.data.prs || []))
                .catch(err => console.error("Failed to fetch PRs", err))
                .finally(() => setLoadingPrs(false));
        }
    }, [activeModal, githubUrl]);

    const selectedNode = payload?.nodes.find(n => n.name === selectedNodeId) || payload?.nodes.find(n => n.id === selectedNodeId) || null;

    const handleGithubIngest = async () => {
        if (!githubUrl || !githubUrl.includes("github.com")) {
            alert("Please enter a valid GitHub repository URL");
            return;
        }

        setLoadingPhase("ast");
        setActiveModal(null);
        try {
            setTimeout(() => setLoadingPhase("graph"), 1000);

            const res = await axios.post("http://127.0.0.1:8000/api/v1/sandbox/ingest-github", {
                url: githubUrl
            });

            setLoadingPhase("ai");

            setTimeout(() => {
                setPayload(res.data);
                setLoadingPhase("complete");
            }, 800);

        } catch (err) {
            console.error("Ingest failed", err);
            setLoadingPhase("idle");
            setTimeout(() => {
                alert("Failed to ingest codebase. Is the FastAPI server running?");
            }, 100);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoadingPhase("ast");
        setActiveModal(null);
        const formData = new FormData();
        formData.append("file", file);

        try {
            setTimeout(() => setLoadingPhase("graph"), 1000);
            const res = await axios.post("http://127.0.0.1:8000/api/v1/upload-repo", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setLoadingPhase("ai");
            setTimeout(() => {
                setPayload(res.data);
                setLoadingPhase("complete");
            }, 800);
        } catch (err) {
            console.error("Upload failed", err);
            setLoadingPhase("idle");
            setTimeout(() => {
                alert("Failed to parse codebase. Is the FastAPI server running?");
            }, 100);
        }
    };

    // Prevent rendering issues
    if (!role) return null;

    return (
        <div className="flex h-screen bg-teal-950 overflow-hidden font-sans relative">
            <Sidebar role={role} onActionClick={(action) => setActiveModal(action as "upload" | "prs" | "team" | null)} />

            {/* Modals placed at root level over everything */}
            {activeModal === "upload" && role === "Manager" && (
                <ModalBackdrop onClose={() => setActiveModal(null)}>
                    <h2 className="text-lg font-bold text-orange-50 mb-4">Ingest Codebase</h2>
                    <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-teal-700/50 hover:border-pink-500/50 hover:bg-teal-800/50 rounded-xl cursor-pointer transition-all">
                            <UploadCloud className="text-pink-400 mb-2" size={32} />
                            <span className="text-sm font-medium text-orange-100">Upload Project (.zip)</span>
                            <input type="file" className="hidden" accept=".zip" onChange={handleFileUpload} />
                        </label>
                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-teal-800 flex-1" />
                            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">OR</span>
                            <div className="h-px bg-teal-800 flex-1" />
                        </div>
                        <div className="flex bg-teal-950/50 rounded-xl border border-teal-700 overflow-hidden">
                            <input
                                type="text"
                                placeholder="https://github.com/org/repo"
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-orange-50 px-4 py-3 outline-none"
                                onKeyDown={(e) => { if (e.key === 'Enter') handleGithubIngest(); }}
                            />
                            <button onClick={handleGithubIngest} className="bg-pink-600 hover:bg-pink-500 font-medium px-4 text-sm text-orange-50 transition-colors flex items-center gap-2">
                                <Github size={16} /> Import
                            </button>
                        </div>
                    </div>
                </ModalBackdrop>
            )}

            {activeModal === "prs" && (
                <ModalBackdrop onClose={() => setActiveModal(null)}>
                    <h2 className="text-lg font-bold text-orange-50 mb-4 flex items-center gap-2"><FileText size={20} className="text-pink-400" /> Live PR Architecture Reviews</h2>

                    {loadingPrs ? (
                        <div className="flex flex-col items-center justify-center p-8 gap-3 text-teal-400">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                            <span className="text-sm">Fetching and AI-Analyzing PRs...</span>
                        </div>
                    ) : prs.length === 0 ? (
                        <div className="p-4 text-center text-teal-300 bg-teal-950/50 rounded-xl border border-teal-800/50">
                            No active PRs found.
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                            {prs.map((pr, idx) => (
                                <div key={idx} className="bg-teal-950/50 border border-teal-700/50 rounded-xl p-4 flex justify-between items-start hover:border-pink-500/30 transition-colors">
                                    <div className="pr-4 flex-1">
                                        <h4 className="text-sm font-bold text-orange-50 mb-1 leading-tight">{pr.id} - {pr.title}</h4>
                                        <div className="inline-flex items-center mt-1 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Impact: {pr.impact}</span>
                                        </div>
                                    </div>
                                    <button className="text-xs shrink-0 bg-teal-800 hover:bg-teal-700 px-3 py-1.5 rounded-lg text-orange-100 transition-colors border border-teal-600/50 mt-1">Review</button>
                                </div>
                            ))}
                        </div>
                    )}
                </ModalBackdrop>
            )}

            <main className="flex-1 relative bg-teal-950">
                <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-10 pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-4 text-orange-50 font-medium">
                        <div className="flex bg-teal-900 border border-teal-700 py-1.5 px-3 rounded-lg shadow-lg items-center text-sm gap-2 text-pink-400">
                            @{user} <span className="bg-teal-800 text-orange-100 text-xs px-2 py-0.5 rounded-md border border-teal-600">{role}</span>
                        </div>
                    </div>

                    <div className="pointer-events-auto">
                        {payload ? (
                            <div className="bg-teal-900/80 backdrop-blur-md border border-teal-800 rounded-xl px-4 py-2 shadow-lg">
                                <h2 className="text-orange-50 font-semibold flex items-center gap-2">
                                    <Layers size={16} className="text-pink-400" />
                                    {payload.repositoryName}
                                </h2>
                                <p className="text-xs text-teal-200 mt-0.5">{payload.totalFilesAnalyzed} modules mapped</p>
                            </div>
                        ) : (
                            <div className="text-teal-400 text-sm font-medium bg-teal-900/80 backdrop-blur-sm border border-teal-800 py-2 px-4 rounded-xl shadow-lg">
                                {role === "Manager" ? "Waiting for Repository Ingestion" : "Waiting for Manager to assign codebase graph."}
                            </div>
                        )}
                    </div>

                    {payload && (
                        <div className="flex gap-4 pointer-events-auto">
                            <SearchBar onResultClick={(id) => setSelectedNodeId(id)} />
                            <button
                                onClick={() => setFocusMode(!focusMode)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg ${focusMode
                                    ? "bg-pink-500/10 border border-pink-500/30 text-pink-400"
                                    : "bg-teal-900/80 backdrop-blur-md border border-teal-800 text-orange-100 hover:bg-teal-800"
                                    }`}
                            >
                                {focusMode ? <Eye size={16} /> : <EyeOff size={16} />}
                                {focusMode ? "Focus: ON" : "Focus: OFF"}
                            </button>
                        </div>
                    )}
                </header>

                <AnimatePresence>
                    {loadingPhase !== "idle" && loadingPhase !== "complete" && <LoadingState phase={loadingPhase} />}
                </AnimatePresence>

                <div className="absolute inset-0">
                    <CodebaseFlow
                        payload={payload}
                        focusMode={focusMode}
                        onNodeClick={(id) => setSelectedNodeId(id)}
                        blastRadii={blastRadii}
                        simulatedTargetId={simulatedNodeId}
                        simulationRisk={simulationRisk}
                    />
                </div>

                <AnimatePresence>
                    {selectedNode && (
                        <NodeOverlay
                            node={selectedNode}
                            onClose={() => {
                                setSelectedNodeId(null);
                                setBlastRadii([]);
                                setSimulatedNodeId(null);
                                setSimulationRisk(null);
                            }}
                            onSimulationComplete={(targetId, dependentIds, riskLevel) => {
                                setSimulatedNodeId(targetId);
                                setBlastRadii(dependentIds);
                                setSimulationRisk(riskLevel);
                            }}
                        />
                    )}
                </AnimatePresence>
            </main>
        </div >
    );
}
