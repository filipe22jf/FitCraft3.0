class FitCraftAuth {
    constructor(supabaseClient) {
        if (!supabaseClient) throw new Error("O cliente Supabase é obrigatório.");
        this.supabase = supabaseClient;
    }

    // Lida com o estado de autenticação em QUALQUER página.
    async handleAuthState() {
        const { data: { session } } = await this.supabase.auth.getSession();
        const userIsLoggedIn = session && session.user;
        const currentPage = window.location.pathname.split('/').pop();

        if (userIsLoggedIn) {
            // Se está logado e na página de login, redireciona para o dashboard.
            if (currentPage === 'login.html') {
                console.log('Sessão ativa detectada na página de login. Redirecionando para o dashboard...');
                window.location.replace('dashboard.html');
            }
        } else {
            // Se NÃO está logado e TENTA acessar o dashboard, redireciona para o login.
            if (currentPage === 'dashboard.html') {
                console.log('Tentativa de acesso não autenticada ao dashboard. Redirecionando para o login...');
                window.location.replace('login.html');
            }
        }
    }

    async login(email, password) {
        const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error('Erro no login:', error.message);
        } else {
            // No sucesso, a handleAuthState fará o redirecionamento.
            this.handleAuthState();
        }
        return { success: !error, error };
    }

    async logout() {
        console.log('Realizando logout...');
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            console.error('Erro no logout:', error);
        }
        // Após o logout, redireciona para a página de login.
        window.location.replace('login.html');
        return { success: !error };
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    if (window._supabase) {
        window.fitCraftAuth = new FitCraftAuth(window._supabase);
        console.log('✅ FitCraft Auth inicializado');
        // Verifica o estado de autenticação assim que o app carrega.
        window.fitCraftAuth.handleAuthState();
    } else {
        console.error('Cliente Supabase não encontrado!');
    }
});
