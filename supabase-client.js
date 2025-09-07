// supabase-client.js - Configuração do cliente Supabase

const SUPABASE_URL = 'https://uzyfbrmxcciqyieoktow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6eWZicm14Y2NpcXlpZW9rdG93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMTQ5MTAsImV4cCI6MjA3MTU5MDkxMH0.x8GV2vqz_ZMeLMINRsY8B_-9NvUYv0wIb0nEIjQeFTY';

// Criar cliente Supabase
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tornar disponível globalmente
window._supabase = _supabase;

console.log('✅ Cliente Supabase inicializado');