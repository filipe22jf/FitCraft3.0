// ===== VARIÁVEIS GLOBAIS =====
let exerciciosAdicionados = [];
let contadorExercicios = 0;
let exerciciosPorGrupo = {};
let exerciciosGifMap = {};
let currentWorkoutPlanId = null;
let currentAlunoId = null;
let fichaSelecionada = null;

// ===== CARREGAR EXERCÍCIOS COM GIFS =====
async function carregarExerciciosComGifs() {
    try {
        const resp = await fetch('https://exercicios-mauve.vercel.app/gif_index.json');
        if (!resp.ok) throw new Error(`Erro: ${resp.status}`);
        
        const data = await resp.json();
        if (!Array.isArray(data)) {
            console.error('Dados inválidos');
            return null;
        }

        const mapa = {
            peitoral: [], dorsais: [], ombros: [], biceps: [], triceps: [],
            quadriceps: [], posteriores_de_coxa: [], gluteos: [], panturrilhas: [],
            trapezio: [], eretores_da_espinha: [], cardio_academia: [], abdomen: [], antebracos: []
        };

        exerciciosGifMap = {};

        data.forEach(item => {
            const cat = (item.category || '').toLowerCase();
            const nome = item.name || '';
            if (!nome) return;

            exerciciosGifMap[nome] = {
                path: item.path,
                category: item.category
            };

            if (cat.includes('peitoral')) mapa.peitoral.push(nome);
            else if (cat.includes('costas') || cat.includes('dorsais')) mapa.dorsais.push(nome);
            else if (cat.includes('ombros')) mapa.ombros.push(nome);
            else if (cat.includes('bíceps') || cat.includes('biceps')) mapa.biceps.push(nome);
            else if (cat.includes('tríceps') || cat.includes('triceps')) mapa.triceps.push(nome);
            else if (cat.includes('pernas')) {
                const n = nome.toLowerCase();
                const quadKeys = ['extensor', 'extensora', 'agach', 'leg press', 'passada', 'afundo'];
                const postKeys = ['flexor', 'flexora', 'stiff', 'levantamento terra', 'romeno'];
                if (postKeys.some(k => n.includes(k))) mapa.posteriores_de_coxa.push(nome);
                else if (quadKeys.some(k => n.includes(k))) mapa.quadriceps.push(nome);
                else mapa.quadriceps.push(nome);
            }
            else if (cat.includes('glúteos') || cat.includes('gluteos')) mapa.gluteos.push(nome);
            else if (cat.includes('panturr')) mapa.panturrilhas.push(nome);
            else if (cat.includes('trapézio') || cat.includes('trapezio')) mapa.trapezio.push(nome);
            else if (cat.includes('eretores')) mapa.eretores_da_espinha.push(nome);
            else if (cat.includes('cardio')) mapa.cardio_academia.push(nome);
            else if (cat.includes('abdômen') || cat.includes('abdomen')) mapa.abdomen.push(nome);
            else if (cat.includes('antebra')) mapa.antebracos.push(nome);
        });

        Object.keys(mapa).forEach(k => {
            mapa[k] = Array.from(new Set(mapa[k])).sort((a, b) => a.localeCompare(b, 'pt-BR'));
        });

        return mapa;

    } catch (e) {
        console.error('Erro ao carregar exercícios:', e);
        return null;
    }
}

// ===== MOSTRAR PREVIEW DO GIF =====
function mostrarPreviewGif(nomeExercicio) {
    const preview = document.getElementById('exercise-preview');
    const gifElement = document.getElementById('preview-gif');
    const nomeElement = document.getElementById('preview-nome');
    const grupoElement = document.getElementById('preview-grupo');

    if (exerciciosGifMap[nomeExercicio]) {
        const gifUrl = 'https://gifs.fitcraft.com.br' + exerciciosGifMap[nomeExercicio].path;
        gifElement.src = gifUrl;
        nomeElement.textContent = nomeExercicio;
        grupoElement.textContent = exerciciosGifMap[nomeExercicio].category;
        preview.classList.add('active');
    } else {
        preview.classList.remove('active');
    }
}

