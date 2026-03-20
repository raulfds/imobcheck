// app/actions/settings-actions.ts
'use server';

import { getAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function updateAgencySettings(agencyId: string, data: any) {
    try {
        const supabaseAdmin = getAdminClient();
        if (!supabaseAdmin) throw new Error('Falha ao obter cliente admin');

        const { error } = await supabaseAdmin
            .from('agencies')
            .update({
                name: data.name,
                email: data.email,
                phone: data.phone,
                cnpj: data.cnpj,
                address: data.address,
                logo_url: data.logo,
                updated_at: new Date().toISOString()
            })
            .eq('id', agencyId);

        if (error) throw error;

        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function uploadAgencyLogo(agencyId: string, formData: FormData) {
    try {
        const file = formData.get('logo') as File;
        
        if (!file) {
            throw new Error('Nenhum arquivo enviado');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${agencyId}/${Date.now()}.${fileExt}`;

        const supabaseAdmin = getAdminClient();
        if (!supabaseAdmin) throw new Error('Falha ao obter cliente admin');
        
        // Garantir que o bucket existe
        const { data: buckets } = await supabaseAdmin.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === 'agency-logos');
        
        if (!bucketExists) {
            console.log('Criando bucket agency-logos...');
            const { error: createBucketsError } = await supabaseAdmin.storage.createBucket('agency-logos', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
            });
            if (createBucketsError) {
                console.error('Erro ao criar bucket:', createBucketsError);
                throw new Error('O bucket "agency-logos" não existe e não pôde ser criado automaticamente.');
            }
        }

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('agency-logos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            console.error('Erro no upload storage:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('agency-logos')
            .getPublicUrl(fileName);

        const { error: updateError } = await supabaseAdmin
            .from('agencies')
            .update({ logo_url: publicUrl })
            .eq('id', agencyId);

        if (updateError) throw updateError;

        revalidatePath('/dashboard/settings');
        return { success: true, url: publicUrl };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}