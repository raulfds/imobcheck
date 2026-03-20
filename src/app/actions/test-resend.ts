'use server';

import { Resend } from 'resend';

export async function testResendIntegration() {
    const key = process.env.RESEND_API_KEY;
    console.log('[TEST-RESEND] Key length:', key?.length || 0);
    console.log('[TEST-RESEND] Key prefix:', key?.substring(0, 5));

    if (!key) {
        return { success: false, error: 'RESEND_API_KEY não encontrada no process.env' };
    }

    const resend = new Resend(key);
    try {
        const { data, error } = await resend.emails.send({
            from: 'ImobCheck <onboarding@resend.dev>',
            to: ['raul.fds.dev@gmail.com'], // TEST TO OWNER
            subject: 'Teste de Integração ImobCheck',
            html: '<p>Se você recebeu isso, a integração está funcionando!</p>'
        });

        if (error) {
            console.error('[TEST-RESEND] Erro API:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('[TEST-RESEND] Erro Fatal:', err);
        return { success: false, error: err.message };
    }
}