// ===== ADICIONAR EXERCÍCIO =====
function adicionarExercicio() {
    const nomeFicha = document.getElementById("nome-ficha").value.trim();
    const dataTroca = document.getElementById("data-troca").value;
    const grupoSel = document.getElementById("grupo-muscular");
    const exercicioNome = document.getElementById("exercicio").value;
    const series = document.getElementById("series").value;
    const repeticoes = document.getElementById("repeticoes").value;
    const tecnica = document.getElementById("tecnica").value;
    const observacao = document.getElementById("observacao-exercicio").value.trim();

    if (!nomeFicha || !dataTroca) {
        alert("Preencha nome e data da ficha!");
        return;
    }
    if (!exercicioNome || !series || !repeticoes) {
        alert("Preencha todos os campos obrigatórios!");
        return;
    }

    const novoExercicio = {
        id: Date.now(),
        grupoMuscular: grupoSel.options[grupoSel.selectedIndex]?.text || "",
        exercicio: exercicioNome,
        series: parseInt(series),
        repeticoes: repeticoes,
        tecnica: tecnica || null,
        observacao: observacao || null,
        gifUrl: exerciciosGifMap[exercicioNome]?.path || null,
        grupoTecnicaId: null
    };

    exerciciosAdicionados.push(novoExercicio);
    contadorExercicios = exerciciosAdicionados.length;
    
    atualizarListaExercicios();
    atualizarContadorExercicios();
    document.getElementById("pdf-section").style.display = "block";

    document.getElementById("grupo-muscular").value = "";
    document.getElementById("exercicio").value = "";
    document.getElementById("exercicio").disabled = true;
    document.getElementById("series").value = "3";
    document.getElementById("repeticoes").value = "12";
    document.getElementById("tecnica").value = "";
    document.getElementById("observacao-exercicio").value = "";
    document.getElementById('exercise-preview').classList.remove('active');
}

// ===== ATUALIZAR LISTA =====
function atualizarListaExercicios() {
    const lista = document.getElementById("lista-exercicios");
    lista.innerHTML = "";

    if (exerciciosAdicionados.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-dim);">
                <div style="font-size: 48px; margin-bottom: 1rem;">📋</div>
                <strong>Nenhum exercício adicionado</strong>
            </div>`;
        return;
    }

    exerciciosAdicionados.forEach((ex) => {
        const item = document.createElement("div");
        item.className = "exercise-item";

        const gifUrl = ex.gifUrl ? `https://gifs.fitcraft.com.br${ex.gifUrl}` : '';
        
        item.innerHTML = `
            ${gifUrl ? `<div class="exercise-item-gif"><img src="${gifUrl}" alt="${ex.exercicio}"></div>` : ''}
            <div class="exercise-item-content">
                <h3>${ex.exercicio} <span style="color: var(--text-dim); font-size: 0.9rem;">(${ex.grupoMuscular})</span></h3>
                <p class="details">Séries: ${ex.series} | Repetições: ${ex.repeticoes}${ex.tecnica ? ` | Técnica: ${ex.tecnica}` : ''}</p>
                ${ex.observacao ? `<div class="observacao"><strong>Obs:</strong> ${ex.observacao}</div>` : ''}
            </div>
            <button class="remove-btn" onclick="removerExercicio(${ex.id})">×</button>
        `;
        
        lista.appendChild(item);
    });
}

// ===== REMOVER EXERCÍCIO =====
function removerExercicio(id) {
    exerciciosAdicionados = exerciciosAdicionados.filter(ex => ex.id !== id);
    atualizarListaExercicios();
    atualizarContadorExercicios();
    if (exerciciosAdicionados.length === 0) {
        document.getElementById("pdf-section").style.display = "none";
    }
}

// ===== ATUALIZAR CONTADOR =====
function atualizarContadorExercicios() {
    document.querySelector(".counter").textContent = `${exerciciosAdicionados.length} exercício(s) adicionado(s)`;
}

// ===== LIMPAR DADOS =====
function limparDadosFicha() {
    currentWorkoutPlanId = null;
    fichaSelecionada = null;
    exerciciosAdicionados = [];
    contadorExercicios = 0;
    document.getElementById('nome-ficha').value = '';
    document.getElementById('data-troca').value = new Date().toISOString().split('T')[0];
    document.getElementById('observacoes-aluno').value = '';
    atualizarListaExercicios();
    atualizarContadorExercicios();
    document.getElementById("pdf-section").style.display = "none";
}

