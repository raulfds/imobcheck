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
    } catch (err: unknown) {
        console.error('[ADMIN AUTH ERROR]:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
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
    console.log(`[ADMIN] Finalizing user ${email}...`);

    try {
        let authId = null;

        // 1. More robust user lookup: Try to find user in Auth
        // We fetch a larger batch to avoid page 1 limitations
        const { data: { users }, error: listError } = await admin.auth.admin.listUsers({
            perPage: 1000
        });
        if (listError) throw listError;

        const existingAuthUser = users.find(u => u.email?.toLowerCase() === email);

        if (existingAuthUser) {
            authId = existingAuthUser.id;
            console.log(`[ADMIN] User found in Auth (${authId}). Updating password...`);
            const { error: updateError } = await admin.auth.admin.updateUserById(authId, {
                password: userData.newPassword,
                email_confirm: true
            });
            if (updateError) throw updateError;
        } else {
            console.log(`[ADMIN] User not found in Auth. Creating new confirmed user...`);
            const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                email: email,
                password: userData.newPassword,
                email_confirm: true,
                user_metadata: { name: 'Migrated User' }
            });

            if (createError) {
                // Handle late-arrival race condition: if they were created between list and create
                if (createError.message.toLowerCase().includes('already registered')) {
                     const { data: { users: retryUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 });
                     const retryUser = retryUsers.find(u => u.email?.toLowerCase() === email);
                     if (retryUser) {
                        authId = retryUser.id;
                        await admin.auth.admin.updateUserById(authId, {
                            password: userData.newPassword,
                            email_confirm: true
                        });
                     } else {
                         throw createError;
                     }
                } else {
                    throw createError;
                }
            } else {
                authId = newUser.user.id;
            }
        }

        // 2. Clear temp flags AND SYNC auth_id in system_users
        console.log(`[ADMIN] Syncing flags and auth_id (${authId}) to system_users...`);
        const { error: dbError } = await admin.from('system_users').update({
            temp_password: null,
            must_change_password: false,
            auth_id: authId
        }).eq('email', email);

        if (dbError) throw dbError;

        console.log(`[ADMIN] User ${email} finalized successfully with authId: ${authId}`);
        
        revalidatePath('/');
        
        return { success: true, authId: authId };
    } catch (err: unknown) {
        console.error('[FINALIZE AUTH ERROR FATAL]:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

/**
 * Resets a user's password administratively.
 */
export async function adminResetPassword(userId: string, email: string, name: string) {
    const admin = getAdminClient();
    const tempPassword = Math.random().toString(36).slice(-8);
    console.log(`[ADMIN] Resetting password for ${email} (${userId})...`);

    try {
        // 1. First, find the user in Auth to get their Auth ID
        const { data: { users }, error: listError } = await admin.auth.admin.listUsers({
            perPage: 1000
        });
        if (listError) throw listError;
        
        const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        let authId = authUser?.id || null;

        if (authUser) {
            console.log(`[ADMIN] Found Auth user ${authId}. Updating password to temp...`);
            // Update password in Auth
            const { error: authError } = await admin.auth.admin.updateUserById(authUser.id, {
                password: tempPassword,
                email_confirm: true
            });
            if (authError) throw authError;
        } else {
            console.log(`[ADMIN] User not in Auth. Creating temp account...`);
            const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { name }
            });
            if (createError) throw createError;
            authId = newUser.user.id;
        }

        // 2. Update flags in system_users
        console.log(`[ADMIN] Saving temp_password to DB and syncing auth_id (${authId})...`);
        const { error: dbError } = await admin.from('system_users').update({
            temp_password: tempPassword,
            must_change_password: true,
            auth_id: authId
        }).eq('id', userId);

        if (dbError) throw dbError;

        console.log(`[ADMIN] Password reset for ${email} successful.`);
        return { success: true, tempPassword };
    } catch (err: unknown) {
        console.error('[ADMIN RESET ERROR FATAL]:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}
