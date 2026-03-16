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
                className="bg-card border-x-2 border-primary p-12 z-20 shadow-premium scale-105 rounded-xl transform hover:scale-[1.07] transition-all cursor-pointer group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="flex items-center gap-4 mb-8 relative z-10">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined text-white text-3xl">real_estate_agent</span>
                    </div>
                    <div className="overflow-hidden">
                        <h3 className="text-2xl font-black text-foreground truncate">{name}</h3>
                        <p className="text-primary text-xs uppercase font-black tracking-widest truncate">{adminName || 'Principal Tenant'}</p>
                    </div>
                </div>
                <div className="space-y-6 relative z-10">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-muted p-4 rounded-xl border border-border/50">
                            <p className="text-3xl font-black text-foreground">{inspectionsCount}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">TOTAL VISTORIAS</p>
                        </div>
                        <div className="bg-muted p-4 rounded-xl border border-border/50">
                            <p className="text-3xl font-black text-primary">{healthScore}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">SAÚDE</p>
                        </div>
                    </div>
                </div>
                <button className="relative z-10 mt-12 w-full py-4 bg-primary text-primary-foreground font-black text-sm tracking-widest rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">GERENCIAR ACESSO</button>
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
            className={`${facetClass} bg-card/40 backdrop-blur-sm ${borderClass} border-border p-10 z-10 shadow-xl transform ${transformClass} transition-all cursor-pointer group relative`}
        >
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary">{iconName}</span>
                </div>
                <div className="overflow-hidden">
                    <h3 className="text-xl font-bold text-foreground truncate">{name}</h3>
                    <p className="text-muted-foreground text-xs uppercase font-black truncate">ID: {id.substring(0, 8).toUpperCase()}</p>
                </div>
            </div>
            <div className="space-y-6">
                <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Vistorias</span>
                    <span className="font-bold text-foreground">{inspectionsCount}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                    <span className="text-muted-foreground font-medium">Score</span>
                    <span className={`font-bold ${healthScore > 8 ? 'text-emerald-500' : 'text-amber-500'}`}>{healthScore}/10</span>
                </div>
                <div className="pt-4">
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${healthScore > 8 ? 'bg-primary' : 'bg-amber-500'}`} style={{ width: `${healthScore * 10}%` }}></div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 font-bold uppercase tracking-wider">Portfolio Health: {healthScore * 10}%</p>
                </div>
            </div>
            <button className="mt-12 w-full py-3 border border-border rounded-xl group-hover:bg-primary group-hover:border-primary transition-all text-sm font-bold text-muted-foreground group-hover:text-primary-foreground">VER DETALHES</button>
        </div>
    );
}
