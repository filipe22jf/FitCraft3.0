// cadastrar_alunos_script.js (VERSÃO FINAL E CORRIGIDA)

document.addEventListener('DOMContentLoaded', () => {
    // --- CONSTANTES DO DOM ---
    const btnSalvarAluno = document.getElementById('btn-salvar-aluno');
    const listaAlunosCadastrados = document.getElementById('lista-alunos-cadastrados');
    const nomeAlunoInput = document.getElementById('nome-aluno-cadastro');
    const dataCadastroInput = document.getElementById('data-cadastro');
    const valorConsultoriaInput = document.getElementById('valor-consultoria');
    const modal = document.getElementById('credential-modal');
    const spanClose = document.querySelector('.modal .close-button');
    const credencialSpan = document.getElementById('aluno-credencial');
    const copyBtn = document.getElementById('copy-credential-btn');

    // --- FUNÇÕES AUXILIARES ---
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
        if (modal && credencialSpan) {
            credencialSpan.textContent = credencial;
            modal.style.display = 'block';
        } else {
            console.error('Elementos do modal não encontrados.');
        }
    }

    // --- FUNÇÕES PRINCIPAIS (CRUD) ---

    async function desativarCredencial(clientId) {
        const confirmacao = confirm('Tem certeza de que deseja desativar o acesso deste aluno? A credencial será removida, mas o aluno continuará na sua lista.');
        if (!confirmacao) return;

        const { error } = await _supabase
            .from('clients')
            .update({ credencial: null })
            .eq('id', clientId);

        if (error) {
            console.error('Erro ao desativar credencial:', error);
            alert(`Não foi possível desativar o acesso. Detalhes: ${error.message}`);
        } else {
            console.log('Acesso do cliente desativado com sucesso!');
            renderizarAlunos();
        }
    }

    async function excluirAluno(clientId) {
        const confirmacao1 = confirm('ATENÇÃO: Esta ação é irreversível!\n\nTem certeza de que deseja EXCLUIR este aluno permanentemente? Todos os dados dele serão perdidos.');
        if (!confirmacao1) return;

        const confirmacao2 = prompt('Para confirmar a exclusão, digite "EXCLUIR" na caixa abaixo:');
        if (confirmacao2 !== 'EXCLUIR') {
            alert('A exclusão foi cancelada.');
            return;
        }

        const { error } = await _supabase
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (error) {
            console.error('Erro ao excluir aluno:', error);
            alert(`Não foi possível excluir o aluno. Detalhes: ${error.message}`);
        } else {
            console.log('Aluno excluído com sucesso!');
            alert('Aluno excluído permanentemente.');
            renderizarAlunos();
        }
    }

    async function renderizarAlunos() {
        if (!listaAlunosCadastrados) return;
        listaAlunosCadastrados.innerHTML = '<li>Carregando alunos...</li>';

        const { data: clients, error } = await _supabase
            .from('clients')
            .select('id, nome, credencial, valor_consultoria')
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

            const temCredencial = client.credencial;
            const credencialDisplay = temCredencial
                ? `Credencial: <strong>${client.credencial}</strong>`
                : `<span style="color: #e74c3c;">Acesso Desativado</span>`;

            const valorDisplay = client.valor_consultoria
                ? `Valor: <strong>R$ ${parseFloat(client.valor_consultoria).toFixed(2).replace('.', ',')}</strong>`
                : '';

            const botaoDesativar = temCredencial
                ? `<button class="disable-access-btn" data-client-id="${client.id}">Desativar Acesso</button>`
                : '';

            li.innerHTML = `
                <div class="client-info">
                    <span>${client.nome || 'Nome não encontrado'}</span>
                    <small>${credencialDisplay}</small>
                    <small>${valorDisplay}</small>
                </div>
                <div class="client-actions">
                    ${botaoDesativar}
                    <button class="delete-client-btn" data-client-id="${client.id}">Excluir</button>
                </div>
            `;
            listaAlunosCadastrados.appendChild(li);
        });
    }

    // --- EVENT LISTENERS ---

    // NO ARQUIVO: cadastrar_alunos_script.js
// SUBSTITUA O BLOCO 'if (btnSalvarAluno)' INTEIRO POR ESTE:

if (btnSalvarAluno) {
    btnSalvarAluno.addEventListener('click', async () => {
        
        // --- INÍCIO DA VERSÃO FINAL E CORRIGIDA ---

        // 1. PRIMEIRO, pegamos o valor do input do nome.
        const nome = nomeAlunoInput.value.trim();

        // 2. AGORA, validamos se o nome foi preenchido.
        if (!nome) {
            alert('Por favor, preencha o nome do aluno.');
            return; // Para a execução se o nome estiver vazio.
        }

        // 3. SÓ DEPOIS, buscamos o usuário logado.
        const { data: { user }, error: userError } = await _supabase.auth.getUser();

        // 4. E verificamos se a sessão é válida.
        if (userError || !user) {
            alert('Sua sessão expirou ou é inválida. Por favor, faça login novamente.');
            window.location.href = 'login.html'; 
            return;
        }
        
        // --- FIM DA VERSÃO FINAL E CORRIGIDA ---

        // O resto do seu código, que agora funciona perfeitamente.
        btnSalvarAluno.disabled = true;
        btnSalvarAluno.textContent = 'Salvando...';

        const novaCredencial = gerarCredencial();
        
        const novoCliente = {
            nome: nome,
            data_inicio: dataCadastroInput.value || null,
            valor_consultoria: valorConsultoriaInput.value || null,
            credencial: novaCredencial,
            personal_id: user.id // Usando 'personal_id' como você confirmou
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
            alert('Aluno salvo com sucesso!'); // Adicionando um alerta de sucesso
        }
    });
}


    if (listaAlunosCadastrados) {
        listaAlunosCadastrados.addEventListener('click', (event) => {
            const target = event.target;
            const clientId = target.dataset.clientId;

            if (!clientId) return;

            if (target.classList.contains('disable-access-btn')) {
                desativarCredencial(clientId);
            } else if (target.classList.contains('delete-client-btn')) {
                excluirAluno(clientId);
            }
        });
    }

    if (modal) {
        if (spanClose) {
            spanClose.onclick = () => {
                modal.style.display = 'none';
            };
        }
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }
    
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(credencialSpan.textContent).then(() => {
                copyBtn.textContent = 'Copiado!';
                setTimeout(() => { copyBtn.textContent = 'Copiar'; }, 2000);
            });
        });
    }

    // --- INICIALIZAÇÃO ---
    renderizarAlunos();
});
