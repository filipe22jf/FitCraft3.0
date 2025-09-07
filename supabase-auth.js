// supabase-auth.js (VERSÃO ATUALIZADA PARA NOVO FLUXO)

class FitCraftAuth {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
        this.initAuth();
    }

    async initAuth() {
        // Aguardar um pouco para garantir que tudo está carregado
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Iniciar monitoramento de autenticação
        this.handleAuthStateChange();
        
        // Verificar sessão inicial apenas se não estivermos na página de entrada
        const currentPath = window.location.pathname;
        const isEntryPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '';
        
        if (!isEntryPage) {
            this.checkInitialSession();
        }
    }

    async checkInitialSession() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            this.handleSession(session);
        } catch (error) {
            console.error('Erro ao verificar sessão inicial:', error);
        }
    }

    handleAuthStateChange() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth event:', event, session ? 'com sessão' : 'sem sessão');
            
            // Não fazer redirecionamento automático na página de entrada
            const currentPath = window.location.pathname;
            const isEntryPage = currentPath.endsWith('index.html') || currentPath === '/' || currentPath === '';
            
            if (!isEntryPage) {
                this.handleSession(session);
            }
        });
    }

    handleSession(session) {
        const userIsLoggedIn = session && session.user;
        const currentPath = window.location.pathname;
        const onAuthPage = currentPath.endsWith('login.html') || currentPath.endsWith('register.html');
        const onDashboard = currentPath.endsWith('dashboard.html');
        const onProtectedPage = !onAuthPage && !currentPath.endsWith('index.html') && currentPath !== '/' && currentPath !== '';

        console.log('Verificando sessão:', {
            userLoggedIn: !!userIsLoggedIn,
            currentPath,
            onAuthPage,
            onDashboard,
            onProtectedPage
        });

        if (userIsLoggedIn && onAuthPage) {
            // Usuário logado tentando acessar página de login/registro
            console.log('Redirecionando usuário logado para dashboard...');
            window.location.replace('dashboard.html');
        } else if (!userIsLoggedIn && (onDashboard || onProtectedPage)) {
            // Usuário não logado tentando acessar página protegida
            console.log('Redirecionando usuário não logado para login...');
            window.location.replace('login.html');
        }
    }

    async login(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({ 
                email, 
                password 
            });
            
            if (error) {
                console.error('Erro no login:', error.message);
                return { success: false, error: error.message };
            }
            
            console.log('Login realizado com sucesso');
            return { success: true, data };
        } catch (error) {
            console.error('Erro inesperado no login:', error);
            return { success: false, error: 'Erro inesperado no login' };
        }
    }

    async logout() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                console.error('Erro no logout:', error.message);
                return { success: false, error: error.message };
            }
            
            // Limpar dados locais
            localStorage.clear();
            sessionStorage.clear();
            
            console.log('Logout realizado com sucesso');
            return { success: true };
        } catch (error) {
            console.error('Erro inesperado no logout:', error);
            return { success: false, error: 'Erro inesperado no logout' };
        }
    }

    async register(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signUp({ 
                email, 
                password 
            });
            
            if (error) {
                console.error('Erro no registro:', error.message);
                return { success: false, error: error.message };
            }
            
            console.log('Registro realizado com sucesso');
            return { success: true, data };
        } catch (error) {
            console.error('Erro inesperado no registro:', error);
            return { success: false, error: 'Erro inesperado no registro' };
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await this.supabase.auth.getUser();
            return user;
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }
}

// Aguardar o _supabase estar disponível antes de criar a instância
function initFitCraftAuth() {
    if (window._supabase) {
        window.fitCraftAuth = new FitCraftAuth(window._supabase);
        console.log('✅ FitCraft Auth inicializado');
    } else {
        console.log('Aguardando cliente Supabase...');
        setTimeout(initFitCraftAuth, 100);
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFitCraftAuth);
} else {
    initFitCraftAuth();
}

