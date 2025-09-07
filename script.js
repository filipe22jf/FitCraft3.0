document.addEventListener('DOMContentLoaded', () => {
    // Navegação do Dashboard
    document.getElementById('btn-ver-clientes').addEventListener('click', () => {
        window.location.href = 'cadastrar_alunos.html';
    });

    document.getElementById('btn-criar-ficha').addEventListener('click', () => {
        window.location.href = 'criar_ficha.html';
    });

    document.getElementById('btn-gifs').addEventListener('click', () => {
        window.open('https://fitcraft-gifs-html.vercel.app/', '_blank');
    });

    // Carregar dados do dashboard
    carregarDashboard();
});

async function carregarDashboard() {
    try {
        // Carregar estatísticas
        const resultadoStats = await fitCraftData.obterEstatisticas();
        if (resultadoStats.success) {
            atualizarEstatisticas(resultadoStats.data);
        }

        // Carregar últimas fichas
        const resultadoFichas = await fitCraftData.listarFichasTreino();
        if (resultadoFichas.success) {
            atualizarUltimasFichas(resultadoFichas.data.slice(0, 3)); // Mostrar apenas as 3 mais recentes
        }

        // Migrar dados locais se existirem
        await fitCraftData.migrarDadosLocais();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
    }
}

function atualizarEstatisticas(stats) {
    const statItems = document.querySelectorAll('.stat-item');
    
    if (statItems.length >= 4) {
        statItems[0].querySelector('.stat-value').textContent = `↑ ${stats.crescimento}%`;
        statItems[0].querySelector('.stat-label').textContent = 'Crescimento';
        
        statItems[1].querySelector('.stat-value').textContent = stats.totalFichas;
        statItems[1].querySelector('.stat-label').textContent = 'Fichas';
        
        statItems[2].querySelector('.stat-value').textContent = stats.totalClientes;
        statItems[2].querySelector('.stat-label').textContent = 'Clientes';
        
        statItems[3].querySelector('.stat-value').textContent = stats.fichasEsteMes;
        statItems[3].querySelector('.stat-label').textContent = 'Este Mês';
    }
}

function atualizarUltimasFichas(fichas) {
    const listaUltimosTreinos = document.getElementById("lista-ultimos-treinos");

    if (fichas.length > 0) {
        listaUltimosTreinos.innerHTML = ''; // Limpa o estado vazio
        
        fichas.forEach(ficha => {
            const workoutItem = document.createElement('div');
            workoutItem.classList.add('workout-item');
            workoutItem.innerHTML = `
                <img src="https://via.placeholder.com/50" alt="Foto do Cliente" class="client-photo">
                <div class="workout-details">
                    <span class="client-name">${ficha.clientes?.nome || 'Cliente'}</span>
                    <span class="workout-type">${ficha.nome}</span>
                </div>
                <span class="workout-time">${new Date(ficha.data_criacao).toLocaleDateString('pt-BR')}</span>
            `;
            listaUltimosTreinos.appendChild(workoutItem);
        });
    } else {
        listaUltimosTreinos.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🗂️</div>
                <div>Nenhuma ficha gerada ainda</div>
            </div>
        `;
    }
}

// Função para carregar última ficha (compatibilidade com código antigo)
function carregarUltimaFicha() {
    carregarDashboard();
}


