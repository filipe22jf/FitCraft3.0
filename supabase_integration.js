// supabase-stats-calculator.js - Versão integrada com Supabase

class SupabaseStatsCalculator {
    constructor() {
        this.supabase = window._supabase;
        this.currentUser = null;
        this.clients = [];
        this.workoutPlans = [];
        this.init();
    }

    async init() {
        await this.getCurrentUser();
        if (this.currentUser) {
            await this.loadDataFromSupabase();
            this.calculateAndDisplayStats();
            this.generateChart();
            this.showRecentActivities();
            
            // Atualizar a cada 30 segundos
            setInterval(() => {
                this.refreshData();
            }, 30000);
        }
    }

    async getCurrentUser() {
        const { data: { user } } = await this.supabase.auth.getUser();
        this.currentUser = user;
        return user;
    }

    async loadDataFromSupabase() {
        try {
            const userId = this.currentUser.id;

            // Carregar clientes do usuário atual
            const { data: clients, error: clientsError } = await this.supabase
                .from('clients')
                .select('id, nome, credencial, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (clientsError) throw clientsError;

            // Carregar planos de treino do usuário atual
            const { data: workoutPlans, error: plansError } = await this.supabase
                .from('planos_de_treino')
                .select('id, user_id, name, data_troca, exercicios, created_at')
                .eq('created_by', userId)
                .order('created_at', { ascending: false });

            if (plansError) throw plansError;

            this.clients = clients || [];
            this.workoutPlans = workoutPlans || [];

            console.log(`Carregados ${this.clients.length} clientes e ${this.workoutPlans.length} planos`);

        } catch (error) {
            console.error('Erro ao carregar dados do Supabase:', error);
            this.showError('Erro ao carregar dados. Verifique sua conexão.');
        }
    }

    calculateAndDisplayStats() {
        try {
            // 1. Total de clientes cadastrados
            const totalClients = this.clients.length;
            
            // 2. Clientes ativos (com credencial)
            const activeClients = this.clients.filter(client => 
                client.credencial !== null && client.credencial !== ''
            ).length;
            
            // 3. Total de fichas de treino
            const totalWorkouts = this.workoutPlans.length;
            
            // 4. Crescimento mensal baseado em fichas criadas
            const growth = this.calculateMonthlyGrowth();

            // Animar os contadores
            this.animateCounter('totalClients', totalClients);
            this.animateCounter('activeClients', activeClients);
            this.animateCounter('totalWorkouts', totalWorkouts);
            this.animateCounter('monthlyGrowth', growth, '%');

            // Atualizar cores baseadas nos valores
            this.updateStatColors(growth);

        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
            this.showError('Erro ao calcular estatísticas');
        }
    }

    calculateMonthlyGrowth() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Primeiro dia do mês atual
        const startCurrentMonth = new Date(currentYear, currentMonth, 1);
        
        // Primeiro dia do mês passado
        const startLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const endLastMonth = new Date(currentYear, currentMonth, 0);

        // Contar fichas do mês atual
        const currentMonthWorkouts = this.workoutPlans.filter(plan => {
            const createdAt = new Date(plan.created_at);
            return createdAt >= startCurrentMonth;
        }).length;

        // Contar fichas do mês passado
        const lastMonthWorkouts = this.workoutPlans.filter(plan => {
            const createdAt = new Date(plan.created_at);
            return createdAt >= startLastMonth && createdAt <= endLastMonth;
        }).length;

        // Calcular percentual de crescimento
        if (lastMonthWorkouts === 0) {
            return currentMonthWorkouts > 0 ? 100 : 0;
        }

        const growthPercent = ((currentMonthWorkouts - lastMonthWorkouts) / lastMonthWorkouts) * 100;
        return Math.round(growthPercent);
    }

    generateChart() {
        const chart = document.getElementById('activityChart');
        if (!chart) return;

        chart.innerHTML = '';
        
        // Gerar dados dos últimos 7 dias
        const chartData = this.getLast7DaysData();
        const maxValue = Math.max(...chartData.map(d => d.value), 1);
        
        chartData.forEach((day, index) => {
            const bar = document.createElement('div');
            bar.className = 'chart-bar';
            bar.style.height = `${(day.value / maxValue) * 160 + 10}px`;
            bar.setAttribute('data-value', day.value);
            bar.title = `${day.day}: ${day.value} fichas criadas`;
            
            // Adicionar animação com delay
            bar.style.animationDelay = `${index * 100}ms`;
            bar.style.animation = 'chartBarGrow 0.6s ease-out forwards';
            
            chart.appendChild(bar);
        });
    }

