'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RegistrationsNav() {
    const pathname = usePathname();

    const items = [
        {
            label: 'Imóveis',
            href: '/dashboard/registrations/properties',
            icon: Building,
            active: pathname === '/dashboard/registrations/properties'
        },
        {
            label: 'Locadores',
            href: '/dashboard/registrations/landlords',
            icon: User,
            active: pathname === '/dashboard/registrations/landlords'
        },
        {
            label: 'Inquilinos',
            href: '/dashboard/registrations/tenants',
            icon: Users,
            active: pathname === '/dashboard/registrations/tenants'
        }
    ];

    return (
        <div className="flex bg-muted/50 p-1 rounded-2xl h-14 md:h-16 w-full md:w-auto shadow-inner grid grid-cols-3 md:flex gap-1">
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "rounded-xl px-2 md:px-10 h-full flex items-center justify-center gap-1.5 md:gap-3 font-black text-[9px] md:text-[10px] uppercase tracking-tighter md:tracking-[0.2em] transition-all",
                        item.active 
                            ? "bg-background shadow-lg text-primary scale-[1.02]" 
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                >
                    <item.icon className={cn("h-3.5 w-3.5 md:h-4 md:w-4", item.active ? "text-primary" : "text-muted-foreground")} />
                    <span className="truncate">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}
