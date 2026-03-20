'use server';

import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';
import { getAdminClient } from '@/lib/supabase-admin';
import { supabase as supabaseClient } from '@/lib/supabase';

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

        // 1. Check if user already exists
        const { data: dbUser } = await admin.from('system_users')
            .select('auth_id')
            .eq('email', email)
            .maybeSingle();

        authId = dbUser?.auth_id;

        if (authId) {
            await admin.auth.admin.updateUserById(authId, {
                email: email,
                user_metadata: { name: userData.name },
                ...(userData.temp_password && { password: userData.temp_password, email_confirm: true })
            });
        } else {
            const { data: newUser, error: createError } = await admin.auth.admin.createUser({
                email: email,
                password: userData.temp_password || Math.random().toString(36).slice(-12),
                email_confirm: true,
                user_metadata: { name: userData.name }
            });

            if (createError) {
                if (createError.message.toLowerCase().includes('already registered')) {
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

        // 2. Upsert into system_users
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
 */
export async function finalizeUserPassword(userData: {
    email: string;
    newPassword: string;
}) {
    const admin = getAdminClient();
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    const email = userData.email.toLowerCase();
    try {
        const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
        if (listError) throw listError;

        const existingAuthUser = users.find((u: any) => u.email?.toLowerCase() === email);

        if (!existingAuthUser) throw new Error('Usuário não encontrado no Supabase Auth.');

        const authId = existingAuthUser.id;
        const { error: updateError } = await admin.auth.admin.updateUserById(authId, {
            password: userData.newPassword,
            email_confirm: true
        });
        if (updateError) throw updateError;

        const { error: dbError } = await admin.from('system_users').update({
            temp_password: null,
            must_change_password: false,
            auth_id: authId
        }).eq('email', email);

        if (dbError) throw dbError;
        
        revalidatePath('/');
        return { success: true, authId };
    } catch (err: unknown) {
        console.error('[FINALIZE AUTH ERROR]:', err);
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
    try {
        const { data: dbUser } = await admin.from('system_users')
            .select('auth_id')
            .eq('id', userId)
            .single();
        
        let authId = dbUser?.auth_id;

        if (authId) {
            const { error: authError } = await admin.auth.admin.updateUserById(authId, {
                password: tempPassword,
                email_confirm: true
            });
            if (authError) throw authError;
        } else {
            const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
            const authUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
            
            if (authUser) {
                authId = authUser.id;
                await admin.auth.admin.updateUserById(authId, {
                    password: tempPassword,
                    email_confirm: true
                });
            } else {
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

        const { error: dbError } = await admin.from('system_users').update({
            temp_password: tempPassword,
            must_change_password: true,
            auth_id: authId
        }).eq('id', userId);

        if (dbError) throw dbError;

        return { success: true, tempPassword };
    } catch (err: unknown) {
        console.error('[ADMIN RESET ERROR]:', err);
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

/**
 * Public action to request a password reset.
 * Generates a temporary password and sends it via Resend.
 */
export async function requestPasswordResetAction(emailId: string) {
    const admin = getAdminClient();
    if (!admin) return { success: false, error: 'Admin credentials missing.' };

    const email = emailId.toLowerCase();
    
    try {
        // 1. Verificar se o usuário existe no system_users
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
            // Por segurança, não revelamos se o e-mail existe
            console.log(`[PASSWORD RESET] E-mail não encontrado: ${email}`);
            return { 
                success: true, 
                message: 'Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.' 
            };
        }

        console.log(`[PASSWORD RESET] Usuário encontrado: ${user.email} (${user.id})`);

        // 2. Gerar nova senha temporária segura
        const tempPassword = generateSecureTempPassword();
        
        // 3. Atualizar a senha no Supabase Auth
        let authId = user.auth_id;
        
        if (authId) {
            const { error: updateError } = await admin.auth.admin.updateUserById(authId, {
                password: tempPassword,
                email_confirm: true
            });
            
            if (updateError) {
                console.error('[PASSWORD RESET] Erro ao atualizar senha no Auth:', updateError);
                throw updateError;
            }
        } else {
            // Buscar usuário no Auth pelo email
            const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
            const authUser = users.find((u: any) => u.email?.toLowerCase() === email);
            
            if (authUser) {
                authId = authUser.id;
                const { error: updateError } = await admin.auth.admin.updateUserById(authId, {
                    password: tempPassword,
                    email_confirm: true
                });
                if (updateError) throw updateError;
            } else {
                // Criar novo usuário no Auth
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

        // 5. Enviar e-mail via Resend com a senha gerada
        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Recuperação de Senha - ImobCheck</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        margin: 0;
                        padding: 0;
                    }
                    .container {
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background: #ffffff;
                        border-radius: 16px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .header {
                        text-align: center;
                        padding: 20px 0;
                        border-bottom: 2px solid #10b981;
                    }
                    .logo {
                        font-size: 28px;
                        font-weight: bold;
                        color: #10b981;
                    }
                    .content {
                        padding: 30px 20px;
                    }
                    .password-box {
                        background: #f3f4f6;
                        padding: 20px;
                        text-align: center;
                        border-radius: 12px;
                        margin: 20px 0;
                        border: 2px dashed #10b981;
                    }
                    .password {
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 2px;
                        color: #111827;
                        font-family: 'Courier New', monospace;
                        word-break: break-all;
                    }
                    .warning {
                        background: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 8px;
                    }
                    .footer {
                        text-align: center;
                        padding: 20px;
                        font-size: 12px;
                        color: #6b7280;
                        border-top: 1px solid #e5e7eb;
                    }
                    .button {
                        display: inline-block;
                        background: #10b981;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 8px;
                        margin-top: 20px;
                        font-weight: bold;
                    }
                    .button:hover {
                        background: #059669;
                    }
                    @media only screen and (max-width: 600px) {
                        .container {
                            width: 100% !important;
                            border-radius: 0 !important;
                        }
                        .password {
                            font-size: 24px !important;
                        }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 20px; background: #f9fafb;">
                <div class="container">
                    <div class="header">
                        <div class="logo">🏠 ImobCheck</div>
                        <p style="margin: 5px 0 0; color: #6b7280;">Sistema de Vistorias Imobiliárias</p>
                    </div>
                    
                    <div class="content">
                        <h2 style="color: #10b981; margin-top: 0;">Olá ${user.name}! 👋</h2>
                        
                        <p>Recebemos uma solicitação de recuperação de senha para sua conta no <strong>ImobCheck</strong>.</p>
                        
                        <div class="password-box">
                            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">🔑 Sua nova senha temporária é:</p>
                            <div class="password">${tempPassword}</div>
                            <p style="margin: 10px 0 0; font-size: 12px; color: #6b7280;">(Copie esta senha para fazer login)</p>
                        </div>
                        
                        <div class="warning">
                            <strong>⚠️ Importante:</strong>
                            <ul style="margin: 10px 0 0 20px; padding: 0;">
                                <li>Esta senha é <strong>temporária</strong> e válida apenas para o próximo acesso</li>
                                <li>Ao fazer login, você será solicitado a criar uma <strong>nova senha definitiva</strong></li>
                                <li>Por segurança, não compartilhe esta senha com ninguém</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" class="button">
                                Acessar o Sistema →
                            </a>
                        </div>
                        
                        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                            Se você não solicitou esta alteração, por favor ignore este e-mail.<br>
                            Sua senha atual permanecerá válida.
                        </p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} ImobCheck - Todos os direitos reservados</p>
                        <p style="margin-top: 10px;">
                            Este é um e-mail automático, por favor não responda.<br>
                            Em caso de dúvidas, entre em contato com o suporte.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;

        try {
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: 'ImobCheck <onboarding@resend.dev>',
                to: [user.email],
                subject: '🔐 Sua Nova Senha Temporária - ImobCheck',
                html: emailHtml,
            });

            if (emailError) {
                console.error('[PASSWORD RESET] Erro ao enviar e-mail via Resend:', emailError);
                // Mesmo com erro no e-mail, a senha foi gerada
                return {
                    success: true,
                    message: 'Senha gerada com sucesso! Verifique seu e-mail (pode estar na pasta de spam).'
                };
            }

            console.log(`[PASSWORD RESET] E-mail enviado com sucesso para ${user.email}`, emailData?.id);
            
            return { 
                success: true, 
                message: 'E-mail enviado com sucesso! Verifique sua caixa de entrada e a pasta de spam.' 
            };
            
        } catch (emailError: any) {
            console.error('[PASSWORD RESET] Erro fatal no envio de e-mail:', emailError);
            // Mesmo com erro, a senha foi gerada
            return {
                success: true,
                message: 'Senha gerada com sucesso! Verifique seu e-mail (pode estar na pasta de spam).'
            };
        }
        
    } catch (err: unknown) {
        console.error('[PASSWORD RESET] Erro fatal:', err);
        return { 
            success: false, 
            error: 'Não foi possível processar sua solicitação. Tente novamente mais tarde.' 
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