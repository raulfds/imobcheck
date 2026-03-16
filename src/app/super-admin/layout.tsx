'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Users, LayoutDashboard, LogOut, Settings, FileText, Building2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';

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
            <Sidebar className="border-r border-border bg-sidebar shadow-xl">
                <SidebarHeader className="p-6 border-b border-border/50 bg-sidebar/50 backdrop-blur-md">
                    <Logo />
                    <div className="mt-2 text-[10px] text-primary uppercase font-black tracking-[0.2em]">Super Admin</div>
                </SidebarHeader>
                <SidebarContent className="p-4 space-y-4">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin'} className="rounded-xl transition-all duration-200">
                                <a href="/super-admin" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                                        <LayoutDashboard className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold">Dashboard</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin/tenants'} className="rounded-xl transition-all duration-200">
                                <a href="/super-admin/tenants" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin/tenants' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                                        <Building2 className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold">Assinantes</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin/users'} className="rounded-xl transition-all duration-200">
                                <a href="/super-admin/users" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin/users' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                                        <Users className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold">Super Admins</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin/settings'} className="rounded-xl transition-all duration-200">
                                <a href="/super-admin/settings" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin/settings' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                                        <Settings className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold">Configurações Globais</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild isActive={pathname === '/super-admin/plans'} className="rounded-xl transition-all duration-200">
                                <a href="/super-admin/plans" className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${pathname === '/super-admin/plans' ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                                        <FileText className="h-4 w-4" />
                                    </div>
                                    <span className="font-bold">Planos</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <div className="mt-auto p-6 border-t border-border/50 bg-sidebar/30">
                    <Button variant="ghost" className="w-full justify-start gap-4 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl h-12 font-bold transition-all" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                        Sair do Sistema
                    </Button>
                </div>
            </Sidebar>
            <SidebarInset className="bg-background">
                <header className="flex h-16 md:h-20 shrink-0 items-center justify-between gap-4 border-b border-border/50 px-4 md:px-8 bg-background/50 backdrop-blur-xl sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="hover:bg-muted rounded-lg w-10 h-10" />
                        <div className="md:hidden">
                            <Logo className="scale-75 origin-left" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 md:gap-6">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Logado como:</span>
                            <span className="text-xs font-bold text-foreground truncate max-w-[150px]">{user?.email}</span>
                        </div>
                        <div className="hidden sm:block h-8 w-px bg-border/50 mx-2" />
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
