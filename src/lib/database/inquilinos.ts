import { supabase } from '@/lib/supabase';
import { Client } from '@/types';

// Função para validar CPF
export function validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    // Verificar se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
}

// Função para validar email
export function validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Função para validar telefone
export function validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    // Aceita 10 ou 11 dígitos (com ou sem 9)
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

export async function fetchClients(agencyId: string): Promise<Client[]> {
    try {
        console.log('Buscando inquilinos para agency_id:', agencyId);
        
        const { data, error } = await supabase
            .from('inquilinos')
            .select(`
                id,
                name,
                cpf,
                email,
                phone,
                primeiro_acesso,
                created_at,
                updated_at,
                agency_id
            `)
            .eq('agency_id', agencyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar inquilinos:', error);
            throw error;
        }

        console.log('Inquilinos encontrados:', data);

        return (data || []).map(item => ({
            id: item.id,
            tenantId: item.agency_id,
            name: item.name,
            cpf: item.cpf,
            email: item.email || '',
            phone: item.phone || '',
            primeiro_acesso: item.primeiro_acesso,
            created_at: item.created_at
        }));
    } catch (error) {
        console.error('Erro em fetchClients:', error);
        return [];
    }
}

export async function createClient(clientData: {
    tenantId: string;
    name: string;
    cpf: string;
    email?: string;
    phone?: string;
}): Promise<Client> {
    try {
        console.log('createClient - Dados recebidos:', clientData);

        // Validações
        if (!clientData.name || clientData.name.trim().length < 3) {
            throw new Error('Nome deve ter pelo menos 3 caracteres');
        }

        const cleanCPF = clientData.cpf.replace(/\D/g, '');
        if (!validateCPF(cleanCPF)) {
            throw new Error('CPF inválido');
        }

        if (clientData.email && !validateEmail(clientData.email)) {
            throw new Error('E-mail inválido');
        }

        if (clientData.phone && !validatePhone(clientData.phone)) {
            throw new Error('Telefone inválido');
        }

        // Verificar se CPF já existe na agência
        const { data: existingCPF, error: checkError } = await supabase
            .from('inquilinos')
            .select('id')
            .eq('agency_id', clientData.tenantId)
            .eq('cpf', cleanCPF)
            .maybeSingle();

        if (checkError) {
            console.error('Erro ao verificar CPF existente:', checkError);
        }

        if (existingCPF) {
            throw new Error('CPF já cadastrado nesta agência');
        }

        const supabaseData = {
            agency_id: clientData.tenantId,
            name: clientData.name.trim(),
            cpf: cleanCPF,
            email: clientData.email?.trim() || null,
            phone: clientData.phone?.replace(/\D/g, '') || null,
            primeiro_acesso: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('createClient - Dados para inserção:', supabaseData);

        const { data, error } = await supabase
            .from('inquilinos')
            .insert([supabaseData])
            .select()
            .single();

        if (error) {
            console.error('createClient - Erro do Supabase:', error);
            
            // Tratar erro de unicidade
            if (error.code === '23505') {
                if (error.message.includes('cpf')) {
                    throw new Error('CPF já cadastrado');
                } else if (error.message.includes('email')) {
                    throw new Error('E-mail já cadastrado');
                }
            }
            throw error;
        }

        console.log('createClient - Resposta do Supabase:', data);

        return {
            id: data.id,
            tenantId: data.agency_id,
            name: data.name,
            cpf: data.cpf,
            email: data.email || '',
            phone: data.phone || '',
            primeiro_acesso: data.primeiro_acesso,
            created_at: data.created_at
        };
    } catch (error) {
        console.error('createClient - Erro geral:', error);
        throw error;
    }
}

export async function updateClient(id: string, clientData: Partial<{
    name: string;
    cpf: string;
    email: string;
    phone: string;
}>): Promise<Client> {
    try {
        console.log('updateClient - ID:', id, 'Dados:', clientData);

        const updateData: any = {};
        
        if (clientData.name) {
            if (clientData.name.trim().length < 3) {
                throw new Error('Nome deve ter pelo menos 3 caracteres');
            }
            updateData.name = clientData.name.trim();
        }
        
        if (clientData.cpf) {
            const cleanCPF = clientData.cpf.replace(/\D/g, '');
            if (!validateCPF(cleanCPF)) {
                throw new Error('CPF inválido');
            }
            updateData.cpf = cleanCPF;
        }
        
        if (clientData.email !== undefined) {
            if (clientData.email && !validateEmail(clientData.email)) {
                throw new Error('E-mail inválido');
            }
            updateData.email = clientData.email?.trim() || null;
        }
        
        if (clientData.phone !== undefined) {
            if (clientData.phone && !validatePhone(clientData.phone)) {
                throw new Error('Telefone inválido');
            }
            updateData.phone = clientData.phone?.replace(/\D/g, '') || null;
        }

        updateData.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('inquilinos')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('updateClient - Erro do Supabase:', error);
            
            if (error.code === '23505') {
                if (error.message.includes('cpf')) {
                    throw new Error('CPF já cadastrado');
                } else if (error.message.includes('email')) {
                    throw new Error('E-mail já cadastrado');
                }
            }
            throw error;
        }

        return {
            id: data.id,
            tenantId: data.agency_id,
            name: data.name,
            cpf: data.cpf,
            email: data.email || '',
            phone: data.phone || '',
            primeiro_acesso: data.primeiro_acesso,
            created_at: data.created_at
        };
    } catch (error) {
        console.error('updateClient - Erro geral:', error);
        throw error;
    }
}