// ===== NOVA FICHA =====
function iniciarNovaFicha() {
    if (!currentAlunoId) {
        alert("Selecione um aluno primeiro!");
        return;
    }
    limparDadosFicha();
    document.getElementById('dados-ficha-section').style.display = 'block';
    document.getElementById('adicionar-exercicio-section').style.display = 'block';
    document.getElementById('ficha-atual-section').style.display = 'block';
    document.getElementById('modo-edicao').textContent = '(Nova Ficha)';
    document.getElementById('nome-ficha-atual').textContent = '';
    document.querySelectorAll('.ficha-item').forEach(item => item.classList.remove('selected'));
    document.getElementById('btn-editar-ficha').disabled = true;
}

// ===== EDITAR FICHA =====
async function iniciarEdicaoFicha(fichaId) {
    if (!currentAlunoId) {
        alert("Erro: Aluno não selecionado");
        return;
    }
    
    const loading = document.getElementById("loading");
    loading.style.display = 'flex';
    
    const { data: workoutPlan, error } = await _supabase
        .from('planos_de_treino')
        .select('*')
        .eq('id', fichaId)
        .single();
    
    loading.style.display = 'none';
    
    if (error || !workoutPlan) {
        console.error('Erro ao carregar ficha:', error);
        alert('Erro ao carregar ficha');
        return;
    }
    
    currentWorkoutPlanId = workoutPlan.id;
    fichaSelecionada = workoutPlan;
    document.getElementById('nome-ficha').value = workoutPlan.name;
    document.getElementById('data-troca').value = workoutPlan.data_troca;
    document.getElementById('observacoes-aluno').value = workoutPlan.observacoes || '';
    exerciciosAdicionados = workoutPlan.exercicios || [];
    contadorExercicios = exerciciosAdicionados.length;
    
    document.getElementById('dados-ficha-section').style.display = 'block';
    document.getElementById('adicionar-exercicio-section').style.display = 'block';
    document.getElementById('ficha-atual-section').style.display = 'block';
    document.getElementById('modo-edicao').textContent = '(Editando)';
    document.getElementById('nome-ficha-atual').textContent = `- ${workoutPlan.name}`;
    
    atualizarListaExercicios();
    atualizarContadorExercicios();
    document.getElementById("pdf-section").style.display = "block";
}

// ===== POPULAR ALUNOS =====
async function popularAlunosSelect() {
    const select = document.getElementById('select-aluno');
    select.innerHTML = '<option value="">Carregando...</option>';
    
    const { data: clients, error } = await _supabase
        .from('clients')
        .select('id, nome')
        .not('credencial', 'is', null)
        .order('nome', { ascending: true});
    
    if (error || !clients || clients.length === 0) {
        select.innerHTML = '<option value="">Nenhum aluno encontrado</option>';
        return;
    }
    
    select.innerHTML = '<option value="">Selecione um aluno</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.nome;
        select.appendChild(option);
    });
}

// ===== POPULAR FICHAS =====
async function popularFichasExistentes(alunoId) {
    const lista = document.getElementById('lista-fichas-existentes');
    lista.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    if (!alunoId) {
        lista.innerHTML = '<p>Selecione um aluno</p>';
        return;
    }

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        lista.innerHTML = '<p>Sessão inválida</p>';
        return;
    }

    const { data: plans, error } = await _supabase
        .from('planos_de_treino')
        .select('id, name, data_troca, exercicios')
        .eq('user_id', alunoId)
        .eq('created_by', user.id)
        .order('data_troca', { ascending: false });

    if (error || !plans || plans.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 1rem;">Nenhuma ficha encontrada</p>';
        return;
    }

    const container = document.createElement('div');
    container.className = 'fichas-container';

    plans.forEach(plan => {
        const item = document.createElement('div');
        item.className = 'ficha-item';
        item.dataset.plan = JSON.stringify(plan);
        
        const data = new Date(plan.data_troca).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        const numEx = plan.exercicios ? plan.exercicios.length : 0;

        item.innerHTML = `
            <div>
                <h4>${plan.name}</h4>
                <p>Data: ${data} | ${numEx} exercício(s)</p>
            </div>
            <button class="delete-ficha-btn" data-ficha-id="${plan.id}" data-ficha-nome="${plan.name}">×</button>
        `;
        
        container.appendChild(item);
    });

    lista.innerHTML = '';
    lista.appendChild(container);
}

