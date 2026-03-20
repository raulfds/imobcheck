'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase-admin';
import { Tenant } from '@/types';

/**
 * Saves (creates or updates) an agency/tenant on the server side.
 * Uses service role to bypass RLS for administrative operations.
 */
export async function saveAgencyAction(tenant: Partial<Tenant>) {
    const admin = getAdminClient();
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    try {
        const payload = {
            name: tenant.name,
            email: tenant.email,
            admin_name: tenant.adminName ?? null,
            phone: tenant.phone ?? null,
            status: tenant.status || 'active',
            plan: tenant.plan,
            plan_id: tenant.planId ?? null,
            acquisition_date: tenant.acquisitionDate || new Date().toISOString(),
            cnpj: tenant.cnpj ?? null,
            address: tenant.address ?? null,
            logo_url: tenant.logo ?? null,
            billing_cycle: tenant.billingCycle ?? 'monthly',
            first_login_at: tenant.firstLoginAt ?? null,
            expires_at: tenant.expiresAt ?? null,
        };

        let result;
        if (tenant.id) {
            // Update
            result = await admin.from('agencies').update(payload).eq('id', tenant.id).select().single();
        } else {
            // Create
            result = await admin.from('agencies').insert(payload).select().single();
        }

        if (result.error) throw result.error;

        revalidatePath('/super-admin/tenants');
        return { success: true, data: result.data };
    } catch (err: any) {
        console.error('[TENANT ACTION ERROR]:', err);
        return { success: false, error: err.message || String(err) };
    }
}

/**
 * Deletes an agency/tenant on the server side.
 */
export async function deleteAgencyAction(id: string) {
    const admin = getAdminClient();
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    try {
        const { error } = await admin.from('agencies').delete().eq('id', id);
        if (error) throw error;
        revalidatePath('/super-admin/tenants');
        return { success: true };
    } catch (err: any) {
        console.error('[TENANT DELETE ERROR]:', err);
        return { success: false, error: err.message || String(err) };
    }
}
