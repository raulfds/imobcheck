'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  name: string;
  agency_id: string | null;
  role: string;
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
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUserData(userEmail: string | null, authUserId?: string): Promise<User | null> {
    if (!userEmail) return null;
    
    try {
      console.log('Buscando usuário no sistema com email:', userEmail);
      
      // Primeiro, buscar na tabela system_users
      const { data: systemUser, error: systemError } = await supabase
        .from('system_users')
        .select(`
          id,
          email,
          name,
          agency_id,
          role,
          auth_id
        `)
        .eq('email', userEmail)
        .maybeSingle();

      if (systemError) {
        console.error('Erro ao buscar system_user:', systemError);
      }

      if (systemUser) {
        console.log('Usuário encontrado no system_users:', systemUser);
        
        const userData: User = {
          id: systemUser.id,
          email: systemUser.email,
          name: systemUser.name,
          agency_id: systemUser.agency_id,
          role: systemUser.role,
        };
        setUser(userData);

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

      // Se não encontrar no system_users, buscar na tabela clients
      console.log('Buscando cliente com email:', userEmail);
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          agency_id,
          primeiro_acesso,
          agencies (
            cnpj,
            name
          )
        `)
        .eq('email', userEmail)
        .maybeSingle();

      if (clientError) {
        console.error('Erro ao buscar cliente:', clientError);
        return null;
      }

      if (clientData) {
        console.log('Cliente encontrado:', clientData);
        
        const userData: User = {
          id: clientData.id,
          email: clientData.email,
          name: clientData.name,
          agency_id: clientData.agency_id,
          role: 'CLIENT_ADMIN',
        };
        setUser(userData);

        // Se for primeiro acesso, marcar como FALSE após login bem sucedido
        if (clientData.primeiro_acesso) {
          console.log('Marcando primeiro acesso como false para cliente:', clientData.id);
          
          const { error: updateError } = await supabase
            .from('clients')
            .update({ primeiro_acesso: false })
            .eq('id', clientData.id);

          if (updateError) {
            console.error('Erro ao atualizar primeiro_acesso:', updateError);
          }
        }
        return userData;
      } else {
        console.log('Nenhum usuário encontrado com o email:', userEmail);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
    return null;
  }

  async function verifyFirstAccess(email: string): Promise<FirstAccessData | null> {
    try {
      setIsLoading(true);
      
      console.log('Verificando primeiro acesso para email:', email);
      
      // Primeiro verificar se já é um system_user
      const { data: systemUser } = await supabase
        .from('system_users')
        .select('id, email, role')
        .eq('email', email)
        .maybeSingle();

      if (systemUser) {
        console.log('Usuário já é system_user:', systemUser);
        // Se já é system_user, não é primeiro acesso
        return null;
      }
      
      // Buscar cliente pelo email
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          email,
          name,
          agency_id,
          primeiro_acesso,
          agencies (
            cnpj
          )
        `)
        .eq('email', email)
        .maybeSingle();

      if (clientError) {
        console.error('Erro na consulta:', clientError);
        throw new Error('Erro ao verificar email');
      }

      if (!client) {
        console.log('Email não encontrado:', email);
        throw new Error('Email não encontrado');
      }

      console.log('Cliente encontrado:', client);
      console.log('Primeiro acesso:', client.primeiro_acesso);

      // Verificar se é primeiro acesso
      if (client.primeiro_acesso) {
        const agencyData = client.agencies as unknown as { cnpj: string };
        
        const data: FirstAccessData = {
          email: client.email,
          agency_id: client.agency_id,
          cnpj: agencyData.cnpj || '',
          client_id: client.id,
          name: client.name,
        };
        
        setFirstAccessData(data);
        setNeedsPasswordReset(true);
        return data;
      }

      return null;
    } catch (error) {
      console.error('Erro ao verificar primeiro acesso:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function verifyCnpj(cnpj: string): Promise<boolean> {
    try {
      if (!firstAccessData) {
        console.log('Sem dados de primeiro acesso');
        return false;
      }
      
      console.log('Verificando CNPJ:', cnpj);
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

      console.log('Criando senha para:', firstAccessData.email);

      // Verificar se já existe um usuário com este email
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users.find(u => u.email === firstAccessData.email);
      const userExists = !!existingUser;

      let authUserId: string;

      if (userExists) {
        // Se usuário já existe, fazer update da senha
        authUserId = existingUser.id;
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          authUserId,
          { password }
        );

        if (updateError) throw updateError;
      } else {
        // Criar novo usuário
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

        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar usuário');
        
        authUserId = authData.user.id;
      }

      // Verificar se já existe na tabela system_users
      const { data: existingSystemUser } = await supabase
        .from('system_users')
        .select('id')
        .eq('email', firstAccessData.email)
        .maybeSingle();

      if (!existingSystemUser) {
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
      } else {
        // Atualizar o auth_id se necessário
        const { error: updateError } = await supabase
          .from('system_users')
          .update({ 
            auth_id: authUserId,
            must_change_password: false,
            updated_at: new Date().toISOString()
          })
          .eq('email', firstAccessData.email);

        if (updateError) {
          console.error('Erro ao atualizar system_users:', updateError);
        }
      }

      // Atualizar o cliente para marcar que não é mais primeiro acesso
      const { error: updateError } = await supabase
        .from('clients')
        .update({ 
          primeiro_acesso: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', firstAccessData.client_id);

      if (updateError) throw updateError;

      console.log('Senha criada com sucesso para:', firstAccessData.email);

      // Limpar dados de primeiro acesso
      setFirstAccessData(null);
      setNeedsPasswordReset(false);
      
      // Redirecionar para login
      router.push('/login?senha_criada=true');
      
    } catch (error) {
      console.error('Erro ao criar senha:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      setIsLoading(true);
      
      console.log('Tentando login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro no login:', error);
        
        // Se for erro de credenciais inválidas, verificar se o email existe no system_users ou clients
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

          // Verificar se o email existe em clients
          const { data: client } = await supabase
            .from('clients')
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
        console.log('Login bem sucedido para:', data.user.email);
        const userData = await loadUserData(data.user.email ?? null, data.user.id);
        
        if (userData?.role === 'SUPER_ADMIN') {
          router.push('/super-admin');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
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
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      setUser(null);
      setFirstAccessData(null);
      setNeedsPasswordReset(false);
      
      // Limpar potenciais dados em cache ou storage
      localStorage.removeItem('imob_user');
      
      // Utilizar hard-reload para limpar cache de estado do Next.js
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