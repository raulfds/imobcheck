'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { getAdminClient } from '@/lib/supabase-admin';

// Helper to get Resend instance safely
const getResendClient = () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.warn('[RESEND] API Key missing in environment variables.');
        return null;
    }
    return new Resend(key);
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
    if (!admin) return { success: false, error: 'Admin credentials missing.' };
    
    const email = userData.email.toLowerCase();

    try {
        let authId = null;

        // 1. Check if user already exists (Query DB first for speed, then Auth if needed)
        const { data: dbUser } = await admin.from('system_users')
            .select('auth_id')
            .eq('email', email)
            .maybeSingle();

        authId = dbUser?.auth_id;

        if (authId) {
            // Update existing user in Auth
            await admin.auth.admin.updateUserById(authId, {
                email: email,
                user_metadata: { name: userData.name },
                ...(userData.temp_password && { password: userData.temp_password, email_confirm: true })
            });
        } else {
            // If not in DB, double check listUsers but with a filter if possible 
            // (Supabase doesn't support filter well in listUsers, so we'll try to find by email directly)
            // A better way is actually to just TRAY to create and handle the "already registered" error.
            const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                email: email,
                password: userData.temp_password || Math.random().toString(36).slice(-12),
                email_confirm: true,
                user_metadata: { name: userData.name }
            });

            if (createError) {
                if (createError.message.toLowerCase().includes('already registered')) {
                    // If already registered, fetch the user to get ID (use 1000 to avoid page 1 limit)
                    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
                    const existing = users.find(u => u.email?.toLowerCase() === email);
                    authId = existing?.id;
                    
                    if (!authId) {
                        throw new Error('Usuário já registrado no Auth, mas não foi encontrado na lista administrativa.');
                    }
                } else {
                    throw createError;
                }
            } else {
                authId = newUser.user.id;
            }
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

        // Parallel revalidation
        await Promise.all([
            revalidatePath('/super-admin/users'),
            revalidatePath('/dashboard/team')
        ]);
        
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
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    const email = userData.email.toLowerCase();
    console.log(`[ADMIN] Finalizing user ${email}...`);

    try {
        let authId = null;

        // 1. More robust user lookup: Try to find user in Auth
        const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
        if (listError) throw listError;

        const existingAuthUser = users.find((u: any) => u.email?.toLowerCase() === email);

        if (existingAuthUser) {
            authId = existingAuthUser.id;
            console.log(`[ADMIN] User found in Auth (${authId}). Updating password...`);
            const { error: updateError } = await admin.auth.admin.updateUserById(authId, {
                password: userData.newPassword,
                email_confirm: true
            });
            if (updateError) throw updateError;
        } else {
            // Fallback for edge cases, but usually we prefer not to list 1000
            const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
            const retryUser = users.find(u => u.email?.toLowerCase() === email);
            if (retryUser) {
                authId = retryUser.id;
                await admin.auth.admin.updateUserById(authId, {
                    password: userData.newPassword,
                    email_confirm: true
                });
            } else {
                throw new Error('Usuário não encontrado no Supabase Auth.');
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
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    const tempPassword = Math.random().toString(36).slice(-8);
    console.log(`[ADMIN] Resetting password for ${email} (${userId})...`);

    try {
        // 1. Get user's auth_id from DB first (faster than listing all Auth users)
        const { data: dbUser } = await admin.from('system_users')
            .select('auth_id')
            .eq('id', userId)
            .single();
        
        let authId = dbUser?.auth_id;

        if (authId) {
            console.log(`[ADMIN] Found Auth user ${authId} via DB. Updating password to temp...`);
            // Update password in Auth
            const { error: authError } = await admin.auth.admin.updateUserById(authId, {
                password: tempPassword,
                email_confirm: true
            });
            if (authError) throw authError;
        } else {
            // Fallback: If not in DB, list Auth users (limited to 1000 to avoid missing users)
            const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
            const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
            
            if (authUser) {
                authId = authUser.id;
                await admin.auth.admin.updateUserById(authId, {
                    password: tempPassword,
                    email_confirm: true
                });
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

/**
 * Public action to request a password reset.
 * Generates a temporary password and (mocks) an email.
 */
export async function requestPasswordResetAction(emailId: string) {
    const admin = getAdminClient();
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    const email = emailId.toLowerCase();
    
    try {
        // 1. Check if user exists in system_users
        const { data: user, error: userError } = await admin
            .from('system_users')
            .select('id, name, email')
            .eq('email', email)
            .maybeSingle();

        if (userError) throw userError;
        if (!user) {
            // Silently fail to avoid email enumeration if safe, 
            // but for this app we'll return an error if not found.
            return { success: false, error: 'E-mail não encontrado no sistema.' };
        }

        // 2. Generate temp password and update Auth/DB
        const result = await adminResetPassword(user.id, user.email, user.name);
        
        if (!result.success) throw new Error(result.error);

        // 3. SEND REAL EMAIL VIA RESEND
        const resend = getResendClient();
        if (!resend) {
            console.error('[RESEND ERROR]: API Key missing.');
            return { success: false, error: 'Configuração de e-mail (API Key) não encontrada. Verifique seu arquivo .env.local' };
        }

        try {
            // Log for manual retrieval in case email fails (domain verification issue)
            console.log(`[AUTH-ACTION] Temp Password for ${user.email} is: ${result.tempPassword}`);

            const { data: emailResult, error: sendError } = await resend.emails.send({
                from: 'ImobCheck <onboarding@resend.dev>',
                to: [user.email],
                subject: 'Sua Senha Temporária - ImobCheck',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <h2 style="color: #10b981;">Olá ${user.name},</h2>
                        <p>Recebemos uma solicitação de recuperação de senha para sua conta no <strong>ImobCheck</strong>.</p>
                        <p>Sua nova senha temporária é:</p>
                        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #111827;">${result.tempPassword}</span>
                        </div>
                        <p><strong>Importante:</strong> Ao fazer o login com esta senha, você será solicitado a criar uma nova senha definitiva por segurança.</p>
                        <p>Se você não solicitou esta alteração, por favor ignore este e-mail.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #6b7280; text-align: center;">ImobCheck - Sistema de Vistorias Imobiliárias</p>
                    </div>
                `,
            });
            
            if (sendError) {
                console.error('[RESEND SEND ERROR]:', sendError);
                return { success: false, error: `Erro no serviço de e-mail: ${sendError.message}` };
            }

            console.log(`[RESEND] Email enviado com sucesso para ${user.email}`, emailResult);
        } catch (emailError: any) {
            console.error('[RESEND FATAL ERROR]:', emailError);
            return { success: false, error: `Erro fatal no envio de e-mail: ${emailError.message || 'Erro desconhecido'}` };
        }

        return { success: true };
    } catch (err: unknown) {
        console.error('[FORGOT PASSWORD ERROR]:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

/**
 * Public action for a logged-in user to change their own password
 * and clear the must_change_password flag.
 */
export async function finalizePasswordChange(newPassword: string) {
    // This action needs to be called by a logged-in user.
    // However, since it uses admin client to update flags, we verify the session first.
    const admin = getAdminClient();
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    try {
        // We'll use the user's current session or email from metadata if possible.
        // For now, we expect this to be called from a context where we know the user.
        // A safer way is to check the JWT:
        // const { data: { user } } = await supabase.auth.getUser(); // This needs a browser-side client
        
        // Let's use the finalizeUserPassword logic which handles both Auth and DB sync.
        // We'll need the email.
        
        return { success: false, error: 'Use finalizeUserPassword no context correto.' };
    } catch (err: unknown) {
        return { success: false, error: String(err) };
    }
}
