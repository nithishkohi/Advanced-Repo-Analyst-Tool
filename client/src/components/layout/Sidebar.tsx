"use client";

import { UserRole } from "@/types";
import { Activity, Code, Settings, Users, ArrowLeftRight, HardDrive, ShieldAlert, UploadCloud } from "lucide-react";

type SidebarProps = {
    role: UserRole;
    onActionClick: (action: string) => void;
};

export default function Sidebar({ role, onActionClick }: SidebarProps) {
    return (
        <div className="w-64 bg-teal-950 border-r border-teal-800 h-screen flex flex-col justify-between text-orange-50">
            <div>
                <div className="p-6 border-b border-teal-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-pink-500/20 flex items-center justify-center">
                        <span className="text-pink-400 font-bold">CG</span>
                    </div>
                    <div>
                        <h1 className="text-orange-50 font-bold leading-tight">CodeGraph</h1>
                        <p className="text-xs text-teal-400">Intelligence Platform</p>
                    </div>
                </div>

                {/* Removed Role Simulator to enforce true Login flows */}

                <div className="p-4">
                    <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider mb-3 px-2">Navigation</p>
                    <div className="flex flex-col gap-1">
                        {role === "Manager" && (
                            <button onClick={() => onActionClick("upload")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-teal-800/50 transition-colors text-orange-100">
                                <UploadCloud size={16} /> Upload Repo
                            </button>
                        )}
                        {role === "Manager" && (
                            <button onClick={() => onActionClick("prs")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-teal-800/50 transition-colors text-pink-400">
                                <ShieldAlert size={16} /> Review PRs
                            </button>
                        )}
                        {role === "Junior Dev" && (
                            <button onClick={() => onActionClick("prs")} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-teal-800/50 transition-colors text-orange-100">
                                <ShieldAlert size={16} /> Review PRs
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-teal-800">
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-teal-800/50 w-full transition-colors">
                    <Settings size={16} /> Settings
                </button>
            </div>
        </div>
    );
}
