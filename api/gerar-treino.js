// Arquivo: /api/gerar-treino.js

export default async function handler(request, response) {
    // Apenas permite requisições POST
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { promptDoPersonal, listaFormatada } = request.body;

        if (!promptDoPersonal || !listaFormatada) {
            return response.status(400).json({ error: 'Prompt ou lista de exercícios faltando.' });
        }

        // A chave secreta é lida das "Environment Variables" da Vercel
        const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

        
        const promptDeSistema = `Você é um personal trainer de elite, especialista em criar treinos de musculação eficazes e seguros.
Sua tarefa é criar um plano de treino completo baseado nas instruções do usuário.

REGRAS OBRIGATÓRIAS:
1.  Você DEVE usar única e exclusivamente os exercícios da lista fornecida abaixo. Não invente ou sugira nenhum exercício que não esteja nesta lista.
2.  Sua resposta final deve ser APENAS o código JSON, sem nenhuma palavra, explicação ou comentário antes ou depois.
3.  A estrutura do JSON deve ser exatamente esta:
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

LISTA DE EXERCÍCIOS DISPONÍVEIS:
${listaFormatada}
        `;
        const promptDoUsuario = `Com base nas regras e na lista de exercícios, crie o seguinte treino: ${promptDoPersonal}`;

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
            return response.status(responseApi.status).json(errorBody);
        }

        const data = await responseApi.json();
        const planoDeTreino = JSON.parse(data.choices[0].message.content);

        // Envia a resposta de volta para o frontend
        return response.status(200).json(planoDeTreino);

    } catch (error) {
        return response.status(500).json({ error: error.message });
    }

}

