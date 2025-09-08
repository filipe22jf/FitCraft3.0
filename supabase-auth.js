class FitCraftAuth {
    constructor(supabaseClient) {
        if (!supabaseClient) throw new Error("O cliente Supabase é obrigatório.");
        this.supabase = supabaseClient;
    }

   initializeAuthListener() {
    this.supabase.auth.onAuthStateChange((event, session) => {
        console.log(`Auth Event: ${event}`);

        const userIsLoggedIn = session && session.user;
        const currentPath = window.location.pathname.split('/').pop();

        if (userIsLoggedIn) {
            // Se o usuário está logado, mas em uma página pública, redireciona.
            if (currentPath === 'login.html' || currentPath === 'register.html' || currentPath === 'index.html' || currentPath === '') {
                console.log('Usuário já logado. Redirecionando para o dashboard...');
                window.location.replace('dashboard.html');
            }
            // NADA MAIS AQUI. A responsabilidade agora é do dashboard.html

        } else { // Se o usuário NÃO está logado
            const isAuthPage = currentPath === 'login.html' || currentPath === 'register.html';
            const isPublicIndex = currentPath === 'index.html' || currentPath === '';
            
            // Se ele tentar acessar uma página protegida, redireciona.
            if (!isAuthPage && !isPublicIndex) {
                console.log('Usuário não logado em página protegida. Redirecionando para o login...');
                window.location.replace('login.html');
            }
        }
    });
}
    // Funções de login, logout, etc. permanecem as mesmas
    async login(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) console.error('Erro no login:', error.message);
        return { success: !error, data, error };
    }

    async logout() {
        console.log('Realizando logout...');
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            console.error('Erro no logout:', error.message);
        }
        return { success: !error, error };
    }

    async register(email, password) {
        const { data, error } = await this.supabase.auth.signUp({ email, password });
        if (error) console.error('Erro no registro:', error.message);
        return { success: !error, data, error };
    }

    async getCurrentUser() {
        const { data: { session }, error } = await this.supabase.auth.getSession();
        if (error) {
            console.error('Erro ao obter sessão:', error);
            return null;
        }
        return session ? session.user : null;
    }
}

// Função de inicialização global (permanece a mesma)
function initializeAppAuth() {
    if (window._supabase) {
        window.fitCraftAuth = new FitCraftAuth(window._supabase);
        window.fitCraftAuth.initializeAuthListener();
        console.log('✅ FitCraft Auth e Listener inicializados');
    } else {
        console.log('Aguardando cliente Supabase...');
        setTimeout(initializeAppAuth, 100);
    }
}

document.addEventListener('DOMContentLoaded', initializeAppAuth);
