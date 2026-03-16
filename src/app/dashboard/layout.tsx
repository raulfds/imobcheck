'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, ClipboardCheck, Users, FileText, Settings, LogOut, Package, Plus, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && (!user || (user.role !== 'CLIENT_ADMIN' && user.role !== 'INSPECTOR'))) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    }

    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background-light dark:bg-[#1A1A1A] font-display antialiased text-slate-100">
                <Sidebar variant="sidebar" collapsible="icon" className="border-r border-slate-800 shadow-xl bg-[#1A1A1A]">
                    <SidebarHeader className="h-20 flex items-center px-6 border-b border-slate-800 mb-2">
                        <Logo />
                    </SidebarHeader>
                    <SidebarContent className="px-3">
                        <SidebarMenu className="gap-1.5 mt-2">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Dashboard" className="h-11 rounded-lg transition-all hover:bg-slate-800 hover:text-primary px-4 group">
                                    <a href="/dashboard" className="flex items-center gap-3">
                                        <LayoutDashboard className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-bold tracking-wide text-sm">DASHBOARD</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Vistorias" className="h-11 rounded-lg transition-all hover:bg-slate-800 hover:text-primary px-4 group">
                                    <a href="/dashboard/inspections" className="flex items-center gap-3">
                                        <ClipboardCheck className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-bold tracking-wide text-sm">VISTORIAS</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <div className="px-4 pt-6 pb-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-data-[collapsible=icon]:hidden">Administrativo</p>
                            </div>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Cadastros" className="h-11 rounded-lg transition-all hover:bg-slate-800 hover:text-primary px-4 group">
                                    <a href="/dashboard/registrations" className="flex items-center gap-3">
                                        <FileText className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-bold tracking-wide text-sm">IMÓVEIS & CLIENTES</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Equipe" className="h-11 rounded-lg transition-all hover:bg-slate-800 hover:text-primary px-4 group">
                                    <a href="/dashboard/team" className="flex items-center gap-3">
                                        <Users className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-bold tracking-wide text-sm">EQUIPE</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Meu Plano" className="h-11 rounded-lg transition-all hover:bg-slate-800 hover:text-primary px-4 group">
                                    <a href="/dashboard/plan" className="flex items-center gap-3">
                                        <Package className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-bold tracking-wide text-sm">MEU PLANO</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Configurações" className="h-11 rounded-lg transition-all hover:bg-slate-800 hover:text-primary px-4 group">
                                    <a href="/dashboard/settings" className="flex items-center gap-3">
                                        <Settings className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-bold tracking-wide text-sm">CONFIGURAÇÕES</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                    
                    <SidebarFooter className="p-4 border-t border-slate-800 space-y-4">
                        <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center">
                            <div className="h-9 w-9 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 font-bold shrink-0">
                                {user.name.charAt(0)}
                            </div>
                            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                                <p className="text-sm font-bold truncate text-slate-100 leading-tight">{user.name}</p>
                                <p className="text-xs text-slate-400 truncate font-medium">{user.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full gap-2 text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors h-10 rounded-lg font-bold group" onClick={logout}>
                            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                            <span className="group-data-[collapsible=icon]:hidden">ENCERRAR SESSÃO</span>
                        </Button>
                    </SidebarFooter>
                </Sidebar>
                <main className="flex-1 w-full max-w-full overflow-hidden flex flex-col">
                    <header className="h-20 border-b border-slate-800 bg-[#1A1A1A]/80 backdrop-blur-md flex items-center px-4 md:px-10 justify-between sticky top-0 z-50 gap-4">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="md:hidden h-10 w-10 border border-slate-800 bg-[#1A1A1A] shadow-sm rounded-lg text-slate-400">
                                <PanelLeft className="h-5 w-5" />
                            </SidebarTrigger>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Visão Geral</p>
                                <h2 className="font-black text-xl tracking-tight text-slate-100 truncate max-w-[120px] sm:max-w-none uppercase">Área da Imobiliária</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button size="lg" className="h-11 px-6 rounded-lg font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2 bg-primary hover:bg-primary/90 text-white" onClick={() => router.push('/dashboard/inspections/new')}>
                                <Plus className="h-5 w-5" />
                                <span className="hidden sm:inline">NOVA VISTORIA</span>
                            </Button>
                        </div>
                    </header>
                    <div className="flex-1 p-4 md:p-8 lg:p-10 animate-in fade-in slide-in-from-bottom-2 duration-700 bg-background-light dark:bg-[#1A1A1A] overflow-x-hidden">
                        {children}
                    </div>

                    {/* Vistorify Footer */}
                    <footer className="bg-slate-900 border-t border-slate-800 px-6 py-8 mt-auto">
                        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                            <div className="flex items-center gap-3 grayscale opacity-50">
                                <div className="w-6 h-6 bg-slate-500 flex items-center justify-center rounded-lg rotate-45">
                                    <span className="material-symbols-outlined text-slate-900 -rotate-45 text-sm font-bold">diamond</span>
                                </div>
                                <h1 className="text-sm font-black tracking-tighter text-slate-500 uppercase">VISTORIFY</h1>
                            </div>
                            <div className="flex gap-12 text-xs font-bold text-slate-500 tracking-widest uppercase">
                                <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                                <a className="hover:text-primary transition-colors" href="#">System Status</a>
                                <a className="hover:text-primary transition-colors" href="#">Support API</a>
                                <a className="hover:text-primary transition-colors" href="#">Legal</a>
                            </div>
                            <p className="text-xs text-slate-600 font-medium">© 2024 VISTORIFY PLATFORMS INC. ALL RIGHTS RESERVED.</p>
                        </div>
                    </footer>
                </main>
            </div>
        </SidebarProvider>
    );
}
