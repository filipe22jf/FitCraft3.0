// dashboard.js - Sistema com cálculos reais por usuário

class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.supabase = window._supabase;
        this.init();
    }

    async init() {
        await this.getCurrentUser();
        if (this.currentUser) {
            this.loadDashboardData();
        }
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;
        return user;
    }

    // Carregar todos os dados do dashboard
    async loadDashboardData() {
        try {
            const [statsResult, ultimasFichasResult] = await Promise.all([
                this.calculateStatistics(),
                this.loadUltimasFichas()
            ]);

            if (statsResult.success) {
                this.updateStatisticsDisplay(statsResult.data);
            }

            if (ultimasFichasResult.success) {
                this.updateUltimasFichasDisplay(ultimasFichasResult.data);
            }

            // Gerar gráfico simples
            this.generateChart();

        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
        }
    }

    // Calcular estatísticas reais do usuário
    async calculateStatistics() {
        try {
            const userId = this.currentUser.id;

            // 1. Buscar todos os clientes do usuário
            const { data: clients, error: clientsError } = await this.supabase
                .from('clients')
                .select('id, nome, credencial, created_at')
                .eq('user_id', userId);

            if (clientsError) throw clientsError;

            // 2. Buscar todas as fichas de treino do usuário
            const { data: fichas, error: fichasError } = await this.supabase
                .from('fichas_treino')
                .select('id, nome, data_criacao, client_id')
                .eq('user_id', userId)
                .order('data_criacao', { ascending: false });

            if (fichasError) throw fichasError;

            // 3. Calcular estatísticas
            const totalClientes = clients.length;
            const clientesAtivos = clients.filter(client => client.credencial !== null).length;
            const totalFichas = fichas.length;

            // Fichas deste mês
            const agora = new Date();
            const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
            const fichasEsteMes = fichas.filter(ficha => 
                new Date(ficha.data_criacao) >= inicioMes
            ).length;

            // Calcular crescimento (fichas deste mês vs mês anterior)
            const mesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
            const fimMesPassado = new Date(agora.getFullYear(), agora.getMonth(), 0);
            const fichasMesPassado = fichas.filter(ficha => {
                const dataFicha = new Date(ficha.data_criacao);
                return dataFicha >= mesPassado && dataFicha <= fimMesPassado;
            }).length;

            let crescimento = 0;
            if (fichasMesPassado > 0) {
                crescimento = Math.round(((fichasEsteMes - fichasMesPassado) / fichasMesPassado) * 100);
            } else if (fichasEsteMes > 0) {
                crescimento = 100;
            }

            return {
                success: true,
                data: {
                    totalClientes,
                    clientesAtivos,
                    totalFichas,
                    fichasEsteMes,
                    crescimento,
                    clients // Para usar no gráfico
                }
            };

        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
            return { success: false, error };
        }
    }

    // Buscar últimas fichas com informações do cliente
    async loadUltimasFichas() {
        try {
            const userId = this.currentUser.id;

            const { data: fichas, error } = await this.supabase
                .from('fichas_treino')
                .select(`
                    id,
                    nome,
                    data_criacao,
                    clients (
                        nome
                    )
                `)
                .eq('user_id', userId)
                .order('data_criacao', { ascending: false })
                .limit(5);

            if (error) throw error;

            return { success: true, data: fichas || [] };

        } catch (error) {
            console.error('Erro ao buscar últimas fichas:', error);
            return { success: false, error };
        }
    }

    // Atualizar display das estatísticas
    updateStatisticsDisplay(stats) {
        const statItems = document.querySelectorAll('.stat-item');
        
        if (statItems.length >= 4) {
            // Crescimento
            statItems[0].querySelector('.stat-value').textContent = `↗ ${stats.crescimento}%`;
            statItems[0].querySelector('.stat-label').textContent = 'CRESCIMENTO';
            
            // Total de treinos/fichas
            statItems[1].querySelector('.stat-value').textContent = stats.totalFichas;
            statItems[1].querySelector('.stat-label').textContent = 'TREINOS';
            
            // Clientes ativos
            statItems[2].querySelector('.stat-value').textContent = stats.clientesAtivos;
            statItems[2].querySelector('.stat-label').textContent = 'ALUNOS ATIVOS';
            
            // Total de clientes
            statItems[3].querySelector('.stat-value').textContent = stats.totalClientes;
            statItems[3].querySelector('.stat-label').textContent = 'ALUNOS TOTAIS';
        }

        // Atualizar cor do crescimento
        const crescimentoElement = statItems[0].querySelector('.stat-value');
        if (stats.crescimento > 0) {
            crescimentoElement.style.color = '#4CAF50';
        } else if (stats.crescimento < 0) {
            crescimentoElement.style.color = '#f44336';
        } else {
            crescimentoElement.style.color = '#6c757d';
        }
    }

    // Atualizar display das últimas fichas
    updateUltimasFichasDisplay(fichas) {
        const listaContainer = document.getElementById("lista-ultimos-treinos");
        
        if (!listaContainer) return;

        if (fichas.length === 0) {
            listaContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <div>Nenhuma ficha gerada ainda</div>
                </div>
            `;
            return;
        }

        listaContainer.innerHTML = '';

        fichas.forEach(ficha => {
            const workoutItem = document.createElement('div');
            workoutItem.classList.add('workout-item');
            
            const clienteNome = ficha.clients?.nome || 'Cliente não encontrado';
            const dataFormatada = new Date(ficha.data_criacao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });

            workoutItem.innerHTML = `
                <img src="https://via.placeholder.com/50/4CAF50/white?text=${clienteNome.charAt(0)}" 
                     alt="Foto do Cliente" 
                     class="client-photo">
                <div class="workout-details">
                    <span class="client-name">${clienteNome}</span>
                    <span class="workout-type">${ficha.nome}</span>
                    <span class="workout-time">${dataFormatada}</span>
                </div>
            `;
            
            listaContainer.appendChild(workoutItem);
        });
    }

    // Gerar gráfico simples no placeholder
    generateChart() {
        const chartPlaceholder = document.querySelector('.chart-placeholder');
        if (!chartPlaceholder) return;

        // Limpar o placeholder
        chartPlaceholder.innerHTML = '';
        chartPlaceholder.style.display = 'flex';
        chartPlaceholder.style.alignItems = 'flex-end';
        chartPlaceholder.style.justifyContent = 'space-around';
        chartPlaceholder.style.padding = '10px';
        chartPlaceholder.style.background = 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';

        // Dados simulados dos últimos 7 dias (você pode buscar dados reais)
        this.generateWeeklyChart(chartPlaceholder);
    }

    async generateWeeklyChart(container) {
        try {
            const userId = this.currentUser.id;
            const hoje = new Date();
            const seteDiasAtras = new Date(hoje.getTime() - (7 * 24 * 60 * 60 * 1000));

            // Buscar fichas dos últimos 7 dias
            const { data: fichas } = await this.supabase
                .from('fichas_treino')
                .select('data_criacao')
                .eq('user_id', userId)
                .gte('data_criacao', seteDiasAtras.toISOString())
                .order('data_criacao', { ascending: true });

            // Agrupar por dia
            const fichasPorDia = {};
            for (let i = 6; i >= 0; i--) {
                const dia = new Date(hoje.getTime() - (i * 24 * 60 * 60 * 1000));
                const diaStr = dia.toISOString().split('T')[0];
                fichasPorDia[diaStr] = 0;
            }

            if (fichas) {
                fichas.forEach(ficha => {
                    const dia = ficha.data_criacao.split('T')[0];
                    if (fichasPorDia[dia] !== undefined) {
                        fichasPorDia[dia]++;
                    }
                });
            }

            // Criar barras do gráfico
            const valores = Object.values(fichasPorDia);
            const maxValor = Math.max(...valores) || 1;

            valores.forEach((valor, index) => {
                const barra = document.createElement('div');
                const altura = Math.max((valor / maxValor) * 40, 2); // Mínimo 2px de altura
                
                barra.style.width = '8px';
                barra.style.height = `${altura}px`;
                barra.style.backgroundColor = valor > 0 ? '#4CAF50' : '#e0e0e0';
                barra.style.borderRadius = '2px';
                barra.style.transition = 'all 0.3s ease';
                barra.title = `${valor} treino${valor !== 1 ? 's' : ''}`;
                
                container.appendChild(barra);
            });

        } catch (error) {
            console.error('Erro ao gerar gráfico:', error);
            // Fallback para gráfico simples
            for (let i = 0; i < 7; i++) {
                const barra = document.createElement('div');
                const altura = Math.random() * 40 + 5;
                barra.style.width = '8px';
                barra.style.height = `${altura}px`;
                barra.style.backgroundColor = '#4CAF50';
                barra.style.borderRadius = '2px';
                container.appendChild(barra);
            }
        }
    }

    // Atualizar dados (chamar quando necessário)
    async refresh() {
        await this.loadDashboardData();
    }
}

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar o Supabase estar pronto
    if (typeof window._supabase === 'undefined') {
        console.log('Aguardando Supabase...');
        const checkSupabase = setInterval(() => {
            if (typeof window._supabase !== 'undefined') {
                clearInterval(checkSupabase);
                window.dashboardManager = new DashboardManager();
            }
        }, 100);
    } else {
        window.dashboardManager = new DashboardManager();
    }
});

// Função global para atualizar dashboard (compatibilidade)
async function carregarDashboard() {
    if (window.dashboardManager) {
        await window.dashboardManager.refresh();
    }
}

// Função para carregar última ficha (compatibilidade)
function carregarUltimaFicha() {
    carregarDashboard();
}