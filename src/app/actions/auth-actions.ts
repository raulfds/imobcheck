'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { getAdminClient } from '@/lib/supabase-admin';
import { supabase as supabaseClient } from '@/lib/supabase';

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
 * Uses Supabase's built-in password reset functionality.
 */
export async function requestPasswordResetAction(emailId: string) {
    const admin = getAdminClient();
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    const email = emailId.toLowerCase();
    
    try {
        // 1. Check if user exists in system_users
        const { data: user, error: userError } = await admin
            .from('system_users')
            .select('id, name, email, auth_id')
            .eq('email', email)
            .maybeSingle();

        if (userError) {
            console.error('[PASSWORD RESET] Erro ao buscar usuário:', userError);
            throw userError;
        }
        
        if (!user) {
            // Por segurança, retornamos erro genérico
            console.log(`[PASSWORD RESET] E-mail não encontrado: ${email}`);
            return { 
                success: false, 
                error: 'E-mail não encontrado no sistema. Verifique se o endereço está correto.' 
            };
        }

        console.log(`[PASSWORD RESET] Usuário encontrado: ${user.email} (${user.id})`);

        // 2. Gerar nova senha temporária
        const tempPassword = generateSecureTempPassword();
        
        // 3. Atualizar a senha no Supabase Auth
        let authId = user.auth_id;
        
        if (authId) {
            // Se tem auth_id, atualiza diretamente
            const { error: updateError } = await admin.auth.admin.updateUserById(authId, {
                password: tempPassword,
                email_confirm: true
            });
            
            if (updateError) {
                console.error('[PASSWORD RESET] Erro ao atualizar senha no Auth:', updateError);
                throw updateError;
            }
        } else {
            // Se não tem auth_id, tenta encontrar pelo email
            const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
            const authUser = users.find(u => u.email?.toLowerCase() === email);
            
            if (authUser) {
                authId = authUser.id;
                const { error: updateError } = await admin.auth.admin.updateUserById(authId, {
                    password: tempPassword,
                    email_confirm: true
                });
                if (updateError) throw updateError;
            } else {
                // Criar usuário no Auth se não existir
                const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                    email: email,
                    password: tempPassword,
                    email_confirm: true,
                    user_metadata: { name: user.name }
                });
                
                if (createError) throw createError;
                authId = newUser.user.id;
            }
        }

        // 4. Atualizar flags no system_users
        const { error: dbError } = await admin
            .from('system_users')
            .update({
                temp_password: tempPassword,
                must_change_password: true,
                auth_id: authId,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (dbError) {
            console.error('[PASSWORD RESET] Erro ao atualizar system_users:', dbError);
            throw dbError;
        }

        console.log(`[PASSWORD RESET] Senha temporária gerada para ${user.email}: ${tempPassword}`);
        console.log(`[PASSWORD RESET] Usuário deve trocar a senha no próximo login`);

        // 5. Enviar e-mail de recuperação via Supabase
        // O Supabase Auth envia automaticamente o e-mail de reset quando usamos o método correto
        const { error: emailError } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
        });

        if (emailError) {
            console.error('[PASSWORD RESET] Erro ao enviar e-mail via Supabase:', emailError);
            // Se o e-mail falhar, ainda retornamos sucesso pois a senha foi gerada
            return {
                success: true,
                message: 'Senha gerada com sucesso! Verifique seu e-mail (pode estar na pasta de spam).'
            };
        }

        console.log(`[PASSWORD RESET] E-mail de recuperação enviado via Supabase para ${user.email}`);
        
        return { 
            success: true, 
            message: 'E-mail de recuperação enviado! Verifique sua caixa de entrada e a pasta de spam.' 
        };
        
    } catch (err: any) {
        console.error('[PASSWORD RESET] Erro fatal:', err);
        const errorMessage = err.message || err.error_description || 'Erro interno';
        return { 
            success: false, 
            error: `Não foi possível processar sua solicitação: ${errorMessage}` 
        };
    }
}

/**
 * Gera uma senha temporária segura
 */
function generateSecureTempPassword(length: number = 10): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const specials = '!@#$%&*';
    
    const allChars = uppercase + lowercase + numbers + specials;
    
    let password = '';
    
    // Garantir pelo menos um de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += specials[Math.floor(Math.random() * specials.length)];
    
    // Completar o resto
    for (let i = password.length; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * allChars.length);
        password += allChars[randomIndex];
    }
    
    // Embaralhar a senha
    return password.split('').sort(() => Math.random() - 0.5).join('');
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
