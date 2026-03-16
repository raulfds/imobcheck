import React from 'react';

interface TenantFacetCardProps {
    id: string;
    name: string;
    adminName?: string;
    variant: 'left' | 'center' | 'right';
    inspectionsCount: number;
    healthScore: number;
    onClick?: () => void;
}

export function TenantFacetCard({ id, name, adminName, variant, inspectionsCount, healthScore, onClick }: TenantFacetCardProps) {
    if (variant === 'center') {
        return (
            <div
                onClick={onClick}
                className="bg-slate-900 border-x-2 border-primary p-12 z-20 shadow-[0_0_50px_rgba(19,91,236,0.15)] scale-105 rounded-lg transform hover:scale-[1.07] transition-all cursor-pointer group"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-3xl">real_estate_agent</span>
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="text-2xl font-black text-slate-100 truncate">{name}</h3>
                        <p className="text-primary text-xs uppercase font-black tracking-widest truncate">{adminName || 'Principal Tenant'}</p>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-slate-800 p-4 rounded-md">
                            <p className="text-3xl font-black">{inspectionsCount}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">TOTAL VISTORIAS</p>
                        </div>
                        <div className="bg-slate-800 p-4 rounded-md">
                            <p className="text-3xl font-black text-primary">{healthScore}</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">SAÚDE</p>
                        </div>
                    </div>
                </div>
                <button className="mt-12 w-full py-4 bg-primary text-white font-black text-sm tracking-widest rounded-md">GERENCIAR ACESSO</button>
            </div>
        );
    }

    const facetClass = variant === 'left' ? 'v-facet-left' : 'v-facet-right';
    const transformClass = variant === 'left' ? 'hover:-translate-x-2' : 'hover:translate-x-2';
    const borderClass = variant === 'left' ? 'border-r' : 'border-l';
    const iconName = variant === 'left' ? 'apartment' : 'foundation';

    return (
        <div
            onClick={onClick}
            className={`${facetClass} bg-slate-800 ${borderClass} border-slate-700 p-10 z-10 shadow-2xl transform ${transformClass} transition-transform cursor-pointer group`}
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/20 border border-primary/40 rounded flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">{iconName}</span>
                </div>
                <div className="overflow-hidden">
                    <h3 className="text-xl font-bold text-slate-100 truncate">{name}</h3>
                    <p className="text-slate-500 text-xs uppercase font-black truncate">Tenant ID: {id.substring(0, 8).toUpperCase()}</p>
                </div>
            </div>
            <div className="space-y-6">
                <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Vistorias</span>
                    <span className="font-bold">{inspectionsCount}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700 pb-2">
                    <span className="text-slate-400">Score</span>
                    <span className={`font-bold ${healthScore > 8 ? 'text-emerald-400' : 'text-amber-400'}`}>{healthScore}/10</span>
                </div>
                <div className="pt-4">
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${healthScore > 8 ? 'bg-primary' : 'bg-amber-500'}`} style={{ width: `${healthScore * 10}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-tighter">Portfolio Health: {healthScore * 10}%</p>
                </div>
            </div>
            <button className="mt-12 w-full py-2 border border-slate-600 rounded group-hover:bg-primary group-hover:border-primary transition-all text-sm font-bold text-slate-300 group-hover:text-white">VER DETALHES</button>
        </div>
    );
}
