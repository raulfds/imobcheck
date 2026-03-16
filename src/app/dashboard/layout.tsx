'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, ClipboardCheck, Users, FileText, Settings, LogOut, Package, Plus, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeSwitcher } from '@/components/theme-switcher';
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
            <div className="flex min-h-screen w-full bg-background font-display antialiased text-foreground">
                <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border bg-sidebar shadow-xl">
                    <SidebarHeader className="h-20 flex items-center px-6 border-b border-border/50 bg-sidebar/50 backdrop-blur-md mb-2">
                        <Logo />
                    </SidebarHeader>
                    <SidebarContent className="px-4">
                        <SidebarMenu className="gap-2 mt-4">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Dashboard" className="h-12 rounded-xl transition-all duration-200 group">
                                    <a href="/dashboard" className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                            <LayoutDashboard className="h-[18px] w-[18px]" />
                                        </div>
                                        <span className="font-bold tracking-tight text-sm">Dashboard</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Vistorias" className="h-12 rounded-xl transition-all duration-200 group">
                                    <a href="/dashboard/inspections" className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                            <ClipboardCheck className="h-[18px] w-[18px]" />
                                        </div>
                                        <span className="font-bold tracking-tight text-sm">Vistorias</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <div className="px-4 pt-8 pb-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-data-[collapsible=icon]:hidden opacity-70">Administrativo</p>
                            </div>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Cadastros" className="h-12 rounded-xl transition-all duration-200 group">
                                    <a href="/dashboard/registrations" className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                            <FileText className="h-[18px] w-[18px]" />
                                        </div>
                                        <span className="font-bold tracking-tight text-sm">Imóveis & Clientes</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Equipe" className="h-12 rounded-xl transition-all duration-200 group">
                                    <a href="/dashboard/team" className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                            <Users className="h-[18px] w-[18px]" />
                                        </div>
                                        <span className="font-bold tracking-tight text-sm">Equipe</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Meu Plano" className="h-12 rounded-xl transition-all duration-200 group">
                                    <a href="/dashboard/plan" className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                            <Package className="h-[18px] w-[18px]" />
                                        </div>
                                        <span className="font-bold tracking-tight text-sm">Meu Plano</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Configurações" className="h-12 rounded-xl transition-all duration-200 group">
                                    <a href="/dashboard/settings" className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors`}>
                                            <Settings className="h-[18px] w-[18px]" />
                                        </div>
                                        <span className="font-bold tracking-tight text-sm">Configurações</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                    
                    <SidebarFooter className="p-4 md:p-6 border-t border-border/50 bg-sidebar/30 space-y-4">
                        <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0 shadow-inner">
                                {user.name.charAt(0)}
                            </div>
                            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                                <p className="text-sm font-black truncate text-foreground leading-tight">{user.name}</p>
                                <p className="text-[11px] text-muted-foreground truncate font-bold opacity-60">{user.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all h-10 md:h-11 rounded-xl font-bold group" onClick={logout}>
                            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            <span className="group-data-[collapsible=icon]:hidden">ENCERRAR SESSÃO</span>
                        </Button>
                    </SidebarFooter>
                </Sidebar>
                <main className="flex-1 w-full max-w-full overflow-hidden flex flex-col bg-background">
                    <header className="h-16 md:h-20 border-b border-border/50 bg-background/50 backdrop-blur-xl flex items-center px-4 md:px-10 justify-between sticky top-0 z-50 gap-4">
                        <div className="flex items-center gap-4 md:gap-6">
                            <SidebarTrigger className="h-10 w-10 md:h-11 md:w-11 border border-border bg-card shadow-sm rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                                <PanelLeft className="h-5 w-5" />
                            </SidebarTrigger>
                            <div className="hidden sm:block">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60 mb-0.5">Visão Geral</p>
                                <h2 className="font-black text-lg md:text-xl tracking-tight text-foreground truncate uppercase">Painel Digital</h2>
                            </div>
                            <div className="sm:hidden">
                                <Logo className="scale-75 origin-left" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-4">
                            <div className="hidden sm:flex flex-col items-end mr-2">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Logado como:</span>
                                <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{user?.email}</span>
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-border/50 mx-2" />
                            <ThemeSwitcher />
                            <Button size="lg" className="h-10 md:h-12 px-4 md:px-8 rounded-lg md:rounded-xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2 md:gap-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs" onClick={() => router.push('/dashboard/inspections/new')}>
                                <Plus className="h-4 w-4 md:h-5 md:w-5" />
                                <span className="hidden xs:inline">NOVA VISTORIA</span>
                            </Button>
                        </div>
                    </header>
                    <div className="flex-1 p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-background overflow-x-hidden">
                        <div className="max-w-7xl mx-auto w-full">
                            {children}
                        </div>
                    </div>

                    {/* Vistorify Footer */}
                    <footer className="bg-muted/30 border-t border-border/50 px-8 py-10 mt-auto">
                        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                            <div className="flex items-center gap-3 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                                <div className="w-8 h-8 bg-muted-foreground flex items-center justify-center rounded-xl rotate-45 group-hover:bg-primary transition-colors">
                                    <span className="material-symbols-outlined text-background -rotate-45 text-lg font-bold">diamond</span>
                                </div>
                                <h1 className="text-sm font-black tracking-tighter text-muted-foreground uppercase group-hover:text-foreground">VISTORIFY</h1>
                            </div>
                            <div className="flex flex-wrap gap-8 text-[10px] font-black text-muted-foreground tracking-widest uppercase">
                                <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
                                <a className="hover:text-primary transition-colors" href="#">System Status</a>
                                <a className="hover:text-primary transition-colors" href="#">Support API</a>
                                <a className="hover:text-primary transition-colors" href="#">Legal</a>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-bold opacity-60">© 2024 VISTORIFY PLATFORMS INC. ALL RIGHTS RESERVED.</p>
                        </div>
                    </footer>
                </main>
            </div>
        </SidebarProvider>
    );
}
