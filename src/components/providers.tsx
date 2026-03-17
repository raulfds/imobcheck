'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/components/auth/auth-provider';
import { TenantProvider } from '@/components/providers/tenant-provider';
import { useState } from 'react';

import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                <TenantProvider>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </TenantProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
