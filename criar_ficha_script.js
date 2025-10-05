// --- VARIÁVEIS GLOBAIS ---
let exerciciosAdicionados = [];
let contadorExercicios = 0;
let exerciciosPorGrupo = {};
let currentWorkoutPlanId = null;
let currentAlunoId = null;
let fichaSelecionada = null;

let modoAgrupamento = {
    ativo: false,
    tecnica: null,
    exerciciosRestantes: 0,
    grupoId: null
};

// --- FUNÇÕES DE LÓGICA ---
function uniqueSorted(arr) { return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b, 'pt-BR')); }
function classificarPernas(nome) { const n = nome.toLowerCase(); const quadKeys = ['extensor', 'extensora', 'agach', 'leg press', 'passada', 'afundo', 'bulgaro', 'búlgaro', 'frontal', 'hack']; const postKeys = ['flexor', 'flexora', 'stiff', 'levantamento terra', 'romeno', 'mesa flexora']; if (postKeys.some(k => n.includes(k))) return 'posteriores_de_coxa'; if (quadKeys.some(k => n.includes(k))) return 'quadriceps'; return 'quadriceps'; }
function construirMapa(data) { const mapa = { peitoral: [], dorsais: [], ombros: [], biceps: [], triceps: [], quadriceps: [], posteriores_de_coxa: [], gluteos: [], panturrilhas: [], trapezio: [], eretores_da_espinha: [], cardio_academia: [], abdomen: [], antebracos: [] }; for (const item of data) { const cat = (item.category || '').toLowerCase(); const nome = item.name || ''; if (!nome) continue; if (cat.includes('peitoral')) mapa.peitoral.push(nome); else if (cat.includes('costas') || cat.includes('dorsais')) mapa.dorsais.push(nome); else if (cat.includes('ombros')) mapa.ombros.push(nome); else if (cat.includes('bíceps') || cat.includes('biceps')) mapa.biceps.push(nome); else if (cat.includes('tríceps') || cat.includes('triceps')) mapa.triceps.push(nome); else if (cat.includes('pernas')) mapa[classificarPernas(nome)].push(nome); else if (cat.includes('glúteos') || cat.includes('gluteos')) mapa.gluteos.push(nome); else if (cat.includes('panturr')) mapa.panturrilhas.push(nome); else if (cat.includes('trapézio') || cat.includes('trapezio')) mapa.trapezio.push(nome); else if (cat.includes('eretores')) mapa.eretores_da_espinha.push(nome); else if (cat.includes('cardio')) mapa.cardio_academia.push(nome); else if (cat.includes('abdômen') || cat.includes('abdomen')) mapa.abdomen.push(nome); else if (cat.includes('antebra')) mapa.antebracos.push(nome); } for (const k of Object.keys(mapa)) { mapa[k] = uniqueSorted(mapa[k]); } return mapa; }
// NO ARQUIVO: criar_ficha_script.js

async function carregarExerciciosDoSite() {
    const url = 'https://exercicios-mauve.vercel.app/gif_index.json';
    try {
        const resp = await fetch(url );
        
        // Verifica se a requisição foi bem-sucedida (status 200-299)
        if (!resp.ok) {
            // Se não foi, lança um erro para ser pego pelo catch
            throw new Error(`Falha na rede: status ${resp.status}`);
        }

        const data = await resp.json();

        // --- INÍCIO DA CORREÇÃO ---
        // VERIFICAÇÃO DE SEGURANÇA: Garante que 'data' é um array antes de continuar.
        if (!Array.isArray(data)) {
            console.error('Os dados de exercícios carregados do site não são um array válido.', data);
            // Retorna null para que a falha possa ser tratada.
            return null;
        }
        // --- FIM DA CORREÇÃO ---

        // Se tudo deu certo, constrói o mapa e retorna.
        return construirMapa(data);

    } catch (e) {
        console.error('Falha ao carregar ou processar exercícios do site:', e);
        // Retorna null em caso de qualquer erro (rede, JSON inválido, etc.)
        return null;
    }
}

