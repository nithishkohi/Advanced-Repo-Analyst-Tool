"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import axios from "axios";

type SearchResult = {
    id: string;
    summary: string;
    score: number;
};

type SearchBarProps = {
    onResultClick: (filename: string) => void;
};

export default function SearchBar({ onResultClick }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const res = await axios.post("http://127.0.0.1:8000/api/v1/semantic-search", { query: query, top_k: 5 });
            setResults(res.data.matches || []);
        } catch (error) {
            console.error("Search failed", error);
            setResults([{ id: "Error", summary: "Backend search unavailable", score: 0 }]);
        }
        setIsSearching(false);
    };

    return (
        <div className="relative z-50 pointer-events-auto">
            <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400" size={16} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Semantic Search (e.g. 'Where is login handled?')"
                    className="bg-teal-900/80 backdrop-blur-md border border-teal-700 text-orange-50 text-sm rounded-lg pl-10 pr-4 py-2 w-80 focus:outline-none focus:border-pink-500 transition-colors shadow-lg placeholder-teal-500"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-pink-400 animate-spin" size={16} />
                )}
            </form>

            {/* Results Dropdown */}
            {results.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-teal-900 border border-teal-700 rounded-lg shadow-xl overflow-hidden">
                    {results.map((res, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                onResultClick(res.id);
                                setResults([]);
                                setQuery("");
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-teal-800 border-b border-teal-800/50 last:border-0 transition-colors"
                        >
                            <h4 className="text-orange-50 text-sm font-medium truncate">{res.id}</h4>
                            <p className="text-xs text-teal-300 truncate mt-0.5">{res.summary}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
