// supabase-client.js - Configuração do cliente Supabase (versão local para teste)

const SUPABASE_URL = 'https://uzyfbrmxcciqyieoktow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWZicm14Y2NpcXlpZW9rdG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMTQ5MTAsImV4cCI6MjA3MTU5MDkxMH0.x8GV2vqz_ZMeLMINRsY8B_-9NvUYv0wIb0nEIjQeFTY';

// Aguardar o Supabase estar disponível
function initSupabaseClient() {
    if (window.supabase && window.supabase.createClient) {
        // Criar cliente Supabase
        const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Tornar disponível globalmente
        window._supabase = _supabase;
        
        console.log('✅ Cliente Supabase inicializado');
    } else {
        console.log('Aguardando biblioteca Supabase...');
        setTimeout(initSupabaseClient, 100);
    }
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabaseClient);
} else {
    initSupabaseClient();
}

