'use client';

import React from 'react';
import Link from 'next/link';
import { 
    Building, 
    User, 
    Users, 
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function RegistrationsIndexPage() {
    const categories = [
        {
            title: 'Imóveis',
            description: 'Gerencie seu portfólio de imóveis, endereços e características.',
            href: '/dashboard/registrations/properties',
            icon: Building,
            color: 'bg-primary',
            lightColor: 'bg-primary/10',
            textColor: 'text-primary',
            count: 'Portfolio Completo'
        },
        {
            title: 'Locadores',
            description: 'Cadastro de proprietários e locadores parceiros.',
            href: '/dashboard/registrations/landlords',
            icon: User,
            color: 'bg-blue-600',
            lightColor: 'bg-blue-500/10',
            textColor: 'text-blue-600',
            count: 'Gestão de Proprietários'
        },
        {
            title: 'Inquilinos',
            description: 'Gestão de locatários e clientes da imobiliária.',
            href: '/dashboard/registrations/tenants',
            icon: Users,
            color: 'bg-emerald-600',
            lightColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-600',
            count: 'Base de Clientes'
        }
    ];

    return (
        <div className="space-y-10 md:space-y-16 w-full pb-20">
            {/* Header section */}
            <div className="flex flex-col md:items-start gap-4 md:gap-6 pt-4 md:pt-10">
                <Breadcrumb className="hidden md:block">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="opacity-20" />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard/registrations" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Cadastros</BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                
                <div className="space-y-2 md:space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] mx-auto md:mx-0 shadow-sm">
                        Central de Gestão
                    </div>
                    <h1 className="text-3xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.9]">
                        O que deseja <br className="hidden md:block" /> 
                        <span className="text-primary italic">gerenciar</span> hoje?
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm md:text-xl max-w-2xl leading-relaxed">
                        Selecione uma categoria abaixo para acessar a lista completa de registros e realizar novos cadastros no sistema.
                    </p>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {categories.map((cat, idx) => (
                    <Link 
                        key={cat.href}
                        href={cat.href}
                        className="group relative flex flex-col bg-card border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-premium hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                    >
                        {/* Abstract Background Element */}
                        <div className={`absolute -right-8 -top-8 w-48 h-48 rounded-full ${cat.lightColor} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                        
                        <div className="relative z-10 flex flex-col h-full space-y-8 md:space-y-12">
                            <div className="flex items-start justify-between">
                                <div className={`h-16 w-16 md:h-20 md:w-20 rounded-3xl ${cat.color} flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                                    <cat.icon className="h-8 w-8 md:h-10 md:w-10 stroke-[2.5px]" />
                                </div>
                                <div className="h-10 w-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground group-hover:bg-foreground group-hover:text-background transition-all">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="space-y-3 md:space-y-4 flex-1">
                                <div className="space-y-1">
                                    <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${cat.textColor}`}>{cat.count}</p>
                                    <h3 className="text-2xl md:text-4xl font-black tracking-tight text-foreground">{cat.title}</h3>
                                </div>
                                <p className="text-muted-foreground font-medium text-sm md:text-base leading-relaxed opacity-80">
                                    {cat.description}
                                </p>
                            </div>

                            <div className="pt-4 flex items-center gap-2 text-foreground font-black text-[10px] md:text-xs uppercase tracking-widest group-hover:gap-4 transition-all">
                                Acessar Módulo <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>

                        {/* Order indicator for aesthetic */}
                        <div className="absolute bottom-6 right-10 text-[6rem] font-black text-foreground/[0.03] select-none group-hover:text-foreground/[0.05] transition-colors leading-none">
                            0{idx + 1}
                        </div>
                    </Link>
                ))}
            </div>

            {/* Bottom help/info */}
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-muted/30 border border-border/50 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
                <div className="space-y-3 text-center md:text-left">
                    <h4 className="text-xl md:text-2xl font-black tracking-tight italic">Precisa de ajuda com os cadastros?</h4>
                    <p className="text-muted-foreground text-sm md:text-base font-medium max-w-xl">
                        Nossa central de ajuda contém tutoriais em vídeo sobre como importar planilhas em massa e gerenciar permissões de acesso.
                    </p>
                </div>
                <button className="h-14 md:h-16 px-10 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest text-[10px] md:text-xs hover:scale-105 active:scale-95 transition-all shadow-xl whitespace-nowrap">
                    Ver Tutoriais
                </button>
            </div>
        </div>
    );
}
