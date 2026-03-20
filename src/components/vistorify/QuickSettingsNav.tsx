'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Settings, Users, Shield, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuickSettingsNav() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        {
            label: 'Perfil',
            href: '/dashboard/settings',
            icon: Settings,
            active: pathname === '/dashboard/settings'
        },
        {
            label: 'Equipe',
            href: '/dashboard/team',
            icon: Users,
            active: pathname === '/dashboard/team'
        },
        {
            label: 'Plano',
            href: '/dashboard/plan',
            icon: CreditCard,
            active: pathname === '/dashboard/plan'
        }
    ];

    return (
        <div className="flex bg-card/50 backdrop-blur-sm p-1.5 rounded-2xl border border-border/50 shadow-sm w-full md:w-auto gap-1">
            {items.map((item) => (
                <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                        "flex-1 md:flex-none rounded-xl px-4 py-2.5 flex items-center justify-center gap-2.5 font-bold text-[10px] uppercase tracking-wider transition-all",
                        item.active 
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <item.icon className={cn("h-4 w-4 transition-transform", item.active ? "scale-110" : "opacity-50")} />
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
}
