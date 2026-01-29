"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    IconSearch,
    IconX,
    IconExternalLink,
    IconAlertCircle,
    IconArrowLeft,
    IconLoader2,
    IconPackage,
    IconSettings
} from '@tabler/icons-react';
import { useAppMessage } from "@daily-co/daily-react";

interface SearchMatch {
    id: string;
    title: string;
    manufacturer: string;
    partNumber: string;
    url: string;
    imageUrl?: string;
    shortSpecs?: string;
    confidence: number;
}

interface SearchResponse {
    modeUsed: string;
    matches: SearchMatch[];
    bestMatchId?: string;
    bestMatchUrl?: string;
}

export const SearchAssist: React.FC<{ isOpen: boolean; onClose: () => void; onOpen: () => void }> = ({ isOpen, onClose, onOpen }) => {
    const [query, setQuery] = useState("");
    const [autoDetect, setAutoDetect] = useState(true);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchMatch[]>([]);
    const [viewingUrl, setViewingUrl] = useState<string | null>(null);
    const [activeProduct, setActiveProduct] = useState<SearchMatch | null>(null);
    const [iframeBlocked, setIframeBlocked] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleSearch = useCallback(async (overrideQuery?: string) => {
        const searchText = overrideQuery || query;
        if (!searchText.trim()) return;

        setLoading(true);
        setViewingUrl(null);
        setActiveProduct(null);
        setIframeBlocked(false);

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queryText: searchText,
                    mode: autoDetect ? 'auto' : 'keyword'
                })
            });
            const data: SearchResponse = await res.json();
            setResults(data.matches);

            // Auto-open if confidence is high (exact PN match or strong keyword match)
            if (data.matches.length > 0 && data.matches[0].confidence >= 0.7) {
                openProduct(data.matches[0]);
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [query, autoDetect]);

    // Daily App Message Tool Hook (Tavus V2)
    useAppMessage({
        onAppMessage: (event) => {
            console.log('[SearchAssist] 🔔 Incoming Daily App Message:', event);
            const data = (event as any).data;

            // Tavus V2 tool_call event
            if (data?.event === 'tool_call' && data?.name === 'search_assist') {
                // Support both 'query_text' (persona) and 'query' (AI guess)
                const queryText = data.arguments?.query_text || data.arguments?.query;

                console.log('[SearchAssist] 🎯 AI Triggered Search:', queryText);
                if (queryText) {
                    onOpen();
                    setQuery(queryText);
                    handleSearch(queryText);
                }
            } else if (data?.event === 'tool_call') {
                console.log('[SearchAssist] ⚠️ Other Tool Call Received:', data.name);
            }
        },
    });

    // Amy Hook Integration (Global window access)
    useEffect(() => {
        (window as any).amySearchAssist = async (text: string) => {
            onOpen();
            setQuery(text);
            await handleSearch(text);
        };
        return () => { delete (window as any).amySearchAssist; };
    }, [onOpen, handleSearch]);

    const openProduct = (product: SearchMatch) => {
        setViewingUrl(product.url);
        setActiveProduct(product);
        setIframeBlocked(false);

        // Potential check for iframe blocking (timer approach)
        // Note: Many sites (including Insight.com) block iframing via X-Frame-Options: SAMEORIGIN
        // For the demo, we show the card + "Open in New Tab" prominently if it's an external link.
    };

    return (
        <div className={`fixed right-0 top-0 z-[400] h-full w-full max-w-xl bg-slate-900 border-l border-slate-700 shadow-2xl flex flex-col transition-all duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none opacity-0'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[rgb(var(--gd-gold))]/10">
                        <IconSearch className="h-5 w-5 text-[rgb(var(--gd-gold))]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-medium text-white">Search Assist</h2>
                        <p className="text-xs text-slate-400">Inventory & Part Number Lookup</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <IconX size={20} />
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {viewingUrl ? (
                    /* Product Viewer */
                    <div className="flex-1 flex flex-col">
                        <div className="p-3 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                            <button
                                onClick={() => setViewingUrl(null)}
                                className="flex items-center gap-1 text-sm text-slate-300 hover:text-white transition-colors"
                            >
                                <IconArrowLeft size={16} />
                                <span>Back to Results</span>
                            </button>
                            <a
                                href={viewingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-[rgb(var(--gd-blue))] hover:underline"
                            >
                                <IconExternalLink size={14} />
                                <span>View on Insight.com</span>
                            </a>
                        </div>

                        <div className="flex-1 relative bg-slate-900 overflow-y-auto">
                            {/* Detailed Product Card - Primary UI */}
                            <div className="flex flex-col items-center justify-start p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {activeProduct && (
                                    <div className="w-full max-w-lg bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700 shadow-2xl mb-6">
                                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6 text-left">
                                            <div className="w-32 h-32 rounded-xl bg-white flex items-center justify-center p-3 shadow-inner flex-shrink-0">
                                                {activeProduct.imageUrl ? (
                                                    <img src={activeProduct.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <IconPackage className="text-slate-300" size={48} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-[10px] font-bold text-[rgb(var(--gd-gold))] px-2 py-0.5 rounded-full bg-[rgb(var(--gd-gold))]/10 uppercase border border-[rgb(var(--gd-gold))]/20">
                                                        {activeProduct.manufacturer}
                                                    </span>
                                                    <span className="text-xs text-slate-500 font-mono">PN: {activeProduct.partNumber}</span>
                                                </div>
                                                <h3 className="text-xl font-semibold text-white leading-tight mb-3">{activeProduct.title}</h3>
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-slate-400">Specifications:</p>
                                                    <div className="bg-slate-900/50 rounded-lg p-3 text-xs text-slate-300 leading-relaxed border border-slate-700/50">
                                                        {activeProduct.shortSpecs}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            <a
                                                href={activeProduct.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full gd-btn gd-btn-primary py-3 rounded-xl justify-center text-sm font-bold tracking-wider"
                                            >
                                                <IconExternalLink size={18} className="mr-2" />
                                                VIEW FULL DETAILS ON INSIGHT.COM
                                            </a>
                                            <p className="text-[10px] text-slate-500 italic mt-2">
                                                * Real-time availability and pricing may vary by region and contract.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Background Iframe (尝试加载，但不作为主UI) */}
                            <iframe
                                ref={iframeRef}
                                src={viewingUrl}
                                className="absolute inset-0 w-full h-full border-0 bg-white opacity-0 pointer-events-none"
                                title="Product Detail"
                                onError={() => setIframeBlocked(true)}
                            />
                        </div>
                    </div>
                ) : (
                    /* Search & Results list */
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                        {/* Input Box */}
                        <div className="mb-6 space-y-3">
                            <div className="relative">
                                <textarea
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pr-12 text-sm text-white focus:ring-1 focus:ring-[rgb(var(--gd-gold))] focus:border-[rgb(var(--gd-gold))] outline-none min-h-[100px] resize-none transition-shadow placeholder:text-slate-600"
                                    placeholder="Paste PN, BOM line, or keywords (e.g., 'Cisco 9500 48 port')..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSearch();
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => handleSearch()}
                                    disabled={loading || !query.trim()}
                                    className="absolute right-3 bottom-3 p-2 bg-[rgb(var(--gd-gold))] text-slate-950 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    {loading ? <IconLoader2 className="animate-spin" size={20} /> : <IconSearch size={20} />}
                                </button>
                            </div>

                            <div className="flex items-center justify-between px-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={autoDetect}
                                        onChange={(e) => setAutoDetect(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-[rgb(var(--gd-gold))] focus:ring-[rgb(var(--gd-gold))]"
                                    />
                                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors select-none">Auto-detect Mode (PN vs Keywords)</span>
                                </label>
                                <button
                                    onClick={() => setQuery("")}
                                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {/* Status/Divider */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-px flex-1 bg-slate-800"></div>
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Results</span>
                            <div className="h-px flex-1 bg-slate-800"></div>
                        </div>

                        {/* Results List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {results.length > 0 ? (
                                results.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => openProduct(product)}
                                        className="group p-3 rounded-xl border border-slate-800/50 bg-slate-800/20 hover:bg-slate-800/40 hover:border-[rgb(var(--gd-gold))]/30 transition-all cursor-pointer"
                                    >
                                        <div className="flex gap-3">
                                            <div className="w-12 h-12 rounded bg-white flex items-center justify-center p-1 flex-shrink-0">
                                                {product.imageUrl ? (
                                                    <img src={product.imageUrl} alt="" className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <IconPackage className="text-slate-400" size={24} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors truncate">{product.title}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-[rgb(var(--gd-gold))] px-1.5 py-0.5 rounded bg-[rgb(var(--gd-gold))]/10 uppercase">{product.manufacturer}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">{product.partNumber}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">{product.shortSpecs}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : query && !loading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                                    <IconAlertCircle size={32} className="mb-2 opacity-20" />
                                    <p className="text-sm">No exact matches found.</p>
                                    <p className="text-xs opacity-60">Try searching for a Part Number (e.g. C9500) or general IT keywords.</p>
                                </div>
                            ) : !loading && (
                                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 opacity-40">
                                    <IconPackage size={32} className="mb-2" />
                                    <p className="text-sm italic">Enter search terms above to assist Amy</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 text-[10px] text-slate-600 flex justify-between items-center bg-slate-900">
                <span>Insight Demo Mode v1.0</span>
                <span className="flex items-center gap-1">
                    <IconSettings size={12} />
                    Provider: Mock Catalog
                </span>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #334155;
                }
            `}</style>
        </div>
    );
};
