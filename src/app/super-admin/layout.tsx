'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Users, LayoutDashboard, LogOut, Settings, FileText, Building2, PanelLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && (!user || user.role !== 'SUPER_ADMIN')) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    }

    return (
        <SidebarProvider>
            <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border bg-sidebar shadow-2xl z-50">
                <SidebarHeader className="h-20 flex flex-row items-center justify-between px-6 border-b border-border/50 bg-sidebar mb-2">
                    <div className="flex flex-col">
                        <Logo />
                        <div className="mt-1 text-[8px] text-primary uppercase font-black tracking-[0.2em] opacity-50">Super Admin</div>
                    </div>
                </SidebarHeader>
                <SidebarContent className="px-4 bg-sidebar">
                    <SidebarMenu className="gap-1 mt-4">
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin'} className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5 data-[active=true]:bg-primary/10">
                                <Link href="/super-admin" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                                        <LayoutDashboard className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin/tenants'} className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5">
                                <Link href="/super-admin/tenants" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin/tenants' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Assinantes</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin/users'} className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5">
                                <Link href="/super-admin/users" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin/users' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Super Admins</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin/settings'} className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5">
                                <Link href="/super-admin/settings" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin/settings' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                                        <Settings className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Configurações</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin/plans'} className="h-11 rounded-xl transition-all duration-200 group hover:bg-primary/5">
                                <Link href="/super-admin/plans" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin/plans' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors'}`}>
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold tracking-tight text-sm">Planos</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <div className="mt-auto p-4 border-t border-border/50 bg-sidebar">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl h-10 font-bold transition-all text-xs" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                        Sair do Sistema
                    </Button>
                </div>
            </Sidebar>
            <SidebarInset className="bg-background relative z-0">
                <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/50 px-4 md:px-8 bg-background/95 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="h-9 w-9 border border-border bg-card shadow-sm rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                            <PanelLeft className="h-4 w-4" />
                        </SidebarTrigger>
                        <div className="md:hidden">
                            <Logo className="scale-75 origin-left" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Logado como:</span>
                            <span className="text-[11px] font-bold text-foreground truncate max-w-[120px]">{user?.email}</span>
                        </div>
                        <div className="hidden md:block h-6 w-px bg-border/50 mx-1" />
                        <ThemeSwitcher />
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-10 bg-background w-full">
                    <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