// ===== SALVAR FICHA =====
async function salvarFichaOnline() {
    if (!currentAlunoId || exerciciosAdicionados.length === 0) {
        alert('Selecione um aluno e adicione exercícios!');
        return;
    }

    const loading = document.getElementById("loading");
    loading.style.display = 'flex';

    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        alert('Sessão expirada. Faça login novamente.');
        loading.style.display = 'none';
        return;
    }
    
    const fichaData = {
        user_id: currentAlunoId,
        name: document.getElementById('nome-ficha').value.trim(),
        data_troca: document.getElementById('data-troca').value,
        observacoes: document.getElementById('observacoes-aluno').value,
        exercicios: exerciciosAdicionados,
        created_by: user.id
    };

    let result;
    if (currentWorkoutPlanId) {
        result = await _supabase.from('planos_de_treino').update(fichaData).eq('id', currentWorkoutPlanId).select();
    } else {
        result = await _supabase.from('planos_de_treino').insert(fichaData).select();
    }

    loading.style.display = 'none';

    if (result.error) {
        alert('Erro ao salvar: ' + result.error.message);
    } else {
        alert('Ficha salva com sucesso!');
        if (!currentWorkoutPlanId && result.data?.[0]) {
            currentWorkoutPlanId = result.data[0].id;
        }
        popularFichasExistentes(currentAlunoId);
        document.getElementById('modo-edicao').textContent = '(Editando)';
        document.getElementById('nome-ficha-atual').textContent = `- ${fichaData.name}`;
    }
}

// ===== DELETAR FICHA =====
async function deletarFicha(fichaId, fichaNome) {
    const confirmacao = confirm(`Deletar a ficha "${fichaNome}"? Esta ação não pode ser desfeita.`);
    if (!confirmacao) return;

    const loading = document.getElementById("loading");
    if (loading) loading.style.display = 'flex';

    try {
        const { data, error } = await _supabase
            .from('planos_de_treino')
            .delete()
            .eq('id', fichaId)
            .select();

        if (loading) loading.style.display = 'none';

        if (error) {
            alert(`Erro ao deletar: ${error.message}`);
        } else if (data && data.length === 0) {
            alert('A ficha não pôde ser deletada. Verifique suas permissões.');
        } else {
            alert(`Ficha "${fichaNome}" deletada com sucesso!`);
            if (currentAlunoId) {
                await popularFichasExistentes(currentAlunoId);
            }
        }
    } catch (err) {
        if (loading) loading.style.display = 'none';
        console.error("Erro inesperado:", err);
        alert("Erro inesperado ao deletar.");
    }
}

// ===== GERAR PDF =====
async function gerarPDF() {
    const nomeAluno = document.getElementById('select-aluno').options[document.getElementById('select-aluno').selectedIndex].textContent;
    const nomeFicha = document.getElementById('nome-ficha').value;
    const dataTroca = document.getElementById('data-troca').value;
    const observacoes = document.getElementById('observacoes-aluno').value;
    
    if (!nomeAluno || !nomeFicha || !dataTroca || exerciciosAdicionados.length === 0) {
        alert('Preencha todos os campos e adicione exercícios antes de gerar o PDF.');
        return;
    }

    const docDefinition = {
        pageMargins: [40, 40, 40, 40],
        content: [
            { text: 'FICHA DE TREINO', style: 'header' },
            { text: `Aluno: ${nomeAluno}`, style: 'subheader' },
            { text: `Ficha: ${nomeFicha}`, style: 'subheader' },
            { text: `Data de Troca: ${new Date(dataTroca).toLocaleDateString('pt-BR')}`, style: 'subheader' },
            observacoes ? { text: `Observações: ${observacoes}`, style: 'observacoes' } : null,
            { text: ' ', margin: [0, 10] },
            { text: 'EXERCÍCIOS', style: 'sectionHeader' },
            { text: ' ', margin: [0, 5] },
        ],
        styles: {
            header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10], color: '#2f3e5c' },
            subheader: { fontSize: 12, bold: true, margin: [0, 5, 0, 0], color: '#4a5e7a' },
            observacoes: { fontSize: 10, italics: true, margin: [0, 5, 0, 10], color: '#6c757d' },
            sectionHeader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5], color: '#2f3e5c', decoration: 'underline' },
            exerciseName: { fontSize: 12, bold: true, margin: [0, 8, 0, 2], color: '#007bff' },
            exerciseDetails: { fontSize: 10, margin: [0, 0, 0, 2], color: '#333' },
            observacaoEx: { fontSize: 9, italics: true, color: '#0099cc', margin: [0, 0, 0, 5] }
        },
        defaultStyle: { font: 'Roboto' }
    };

    exerciciosAdicionados.forEach(ex => {
        docDefinition.content.push(
            { text: `${ex.exercicio} (${ex.grupoMuscular})`, style: 'exerciseName' },
            { text: `Séries: ${ex.series} | Repetições: ${ex.repeticoes}${ex.tecnica ? ` | Técnica: ${ex.tecnica}` : ''}`, style: 'exerciseDetails' },
            ex.observacao ? { text: `Obs: ${ex.observacao}`, style: 'observacaoEx' } : null
        );
    });

    pdfMake.fonts = {
        Roboto: {
            normal: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf',
            bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf',
            italics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Italic.ttf',
            bolditalics: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-MediumItalic.ttf'
        }
    };

    pdfMake.createPdf(docDefinition).download(`Ficha_${nomeAluno.replace(/\s/g, '_')}_${nomeFicha.replace(/\s/g, '_')}.pdf`);
}

