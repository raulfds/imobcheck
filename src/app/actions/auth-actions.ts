'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

/**
 * Super-privileged Supabase client for administrative operations.
 * This client bypasses RLS and uses the service_role key.
 */
const getAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        throw new Error('Supabase admin credentials not found in environment.');
    }

    return createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};

/**
 * Creates or updates a user in Supabase Auth and Syncs with system_users.
 */
export async function adminSaveUser(userData: {
    id?: string;
    email: string;
    name: string;
    role: string;
    agency_id?: string | null;
    temp_password?: string;
}) {
    const admin = getAdminClient();
    const email = userData.email.toLowerCase();

    try {
        let authId = null;

        // 1. Check if user already exists in Auth
        const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
        if (listError) throw listError;

        const existingAuthUser = users.find(u => u.email?.toLowerCase() === email);

        if (existingAuthUser) {
            authId = existingAuthUser.id;
            // Update email if it changed (though uniquely indexed)
            await admin.auth.admin.updateUserById(authId, {
                email: email,
                user_metadata: { name: userData.name },
                ...(userData.temp_password && { password: userData.temp_password, email_confirm: true })
            });
        } else if (userData.temp_password) {
            // Create new user in Auth
            const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                email: email,
                password: userData.temp_password,
                email_confirm: true, // AUTO CONFIRM
                user_metadata: { name: userData.name }
            });

            if (createError) throw createError;
            authId = newUser.user.id;
        }

        // 2. Upsert into system_users (Public Schema)
        const { error: dbError } = await admin.from('system_users').upsert({
            ...(userData.id && { id: userData.id }),
            name: userData.name,
            email: email,
            role: userData.role,
            agency_id: userData.agency_id || null,
            auth_id: authId,
            ...(userData.temp_password && {
                temp_password: userData.temp_password,
                must_change_password: true
            })
        }, { onConflict: 'email' });

        if (dbError) throw dbError;

        revalidatePath('/super-admin/users');
        revalidatePath('/dashboard/team');
        
        return { success: true, authId };
    } catch (err: any) {
        console.error('[ADMIN AUTH ERROR]:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Finalizes the user's password during the first-access flow.
 * Uses service_role to avoid email rate limits and confirm the user automatically.
 */
export async function finalizeUserPassword(userData: {
    email: string;
    newPassword: string;
}) {
    const admin = getAdminClient();
    const email = userData.email.toLowerCase();

    try {
        // 1. Check if user already exists in Auth
        const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
        if (listError) throw listError;

        const existingAuthUser = users.find(u => u.email?.toLowerCase() === email);

        if (existingAuthUser) {
            // Update existing user: set password and confirm email silently
            const { error: updateError } = await admin.auth.admin.updateUserById(existingAuthUser.id, {
                password: userData.newPassword,
                email_confirm: true
            });
            if (updateError) throw updateError;
        } else {
            // Create brand new confirmed user
            const { error: createError } = await admin.auth.admin.createUser({
                email: email,
                password: userData.newPassword,
                email_confirm: true
            });
            if (createError) throw createError;
        }

        // 2. Clear temp flags in system_users
        const { error: dbError } = await admin.from('system_users').update({
            temp_password: null,
            must_change_password: false
        }).eq('email', email);

        if (dbError) throw dbError;

        return { success: true };
    } catch (err: any) {
        console.error('[FINALIZE AUTH ERROR]:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Resets a user's password administratively.
 */
export async function adminResetPassword(userId: string, email: string, name: string) {
    const admin = getAdminClient();
    const tempPassword = Math.random().toString(36).slice(-8);

    try {
        // 1. First, find the user in Auth to get their Auth ID
        const { data: { users }, error: listError } = await admin.auth.admin.listUsers();
        if (listError) throw listError;
        
        const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        if (authUser) {
            // Update password in Auth
            const { error: authError } = await admin.auth.admin.updateUserById(authUser.id, {
                password: tempPassword,
                email_confirm: true
            });
            if (authError) throw authError;
        }

        // 2. Update flags in system_users
        const { error: dbError } = await admin.from('system_users').update({
            temp_password: tempPassword,
            must_change_password: true,
            ...(authUser && { auth_id: authUser.id })
        }).eq('id', userId);

        if (dbError) throw dbError;

        return { success: true, tempPassword };
    } catch (err: any) {
        console.error('[ADMIN RESET ERROR]:', err);
        return { success: false, error: err.message };
    }
}
