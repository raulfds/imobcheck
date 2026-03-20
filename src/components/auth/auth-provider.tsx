'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  name: string;
  agency_id: string | null;
  tenantId?: string | null;
  agency_name?: string;
  role: string;
  must_change_password?: boolean;
};

type FirstAccessData = {
  email: string;
  agency_id: string;
  cnpj: string;
  client_id: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  needsPasswordReset: boolean;
  firstAccessData: FirstAccessData | null;
  login: (email: string, password: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  verifyFirstAccess: (email: string) => Promise<FirstAccessData | null>;
  verifyCnpj: (cnpj: string) => Promise<boolean>;
  createPassword: (password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [firstAccessData, setFirstAccessData] = useState<FirstAccessData | null>(null);
  const router = useRouter();

  // Verificar sessão ao carregar
  useEffect(() => {
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserData(session.user.email ?? null, session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserData(session.user.email ?? null, session.user.id);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      setIsLoading(false);
    }
  }

  async function loadUserData(userEmail: string | null, authUserId?: string): Promise<User | null> {
    if (!userEmail) return null;
    
    try {
      console.log('🔍 Buscando usuário no sistema com email:', userEmail);
      
      // Primeiro, buscar na tabela system_users por email
      let { data: systemUser, error: systemError } = await supabase
        .from('system_users')
        .select(`
          id,
          email,
          name,
          agency_id,
          role,
          auth_id,
          must_change_password
        `)
        .eq('email', userEmail)
        .maybeSingle();

      if (systemError) {
        console.error('Erro ao buscar system_user por email:', systemError);
      }

      // Se não encontrou por email mas temos o authUserId, tentar por auth_id
      if (!systemUser && authUserId) {
        console.log('🔍 Tentando buscar system_user por auth_id:', authUserId);
        const { data: byAuthId } = await supabase
          .from('system_users')
          .select('id, email, name, agency_id, role, auth_id, must_change_password')
          .eq('auth_id', authUserId)
          .maybeSingle();
          
        if (byAuthId) {
          systemUser = byAuthId;
          console.log('✅ Usuário encontrado por auth_id:', byAuthId);
        }
      }

      if (systemUser) {
        console.log('✅ Usuário encontrado no system_users:', systemUser);
        
        const userData: User = {
          id: systemUser.id,
          email: systemUser.email,
          name: systemUser.name,
          agency_id: systemUser.agency_id,
          tenantId: systemUser.agency_id,
          role: systemUser.role,
          must_change_password: systemUser.must_change_password,
        };

        // Se precisa trocar senha, setar o estado
        if (systemUser.must_change_password) {
          setNeedsPasswordReset(true);
        }

        // Buscar nome da agência se houver agency_id
        if (systemUser.agency_id) {
          const { data: agencyData } = await supabase
            .from('agencies')
            .select('name')
            .eq('id', systemUser.agency_id)
            .maybeSingle();
          
          if (agencyData) {
            userData.agency_name = agencyData.name;
          }
        }

        setUser(userData);
        setIsLoading(false);

        // Se o auth_id não estiver preenchido, atualizar com o ID do auth
        if (!systemUser.auth_id && authUserId) {
          const { error: updateError } = await supabase
            .from('system_users')
            .update({ auth_id: authUserId })
            .eq('id', systemUser.id);

          if (updateError) {
            console.error('Erro ao atualizar auth_id:', updateError);
          }
        }

        return userData;
      }

      // Se não encontrar no system_users, buscar na tabela inquilinos
      console.log('🔍 Buscando inquilino com email:', userEmail);
      
      const { data: clientData, error: clientError } = await supabase
        .from('inquilinos')
        .select(`
          id,
          name,
          email,
          agency_id,
          primeiro_acesso
        `)
        .eq('email', userEmail)
        .maybeSingle();

      if (clientError) {
        console.error('Erro ao buscar inquilino:', clientError);
        setIsLoading(false);
        return null;
      }

      if (clientData) {
        console.log('✅ Inquilino encontrado:', clientData);
        
        const userData: User = {
          id: clientData.id,
          email: clientData.email,
          name: clientData.name,
          agency_id: clientData.agency_id,
          tenantId: clientData.agency_id,
          role: 'CLIENT_ADMIN',
        };

        // Buscar nome da agência se houver agency_id
        if (clientData.agency_id) {
          const { data: agencyData } = await supabase
            .from('agencies')
            .select('name')
            .eq('id', clientData.agency_id)
            .maybeSingle();
          
          if (agencyData) {
            userData.agency_name = agencyData.name;
          }
        }

        setUser(userData);
        setIsLoading(false);

        // Se for primeiro acesso, marcar como FALSE após login bem sucedido
        if (clientData.primeiro_acesso) {
          console.log('📝 Marcando primeiro acesso como false para inquilino:', clientData.id);
          
          const { error: updateError } = await supabase
            .from('inquilinos')
            .update({ primeiro_acesso: false })
            .eq('id', clientData.id);

          if (updateError) {
            console.error('Erro ao atualizar primeiro_acesso:', updateError);
          }
        }
        return userData;
      }

      // Fallback: usuário existe no Auth mas não nas tabelas do sistema
      console.log('⚠️ Nenhum usuário encontrado nas tabelas, verificando metadados...');
      
      if (authUserId) {
        const { data: authUserData } = await supabase.auth.getUser();
        const meta = authUserData?.user?.user_metadata;
        
        if (meta?.agency_id) {
          console.log('📝 Metadados encontrados, criando registro em system_users...');
          
          const fallbackUser = {
            auth_id: authUserId,
            email: userEmail,
            name: meta.name || userEmail.split('@')[0],
            agency_id: meta.agency_id,
            role: 'CLIENT_ADMIN' as const,
            must_change_password: false,
          };

          const { data: inserted, error: insertError } = await supabase
            .from('system_users')
            .insert(fallbackUser)
            .select()
            .single();

          if (insertError) {
            console.error('Erro ao criar registro fallback:', insertError);
          } else if (inserted) {
            console.log('✅ Registro criado com sucesso:', inserted);
            const userData: User = {
              id: inserted.id,
              email: inserted.email,
              name: inserted.name,
              agency_id: inserted.agency_id,
              tenantId: inserted.agency_id,
              role: inserted.role,
            };
            setUser(userData);
            setIsLoading(false);
            return userData;
          }
        }
      }
      
      console.log('❌ Nenhum usuário encontrado com o email:', userEmail);
      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setIsLoading(false);
      return null;
    }
  }

  async function verifyFirstAccess(email: string): Promise<FirstAccessData | null> {
    try {
      setIsLoading(true);
      
      console.log('🔍 Verificando primeiro acesso para email:', email);
      
      // Primeiro verificar se já é um system_user
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id, email, role')
        .eq('email', email)
        .maybeSingle();

      if (systemUser) {
        console.log('ℹ️ Usuário já é system_user:', systemUser);
        setIsLoading(false);
        return null;
      }
      
      // Buscar inquilino pelo email
      const { data: client, error: clientError } = await supabase
        .from('inquilinos')
        .select(`
          id,
          email,
          name,
          agency_id,
          primeiro_acesso
        `)
        .eq('email', email)
        .maybeSingle();

      if (clientError) {
        console.error('Erro na consulta:', clientError);
        throw new Error('Erro ao verificar email');
      }

      if (!client) {
        console.log('❌ Email não encontrado:', email);
        throw new Error('Email não encontrado');
      }

      console.log('✅ Inquilino encontrado:', client);
      console.log('Primeiro acesso:', client.primeiro_acesso);

      // Verificar se é primeiro acesso
      if (client.primeiro_acesso) {
        // Buscar CNPJ da agência separadamente
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('cnpj')
          .eq('id', client.agency_id)
          .maybeSingle();
        
        const data: FirstAccessData = {
          email: client.email,
          agency_id: client.agency_id,
          cnpj: agencyData?.cnpj || '',
          client_id: client.id,
          name: client.name,
        };
        
        setFirstAccessData(data);
        setNeedsPasswordReset(true);
        setIsLoading(false);
        return data;
      }

      setIsLoading(false);
      return null;
    } catch (error) {
      console.error('Erro ao verificar primeiro acesso:', error);
      setIsLoading(false);
      throw error;
    }
  }

  async function verifyCnpj(cnpj: string): Promise<boolean> {
    try {
      if (!firstAccessData) {
        console.log('❌ Sem dados de primeiro acesso');
        return false;
      }
      
      console.log('🔍 Verificando CNPJ:', cnpj);
      console.log('CNPJ armazenado:', firstAccessData.cnpj);
      
      // Remover caracteres não numéricos para comparação
      const cleanCnpjInput = cnpj.replace(/\D/g, '');
      const cleanCnpjStored = firstAccessData.cnpj ? firstAccessData.cnpj.replace(/\D/g, '') : '';
      
      const isValid = cleanCnpjInput === cleanCnpjStored;
      console.log('CNPJ válido?', isValid);
      
      return isValid;
    } catch (error) {
      console.error('Erro ao verificar CNPJ:', error);
      return false;
    }
  }

  async function createPassword(password: string): Promise<void> {
    try {
      setIsLoading(true);
      
      if (!firstAccessData) {
        throw new Error('Dados de primeiro acesso não encontrados');
      }

      console.log('🔐 Criando senha para:', firstAccessData.email);

      // Criar novo usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: firstAccessData.email,
        password: password,
        options: {
          data: {
            client_id: firstAccessData.client_id,
            agency_id: firstAccessData.agency_id,
            name: firstAccessData.name,
          }
        }
      });

      if (authError) {
        console.error('Erro no signUp:', authError);
        throw authError;
      }
      
      if (!authData.user) throw new Error('Erro ao criar usuário');
      
      const authUserId = authData.user.id;
      console.log('✅ Usuário criado no Auth:', authUserId);

      // Inserir na tabela system_users
      const { error: insertError } = await supabase
        .from('system_users')
        .insert({
          auth_id: authUserId,
          agency_id: firstAccessData.agency_id,
          email: firstAccessData.email,
          name: firstAccessData.name,
          role: 'CLIENT_ADMIN',
          must_change_password: false,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Erro ao inserir em system_users:', insertError);
        throw new Error('Erro ao registrar usuário no sistema');
      }

      console.log('✅ Usuário inserido em system_users');

      // Atualizar o inquilino para marcar que não é mais primeiro acesso
      const { error: updateError } = await supabase
        .from('inquilinos')
        .update({ 
          primeiro_acesso: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', firstAccessData.client_id);

      if (updateError) {
        console.error('Erro ao atualizar inquilino:', updateError);
      } else {
        console.log('✅ Primeiro acesso marcado como false');
      }

      console.log('🎉 Senha criada com sucesso para:', firstAccessData.email);

      // Limpar dados de primeiro acesso
      setFirstAccessData(null);
      setNeedsPasswordReset(false);
      setIsLoading(false);
      
      // Redirecionar para login
      router.push('/login?senha_criada=true');
      
    } catch (error) {
      console.error('❌ Erro ao criar senha:', error);
      setIsLoading(false);
      throw error;
    }
  }

  async function login(email: string, password: string) {
    try {
      setIsLoading(true);
      
      console.log('🔐 Tentando login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        
        // Se for erro de credenciais inválidas, verificar se o email existe
        if (error.message === 'Invalid login credentials') {
          // Verificar se o email existe em system_users
          const { data: systemUser } = await supabase
            .from('system_users')
            .select('email')
            .eq('email', email)
            .maybeSingle();

          if (systemUser) {
            throw new Error('Usuário encontrado mas senha incorreta. Tente novamente ou use "Esqueceu a senha?".');
          }

          // Verificar se o email existe em inquilinos
          const { data: client } = await supabase
            .from('inquilinos')
            .select('email, primeiro_acesso')
            .eq('email', email)
            .maybeSingle();

          if (client) {
            if (client.primeiro_acesso) {
              throw new Error('Este é seu primeiro acesso. Por favor, use a opção "Primeiro Acesso" acima.');
            } else {
              throw new Error('Usuário encontrado mas senha incorreta. Tente novamente ou use "Esqueceu a senha?".');
            }
          }
        }
        
        throw new Error('Email ou senha inválidos');
      }

      if (data.user) {
        console.log('✅ Login bem sucedido para:', data.user.email);
        const userData = await loadUserData(data.user.email ?? null, data.user.id);
        
        if (userData) {
          console.log('🎯 Role do usuário:', userData.role);
          
          // Verificar se precisa trocar a senha antes de redirecionar para o dashboard
          if (userData.must_change_password) {
            console.log('🔐 Usuário com senha temporária, redirecionando para /redefinir-senha');
            router.push('/redefinir-senha');
            return;
          }

          // Redirecionar baseado no role
          if (userData.role === 'SUPER_ADMIN') {
            console.log('👉 Redirecionando para /super-admin');
            router.push('/super-admin');
          } else {
            console.log('👉 Redirecionando para /dashboard');
            router.push('/dashboard');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function resetPassword(newPassword: string) {
    throw new Error('Método não utilizado. Use createPassword para primeiro acesso.');
  }

  async function logout() {
    try {
      console.log('🔓 Fazendo logout...');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      setUser(null);
      setFirstAccessData(null);
      setNeedsPasswordReset(false);
      
      // Limpar dados em cache
      localStorage.removeItem('sb-wvdtaccrextjkinecngz-auth-token');
      
      // Hard reload para limpar tudo
      window.location.href = '/login';
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      needsPasswordReset,
      firstAccessData,
      login,
      resetPassword,
      verifyFirstAccess,
      verifyCnpj,
      createPassword,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}