    getLast7DaysData() {
        const days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Contar fichas criadas neste dia
            const dayWorkouts = this.workoutPlans.filter(plan => {
                const planDate = new Date(plan.created_at);
                return planDate.toDateString() === date.toDateString();
            }).length;
            
            days.push({
                day: date.toLocaleDateString('pt-BR', { 
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit'
                }),
                value: dayWorkouts,
                date: date
            });
        }
        
        return days;
    }

    showRecentActivities() {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        // Pegar as 5 fichas mais recentes
        const recentWorkouts = [...this.workoutPlans]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
        
        if (recentWorkouts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
                    <p>Nenhuma ficha criada ainda</p>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem;">
                        Suas primeiras fichas aparecerão aqui
                    </p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        recentWorkouts.forEach((workout, index) => {
            const client = this.clients.find(c => c.id === workout.user_id);
            const clientName = client ? client.nome : 'Cliente';
            
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.style.animationDelay = `${index * 100}ms`;
            activityItem.style.animation = 'fadeInUp 0.5s ease-out forwards';
            
            const timeAgo = this.getTimeAgo(new Date(workout.created_at));
            const exerciseCount = workout.exercicios ? workout.exercicios.length : 0;
            
            activityItem.innerHTML = `
                <div class="activity-avatar">
                    ${clientName.charAt(0).toUpperCase()}
                </div>
                <div class="activity-info">
                    <div class="activity-name">${clientName}</div>
                    <div class="activity-action">
                        ${workout.name} - ${exerciseCount} exercícios
                    </div>
                </div>
                <div class="activity-time">${timeAgo}</div>
            `;
            
            container.appendChild(activityItem);
        });
    }

    animateCounter(elementId, finalValue, suffix = '') {
        const element = document.getElementById(elementId);
        if (!element) return;

        const duration = 2000;
        const steps = 60;
        const increment = finalValue / steps;
        let currentValue = 0;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            
            let displayValue;
            if (suffix === '%') {
                displayValue = (currentValue >= 0 ? '+' : '') + Math.floor(currentValue);
            } else {
                displayValue = Math.floor(currentValue);
            }
            
            element.textContent = displayValue + suffix;
        }, duration / steps);
    }

    updateStatColors(growth) {
        const growthElement = document.getElementById('monthlyGrowth');
        if (!growthElement) return;

        if (growth > 0) {
            growthElement.style.color = '#4CAF50'; // Verde para crescimento positivo
        } else if (growth < 0) {
            growthElement.style.color = '#f44336'; // Vermelho para crescimento negativo
        } else {
            growthElement.style.color = 'var(--text-secondary)'; // Neutro para sem mudança
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Agora mesmo';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
        return `${Math.floor(diffInSeconds / 604800)} semanas atrás`;
    }

    async refreshData() {
        console.log('Atualizando dados...');
        await this.loadDataFromSupabase();
        this.calculateAndDisplayStats();
        this.generateChart();
        this.showRecentActivities();
    }

    showError(message) {
        // Mostrar erro nos elementos de estatística
        ['totalClients', 'activeClients', 'totalWorkouts', 'monthlyGrowth'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '--';
                element.style.color = '#f44336';
            }
        });
        
        console.error(message);
    }
}

// CSS adicional para animações
const additionalCSS = `
    @keyframes chartBarGrow {
        from {
            height: 10px !important;
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .activity-item {
        opacity: 0;
    }

    .chart-bar {
        opacity: 0;
    }
`;

// Adicionar CSS ao document
if (!document.getElementById('additional-animations')) {
    const style = document.createElement('style');
    style.id = 'additional-animations';
    style.textContent = additionalCSS;
    document.head.appendChild(style);
}

// Inicializar quando o Supabase estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    if (typeof window._supabase === 'undefined') {
        console.log('Aguardando Supabase...');
        const checkSupabase = setInterval(() => {
            if (typeof window._supabase !== 'undefined') {
                clearInterval(checkSupabase);
                window.statsCalculator = new SupabaseStatsCalculator();
            }
        }, 100);
    } else {
        window.statsCalculator = new SupabaseStatsCalculator();
    }
});

// Exportar para uso global
window.SupabaseStatsCalculator = SupabaseStatsCalculator;