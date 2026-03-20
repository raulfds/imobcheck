// app/actions/settings-actions.ts
'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function updateAgencySettings(agencyId: string, data: any) {
    try {
        const { error } = await supabase
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
        
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('agency-logos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('agency-logos')
            .getPublicUrl(fileName);

        const { error: updateError } = await supabase
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