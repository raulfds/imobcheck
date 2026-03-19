'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { LayoutDashboard, ClipboardCheck, Users, FileText, Settings, LogOut, Package, Plus, PanelLeft, Building, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useSidebar } from '@/components/ui/sidebar';
import Link from 'next/link';

const ContentWrapper = ({ children, user, router, logout }: { children: React.ReactNode, user: any, router: any, logout: any }) => {
    const { isMobile } = useSidebar();

    const header = (
        <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur-xl flex items-center px-2 md:px-8 justify-between sticky top-0 z-40 gap-2 md:gap-4 shrink-0 overflow-hidden w-full">
            <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <SidebarTrigger className="h-8 w-8 md:h-9 md:w-9 border border-border bg-card shadow-sm rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0">
                    <PanelLeft className="h-4 w-4" />
                </SidebarTrigger>
                <div className="hidden sm:block">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-50 mb-0">Visão Geral</p>
                    <h2 className="font-black text-base tracking-tight text-foreground truncate uppercase">Painel Digital</h2>
                </div>
                <div className="sm:hidden flex items-center min-w-0">
                    <Logo className="scale-[0.6] origin-left -ml-1" />
                </div>
            </div>
            <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Logado como:</span>
                    <span className="text-[11px] font-bold text-foreground truncate max-w-[120px]">{user?.email}</span>
                </div>
                <div className="hidden md:block h-6 w-px bg-border/50 mx-1" />
                <ThemeSwitcher />
                <Button size="sm" className="h-8 md:h-9 px-2 md:px-4 rounded-xl font-black shadow-lg shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all gap-1.5 md:gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-[10px]" onClick={() => router.push('/dashboard/inspections/new')}>
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden xs:inline">NOVA</span>
                </Button>
            </div>
        </header>
    );

    const mainContent = (
        <main className="flex-1 flex flex-col min-h-0 w-full overflow-y-auto overflow-x-hidden pt-0">
            <div className="py-0 sm:py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full flex-1">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </div>

            {/* Vistorify Footer */}
            <footer className="bg-muted/30 border-t border-border/50 px-6 md:px-8 py-10 mt-auto w-full">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                    <div className="flex items-center gap-3 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                        <div className="w-8 h-8 bg-muted-foreground flex items-center justify-center rounded-xl rotate-45 group-hover:bg-primary transition-colors">
                            <span className="material-symbols-outlined text-background -rotate-45 text-lg font-bold">diamond</span>
                        </div>
                        <h1 className="text-sm font-black tracking-tighter text-muted-foreground uppercase group-hover:text-foreground">VISTORIFY</h1>
                    </div>
                    <div className="flex flex-wrap gap-6 md:gap-8 text-[9px] md:text-[10px] font-black text-muted-foreground tracking-widest uppercase">
                        <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                        <a className="hover:text-primary transition-colors" href="#">Status</a>
                        <a className="hover:text-primary transition-colors" href="#">Support</a>
                        <a className="hover:text-primary transition-colors" href="#">Legal</a>
                    </div>
                    <p className="text-[9px] md:text-[10px] text-muted-foreground font-bold opacity-60">© 2024 VISTORIFY PLATFORMS INC.</p>
                </div>
            </footer>
        </main>
    );

    if (isMobile) {
        return (
            <div className="flex flex-col flex-1 min-w-0 w-full max-w-full h-screen overflow-x-hidden bg-background">
                {header}
                {mainContent}
            </div>
        );
    }

    return (
        <SidebarInset className="bg-background relative flex flex-col min-w-0 flex-1 overflow-hidden">
            {header}
            {mainContent}
        </SidebarInset>
    );
};

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && (!user || (user.role !== 'CLIENT_ADMIN' && user.role !== 'INSPECTOR'))) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="flex h-screen items-center justify-center font-bold animate-pulse text-muted-foreground">Carregando...</div>;
    }

    return (
        <SidebarProvider>
            <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border bg-sidebar shadow-2xl z-50">
                <SidebarHeader className="h-20 flex flex-row items-center justify-between px-6 border-b border-border/50 bg-sidebar mb-2">
                    <Logo />
                </SidebarHeader>
                <SidebarContent className="px-4 bg-sidebar">
                    <SidebarMenu className="gap-1 mt-4">
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === '/dashboard'} tooltip="Dashboard" className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/dashboard" className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors group-data-[active=true]:bg-primary group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                                        <LayoutDashboard className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/inspections')} tooltip="Vistorias" className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/dashboard/inspections" className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors group-data-[active=true]:bg-primary group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                                        <ClipboardCheck className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Vistorias</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <div className="px-5 pt-8 pb-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-data-[collapsible=icon]:hidden opacity-50">Admin</p>
                        </div>

                        <div className="px-5 pt-4 pb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-data-[collapsible=icon]:hidden opacity-50">Cadastros</p>
                        </div>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/registrations/properties')} tooltip="Imóveis" className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/dashboard/registrations/properties" className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors group-data-[active=true]:bg-primary group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                                        <Building className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Imóveis</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/registrations/landlords')} tooltip="Locadores" className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/dashboard/registrations/landlords" className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors group-data-[active=true]:bg-primary group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Locadores</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/registrations/tenants')} tooltip="Inquilinos" className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/dashboard/registrations/tenants" className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors group-data-[active=true]:bg-primary group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Inquilinos</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <div className="px-5 pt-8 pb-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-data-[collapsible=icon]:hidden opacity-50">Equipe & Conta</p>
                        </div>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/team')} tooltip="Equipe" className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/dashboard/team" className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors group-data-[active=true]:bg-primary group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Equipe</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/plan')} tooltip="Meu Plano" className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/dashboard/plan" className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors group-data-[active=true]:bg-primary group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Meu Plano</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname.startsWith('/dashboard/settings')} tooltip="Configurações" className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/dashboard/settings" className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors group-data-[active=true]:bg-primary group-data-[active=true]:text-primary-foreground group-data-[active=true]:shadow-lg group-data-[active=true]:shadow-primary/20">
                                        <Settings className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Configurações</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>

                <SidebarFooter className="p-4 border-t border-border/50 bg-sidebar space-y-4">
                    <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center">
                        <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shrink-0 shadow-inner text-xs">
                            {user.name.charAt(0)}
                        </div>
                        <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
                            <p className="text-xs font-black truncate text-foreground leading-none mb-1">{user.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate font-bold opacity-60 leading-none">{user.email}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all h-9 rounded-xl font-bold group text-[10px]" onClick={logout}>
                        <LogOut className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="group-data-[collapsible=icon]:hidden">ENCERRAR SESSÃO</span>
                    </Button>
                </SidebarFooter>
            </Sidebar>

            <ContentWrapper user={user} router={router} logout={logout}>
                {children}
            </ContentWrapper>
        </SidebarProvider>
    );
}