export async function deleteClient(id: string): Promise<void> {
    try {
        console.log('deleteClient - ID:', id);
        
        const { error } = await supabase
            .from('inquilinos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('deleteClient - Erro do Supabase:', error);
            throw error;
        }

        console.log('deleteClient - Inquilino excluído com sucesso');
    } catch (error) {
        console.error('deleteClient - Erro geral:', error);
        throw error;
    }
}

export async function getClientById(id: string): Promise<Client | null> {
    try {
        console.log('getClientById - ID:', id);
        
        const { data, error } = await supabase
            .from('inquilinos')
            .select(`
                id,
                name,
                cpf,
                email,
                phone,
                primeiro_acesso,
                created_at,
                updated_at,
                agency_id
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('getClientById - Erro do Supabase:', error);
            return null;
        }

        return {
            id: data.id,
            tenantId: data.agency_id,
            name: data.name,
            cpf: data.cpf,
            email: data.email || '',
            phone: data.phone || '',
            primeiro_acesso: data.primeiro_acesso,
            created_at: data.created_at
        };
    } catch (error) {
        console.error('getClientById - Erro geral:', error);
        return null;
    }
}

export async function checkExistingCPF(agencyId: string, cpf: string): Promise<boolean> {
    try {
        const cleanCPF = cpf.replace(/\D/g, '');
        
        const { data, error } = await supabase
            .from('inquilinos')
            .select('id')
            .eq('agency_id', agencyId)
            .eq('cpf', cleanCPF)
            .maybeSingle();

        if (error) {
            console.error('checkExistingCPF - Erro:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('checkExistingCPF - Erro geral:', error);
        return false;
    }
}

export async function checkExistingEmail(agencyId: string, email: string): Promise<boolean> {
    try {
        if (!email) return false;
        
        const { data, error } = await supabase
            .from('inquilinos')
            .select('id')
            .eq('agency_id', agencyId)
            .eq('email', email.trim())
            .maybeSingle();

        if (error) {
            console.error('checkExistingEmail - Erro:', error);
            return false;
        }

        return !!data;
    } catch (error) {
        console.error('checkExistingEmail - Erro geral:', error);
        return false;
    }
}