'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Tenant } from '@/types';
import { mockTenants as initialMockTenants } from '@/lib/mock-data';
import {
    fetchAgencies, createAgency, updateAgency, deleteAgency, saveSystemUser, resetUserPassword, fetchUsersByAgency
} from '@/lib/database';
import { isSupabaseConfigured } from '@/lib/supabase';

interface TenantContextData {
    tenants: Tenant[];
    loading: boolean;
    error: string | null;
    addTenant: (tenant: Omit<Tenant, 'id'>) => Promise<{ tenant: Tenant, tempPassword?: string }>;
    updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
    deleteTenant: (id: string) => Promise<void>;
    resetTenantAdminPassword: (tenantId: string, email: string) => Promise<string>;
    refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextData>({} as TenantContextData);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenants, setTenants] = useState<Tenant[]>(isSupabaseConfigured ? [] : initialMockTenants);
    const [loading, setLoading] = useState(!!isSupabaseConfigured);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!isSupabaseConfigured) return;
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAgencies();
            setTenants(data);
        } catch (err) {
            setError('Erro ao carregar assinantes.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const addTenant = async (tenantData: Omit<Tenant, 'id'>) => {
        if (!isSupabaseConfigured) {
            const newTenant = { ...tenantData, id: `local-${Date.now()}` } as Tenant;
            setTenants(prev => [newTenant, ...prev]);
            return { tenant: newTenant };
        }
        
        // 1. Create the agency (tenant)
        const newTenant = await createAgency(tenantData);
        
        // 2. Create the initial admin user for this agency
        const tempPassword = await saveSystemUser({
            name: tenantData.adminName || tenantData.name,
            email: tenantData.email,
            role: 'CLIENT_ADMIN',
            tenantId: newTenant.id
        });
        
        setTenants(prev => [newTenant, ...prev]);
        return { tenant: newTenant, tempPassword };
    };

    const resetTenantAdminPassword = async (tenantId: string, email: string) => {
        if (!isSupabaseConfigured) return 'mock-password-123';
        
        // Find the user first to get their ID
        const users = await fetchUsersByAgency(tenantId);
        const admin = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!admin) {
            // If admin doesn't exist for some reason, create one
            const temp = await saveSystemUser({
                name: email.split('@')[0],
                email: email,
                role: 'CLIENT_ADMIN',
                tenantId: tenantId
            });
            return temp || 'error-generating-password';
        }
        
        return await resetUserPassword(admin.id);
    };

    const updateTenant = async (id: string, updates: Partial<Tenant>) => {
        if (!isSupabaseConfigured) {
            setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
            return;
        }
        await updateAgency(id, updates);
        setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTenant = async (id: string) => {
        if (!isSupabaseConfigured) {
            setTenants(prev => prev.filter(t => t.id !== id));
            return;
        }
        await deleteAgency(id);
        setTenants(prev => prev.filter(t => t.id !== id));
    };

    return (
        <TenantContext.Provider value={{
            tenants, loading, error,
            addTenant, updateTenant, deleteTenant, resetTenantAdminPassword, refetch: load
        }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenants() {
    return useContext(TenantContext);
}
