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
        <div className="bg-slate-800/30 border border-slate-800 p-6 rounded-xl hover:border-primary/50 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{title}</p>
                <span className={`material-symbols-outlined ${iconColor} group-hover:scale-110 transition-transform`}>
                    {icon}
                </span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-100">{value}</span>
                <span className={`${trendColor} text-sm font-bold`}>{subtext}</span>
            </div>
        </div>
    );
}
