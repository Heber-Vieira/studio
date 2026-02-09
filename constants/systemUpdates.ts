
import { ReleaseNote } from '../types';

/**
 * HISTÓRICO AUTOMÁTICO DE IMPLEMENTAÇÕES DO SISTEMA (AI-DRIVEN)
 * 
 * Este arquivo é atualizado automaticamente pela BellaAI sempre que uma nova 
 * funcionalidade ou correção importante é implementada.
 */
export const SYSTEM_UPDATES: ReleaseNote[] = [
    {
        version: '2.5.2',
        title: 'Interface Refinada & Privacidade 💎',
        description: 'Melhoramos a estabilidade visual e a organização do seu painel de controle.',
        features: [
            { text: 'Menu Lateral Otimizado: Botões lado a lado com visibilidade total do texto.', roles: ['master_admin', 'company_admin', 'attendant'] },
            { text: 'Privacidade Inteligente: Botão de LGPD movido para evitar conflitos de interface.', roles: 'all' },
            { text: 'Sistema de Novidades Automático: Agora você acompanha cada evolução em tempo real.', roles: ['master_admin', 'company_admin'] },
            { text: 'Ajuste de ícones e espaçamentos para dispositivos móveis.', roles: 'all' }
        ]
    },
    {
        version: '2.5.1',
        title: 'Inteligência em Anamnese 🧠',
        description: 'Novos campos e validações para garantir a segurança dos seus procedimentos.',
        features: [
            { text: 'Campo de Profissional (Staff) diretamente na ficha de anamnese.', roles: ['company_admin', 'attendant'] },
            { text: 'Vinculação automática de modelos de ficha por tipo de serviço.', roles: ['company_admin'] },
            { text: 'Assinatura digital com timestamp de segurança.', roles: ['client', 'attendant'] }
        ]
    },
    {
        version: '2.5.0',
        title: 'BellaAI Pulse: Visão 360º 🚀',
        description: 'Lançamento do novo motor de gestão e inteligência artificial.',
        features: [
            { text: 'Dashboard de Metas Mensais com progresso em tempo real.', roles: ['master_admin', 'company_admin'] },
            { text: 'Lista de Espera Inteligente (Waiting List) para horários esgotados.', roles: 'all' },
            { text: 'Integração nativa com WhatsApp para lembretes automáticos.', roles: ['company_admin'] }
        ]
    }
];
