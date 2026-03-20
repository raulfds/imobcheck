import { getAdminClient } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { email } = await request.json();
    const supabase = getAdminClient();
    
    if (!supabase) {
        return NextResponse.json({ error: 'Configuração do servidor inválida' }, { status: 500 });
    }
    
    const { error } = await supabase
        .from('system_users')
        .update({
            temp_password: null,
            must_change_password: false
        })
        .eq('email', email);
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
}