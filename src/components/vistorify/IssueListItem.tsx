import React from 'react';

interface IssueListItemProps {
    title: string;
    location: string;
    timeAgo: string;
    severity: 'critical' | 'warning' | 'info';
}

export function IssueListItem({ title, location, timeAgo, severity }: IssueListItemProps) {
    let bgClass = 'bg-slate-700/20';
    let borderClass = 'border-slate-600';
    let iconClass = 'text-slate-400';
    let iconName = 'verified';

    if (severity === 'critical') {
        bgClass = 'bg-red-500/5';
        borderClass = 'border-red-500';
        iconClass = 'text-red-500';
        iconName = 'warning';
    } else if (severity === 'warning') {
        bgClass = 'bg-amber-500/5';
        borderClass = 'border-amber-500';
        iconClass = 'text-amber-500';
        iconName = 'construction';
    }

    return (
        <div className={`flex items-center gap-4 p-4 ${bgClass} border-l-4 ${borderClass} rounded-r-lg`}>
            <span className={`material-symbols-outlined ${iconClass}`}>{iconName}</span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-100 truncate">{title}</p>
                <p className="text-xs text-slate-500 truncate">{location}</p>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase shrink-0">{timeAgo}</span>
        </div>
    );
}
