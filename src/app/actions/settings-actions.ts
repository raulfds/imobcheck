'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { updateAgency } from '@/lib/database';
import { Tenant } from '@/types';

const getAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        return null;
    }

    return createClient(url, key);
};

export async function updateAgencySettings(agencyId: string, data: Partial<Tenant>) {
    try {
        await updateAgency(agencyId, data);
        revalidatePath('/dashboard/settings');
        return { success: true };
    } catch (error: any) {
        console.error('[Settings Action Error]:', error);
        return { success: false, error: error.message };
    }
}

export async function uploadAgencyLogo(agencyId: string, formData: FormData) {
    const admin = getAdminClient();
    
    if (!admin) {
        return { 
            success: false, 
            error: 'Credenciais de administrador (SUPABASE_SERVICE_ROLE_KEY) não configuradas no servidor. O upload de logo requer esta configuração.' 
        };
    }

    const file = formData.get('logo') as File;
    
    if (!file) {
        return { success: false, error: 'Nenhum arquivo enviado.' };
    }

    try {
        // 1. Ensure bucket exists (optional but good for first run)
        const { data: buckets } = await admin.storage.listBuckets();
        if (!buckets?.find(b => b.name === 'logos')) {
            await admin.storage.createBucket('logos', {
                public: true,
                allowedMimeTypes: ['image/png', 'image/jpeg'],
                fileSizeLimit: 2 * 1024 * 1024 // 2MB
            });
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${agencyId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        // 2. Upload to bucket
        const { data: uploadData, error: uploadError } = await admin.storage
            .from('logos')
            .upload(filePath, file, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) throw uploadError;

        // 3. Get Public URL
        const { data: { publicUrl } } = admin.storage
            .from('logos')
            .getPublicUrl(filePath);

        // 4. Update Agency Record
        await updateAgency(agencyId, { logo: publicUrl });

        revalidatePath('/dashboard/settings');
        return { success: true, url: publicUrl };
    } catch (error: any) {
        console.error('[Logo Upload Error]:', error);
        return { success: false, error: error.message };
    }
}
