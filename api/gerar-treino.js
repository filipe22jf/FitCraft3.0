// Arquivo: /api/gerar-treino.js

// ARQUIVO /api/gerar-treino.js CORRIGIDO

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // --- INÍCIO DA MODIFICAÇÃO 1 ---
        // Agora, apenas o promptDoPersonal é obrigatório.
        const { promptDoPersonal, listaFormatada } = request.body;

        if (!promptDoPersonal) {
            return response.status(400).json({ error: { message: 'O campo promptDoPersonal é obrigatório.' } });
        }
        // --- FIM DA MODIFICAÇÃO 1 ---

        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        // --- INÍCIO DA MODIFICAÇÃO 2 ---
        // Monta a parte da lista de exercícios APENAS se ela foi enviada e não está vazia.
        const secaoListaDeExercicios = (listaFormatada && listaFormatada.trim() !== "")
            ? `LISTA DE EXERCÍCIOS DISPONÍVEIS:\n${listaFormatada}`
            : "Use exercícios de musculação comuns e populares."; // Fallback caso a lista esteja vazia
        // --- FIM DA MODIFICAÇÃO 2 ---
        
        const promptDeSistema = `Você é um personal trainer de elite, especialista em criar treinos de musculação eficazes e seguros.
Sua tarefa é criar um plano de treino completo baseado nas instruções do usuário.

REGRAS OBRIGATÓRIAS:
1.  Sua resposta final deve ser APENAS o código JSON, sem nenhuma palavra, explicação ou comentário antes ou depois.
2.  A estrutura do JSON deve ser exatamente esta:
    {
      "nome_ficha": "Nome do Treino Sugerido pela IA",
      "dias_treino": [
        {
          "dia": "A",
          "grupo_muscular": "Peito e Tríceps",
          "exercicios": [
            { "nome": "Supino Reto", "series": "4", "repeticoes": "8-12", "tecnica_avancada": "Nenhuma" }
          ]
        }
      ]
    }

${secaoListaDeExercicios}
        `;
        const promptDoUsuario = `Com base nas regras, crie o seguinte treino: ${promptDoPersonal}`;

        const responseApi = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'system', content: promptDeSistema }, { role: 'user', content: promptDoUsuario }],
                response_format: { "type": "json_object" }
            } )
        });

        if (!responseApi.ok) {
            const errorBody = await responseApi.json();
            console.error("Erro da API da OpenAI:", errorBody);
            return response.status(responseApi.status).json(errorBody);
        }

        const data = await responseApi.json();
        const planoDeTreino = JSON.parse(data.choices[0].message.content);

        return response.status(200).json(planoDeTreino);

    } catch (error) {
        console.error("Erro interno do servidor:", error);
        return response.status(500).json({ error: { message: error.message } });
    }
}