/**
 * Gera um plano de treino usando a API da OpenAI.
 * @param {string} promptDoPersonal - A instrução do personal trainer.
 * @returns {Promise<object|null>} - O plano de treino em formato JSON ou null em caso de erro.
 */
// Arquivo: criar_ficha_script.js

async function gerarTreinoComIA(promptDoPersonal) {
    const urlExercicios = 'https://exercicios-mauve.vercel.app/gif_index.json';
    const loadingDiv = document.getElementById('ia-loading' );
    if (loadingDiv) loadingDiv.style.display = 'block';

    try {
        // Busca a lista de exercícios como antes
        const responseExercicios = await fetch(urlExercicios);
        if (!responseExercicios.ok) throw new Error('Falha ao buscar a lista de exercícios.');
        const listaDeExerciciosCompleta = await responseExercicios.json();
        const listaFormatada = listaDeExerciciosCompleta.map(ex => `${ex.nome_exercicio} (Grupo: ${ex.grupo_muscular})`).join('\n');

        // CHAMA A NOSSA PRÓPRIA API SEGURA!
        const response = await fetch('/api/gerar-treino', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                promptDoPersonal: promptDoPersonal,
                listaFormatada: listaFormatada
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Falha na API: ${errorData.error.message || 'Erro desconhecido'}`);
        }

        const planoDeTreino = await response.json();
        
        if (loadingDiv) loadingDiv.style.display = 'none';
        return planoDeTreino;

    } catch (error) {
        console.error('ERRO GERAL ao gerar treino com IA:', error);
        alert(`Ocorreu um erro ao gerar o treino: ${error.message}`);
        if (loadingDiv) loadingDiv.style.display = 'none';
        return null;
    }
}



const tecnicasDescricoes = { "Drop set": "Realizar o exercício até a falha e reduzir o peso para continuar até a falha novamente.", "Rest-pause": "Ir até a falha, descansar 10–20s e continuar com o mesmo peso.", "Bi-set": "Dois exercícios em sequência sem descanso.", "Tri-set": "Três exercícios em sequência sem descanso.", "Giant set": "Quatro ou mais exercícios em sequência sem descanso.", "Super-set": "Dois exercícios de grupos opostos sem descanso.", "Pré-exaustão": "Exercício isolado antes do composto para o mesmo músculo.", "Pós-exaustão": "Exercício isolado após o composto para o mesmo músculo.", "Isometria": "Manter a contração por tempo definido.", "Parciais": "Repetições com amplitude reduzida na parte mais difícil.", "Forçada": "Ajuda do parceiro nas últimas repetições.", "Negativa": "Ênfase na fase excêntrica, descendo de forma lenta.", "Cluster set": "Dividir a série em mini-blocos com pequenos descansos.", "Piramidal crescente": "Aumenta peso e reduz repetições a cada série.", "Piramidal decrescente": "Reduz peso e aumenta repetições a cada série.", "FST-7": "7 séries de 10–15 repetições com 30–45s de descanso, geralmente no final." };
function formatGrupoForPDF(grupo) { const g = (grupo || '').toLowerCase(); if (g.includes('dorsais') || g.includes('costas')) { return '(costas)'; } else if (g.includes('ombros (deltoides)')) { return '(deltoides)'; } return `(${g.replace(/[^a-z\s]/gi, '')})`; }

// --- FUNÇÕES DE MANIPULAÇÃO DA INTERFACE ---
function limparDadosFicha() { currentWorkoutPlanId = null; fichaSelecionada = null; exerciciosAdicionados = []; contadorExercicios = 0; document.getElementById('nome-ficha').value = ''; document.getElementById('data-troca').value = new Date().toISOString().split('T')[0]; document.getElementById('observacoes-aluno').value = ''; atualizarListaExercicios(); atualizarContadorExercicios(); document.getElementById("pdf-section").style.display = "none"; document.getElementById("grupo-muscular").value = ""; document.getElementById("exercicio").innerHTML = '<option value="">Primeiro selecione o grupo muscular</option>'; document.getElementById("exercicio").disabled = true; document.getElementById("series").value = "3"; document.getElementById("repeticoes").value = "12"; document.getElementById("tecnica").value = ""; }
function iniciarNovaFicha() { if (!currentAlunoId) { alert("Por favor, selecione um aluno antes de criar uma nova ficha."); return; } limparDadosFicha(); document.getElementById('dados-ficha-section').style.display = 'block'; document.getElementById('adicionar-exercicio-section').style.display = 'block'; document.getElementById('ficha-atual-section').style.display = 'block'; document.getElementById('modo-edicao').textContent = '(Nova Ficha)'; document.getElementById('nome-ficha-atual').textContent = ''; document.querySelectorAll('.ficha-item').forEach(item => item.classList.remove('selected')); document.getElementById('btn-editar-ficha').disabled = true; }
async function iniciarEdicaoFicha(fichaId) { if (!currentAlunoId) { alert("Erro crítico: Tentando editar uma ficha sem um aluno selecionado."); return; } const loading = document.getElementById("loading"); loading.style.display = 'block'; const { data: workoutPlan, error } = await _supabase.from('planos_de_treino').select('*').eq('id', fichaId).single(); loading.style.display = 'none'; if (error || !workoutPlan) { console.error('Erro ao carregar ficha:', error); alert('Ocorreu um erro ao carregar a ficha.'); return; } currentWorkoutPlanId = workoutPlan.id; fichaSelecionada = workoutPlan; document.getElementById('nome-ficha').value = workoutPlan.name; document.getElementById('data-troca').value = workoutPlan.data_troca; document.getElementById('observacoes-aluno').value = workoutPlan.observacoes || ''; exerciciosAdicionados = workoutPlan.exercicios || []; contadorExercicios = exerciciosAdicionados.length; document.getElementById('dados-ficha-section').style.display = 'block'; document.getElementById('adicionar-exercicio-section').style.display = 'block'; document.getElementById('ficha-atual-section').style.display = 'block'; document.getElementById('modo-edicao').textContent = '(Editando)'; document.getElementById('nome-ficha-atual').textContent = `- ${workoutPlan.name}`; atualizarListaExercicios(); atualizarContadorExercicios(); document.getElementById("pdf-section").style.display = "block"; }

// --- FUNÇÕES DE MANIPULAÇÃO DA FICHA ---
function adicionarExercicio() {
    const nomeFicha = document.getElementById("nome-ficha").value.trim();
    const dataTroca = document.getElementById("data-troca").value;
    const grupoSel = document.getElementById("grupo-muscular");
    const grupoMuscularKey = grupoSel.value;
    const exercicioNome = document.getElementById("exercicio").value;
    const series = document.getElementById("series").value;
    const repeticoes = document.getElementById("repeticoes").value;
    const tecnica = document.getElementById("tecnica").value;

    if (!nomeFicha || !dataTroca) { alert("Por favor, preencha o 'Nome da Ficha' e a 'Data de Troca' antes de adicionar exercícios."); return; }
    if (!grupoMuscularKey || !exercicioNome || !series || !repeticoes) { alert("Por favor, selecione o grupo muscular, o exercício, as séries e as repetições."); return; }

    const novoExercicio = { id: Date.now(), grupoMuscular: grupoSel.options[grupoSel.selectedIndex]?.text || "", exercicio: exercicioNome, series: parseInt(series), repeticoes: repeticoes, tecnica: tecnica || null, grupoTecnicaId: null };
    const tecnicasAgrupamento = { "Bi-set": 2, "Tri-set": 3, "Giant set": 4, "Super-set": 2 };

    if (modoAgrupamento.ativo) {
        novoExercicio.grupoTecnicaId = modoAgrupamento.grupoId;
        novoExercicio.tecnica = modoAgrupamento.tecnica;
        exerciciosAdicionados.push(novoExercicio);
        modoAgrupamento.exerciciosRestantes--;
        if (modoAgrupamento.exerciciosRestantes === 0) {
            modoAgrupamento.ativo = false;
            alert(`Grupo de ${modoAgrupamento.tecnica} finalizado!`);
        } else {
            alert(`Adicionado ao ${modoAgrupamento.tecnica}. Faltam ${modoAgrupamento.exerciciosRestantes} exercício(s) para completar o grupo.`);
        }
    } else if (tecnicasAgrupamento[tecnica]) {
        modoAgrupamento.ativo = true;
        modoAgrupamento.tecnica = tecnica;
        modoAgrupamento.exerciciosRestantes = tecnicasAgrupamento[tecnica] - 1;
        modoAgrupamento.grupoId = `grupo-${Date.now()}`;
        novoExercicio.grupoTecnicaId = modoAgrupamento.grupoId;
        exerciciosAdicionados.push(novoExercicio);
        alert(`Iniciando um ${tecnica}. Adicione o próximo exercício para o grupo.`);
    } else {
        exerciciosAdicionados.push(novoExercicio);
    }

    contadorExercicios = exerciciosAdicionados.length;
    atualizarListaExercicios();
    atualizarContadorExercicios();
    document.getElementById("pdf-section").style.display = "block";
    document.getElementById("grupo-muscular").value = "";
    document.getElementById("exercicio").innerHTML = '<option value="">Primeiro selecione o grupo muscular</option>';
    document.getElementById("exercicio").disabled = true;
    document.getElementById("series").value = "3";
    document.getElementById("repeticoes").value = "12";
    document.getElementById("tecnica").value = "";
}

function atualizarListaExercicios() {
    const listaExerciciosDiv = document.getElementById("lista-exercicios");
    listaExerciciosDiv.innerHTML = "";
    if (exerciciosAdicionados.length === 0) { listaExerciciosDiv.innerHTML = `<div class="empty-state" style="text-align: center; padding: 40px; color: var(--texto-secundario);"><div style="font-size: 48px; margin-bottom: 1rem;">📋</div><div><strong>Nenhum exercício adicionado ainda</strong>  
Selecione exercícios para começar a montar a ficha.</div></div>`; return; }

    const exerciciosProcessados = new Set();
    exerciciosAdicionados.forEach((ex) => {
        if (exerciciosProcessados.has(ex.id)) return;
        if (ex.grupoTecnicaId) {
            const grupoExercicios = exerciciosAdicionados.filter(e => e.grupoTecnicaId === ex.grupoTecnicaId);
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'exercise-group';
            let grupoHTML = `<div class="group-header">${grupoExercicios[0].tecnica} <button class="remove-btn-group" onclick="removerExercicioDoGrupo('${ex.grupoTecnicaId}')">×</button></div>`;
            grupoExercicios.forEach((exGrupo, idx) => {
                const grupoFmt = formatGrupoForPDF(exGrupo.grupoMuscular).replace(/[()]/g, '');
                grupoHTML += `<div class="exercise-item-grouped"><span class="group-order">${idx + 1}º</span><div class="group-details"><h3>${exGrupo.exercicio} (${grupoFmt})</h3><p class="details">Séries: ${exGrupo.series} | Repetições: ${exGrupo.repeticoes}</p></div></div>`;
                exerciciosProcessados.add(exGrupo.id);
            });
            grupoDiv.innerHTML = grupoHTML;
            listaExerciciosDiv.appendChild(grupoDiv);
        } else {
            const exercicioItem = document.createElement("div");
            exercicioItem.classList.add("exercise-item");
            const grupoFmt = formatGrupoForPDF(ex.grupoMuscular).replace(/[()]/g, '');
            const tecnicaDescricao = ex.tecnica ? (tecnicasDescricoes[ex.tecnica] || '') : '';
            exercicioItem.innerHTML = `<h3>${ex.exercicio} (${grupoFmt})</h3><p class="details">Séries: ${ex.series} | Repetições: ${ex.repeticoes}</p>${ex.tecnica ? `<span class="technique" title="${tecnicaDescricao}">Técnica: <strong>${ex.tecnica}</strong></span>` : ''}<button class="remove-btn" onclick="removerExercicio(${ex.id})">×</button>`;
            listaExerciciosDiv.appendChild(exercicioItem);
            exerciciosProcessados.add(ex.id);
        }
    });
}

function removerExercicio(exercicioId) {
    exerciciosAdicionados = exerciciosAdicionados.filter(ex => ex.id !== exercicioId);
    if (modoAgrupamento.ativo) { modoAgrupamento.ativo = false; alert("Modo de agrupamento cancelado."); }
    atualizarListaExercicios();
    atualizarContadorExercicios();
    if (exerciciosAdicionados.length === 0) { document.getElementById("pdf-section").style.display = "none"; }
}

function removerExercicioDoGrupo(grupoId) {
    exerciciosAdicionados = exerciciosAdicionados.filter(ex => ex.grupoTecnicaId !== grupoId);
    if (modoAgrupamento.ativo && modoAgrupamento.grupoId === grupoId) { modoAgrupamento.ativo = false; alert("Grupo cancelado e removido."); }
    atualizarListaExercicios();
    atualizarContadorExercicios();
    if (exerciciosAdicionados.length === 0) { document.getElementById("pdf-section").style.display = "none"; }
}

function preencherFichaComDadosDaIA(plano) {
    // Validação robusta para garantir que o plano e a estrutura estão corretos
    if (!plano || !plano.dias_treino || !Array.isArray(plano.dias_treino)) {
        alert('A IA retornou um formato de treino inválido. Por favor, tente novamente.');
        console.error("Formato inválido recebido da IA:", plano);
        return;
    }

    // 1. Limpa a ficha atual para receber os novos dados
    limparDadosFicha();

    // 2. Preenche os dados principais da ficha
    const nomeDaFicha = plano.nome_ficha || 'Treino Gerado por IA';
    document.getElementById('nome-ficha').value = nomeDaFicha;
    document.getElementById('dados-ficha-section').style.display = 'block';
    document.getElementById('adicionar-exercicio-section').style.display = 'block';
    document.getElementById('ficha-atual-section').style.display = 'block';
    document.getElementById('modo-edicao').textContent = '(Gerado por IA)';
    document.getElementById('nome-ficha-atual').textContent = `- ${nomeDaFicha}`;

    // 3. A MÁGICA ACONTECE AQUI: Itera sobre TODOS os dias e TODOS os exercícios
    plano.dias_treino.forEach(dia => {
        // Verifica se o dia tem a estrutura correta
        if (dia.exercicios && Array.isArray(dia.exercicios)) {
            dia.exercicios.forEach(ex => {
                // Cria um objeto de exercício para cada um encontrado no JSON
                const novoExercicio = {
                    id: Date.now() + Math.random(), // ID único para evitar conflitos
                    grupoMuscular: dia.grupo_muscular || 'Não especificado',
                    exercicio: ex.nome,
                    series: parseInt(ex.series) || 3,
                    repeticoes: ex.repeticoes || '10-12',
                    tecnica: ex.tecnica_avancada || 'Nenhuma',
                    grupoTecnicaId: null
                };
                // Adiciona o exercício à nossa lista global
                exerciciosAdicionados.push(novoExercicio);
            });
        }
    });

    // 4. Atualiza a interface para mostrar TODOS os exercícios adicionados
    atualizarListaExercicios();
    atualizarContadorExercicios();
    document.getElementById("pdf-section").style.display = "block";
    
    alert('Ficha de treino completa preenchida com sucesso pela IA!');
}

function atualizarContadorExercicios() { document.querySelector(".counter").textContent = `${exerciciosAdicionados.length} exercício(s) adicionado(s)`; }

// --- FUNÇÕES DE INTEGRAÇÃO COM SUPABASE ---
async function popularAlunosSelect() { const selectAluno = document.getElementById('select-aluno'); selectAluno.innerHTML = '<option value="">Carregando...</option>'; const { data: clients, error } = await _supabase.from('clients').select('id, nome').not('credencial', 'is', null).order('nome', { ascending: true }); if (error) { console.error('Erro ao buscar alunos:', error); selectAluno.innerHTML = '<option value="">Erro ao carregar alunos</option>'; return; } selectAluno.innerHTML = '<option value="">Selecione um aluno</option>'; clients.forEach(client => { const option = document.createElement('option'); option.value = client.id; option.textContent = client.nome; selectAluno.appendChild(option); }); }

async function popularFichasExistentes(alunoId) {
    const listaFichasDiv = document.getElementById('lista-fichas-existentes');
    listaFichasDiv.innerHTML = '<div class="loading"></div>';

    if (!alunoId) {
        listaFichasDiv.innerHTML = '<p>Selecione um aluno para ver as fichas.</p>';
        return;
    }
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        alert('Sessão expirada. Faça login novamente.');
        listaFichasDiv.innerHTML = '<p>Sessão inválida.</p>';
        return;
    }
    const personalId = user.id;
    const { data: workoutPlans, error } = await _supabase
    .from('planos_de_treino')
    .select('id, name, data_troca, exercicios')
    .eq('user_id', alunoId)       // CONDIÇÃO 1: A ficha é deste aluno...
    .eq('created_by', personalId) // CONDIÇÃO 2: ...E foi criada por este personal.
    .order('data_troca', { ascending: false });

    if (error) {
        console.error('Erro ao buscar fichas existentes:', error);
        listaFichasDiv.innerHTML = '<p>Erro ao carregar as fichas.</p>';
        return;
    }

    if (workoutPlans.length === 0) {
        listaFichasDiv.innerHTML = '<p style="text-align: center; padding: 1rem 0;">Nenhuma ficha encontrada para este aluno.</p>';
        return;
    }

    listaFichasDiv.innerHTML = '';
    const fichasContainer = document.createElement('div');
    fichasContainer.className = 'fichas-container';

    workoutPlans.forEach(plan => {
        const fichaItem = document.createElement('div');
        fichaItem.className = 'ficha-item';
        fichaItem.dataset.plan = JSON.stringify(plan);

        const dataFormatada = new Date(plan.data_troca).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const numExercicios = plan.exercicios ? plan.exercicios.length : 0;

        fichaItem.innerHTML = `
            <div class="ficha-info">
                <h4>${plan.name}</h4>
                <p>Data: ${dataFormatada} | ${numExercicios} exercício(s)</p>
            </div>
        `;
        fichasContainer.appendChild(fichaItem);
    });

    listaFichasDiv.appendChild(fichasContainer);
}

async function salvarFichaOnline() {
    if (!currentAlunoId) { alert('ERRO CRÍTICO: O ID do aluno é nulo. Por favor, selecione o aluno novamente.'); return; }
    if (exerciciosAdicionados.length === 0) { alert('Por favor, adicione pelo menos um exercício à ficha.'); return; }
    const loading = document.getElementById("loading");
    loading.style.display = 'block';
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) { alert('Você precisa estar logado para salvar a ficha.'); loading.style.display = 'none'; return; }
    const fichaData = { user_id: currentAlunoId, name: document.getElementById('nome-ficha').value.trim(), data_troca: document.getElementById('data-troca').value, observacoes: document.getElementById('observacoes-aluno').value, exercicios: exerciciosAdicionados, created_by: user.id };
    let result;
    if (currentWorkoutPlanId) {
        result = await _supabase.from('planos_de_treino').update(fichaData).eq('id', currentWorkoutPlanId).select();
    } else {
        result = await _supabase.from('planos_de_treino').insert(fichaData).select();
    }
    loading.style.display = 'none';
    if (result.error) {
        console.error('Erro ao salvar/atualizar a ficha online:', result.error);
        alert('Ocorreu um erro ao salvar/atualizar a ficha online. Detalhes: ' + result.error.message);
    } else {
        alert('Ficha salva/atualizada com sucesso!');
        if (!currentWorkoutPlanId && result.data && result.data.length > 0) {
            currentWorkoutPlanId = result.data[0].id;
        }
        popularFichasExistentes(currentAlunoId);
        document.getElementById('modo-edicao').textContent = '(Editando)';
        document.getElementById('nome-ficha-atual').textContent = `- ${fichaData.name}`;
    }
}

// --- FUNÇÕES DE GERAÇÃO DE PDF ---
async function gerarPDF() {
    const nomeAluno = document.getElementById('select-aluno').options[document.getElementById('select-aluno').selectedIndex].textContent;
    const nomeFicha = document.getElementById('nome-ficha').value;
    const dataTroca = document.getElementById('data-troca').value;
    const observacoes = document.getElementById('observacoes-aluno').value;
    if (!nomeAluno || !nomeFicha || !dataTroca || exerciciosAdicionados.length === 0) { alert('Por favor, preencha todos os campos e adicione exercícios antes de gerar o PDF.'); return; }
    const docDefinition = { pageMargins: [40, 40, 40, 40], content: [ { text: 'FICHA DE TREINO', style: 'header' }, { text: `Aluno: ${nomeAluno}`, style: 'subheader' }, { text: `Ficha: ${nomeFicha}`, style: 'subheader' }, { text: `Data de Troca: ${new Date(dataTroca).toLocaleDateString('pt-BR')}`, style: 'subheader' }, observacoes ? { text: `Observações: ${observacoes}`, style: 'observacoes' } : null, { text: ' ', margin: [0, 10] }, { text: 'EXERCÍCIOS', style: 'sectionHeader' }, { text: ' ', margin: [0, 5] }, ], styles: { header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10], color: '#2f3e5c' }, subheader: { fontSize: 12, bold: true, margin: [0, 5, 0, 0], color: '#4a5e7a' }, observacoes: { fontSize: 10, italics: true, margin: [0, 5, 0, 10], color: '#6c757d' }, sectionHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5], color: '#2f3e5c', decoration: 'underline' }, exerciseName: { fontSize: 12, bold: true, margin: [0, 8, 0, 2], color: '#007bff' }, exerciseDetails: { fontSize: 10, margin: [0, 0, 0, 2], color: '#333' }, technique: { fontSize: 9, italics: true, color: '#555', margin: [0, 0, 0, 5] }, groupHeader: { fontSize: 14, bold: true, color: '#ffffff', background: '#ff9800', padding: 5, margin: [0, 10, 0, 5], alignment: 'center' }, groupExercise: { margin: [10, 5, 0, 5] } }, defaultStyle: { font: 'Roboto' } };
    const exerciciosProcessados = new Set();
    exerciciosAdicionados.forEach(ex => {
        if (exerciciosProcessados.has(ex.id)) return;
        if (ex.grupoTecnicaId) {
            const grupoExercicios = exerciciosAdicionados.filter(e => e.grupoTecnicaId === ex.grupoTecnicaId);
            docDefinition.content.push({ text: ex.tecnica.toUpperCase(), style: 'groupHeader' });
            grupoExercicios.forEach(exGrupo => {
                docDefinition.content.push({ stack: [ { text: `${exGrupo.exercicio} ${formatGrupoForPDF(exGrupo.grupoMuscular)}`, style: 'exerciseName' }, { text: `Séries: ${exGrupo.series} | Repetições: ${exGrupo.repeticoes}`, style: 'exerciseDetails' } ], style: 'groupExercise' });
                exerciciosProcessados.add(exGrupo.id);
            });
        } else {
            const tecnicaDescricao = ex.tecnica ? (tecnicasDescricoes[ex.tecnica] || '') : '';
            docDefinition.content.push({ text: `${ex.exercicio} ${formatGrupoForPDF(ex.grupoMuscular)}`, style: 'exerciseName' }, { text: `Séries: ${ex.series} | Repetições: ${ex.repeticoes}`, style: 'exerciseDetails' }, ex.tecnica ? { text: `Técnica: ${ex.tecnica} - ${tecnicaDescricao}`, style: 'technique' } : null);
            exerciciosProcessados.add(ex.id);
        }
    });
    pdfMake.fonts = { Roboto: { normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf', bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf', italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf', bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf' } };
    pdfMake.createPdf(docDefinition ).download(`Ficha_${nomeAluno.replace(/\s/g, '_')}_${nomeFicha.replace(/\s/g, '_')}.pdf`);
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', async () => {
    await popularAlunosSelect();
    // NO ARQUIVO: criar_ficha_script.js (dentro do DOMContentLoaded)

// Versão corrigida
try {
    exerciciosPorGrupo = await carregarExerciciosDoSite();
    if (!exerciciosPorGrupo) {
        // Se o carregamento falhou, exerciciosPorGrupo será null.
        // Atribuímos um objeto vazio e avisamos o usuário.
        exerciciosPorGrupo = {};
        alert('Aviso: A lista de exercícios online não pôde ser carregada. Você não conseguirá selecionar exercícios para a ficha. Verifique sua conexão ou tente mais tarde.');
    }
} catch (e) {
    console.error("Erro crítico ao inicializar exercícios:", e);
    exerciciosPorGrupo = {};
    alert('Um erro crítico impediu o carregamento da lista de exercícios.');
}

const btnGerarIA = document.getElementById('btn-gerar-com-ia');
    if (btnGerarIA) {
        btnGerarIA.addEventListener('click', async () => {
            const promptDoPersonal = document.getElementById('ia-prompt').value;
            if (!promptDoPersonal.trim()) {
                alert('Por favor, descreva o treino que você deseja criar.');
                return;
            }
            if (!currentAlunoId) {
                alert('Por favor, selecione um aluno antes de gerar um treino.');
                return;
            }

            // Chama a função da IA
            const planoDeTreino = await gerarTreinoComIA(promptDoPersonal);

            // Se a IA retornou um plano válido, vamos processá-lo
           if (planoDeTreino) {
    preencherFichaComDadosDaIA(planoDeTreino);
}
        });
    }

    document.getElementById('select-aluno').addEventListener('change', async (event) => {
        currentAlunoId = event.target.value;
        limparDadosFicha();
        document.getElementById('dados-ficha-section').style.display = 'none';
        document.getElementById('adicionar-exercicio-section').style.display = 'none';
        document.getElementById('ficha-atual-section').style.display = 'none';
        if (currentAlunoId) {
            await popularFichasExistentes(currentAlunoId);
            document.getElementById('fichas-existentes-section').style.display = 'block';
        } else {
            document.getElementById('fichas-existentes-section').style.display = 'none';
        }
    });

    document.getElementById('grupo-muscular').addEventListener('change', (event) => {
        const grupoSelecionado = event.target.value;
        const exercicioSelect = document.getElementById('exercicio');
        exercicioSelect.innerHTML = '<option value="">Selecione o exercício</option>';
        exercicioSelect.disabled = true;
        if (grupoSelecionado && exerciciosPorGrupo[grupoSelecionado]) {
            exerciciosPorGrupo[grupoSelecionado].forEach(ex => {
                const option = document.createElement('option');
                option.value = ex;
                option.textContent = ex;
                exercicioSelect.appendChild(option);
            });
            exercicioSelect.disabled = false;
        }
    });

    document.addEventListener('click', (event) => {
        const fichaItemClicado = event.target.closest('.ficha-item');
        if (fichaItemClicado) {
            document.querySelectorAll('.ficha-item').forEach(item => item.classList.remove('selected'));
            fichaItemClicado.classList.add('selected');
            fichaSelecionada = JSON.parse(fichaItemClicado.dataset.plan);
            document.getElementById('btn-editar-ficha').disabled = false;
            return;
        }
        if (event.target.closest('#btn-editar-ficha')) {
            if (!event.target.closest('#btn-editar-ficha').disabled) {
                if (fichaSelecionada) {
                    iniciarEdicaoFicha(fichaSelecionada.id);
                } else {
                    alert('Por favor, selecione uma ficha para editar.');
                }
            }
        } else if (event.target.closest('#btn-nova-ficha')) {
            iniciarNovaFicha();
        } else if (event.target.closest('#btn-salvar-ficha')) {
            salvarFichaOnline();
        } else if (event.target.closest('#btn-gerar-pdf')) {
            gerarPDF();
        } else if (event.target.closest('.add-exercise-btn[onclick="adicionarExercicio()"]')) {
            adicionarExercicio();
        } else if (event.target.closest('#btn-cancelar-edicao')) {
            document.getElementById('dados-ficha-section').style.display = 'none';
            document.getElementById('adicionar-exercicio-section').style.display = 'none';
            document.getElementById('ficha-atual-section').style.display = 'none';
            document.querySelectorAll('.ficha-item').forEach(item => item.classList.remove('selected'));
            document.getElementById('btn-editar-ficha').disabled = true;
            limparDadosFicha();
        }
    });
});
