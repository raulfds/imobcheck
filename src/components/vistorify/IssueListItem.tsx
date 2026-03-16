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
        bgClass = 'bg-destructive/10';
        borderClass = 'border-destructive';
        iconClass = 'text-destructive';
        iconName = 'warning';
    } else if (severity === 'warning') {
        bgClass = 'bg-amber-500/10';
        borderClass = 'border-amber-500';
        iconClass = 'text-amber-500';
        iconName = 'construction';
    } else {
        bgClass = 'bg-primary/10';
        borderClass = 'border-primary';
        iconClass = 'text-primary';
        iconName = 'verified';
    }

    return (
        <div className={`flex items-center gap-4 p-5 ${bgClass} border-l-4 ${borderClass} rounded-r-2xl transition-all hover:scale-[1.02]`}>
            <div className={`h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${iconClass}`}>{iconName}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-foreground truncate">{title}</p>
                <p className="text-[11px] text-muted-foreground font-bold truncate tracking-wide">{location}</p>
            </div>
            <span className="text-[10px] font-black text-muted-foreground uppercase shrink-0 tracking-widest bg-muted px-2 py-1 rounded-md">{timeAgo}</span>
        </div>
    );
}
