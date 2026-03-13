'use client';

import { useAuth } from '@/components/auth/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Users, LayoutDashboard, LogOut, Settings, FileText } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { ThemeSwitcher } from '@/components/theme-switcher';

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
            <Sidebar className="border-r border-border">
                <SidebarHeader className="p-4 border-b border-border">
                    <Logo />
                    <div className="text-[10px] text-muted-foreground uppercase font-semibold">Super Admin</div>
                </SidebarHeader>
                <SidebarContent className="p-2">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === '/super-admin'}>
                                <a href="/super-admin" className="flex items-center gap-3">
                                    <LayoutDashboard className="h-4 w-4" />
                                    <span>Dashboard</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === '/super-admin/tenants'}>
                                <a href="/super-admin/tenants" className="flex items-center gap-3">
                                    <Users className="h-4 w-4" />
                                    <span>Assinantes</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === '/super-admin/users'}>
                                <a href="/super-admin/users" className="flex items-center gap-3">
                                    <Users className="h-4 w-4" />
                                    <span>Super Admins</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === '/super-admin/settings'}>
                                <a href="/super-admin/settings" className="flex items-center gap-3">
                                    <Settings className="h-4 w-4" />
                                    <span>Configurações Globais</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={pathname === '/super-admin/plans'}>
                                <a href="/super-admin/plans" className="flex items-center gap-3">
                                    <FileText className="h-4 w-4" />
                                    <span>Planos</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <div className="mt-auto p-4 border-t border-border">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-destructive" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                        Sair
                    </Button>
                </div>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border px-4">
                    <SidebarTrigger className="-ml-1" />
                    <div className="w-full flex justify-end items-center gap-4">
                        <div className="text-sm text-muted-foreground">Logado como: <span className="font-medium text-foreground">{user?.email}</span></div>
                        <ThemeSwitcher />
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 bg-background w-full">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

// Minimal Button import for layout if not yet available globally
import { Button } from '@/components/ui/button';
