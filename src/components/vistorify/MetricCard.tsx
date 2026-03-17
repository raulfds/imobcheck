import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtext: string;
    trend?: 'up' | 'down' | 'neutral';
    icon: string;
    iconColor?: string;
}

export function MetricCard({ title, value, subtext, trend = 'neutral', icon, iconColor = 'text-primary' }: MetricCardProps) {
    let trendColor = 'text-slate-500';
    if (trend === 'up') trendColor = 'text-emerald-500';
    if (trend === 'down') trendColor = 'text-red-500';

    return (
        <div className="bg-card rounded-2xl border border-border p-4 md:p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/50 group relative overflow-hidden">
            <div className="flex flex-col justify-between h-full relative z-10">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                    <p className="text-muted-foreground font-bold text-[9px] md:text-[10px] uppercase tracking-[0.2em]">{title}</p>
                    <div className={`p-1.5 md:p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors`}>
                        <span className={`material-symbols-outlined text-lg md:text-xl ${iconColor} group-hover:scale-110 transition-transform`}>
                            {icon}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col xs:flex-row xs:items-baseline gap-1 xs:gap-2">
                    <span className="text-2xl md:text-3xl font-black text-foreground tracking-tighter leading-none">{value}</span>
                    <span className={`${trendColor} text-[8px] md:text-[10px] font-black uppercase tracking-wider`}>{subtext}</span>
                </div>
            </div>
        </div>
    );
}
