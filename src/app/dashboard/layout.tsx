'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { LayoutDashboard, ClipboardCheck, Users, Building, FileText, Settings, LogOut, Package, Plus, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
            <div className="flex min-h-screen w-full bg-background font-sans antialiased text-foreground">
                <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border/50 shadow-xl bg-card">
                    <SidebarHeader className="h-20 flex items-center px-6 border-b border-border/40 mb-2">
                        <Logo />
                    </SidebarHeader>
                    <SidebarContent className="px-3">
                        <SidebarMenu className="gap-1.5">
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Dashboard" className="h-11 rounded-xl transition-all hover:bg-primary/5 hover:text-primary px-4 group">
                                    <a href="/dashboard" className="flex items-center gap-3">
                                        <LayoutDashboard className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-semibold tracking-tight">Dashboard</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Vistorias" className="h-11 rounded-xl transition-all hover:bg-primary/5 hover:text-primary px-4 group">
                                    <a href="/dashboard/inspections" className="flex items-center gap-3">
                                        <ClipboardCheck className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-semibold tracking-tight">Vistorias</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <div className="px-4 pt-6 pb-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-data-[collapsible=icon]:hidden">Administrativo</p>
                            </div>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Cadastros" className="h-11 rounded-xl transition-all hover:bg-primary/5 hover:text-primary px-4 group">
                                    <a href="/dashboard/registrations" className="flex items-center gap-3">
                                        <FileText className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-semibold tracking-tight">Imóveis & Clientes</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Equipe" className="h-11 rounded-xl transition-all hover:bg-primary/5 hover:text-primary px-4 group">
                                    <a href="/dashboard/team" className="flex items-center gap-3">
                                        <Users className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-semibold tracking-tight">Equipe</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Meu Plano" className="h-11 rounded-xl transition-all hover:bg-primary/5 hover:text-primary px-4 group">
                                    <a href="/dashboard/plan" className="flex items-center gap-3">
                                        <Package className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-semibold tracking-tight">Meu Plano</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton asChild tooltip="Configurações" className="h-11 rounded-xl transition-all hover:bg-primary/5 hover:text-primary px-4 group">
                                    <a href="/dashboard/settings" className="flex items-center gap-3">
                                        <Settings className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                                        <span className="font-semibold tracking-tight">Configurações</span>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarContent>
                    
                    <SidebarFooter className="p-4 border-t border-border/40 space-y-4">
                        <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                                {user.name.charAt(0)}
                            </div>
                            <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                                <p className="text-sm font-bold truncate text-foreground leading-tight">{user.name}</p>
                                <p className="text-xs text-muted-foreground truncate font-medium">{user.email}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full gap-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors h-10 rounded-xl font-bold group" onClick={logout}>
                            <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                            <span className="group-data-[collapsible=icon]:hidden">Encerrar Sessão</span>
                        </Button>
                    </SidebarFooter>
                </Sidebar>
                <main className="flex-1 w-full max-w-full overflow-hidden flex flex-col">
                    <header className="h-20 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center px-4 md:px-10 justify-between sticky top-0 z-10 gap-4">
                        <div className="flex items-center gap-4">
                            <SidebarTrigger className="md:hidden h-10 w-10 border border-border/40 bg-card shadow-sm rounded-xl">
                                <PanelLeft className="h-5 w-5" />
                            </SidebarTrigger>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Visão Geral</p>
                                <h2 className="font-extrabold text-lg md:text-xl tracking-tight text-foreground truncate max-w-[120px] sm:max-w-none">Área da Imobiliária</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <ThemeSwitcher />
                            <Button size="lg" className="h-11 px-6 rounded-xl font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all gap-2" onClick={() => router.push('/dashboard/inspections/new')}>
                                <Plus className="h-5 w-5" />
                                <span className="hidden sm:inline">Nova Vistoria</span>
                            </Button>
                        </div>
                    </header>
                    <div className="flex-1 p-6 md:p-10 lg:p-12 animate-in fade-in slide-in-from-bottom-2 duration-700 bg-muted/20">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}
