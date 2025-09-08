class FitCraftAuth {
    constructor(supabaseClient) {
        if (!supabaseClient) throw new Error("O cliente Supabase é obrigatório.");
        this.supabase = supabaseClient;
    }

    // Esta função agora é o ponto de entrada principal do app
    async handleInitialState() {
        try {
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session && session.user) {
                console.log('Sessão ativa encontrada. Redirecionando para o dashboard...');
                window.location.replace('dashboard.html');
            } else {
                console.log('Nenhuma sessão ativa. Redirecionando para o login...');
                window.location.replace('login.html');
            }
        } catch (error) {
            console.error('Erro crítico ao verificar sessão inicial. Redirecionando para login como segurança.', error);
            window.location.replace('login.html');
        }
    }

    // O listener de autenticação para páginas internas (como o dashboard)
    initializeAuthListener() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            console.log(`Auth Event: ${event}`);
            if (event === 'SIGNED_OUT') {
                window.location.replace('login.html');
            }
        });
    }

    // Funções de login, logout, etc. permanecem as mesmas
    async login(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) console.error('Erro no login:', error.message);
        else window.location.replace('dashboard.html'); // Redireciona no sucesso
        return { success: !error, data, error };
    }

    async logout() {
        console.log('Realizando logout...');
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            console.error('Erro no logout:', error.message);
        }
        // O onAuthStateChange vai pegar o SIGNED_OUT e redirecionar.
        return { success: !error, error };
    }
}

// Função de inicialização global
function initializeAppAuth() {
    if (window._supabase) {
        window.fitCraftAuth = new FitCraftAuth(window._supabase);
        console.log('✅ FitCraft Auth inicializado');

        const currentPage = window.location.pathname.split('/').pop();

        // Lógica de Roteamento Principal
        if (currentPage === 'index.html' || currentPage === '') {
            // Se estamos na página de entrada, verifica o estado e redireciona.
            window.fitCraftAuth.handleInitialState();
        } else {
            // Se estamos em qualquer outra página, apenas escuta por eventos (como logout).
            window.fitCraftAuth.initializeAuthListener();
        }
    } else {
        console.log('Aguardando cliente Supabase...');
        setTimeout(initializeAppAuth, 100);
    }
}

// Inicia tudo
initializeAppAuth();
