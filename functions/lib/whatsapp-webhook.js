"use strict";
/**
 * WhatsApp Business Cloud API - Webhook Handler
 *
 * Recebe mensagens do WhatsApp e as processa, criando entidades no Firestore.
 *
 * Comandos suportados:
 *   #tarefa [título] | [descrição] | [prioridade]
 *   #reuniao [título] | [data YYYY-MM-DD] | [hora HH:mm] | [participantes]
 *   #aula [título] | [disciplina] | [data YYYY-MM-DD]
 *   #feedback [analista] | [pontos fortes] | [pontos de melhoria]
 *   #viagem [destino] | [data ida YYYY-MM-DD] | [data volta YYYY-MM-DD] | [orçamento]
 *   #custo [descrição] | [valor] | [categoria] | [tipo fixa|variavel]
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappWebhook = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const firebase_admin_1 = require("./firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const whatsappVerifyToken = (0, params_1.defineSecret)('WHATSAPP_VERIFY_TOKEN');
// ─── Helpers ─────────────────────────────────────────────────────────────────
function partes(corpo) {
    const semComando = corpo.substring(corpo.indexOf(' ') + 1);
    return semComando.split('|').map((s) => s.trim());
}
function parseData(str) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}
async function salvarMensagem(de, corpo, tipoComando, entidadeCriada, entidadeId, erro) {
    await firebase_admin_1.adminDb.collection('whatsapp_mensagens').add({
        de,
        corpo,
        tipoComando,
        entidadeCriada: entidadeCriada || null,
        entidadeId: entidadeId || null,
        processada: !erro,
        erro: erro || null,
        recebidasEm: firestore_1.Timestamp.now(),
    });
}
// ─── Processadores de Comando ─────────────────────────────────────────────────
async function processarTarefa(de, corpo) {
    const p = partes(corpo);
    const titulo = p[0] || 'Tarefa sem título';
    const descricao = p[1] || '';
    const prioridade = ['baixa', 'media', 'alta'].includes(p[2]?.toLowerCase()) ? p[2].toLowerCase() : 'media';
    const ref = await firebase_admin_1.adminDb.collection('tarefas').add({
        titulo,
        descricao,
        prioridade,
        status: 'backlog',
        contexto: 'fiap',
        tags: ['whatsapp'],
        checklist: [],
        criadoEm: firestore_1.Timestamp.now(),
        atualizadoEm: firestore_1.Timestamp.now(),
    });
    await salvarMensagem(de, corpo, 'tarefa', 'tarefas', ref.id);
}
async function processarReuniao(de, corpo) {
    const p = partes(corpo);
    const titulo = p[0] || 'Reunião sem título';
    const dataStr = p[1] || '';
    const hora = p[2] || '09:00';
    const participantes = p[3] ? p[3].split(',').map((s) => s.trim()) : [];
    const data = parseData(dataStr) || new Date();
    const ref = await firebase_admin_1.adminDb.collection('reunioes').add({
        titulo,
        data: firestore_1.Timestamp.fromDate(data),
        horario: hora,
        duracao: 60,
        participantes,
        notas: `Criado via WhatsApp por ${de}`,
        acoes: [],
        status: 'agendada',
        criadoEm: firestore_1.Timestamp.now(),
        atualizadoEm: firestore_1.Timestamp.now(),
    });
    await salvarMensagem(de, corpo, 'reuniao', 'reunioes', ref.id);
}
async function processarAula(de, corpo) {
    const p = partes(corpo);
    const titulo = p[0] || 'Aula sem título';
    const disciplina = p[1] || 'Geral';
    const dataStr = p[2] || '';
    const data = parseData(dataStr) || new Date();
    const ref = await firebase_admin_1.adminDb.collection('aulas').add({
        titulo,
        disciplina,
        descricao: `Criada via WhatsApp por ${de}`,
        data: firestore_1.Timestamp.fromDate(data),
        duracao: 90,
        materiais: [],
        tags: ['whatsapp'],
        criadoEm: firestore_1.Timestamp.now(),
    });
    await salvarMensagem(de, corpo, 'aula', 'aulas', ref.id);
}
async function processarFeedback(de, corpo) {
    const p = partes(corpo);
    const analistaStr = p[0] || '';
    const pontosFortes = p[1] ? p[1].split(',').map((s) => s.trim()) : [];
    const pontosMelhoria = p[2] ? p[2].split(',').map((s) => s.trim()) : [];
    const ref = await firebase_admin_1.adminDb.collection('feedbacks').add({
        analistaId: '',
        analistaNome: analistaStr,
        pontosFortes,
        pontosMelhoria,
        combinados: [],
        data: firestore_1.Timestamp.now(),
        proximaRevisao: firestore_1.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        criadoEm: firestore_1.Timestamp.now(),
    });
    await salvarMensagem(de, corpo, 'feedback', 'feedbacks', ref.id);
}
async function processarViagem(de, corpo) {
    const p = partes(corpo);
    const destino = p[0] || 'Destino não informado';
    const dataIdaStr = p[1] || '';
    const dataVoltaStr = p[2] || '';
    const orcamento = parseFloat(p[3] || '0') || 0;
    const dataIda = parseData(dataIdaStr) || new Date();
    const dataVolta = parseData(dataVoltaStr) || null;
    const ref = await firebase_admin_1.adminDb.collection('viagens').add({
        destino,
        descricao: `Criada via WhatsApp por ${de}`,
        dataIda: firestore_1.Timestamp.fromDate(dataIda),
        dataVolta: dataVolta ? firestore_1.Timestamp.fromDate(dataVolta) : null,
        orcamento,
        gastoReal: 0,
        status: 'planejada',
        atividades: [],
        notas: '',
        criadoEm: firestore_1.Timestamp.now(),
        atualizadoEm: firestore_1.Timestamp.now(),
    });
    await salvarMensagem(de, corpo, 'viagem', 'viagens', ref.id);
}
async function processarCusto(de, corpo) {
    const p = partes(corpo);
    const descricao = p[0] || 'Gasto sem descrição';
    const valor = parseFloat(p[1]?.replace(',', '.') || '0') || 0;
    const categoriasValidas = ['alimentacao', 'transporte', 'lazer', 'saude', 'moradia', 'educacao', 'vestuario', 'outros'];
    const categoria = categoriasValidas.includes(p[2]?.toLowerCase()) ? p[2].toLowerCase() : 'outros';
    const tipo = p[3]?.toLowerCase() === 'fixa' ? 'fixa' : 'variavel';
    const ref = await firebase_admin_1.adminDb.collection('custos').add({
        descricao,
        valor,
        categoria,
        tipo,
        data: firestore_1.Timestamp.now(),
        notas: `Registrado via WhatsApp por ${de}`,
        criadoEm: firestore_1.Timestamp.now(),
    });
    await salvarMensagem(de, corpo, 'custo', 'custos', ref.id);
}
// ─── Webhook Principal ────────────────────────────────────────────────────────
exports.whatsappWebhook = (0, https_1.onRequest)({ secrets: [whatsappVerifyToken] }, async (req, res) => {
    // GET — verificação do webhook pelo Meta
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const expectedToken = whatsappVerifyToken.value() || 'taskos-webhook-2025';
        if (mode === 'subscribe' && token === expectedToken) {
            console.log('Webhook WhatsApp verificado com sucesso');
            res.status(200).send(challenge);
            return;
        }
        res.status(403).send('Token de verificação inválido');
        return;
    }
    // POST — mensagem recebida
    if (req.method === 'POST') {
        try {
            const body = req.body;
            // Estrutura do payload do WhatsApp Business Cloud API
            const entry = body?.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages;
            if (!messages || messages.length === 0) {
                res.status(200).send('OK');
                return;
            }
            for (const message of messages) {
                const de = message.from || 'desconhecido';
                const corpo = message?.text?.body || '';
                if (!corpo)
                    continue;
                const corpoNorm = corpo.trim().toLowerCase();
                try {
                    if (corpoNorm.startsWith('#tarefa')) {
                        await processarTarefa(de, corpo);
                    }
                    else if (corpoNorm.startsWith('#reuniao') || corpoNorm.startsWith('#reunião')) {
                        await processarReuniao(de, corpo);
                    }
                    else if (corpoNorm.startsWith('#aula')) {
                        await processarAula(de, corpo);
                    }
                    else if (corpoNorm.startsWith('#feedback')) {
                        await processarFeedback(de, corpo);
                    }
                    else if (corpoNorm.startsWith('#viagem')) {
                        await processarViagem(de, corpo);
                    }
                    else if (corpoNorm.startsWith('#custo')) {
                        await processarCusto(de, corpo);
                    }
                    else {
                        // Mensagem sem comando reconhecido — registra mesmo assim
                        await salvarMensagem(de, corpo, 'desconhecido', undefined, undefined, 'Comando não reconhecido. Use: #tarefa, #reuniao, #aula, #feedback, #viagem ou #custo');
                    }
                }
                catch (err) {
                    console.error(`Erro ao processar mensagem de ${de}:`, err);
                    await salvarMensagem(de, corpo, 'desconhecido', undefined, undefined, err?.message || 'Erro interno');
                }
            }
            res.status(200).send('OK');
        }
        catch (err) {
            console.error('Erro no webhook WhatsApp:', err);
            res.status(500).send('Erro interno');
        }
        return;
    }
    res.status(405).send('Método não permitido');
});
//# sourceMappingURL=whatsapp-webhook.js.map