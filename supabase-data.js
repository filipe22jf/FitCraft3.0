// supabase-data.js - Módulo atualizado com dados por usuário

window.fitCraftData = {
    supabase: null,

    init() {
        this.supabase = window._supabase;
        return this.supabase !== null;
    },

    async getCurrentUser() {
        if (!this.supabase) this.init();
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    },

    // Função para obter estatísticas reais do usuário
    async obterEstatisticas() {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            const userId = user.id;

            // Buscar clientes do usuário
            const { data: clients, error: clientsError } = await this.supabase
                .from('clients')
                .select('id, nome, credencial, created_at')
                .eq('user_id', userId);

            if (clientsError) throw clientsError;

            // Buscar fichas do usuário
            const { data: fichas, error: fichasError } = await this.supabase
                .from('fichas_treino')
                .select('id, nome, data_criacao, client_id')
                .eq('user_id', userId)
                .order('data_criacao', { ascending: false });

            if (fichasError) throw fichasError;

            // Calcular estatísticas
            const totalClientes = clients?.length || 0;
            const clientesAtivos = clients?.filter(client => client.credencial !== null).length || 0;
            const totalFichas = fichas?.length || 0;

            // Fichas deste mês
            const agora = new Date();
            const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
            const fichasEsteMes = fichas?.filter(ficha => 
                new Date(ficha.data_criacao) >= inicioMes
            ).length || 0;

            // Calcular crescimento
            const mesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
            const fimMesPassado = new Date(agora.getFullYear(), agora.getMonth(), 0);
            const fichasMesPassado = fichas?.filter(ficha => {
                const dataFicha = new Date(ficha.data_criacao);
                return dataFicha >= mesPassado && dataFicha <= fimMesPassado;
            }).length || 0;

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
                    crescimento
                }
            };

        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return {
                success: false,
                error: error.message,
                data: {
                    totalClientes: 0,
                    clientesAtivos: 0,
                    totalFichas: 0,
                    fichasEsteMes: 0,
                    crescimento: 0
                }
            };
        }
    },

    // Função para listar fichas com informações do cliente
    async listarFichasTreino(limite = null) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            let query = this.supabase
                .from('fichas_treino')
                .select(`
                    id,
                    nome,
                    data_criacao,
                    exercicios,
                    clients (
                        nome,
                        credencial
                    )
                `)
                .eq('user_id', user.id)
                .order('data_criacao', { ascending: false });

            if (limite) {
                query = query.limit(limite);
            }

            const { data, error } = await query;

            if (error) throw error;

            return {
                success: true,
                data: data || []
            };

        } catch (error) {
            console.error('Erro ao listar fichas:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },

    // Função para salvar ficha de treino
    async salvarFichaTreino(fichaData) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Adicionar user_id aos dados da ficha
            fichaData.user_id = user.id;

            const { data, error } = await this.supabase
                .from('fichas_treino')
                .insert([fichaData])
                .select();

            if (error) throw error;

            return {
                success: true,
                data: data[0]
            };

        } catch (error) {
            console.error('Erro ao salvar ficha:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Função para listar clientes
    async listarClientes() {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await this.supabase
                .from('clients')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: data || []
            };

        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    },

    // Função para salvar cliente
    async salvarCliente(clienteData) {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Adicionar user_id aos dados do cliente
            clienteData.user_id = user.id;

            const { data, error } = await this.supabase
                .from('clients')
                .insert([clienteData])
                .select();

            if (error) throw error;

            return {
                success: true,
                data: data[0]
            };

        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    // Função para obter dados do gráfico (últimos 7 dias)
    async obterDadosGrafico() {
        try {
            const user = await this.getCurrentUser();
            if (!user) throw new Error('Usuário não autenticado');

            const hoje = new Date();
            const seteDiasAtras = new Date(hoje.getTime() - (7 * 24 * 60 * 60 * 1000));

            const { data, error } = await this.supabase
                .from('fichas_treino')
                .select('data_criacao')
                .eq('user_id', user.id)
                .gte('data_criacao', seteDiasAtras.toISOString())
                .order('data_criacao', { ascending: true });

            if (error) throw error;

            // Agrupar por dia
            const fichasPorDia = {};
            for (let i = 6; i >= 0; i--) {
                const dia = new Date(hoje.getTime() - (i * 24 * 60 * 60 * 1000));
                const diaStr = dia.toISOString().split('T')[0];
                fichasPorDia[diaStr] = 0;
            }

            if (data) {
                data.forEach(ficha => {
                    const dia = ficha.data_criacao.split('T')[0];
                    if (fichasPorDia[dia] !== undefined) {
                        fichasPorDia[dia]++;
                    }
                });
            }

            return {
                success: true,
                data: fichasPorDia
            };

        } catch (error) {
            console.error('Erro ao obter dados do gráfico:', error);
            return {
                success: false,
                error: error.message,
                data: {}
            };
        }
    },

    // Migrar dados locais existentes (se houver)
    async migrarDadosLocais() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return { success: false, error: 'Usuário não autenticado' };

            // Verificar se há dados no localStorage
            const clientesLocais = localStorage.getItem('alunos_cadastrados');
            const fichasLocais = localStorage.getItem('fichas_treino');

            let clientesMigrados = 0;
            let fichasMigradas = 0;

            // Migrar clientes
            if (clientesLocais) {
                try {
                    const clientes = JSON.parse(clientesLocais);
                    if (Array.isArray(clientes) && clientes.length > 0) {
                        // Verificar se já existem clientes no Supabase
                        const { data: clientesExistentes } = await this.supabase
                            .from('clients')
                            .select('credencial')
                            .eq('user_id', user.id);

                        const credenciaisExistentes = clientesExistentes?.map(c => c.credencial) || [];

                        // Filtrar clientes que ainda não foram migrados
                        const clientesParaMigrar = clientes.filter(cliente => 
                            !credenciaisExistentes.includes(cliente.credencial)
                        );

                        if (clientesParaMigrar.length > 0) {
                            const clientesComUserId = clientesParaMigrar.map(cliente => ({
                                ...cliente,
                                user_id: user.id
                            }));

                            const { error } = await this.supabase
                                .from('clients')
                                .insert(clientesComUserId);

                            if (!error) {
                                clientesMigrados = clientesComUserId.length;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Erro ao migrar clientes:', e);
                }
            }

            // Migrar fichas
            if (fichasLocais) {
                try {
                    const fichas = JSON.parse(fichasLocais);
                    if (Array.isArray(fichas) && fichas.length > 0) {
                        // Verificar se já existem fichas no Supabase
                        const { data: fichasExistentes } = await this.supabase
                            .from('fichas_treino')
                            .select('nome, data_criacao')
                            .eq('user_id', user.id);

                        const fichasExistentesKeys = fichasExistentes?.map(f => 
                            `${f.nome}_${f.data_criacao}`
                        ) || [];

                        // Filtrar fichas que ainda não foram migradas
                        const fichasParaMigrar = fichas.filter(ficha => {
                            const key = `${ficha.nome}_${ficha.data_criacao}`;
                            return !fichasExistentesKeys.includes(key);
                        });

                        if (fichasParaMigrar.length > 0) {
                            const fichasComUserId = fichasParaMigrar.map(ficha => ({
                                ...ficha,
                                user_id: user.id
                            }));

                            const { error } = await this.supabase
                                .from('fichas_treino')
                                .insert(fichasComUserId);

                            if (!error) {
                                fichasMigradas = fichasComUserId.length;
                            }
                        }
                    }
                } catch (e) {
                    console.error('Erro ao migrar fichas:', e);
                }
            }

            // Limpar localStorage após migração bem-sucedida
            if (clientesMigrados > 0 || fichasMigradas > 0) {
                if (clientesMigrados > 0) localStorage.removeItem('alunos_cadastrados');
                if (fichasMigradas > 0) localStorage.removeItem('fichas_treino');
            }

            return {
                success: true,
                data: {
                    clientesMigrados,
                    fichasMigradas
                }
            };

        } catch (error) {
            console.error('Erro na migração:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
};