// ===== FUNÇÕES DA IA =====
function calcularSimilaridade(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    const track = Array(str2.length + 1).fill(null).map(() =>
        Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }
    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }
    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator,
            );
        }
    }
    const distance = track[str2.length][str1.length];
    const longerLength = Math.max(str1.length, str2.length);
    if (longerLength === 0) {
        return 1;
    }
    return (longerLength - distance) / longerLength;
}

async function gerarTreinoComIA(promptDoPersonal) {
    const loadingDiv = document.getElementById('ia-loading');
    if (loadingDiv) loadingDiv.style.display = 'block';

    try {
        // CHAMA SEU BACKEND VERCEL (igual ao antigo)
        const response = await fetch('/api/gerar-treino', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                promptDoPersonal: promptDoPersonal
            })
        });

        if (!response.ok) {
            // Lógica de erro do arquivo antigo
            let errorMessage = 'Erro desconhecido na API';
            try {
                const errorData = await response.json();
                if (errorData && errorData.error && errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            } catch (e) {
                errorMessage = `A API retornou um erro ${response.status} sem detalhes.`;
            }
            throw new Error(`Falha na API: ${errorMessage}`);
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

async function preencherFichaComDadosDaIA(plano) {
    if (!plano || !plano.dias_treino || !Array.isArray(plano.dias_treino)) {
        alert('A IA retornou um formato inválido. Tente novamente.');
        return;
    }

    const urlExercicios = 'https://exercicios-mauve.vercel.app/gif_index.json';
    const response = await fetch(urlExercicios);
    const bibliotecaExercicios = await response.json();

    limparDadosFicha();

    const nomeDaFicha = plano.nome_ficha || 'Treino Gerado por IA';
    document.getElementById('nome-ficha').value = nomeDaFicha;
    document.getElementById('dados-ficha-section').style.display = 'block';
    document.getElementById('adicionar-exercicio-section').style.display = 'block';
    document.getElementById('ficha-atual-section').style.display = 'block';
    document.getElementById('modo-edicao').textContent = '(Gerado por IA)';
    document.getElementById('nome-ficha-atual').textContent = `- ${nomeDaFicha}`;

    plano.dias_treino.forEach(dia => {
        if (dia.exercicios && Array.isArray(dia.exercicios)) {
            dia.exercicios.forEach(ex => {
                const nomeExercicioIA = ex.exercicio || ex.nome;
                if (!nomeExercicioIA || typeof nomeExercicioIA !== 'string') {
                    return;
                }

                let melhorCorrespondencia = null;
                let maiorSimilaridade = 0;
                const LIMITE_DE_SIMILARIDADE = 0.6;

                for (const item of bibliotecaExercicios) {
                    if (item && item.name) {
                        const similaridade = calcularSimilaridade(nomeExercicioIA, item.name);
                        if (similaridade > maiorSimilaridade) {
                            maiorSimilaridade = similaridade;
                            melhorCorrespondencia = item;
                        }
                    }
                }

                let exercicioFinal;
                let gifUrlFinal;

                if (maiorSimilaridade >= LIMITE_DE_SIMILARIDADE) {
                    exercicioFinal = melhorCorrespondencia.name;
                    gifUrlFinal = melhorCorrespondencia.path;
                } else {
                    exercicioFinal = nomeExercicioIA;
                    gifUrlFinal = null;
                }
                
                const novoExercicio = {
                    id: Date.now() + Math.random(),
                    grupoMuscular: dia.grupo_muscular || 'Não especificado',
                    exercicio: exercicioFinal,
                    series: parseInt(ex.series) || 3,
                    repeticoes: ex.repeticoes || '10-12',
                    tecnica: ex.tecnica_avancada || null,
                    observacao: null,
                    gifUrl: gifUrlFinal,
                    grupoTecnicaId: null
                };
                exerciciosAdicionados.push(novoExercicio);
            });
        }
    });

    atualizarListaExercicios();
    atualizarContadorExercicios();
    document.getElementById("pdf-section").style.display = "block";
    alert('Ficha gerada com sucesso pela IA!');
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async () => {
    await popularAlunosSelect();
    
    // Carregar exercícios
    exerciciosPorGrupo = await carregarExerciciosComGifs();
    if (!exerciciosPorGrupo) {
        exerciciosPorGrupo = {};
        alert('Erro ao carregar exercícios. Verifique sua conexão.');
    }

    // ===== BOTÃO DE GERAR COM IA =====
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

            const planoDeTreino = await gerarTreinoComIA(promptDoPersonal);
            if (planoDeTreino) {
                preencherFichaComDadosDaIA(planoDeTreino);
            }
        });
    }

    // ===== BOTÃO ADICIONAR EXERCÍCIO =====
    const btnAdicionarExercicio = document.getElementById('btn-adicionar-exercicio');
    if (btnAdicionarExercicio) {
        btnAdicionarExercicio.addEventListener('click', adicionarExercicio);
    }

    // ===== SELECT DE ALUNO =====
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

    // ===== SELECT DE GRUPO MUSCULAR =====
    document.getElementById('grupo-muscular').addEventListener('change', (event) => {
        const grupoSelecionado = event.target.value;
        const exercicioSelect = document.getElementById('exercicio');
        exercicioSelect.innerHTML = '<option value="">Selecione o exercício</option>';
        exercicioSelect.disabled = true;
        document.getElementById('exercise-preview').classList.remove('active');
        
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

    // ===== SELECT DE EXERCÍCIO - MOSTRAR GIF =====
    document.getElementById('exercicio').addEventListener('change', (event) => {
        const exercicio = event.target.value;
        if (exercicio) {
            mostrarPreviewGif(exercicio);
        } else {
            document.getElementById('exercise-preview').classList.remove('active');
        }
    });

    // ===== DELEGAÇÃO DE EVENTOS PARA BOTÕES E FICHAS =====
    document.addEventListener('click', (event) => {
        // Botão de deletar ficha
        const deleteBtnClicado = event.target.closest('.delete-ficha-btn');
        if (deleteBtnClicado) {
            event.stopPropagation();
            const fichaId = deleteBtnClicado.dataset.fichaId;
            const fichaNome = deleteBtnClicado.dataset.fichaNome;
            deletarFicha(fichaId, fichaNome);
            return;
        }

        // Clique em item da ficha (selecionar)
        const fichaItemClicado = event.target.closest('.ficha-item');
        if (fichaItemClicado) {
            document.querySelectorAll('.ficha-item').forEach(item => item.classList.remove('selected'));
            fichaItemClicado.classList.add('selected');
            fichaSelecionada = JSON.parse(fichaItemClicado.dataset.plan);
            document.getElementById('btn-editar-ficha').disabled = false;
            return;
        }

        // Botão Editar Ficha
        if (event.target.closest('#btn-editar-ficha')) {
            if (!event.target.closest('#btn-editar-ficha').disabled && fichaSelecionada) {
                iniciarEdicaoFicha(fichaSelecionada.id);
            }
        } 
        // Botão Nova Ficha
        else if (event.target.closest('#btn-nova-ficha')) {
            iniciarNovaFicha();
        } 
        // Botão Salvar Ficha
        else if (event.target.closest('#btn-salvar-ficha')) {
            salvarFichaOnline();
        } 
        // Botão Gerar PDF
        else if (event.target.closest('#btn-gerar-pdf')) {
            gerarPDF();
        } 
        // Botão Cancelar Edição
        else if (event.target.closest('#btn-cancelar-edicao')) {
            document.getElementById('dados-ficha-section').style.display = 'none';
            document.getElementById('adicionar-exercicio-section').style.display = 'none';
            document.getElementById('ficha-atual-section').style.display = 'none';
            document.querySelectorAll('.ficha-item').forEach(item => item.classList.remove('selected'));
            document.getElementById('btn-editar-ficha').disabled = true;
            limparDadosFicha();
        }
    });
});