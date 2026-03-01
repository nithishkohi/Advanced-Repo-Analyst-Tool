"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Layers, Lock, Cpu } from "lucide-react";
export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();
    const { login: setAuth, provisionedUsers } = useAuthStore();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();

        // Manager uses fixed credentials for now
        if (username === "sainimalge" && password === "12345678") {
            setAuth(username, "Manager");
            router.push("/");
            return;
        }

        // Junior Dev checks dynamic credentials
        const devUser = provisionedUsers.find(u => u.id === username && u.pass === password);
        if (devUser) {
            setAuth(devUser.id, devUser.role);
            router.push("/");
            return;
        }

        setError("Invalid username or password");
    };

    return (
        <div className="min-h-screen bg-teal-950 flex items-center justify-center overflow-hidden relative font-sans">

            {/* Pure CSS Pink-Teal Grid Background */}
            <div className="absolute inset-0 z-0 bg-teal-950">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#115e59_1px,transparent_1px),linear-gradient(to_bottom,#115e59_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-pink-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            </div>

            {/* Dark overlay to ensure text contrast */}
            <div className="absolute inset-0 z-0 bg-teal-950/40 pointer-events-none" />

            {/* Glassmorphic Auth Card */}
            <div className="relative z-10 bg-teal-900/60 backdrop-blur-2xl border border-teal-700/50 p-10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] max-w-md w-full mx-4 animate-in fade-in zoom-in duration-700">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-teal-900/80 border border-teal-700 rounded-2xl flex flex-col items-center justify-center mb-4 shadow-[0_0_30px_rgba(244,114,182,0.2)] backdrop-blur-md">
                        <Layers className="text-pink-400 w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-50 drop-shadow-sm flex items-center gap-2">
                        <Cpu className="text-pink-500" size={28} /> CodeGraph
                    </h1>
                    <p className="text-orange-50/70 text-sm mt-2 font-medium">Enterprise Intelligence Sandbox</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-teal-200 uppercase tracking-wider mb-2 drop-shadow-md">
                                Developer ID
                            </label>
                            <input
                                type="text"
                                autoFocus
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-teal-950/70 border border-teal-700 text-orange-50 rounded-xl px-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-teal-600 shadow-inner"
                                placeholder="Enter ID..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-teal-200 uppercase tracking-wider mb-2 drop-shadow-md">
                                Auth Token
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-teal-950/70 border border-teal-700 text-orange-50 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all placeholder-teal-600 shadow-inner"
                                    placeholder="••••••••"
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-300 text-sm p-3 rounded-lg text-center backdrop-blur-md">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-pink-600 hover:bg-pink-500 text-orange-50 font-bold py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(244,114,182,0.3)] transition-all active:scale-[0.98] border border-pink-400/20"
                    >
                        Terminal Access
                    </button>
                </form>
            </div>
        </div>
    );
}
