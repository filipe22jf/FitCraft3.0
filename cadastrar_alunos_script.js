// cadastrar_alunos_script.js (Versão com Desativação de Credencial)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES DO DOM (não mudam) ---
    const btnSalvarAluno = document.getElementById('btn-salvar-aluno');
    const listaAlunosCadastrados = document.getElementById('lista-alunos-cadastrados');
    const nomeAlunoInput = document.getElementById('nome-aluno-cadastro');
    const dataCadastroInput = document.getElementById('data-cadastro');
    const valorConsultoriaInput = document.getElementById('valor-consultoria');
    const modal = document.getElementById('credential-modal');
    const spanClose = document.getElementsByClassName('close-button')[0];
    const credencialSpan = document.getElementById('aluno-credencial');
    const copyBtn = document.getElementById('copy-credential-btn');

    // --- FUNÇÕES AUXILIARES (não mudam) ---
    function gerarCredencial() {
        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numeros = '0123456789';
        let parteLetras = '';
        for (let i = 0; i < 3; i++) {
            parteLetras += letras.charAt(Math.floor(Math.random() * letras.length));
        }
        let parteNumeros = '';
        for (let i = 0; i < 3; i++) {
            parteNumeros += numeros.charAt(Math.floor(Math.random() * numeros.length));
        }
        return `${parteLetras}-${parteNumeros}`;
    }
    function limparFormulario() {
        nomeAlunoInput.value = '';
        dataCadastroInput.value = '';
        valorConsultoriaInput.value = '';
    }
    function mostrarModalCredencial(credencial) {
        credencialSpan.textContent = credencial;
        modal.style.display = 'block';
    }

    // --- FUNÇÕES PRINCIPAIS ---

    /**
     * NOVO: Define a credencial de um cliente como NULL no banco de dados.
     * @param {string} clientId - O ID (uuid) do cliente.
     */
    async function desativarCredencial(clientId) {
        const confirmacao = confirm('Tem certeza de que deseja desativar o acesso deste aluno? A credencial será removida, mas o aluno continuará na sua lista.');

        if (!confirmacao) {
            return; // Usuário cancelou
        }

        // Atualiza a coluna 'credencial' para NULL para o cliente específico
        const { error } = await _supabase
            .from('clients')
            .update({ credencial: null }) // Define a credencial como nula
            .eq('id', clientId);

        if (error) {
            console.error('Erro ao desativar credencial:', error);
            alert(`Não foi possível desativar o acesso. Detalhes: ${error.message}`);
        } else {
            console.log('Acesso do cliente desativado com sucesso!');
            renderizarAlunos(); // Atualiza a lista para refletir a mudança
        }
    }

    /**
     * ATUALIZADO: Carrega todos os alunos e mostra o status da credencial.
     */
    async function renderizarAlunos() {
        listaAlunosCadastrados.innerHTML = '<li>Carregando alunos...</li>';

        const { data: clients, error } = await _supabase
            .from('clients')
            .select('id, nome, credencial')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar clientes:', error);
            listaAlunosCadastrados.innerHTML = `<li>Erro ao carregar. Verifique o console.</li>`;
            return;
        }

        listaAlunosCadastrados.innerHTML = '';

        if (clients.length === 0) {
            listaAlunosCadastrados.innerHTML = '<li>Nenhum cliente cadastrado.</li>';
            return;
        }

        clients.forEach(client => {
            const li = document.createElement('li');
            li.className = 'client-item-list';

            // Lógica para exibir a credencial ou o status "Acesso Desativado"
            const temCredencial = client.credencial;
            const credencialDisplay = temCredencial 
                ? `Credencial: <strong>${client.credencial}</strong>` 
                : `<span style="color: #e74c3c;">Acesso Desativado</span>`;

            // Lógica para mostrar o botão de desativar apenas se houver credencial
            const botaoDisplay = temCredencial
                ? `<button class="remove-client-btn" data-client-id="${client.id}">Desativar Acesso</button>`
                : '';

            li.innerHTML = `
                <div class="client-info">
                    <span>${client.nome || 'Nome não encontrado'}</span>
                    <small>${credencialDisplay}</small>
                </div>
                ${botaoDisplay}
            `;
            listaAlunosCadastrados.appendChild(li);
        });
    }

    // --- EVENT LISTENERS ---

    // Listener para salvar um novo aluno (não muda)
    btnSalvarAluno.addEventListener('click', async () => {
        const nome = nomeAlunoInput.value.trim();
        if (!nome) {
            alert('Por favor, preencha o nome do aluno.');
            return;
        }
        // ... resto do código de salvar não precisa de alteração
        btnSalvarAluno.disabled = true;
        btnSalvarAluno.textContent = 'Salvando...';
        const novaCredencial = gerarCredencial();
        const novoCliente = {
            nome: nome,
            data_inicio: document.getElementById('data-cadastro').value || null,
            valor_consultoria: document.getElementById('valor-consultoria').value || null,
            credencial: novaCredencial
        };
        const { data, error } = await _supabase.from('clients').insert([novoCliente]).select();
        btnSalvarAluno.disabled = false;
        btnSalvarAluno.textContent = 'Salvar Aluno';
        if (error) {
            console.error('Erro ao salvar cliente:', error);
            alert(`Ocorreu um erro ao salvar. Detalhes: ${error.message}`);
        } else {
            limparFormulario();
            renderizarAlunos();
            mostrarModalCredencial(novaCredencial);
        }
    });

    // Listener para os cliques na lista (agora para desativar credencial)
    listaAlunosCadastrados.addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('remove-client-btn')) {
            const clientId = event.target.dataset.clientId;
            if (clientId) {
                desativarCredencial(clientId);
            }
        }
    });

    // Listeners do modal (não mudam)
    spanClose.onclick = () => modal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    };
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(credencialSpan.textContent).then(() => {
            copyBtn.textContent = 'Copiado!';
            setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 2000);
        });
    });

    // --- INICIALIZAÇÃO ---
    renderizarAlunos();
});
