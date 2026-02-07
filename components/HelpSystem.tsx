
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { View, UserRole } from '../types';
import {
  X, Search, Sparkles, Zap, Target, ShieldCheck,
  HelpCircle, ChevronRight, Book, Lightbulb,
  Info, Star, ShieldAlert, CheckCircle2,
  ArrowLeft, FileText, Users, CreditCard,
  Megaphone, Settings, Smartphone, BookOpen,
  ArrowRight, Scissors, Package, Palette, SearchCode,
  User, Calendar, DollarSign, Map, Shield, Eye,
  Trophy, MousePointer2, Layers, Cpu, Heart,
  SmartphoneNfc, MessageSquare, MessageCircle, History, BarChart3,
  RefreshCw, Loader2, Smile, Gift, Crown,
  Link2, UsersRound, CalendarPlus, Wallet, BarChart,
  Settings2, ClipboardList, Timer, Wand2, Rocket
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface HelpSystemProps {
  currentView: View;
  onShowToast: (msg: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface Step {
  title: string;
  desc: string;
  example?: string;
}

interface DocArticle {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  steps: Step[];
  roles: UserRole[] | 'all';
  tip?: string;
  previewColor?: string;
}

interface DocCategory {
  id: string;
  title: string;
  icon: any;
  roles: UserRole[] | 'all';
  articles: DocArticle[];
  description: string;
}

const HelpSystem: React.FC<HelpSystemProps> = ({ currentView, onShowToast, isOpen, onClose }) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeScreen, setActiveScreen] = useState<'hub' | 'article' | 'docs' | 'doc-category' | 'doc-article' | 'support'>('hub');
  const [selectedArticle, setSelectedArticle] = useState<DocArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  if (!user) return null;

  const masterDocs: DocCategory[] = [
    {
      id: 'operation',
      title: 'Operação e Agenda',
      icon: CalendarPlus,
      description: 'Domine o coração do seu estúdio: a gestão de tempo.',
      roles: ['master_admin', 'company_admin', 'attendant'],
      articles: [
        {
          id: 'schedule-master',
          title: 'Gestão de Agenda Profissional',
          subtitle: 'Como organizar horários e evitar conflitos.',
          icon: Calendar,
          roles: 'all',
          steps: [
            { title: 'Visualização Dinâmica', desc: 'Alterne entre visões de Dia, Semana e Mês para ter controle total da ocupação.', example: 'Use a visão "Dia" para focar na operação momentânea.' },
            { title: 'Inclusão de Agendamentos', desc: 'Clique no botão "+" ou diretamente em um horário vago. Selecione a cliente, o serviço e o profissional.', example: 'Você pode buscar clientes pelo nome ou telefone rapidamente.' },
            { title: 'Status do Agendamento', desc: 'Use as cores para identificar: Pendente (Amarelo), Confirmado (Verde) ou Finalizado (Cinza).', example: 'Agendamentos confirmados via WhatsApp mudam de cor automaticamente.' }
          ],
          tip: 'Arraste e solte agendamentos para remarcar em segundos! ⚡'
        },
        {
          id: 'blocked-periods',
          title: 'Bloqueios e Folgas',
          subtitle: 'Garante que ninguém agende em horários indisponíveis.',
          icon: ShieldAlert,
          roles: ['master_admin', 'company_admin', 'attendant'],
          steps: [
            { title: 'Bloqueio Rápido', desc: 'No menu Equipe, selecione "Bloquear Data" para o profissional desejado.', example: 'Útil para horários de almoço ou imprevistos.' },
            { title: 'Intervalos Recorrentes', desc: 'Configure as jornadas de trabalho nas configurações de cada profissional.', example: 'Defina que a profissional "Ana" não atende às Segundas-Feiras.' }
          ]
        },
        {
          id: 'waitlist-tech',
          title: 'Fila de Espera Inteligente',
          subtitle: 'Nunca perca uma oportunidade de venda.',
          icon: Timer,
          roles: ['master_admin', 'company_admin', 'attendant'],
          steps: [
            { title: 'Captura de Interesse', desc: 'Quando um horário estiver cheio, adicione a cliente à Fila de Espera.', example: 'Registre que a Maria quer "Cílios" caso alguém desmarque.' },
            { title: 'Notificação Automática', desc: 'O sistema alerta quando uma vaga surge no dia solicitado.', example: 'O dashboard mostrará um alerta vibrante quando houver compatibilidade.' }
          ],
          tip: 'Priorize clientes fiéis usando o score de prioridade da BellaAI. 🚀'
        }
      ]
    },
    {
      id: 'management',
      title: 'Finanças e Inteligência',
      icon: Wallet,
      description: 'Gestão financeira de alto nível e decisões baseadas em dados.',
      roles: ['master_admin', 'company_admin'],
      articles: [
        {
          id: 'pos-checkout',
          title: 'Checkout Transacional (POS)',
          subtitle: 'Receba pagamentos e encerre atendimentos com elegância.',
          icon: CreditCard,
          roles: ['master_admin', 'company_admin', 'attendant'],
          steps: [
            { title: 'Fluxo de Pagamento', desc: 'Ao finalizar um serviço, clique em "Checkout". Selecione o método (Pix, Cartão, Dinheiro).', example: 'O sistema já calcula automaticamente o valor total com descontos.' },
            { title: 'Comissões Automáticas', desc: 'O sistema deduz a parte do profissional no momento do recebimento.', example: 'Se um serviço custa R$100 e a comissão é 40%, o sistema já reserva R$40 para a contabilidade da profissional.' }
          ],
          tip: 'Cadastre sua Chave Pix nas configurações para gerar QR Codes instantâneos! 💸'
        },
        {
          id: 'expense-control',
          title: 'Controle de Despesas',
          subtitle: 'Mantenha a saúde financeira em dia.',
          icon: DollarSign,
          roles: ['master_admin', 'company_admin'],
          steps: [
            { title: 'Lançamentos', desc: 'Registre todas as saídas (aluguel, produtos, luz) no módulo Financeiro.', example: 'Anexe o fornecedor para ter um histórico de compras.' },
            { title: 'Fluxo de Caixa', desc: 'Veja o saldo real do dia subtraindo despesas de receitas.', example: 'Use o filtro mensal para planejar investimentos futuros.' }
          ]
        }
      ]
    },
    {
      id: 'crm-evolution',
      title: 'CRM e Encantamento',
      icon: Heart,
      description: 'Crie conexões inesquecíveis com suas clientes.',
      roles: ['master_admin', 'company_admin', 'attendant'],
      articles: [
        {
          id: 'magnetic-link-pro',
          title: 'O Poder do Link Magnético',
          subtitle: 'A forma mais rápida de converter agendamentos.',
          icon: Link2,
          roles: 'all',
          steps: [
            { title: 'Personalização', desc: 'No perfil da cliente, clique no ícone de link. O sistema gera uma URL única.', example: 'A Maria recebe um link que já sabe que ela é a "Maria".' },
            { title: 'Zero Fricção', desc: 'A cliente clica e escolhe apenas o horário. Nome e telefone já vêm preenchidos.', example: 'Isso aumenta a taxa de agendamento em até 40%.' }
          ],
          previewColor: 'bg-blue-500'
        },
        {
          id: 'anamnesis-flow',
          title: 'Fichas de Anamnese Digitais',
          subtitle: 'Segurança jurídica e técnica para seus protocolos.',
          icon: ClipboardList,
          roles: 'all',
          steps: [
            { title: 'Criação de Modelos', desc: 'Crie perguntas específicas para cada serviço (Lash, Estética, Unhas).', example: 'Pergunte sobre alergias ou gestação de forma obrigatória.' },
            { title: 'Preenchimento Fluido', desc: 'A cliente pode preencher no próprio celular através de um link seguro.', example: 'A assinatura digital é colhida na tela e salva no prontuário.' }
          ]
        }
      ]
    },
    {
      id: 'marketing-ia',
      title: 'Marketing & IA Bella',
      icon: Wand2,
      description: 'Automação e criatividade para escalar suas vendas.',
      roles: ['master_admin', 'company_admin'],
      articles: [
        {
          id: 'bella-ai-copy',
          title: 'BellaAI: Sua Redatora Pessoal',
          subtitle: 'Crie campanhas magnéticas em segundos.',
          icon: Sparkles,
          roles: 'all',
          steps: [
            { title: 'Defina o Tom', desc: 'Escolha entre tom Amigável, Profissional ou Zen nas configurações.', example: 'Um estúdio de cílios pode preferir o tom "Amigável" com muitos emojis.' },
            { title: 'Geração de Conteúdo', desc: 'No módulo Marketing, peça para a Bella criar um texto de recuperação de clientes.', example: 'Ela dirá: "Oi Gabi, faz tempo que seus cílios não brilham aqui..."' }
          ],
          tip: 'Use a IA para sugerir promoções baseadas nos serviços menos procurados da semana. 🤖'
        },
        {
          id: 'loyalty-engine',
          title: 'Programa de Fidelidade Real',
          subtitle: 'Retenha clientes transformando pontos em mimos.',
          icon: Trophy,
          roles: ['master_admin', 'company_admin'],
          steps: [
            { title: 'Configuração', desc: 'Defina quantos pontos valem cada Real gasto.', example: 'R$ 1,00 = 1 ponto. Meta de 500 pontos para ganhar um pé e mão.' },
            { title: 'Engajamento', desc: 'A cliente vê o progresso no painel dela, criando o desejo de completar a jornada.', example: 'Maria vê que faltam só 50 pontos e agenda um serviço extra.' }
          ]
        }
      ]
    },
    {
      id: 'client-journey',
      title: 'Minha Experiência VIP',
      icon: Crown,
      description: 'Como aproveitar ao máximo o seu Studio favorito.',
      roles: ['client'],
      articles: [
        {
          id: 'booking-easy',
          title: 'Agendando meu Momento',
          subtitle: 'Praticidade total na palma da sua mão.',
          icon: Smartphone,
          roles: 'all',
          steps: [
            { title: 'Escolha do Serviço', desc: 'Navegue pelas categorias e selecione o que deseja realizar.', example: 'Cílios > Extensão Volume Russo.' },
            { title: 'Seu Especialista', desc: 'Escolha o profissional de sua preferência ou veja quem está disponível.', example: 'Você pode ver as fotos e avaliações de cada um.' },
            { title: 'Data e Hora', desc: 'Selecione no calendário o melhor momento para você. Confirmação instantânea!', example: 'O sistema envia um lembrete automático para você não esquecer.' }
          ]
        },
        {
          id: 'my-perks',
          title: 'Meus Pontos e Prêmios',
          subtitle: 'Onde vejo minhas vantagens?',
          icon: Gift,
          roles: 'all',
          steps: [
            { title: 'Painel de Pontos', desc: 'Logo na entrada, você vê quantos pontos já acumulou.', example: 'Cada visita te deixa mais perto de um serviço grátis.' },
            { title: 'Histórico de Beleza', desc: 'Veja todos os serviços que já realizou e quem te atendeu.', example: 'Ótimo para lembrar qual curvatura de cílios você usou da última vez.' }
          ]
        }
      ]
    }
  ];

  const filteredCategories = useMemo(() => {
    return masterDocs
      .filter(cat => cat.roles === 'all' || cat.roles.includes(user.role))
      .map(cat => ({
        ...cat,
        articles: cat.articles.filter(art => art.roles === 'all' || (Array.isArray(art.roles) && art.roles.includes(user.role)))
      }))
      .filter(cat => cat.articles.length > 0);
  }, [user.role]);

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return null;

    const cards: DocArticle[] = [];
    filteredCategories.forEach(cat => {
      cat.articles.forEach(art => {
        if (art.title.toLowerCase().includes(query) || art.subtitle.toLowerCase().includes(query)) {
          cards.push({ ...art, previewColor: 'bg-pink-500' });
        }
      });
    });
    return cards;
  }, [searchQuery, filteredCategories]);

  const openCategory = (cat: DocCategory) => { setSelectedCategory(cat); setActiveScreen('doc-category'); };
  const openArticle = (art: DocArticle) => { setSelectedArticle(art); setActiveScreen('doc-article'); };

  const goBack = () => {
    if (activeScreen === 'doc-article') setActiveScreen('doc-category');
    else if (activeScreen === 'doc-category') setActiveScreen('docs');
    else setActiveScreen('hub');
  };

  const closeHub = () => {
    onClose();
    setTimeout(() => {
      setActiveScreen('hub');
      setSearchQuery('');
      setSelectedArticle(null);
      setSelectedCategory(null);
    }, 300);
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
    exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.05, duration: 0.3 }
    })
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            onClick={closeHub}
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white w-full md:max-w-6xl h-full md:h-[85vh] rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-white/20 relative"
          >
            {/* Header Moderno */}
            <div className="p-8 md:p-12 pb-6 flex justify-between items-start shrink-0 relative bg-gradient-to-b from-gray-50/50 to-transparent">
              <div className="flex items-center gap-6">
                <AnimatePresence mode="wait">
                  {activeScreen !== 'hub' && (
                    <motion.button
                      key="back"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={goBack}
                      className="p-4 bg-white shadow-xl hover:shadow-gray-200 text-gray-900 rounded-[1.8rem] transition-all active:scale-95 border border-gray-100 flex items-center justify-center"
                    >
                      <ArrowLeft size={24} strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-[#FF69B4] p-1.5 rounded-lg shadow-lg shadow-pink-200">
                      <Sparkles className="text-white" size={16} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">BellaAI Intelligence Hub</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500">
                    {activeScreen === 'hub' && (searchQuery ? "Resultados Dinâmicos" : "Olá! Como evoluímos hoje?")}
                    {activeScreen === 'docs' && "Biblioteca de Excelência"}
                    {activeScreen === 'doc-category' && selectedCategory?.title}
                    {activeScreen === 'doc-article' && selectedArticle?.title}
                    {activeScreen === 'support' && "Suporte Especializado"}
                  </h2>
                </div>
              </div>
              <button
                onClick={closeHub}
                className="p-4 bg-gray-100/50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-[1.5rem] transition-all group"
              >
                <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-12 scrollbar-hide">
              <AnimatePresence mode="wait">
                {activeScreen === 'hub' && (
                  <motion.div
                    key="hub"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-12"
                  >
                    <div className="relative group max-w-3xl mx-auto">
                      <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#FF69B4] transition-colors" size={28} />
                      <input
                        type="text"
                        placeholder="Busque por 'IA', 'Financeiro', 'Agendamentos'..."
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-[2.8rem] py-7 pl-18 pr-8 outline-none focus:border-[#FF69B4]/40 focus:bg-white transition-all font-bold text-xl shadow-inner placeholder:text-gray-300"
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                        <kbd className="px-3 py-1.5 bg-white border rounded-xl text-[10px] font-black text-gray-400 shadow-sm uppercase tracking-widest hidden md:block">Esc para fechar</kbd>
                      </div>
                    </div>

                    {searchResults ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
                        {searchResults.length > 0 ? searchResults.map((art, i) => (
                          <motion.div
                            key={art.id}
                            custom={i}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            onClick={() => openArticle(art)}
                            className="p-8 bg-white border border-gray-100 rounded-[3rem] hover:border-[#40E0D0] transition-all flex items-center gap-6 cursor-pointer group shadow-sm hover:shadow-2xl hover:-translate-y-1"
                          >
                            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#40E0D0]/10 to-[#40E0D0]/20 text-[#40E0D0] flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform">
                              <art.icon size={36} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-black text-xl text-gray-900 mb-1">{art.title}</h4>
                              <p className="text-sm text-gray-400 line-clamp-2 font-medium leading-relaxed">{art.subtitle}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#40E0D0] group-hover:text-white transition-all">
                              <ChevronRight size={24} />
                            </div>
                          </motion.div>
                        )) : (
                          <div className="col-span-full py-20 text-center space-y-6">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                              <SearchCode size={60} />
                            </div>
                            <p className="text-gray-400 font-bold text-lg">Xiii... Não encontramos nenhum manual com esse termo.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-16">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {filteredCategories.slice(0, 3).map((cat, i) => (
                            <motion.div
                              key={cat.id}
                              custom={i}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              onClick={() => openCategory(cat)}
                              className="bg-white border-2 border-gray-50 hover:border-pink-100 p-10 rounded-[3.5rem] transition-all hover:bg-pink-50/10 hover:shadow-[0_30px_60px_-15px_rgba(255,105,180,0.15)] group cursor-pointer relative overflow-hidden"
                            >
                              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-10 transition-opacity rotate-12">
                                <cat.icon size={180} />
                              </div>
                              <div className="w-18 h-18 rounded-[1.8rem] bg-gray-50 shadow-inner flex items-center justify-center mb-8 text-[#FF69B4] group-hover:bg-[#FF69B4] group-hover:text-white group-hover:scale-110 transition-all duration-500">
                                <cat.icon size={40} />
                              </div>
                              <h4 className="font-black text-2xl text-gray-900 mb-3 tracking-tight">{cat.title}</h4>
                              <p className="text-sm text-gray-400 font-semibold leading-relaxed mb-8">{cat.description}</p>
                              <div className="flex items-center gap-3 text-[11px] font-black text-[#FF69B4] uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                                Explorar <ArrowRight size={16} />
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 bg-gray-900 p-3 rounded-[4rem] shadow-2xl">
                          <button onClick={() => setActiveScreen('docs')} className="flex-1 p-10 bg-white/5 hover:bg-white/10 text-white rounded-[3.5rem] flex items-center justify-between group transition-all border border-white/5">
                            <div className="flex items-center gap-7">
                              <div className="w-18 h-18 rounded-[2rem] bg-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-lg"><BookOpen size={36} /></div>
                              <div className="text-left">
                                <h5 className="font-black text-2xl tracking-tight">Base de Conhecimento</h5>
                                <p className="text-sm text-gray-400 font-medium">Todos os guias estruturados por módulos.</p>
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-gray-900 transition-all">
                              <ChevronRight size={28} />
                            </div>
                          </button>

                          <button onClick={() => setActiveScreen('support')} className="flex-1 p-10 bg-[#40E0D0] text-white rounded-[3.5rem] flex items-center justify-between group hover:scale-[1.01] transition-all shadow-2xl shadow-teal-500/20 border border-white/20">
                            <div className="flex items-center gap-7">
                              <div className="w-18 h-18 rounded-[2rem] bg-white/20 flex items-center justify-center shadow-lg">
                                <Zap size={36} strokeWidth={2.5} />
                              </div>
                              <div className="text-left">
                                <h5 className="font-black text-2xl tracking-tight">Canal Prioritário</h5>
                                <p className="text-sm text-teal-50/80 font-medium">Nossa equipe responde em minutos!</p>
                              </div>
                            </div>
                            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <MessageSquare size={28} />
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeScreen === 'docs' && (
                  <motion.div
                    key="docs"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    {filteredCategories.map((cat, i) => (
                      <div
                        key={cat.id} onClick={() => openCategory(cat)}
                        className="p-10 bg-white border border-gray-100 rounded-[3.5rem] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all group cursor-pointer flex justify-between items-center hover:border-indigo-100"
                      >
                        <div className="flex items-center gap-8">
                          <div className="w-20 h-20 bg-gray-50 rounded-[2.2rem] flex items-center justify-center text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition-all group-hover:rotate-6">
                            <cat.icon size={40} />
                          </div>
                          <div>
                            <h4 className="font-black text-2xl text-gray-900 group-hover:text-indigo-600 transition-colors tracking-tight">{cat.title}</h4>
                            <span className="text-[12px] font-black text-gray-300 uppercase tracking-[0.3em] mt-1 block">{cat.articles.length} Artigos Detalhados</span>
                          </div>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                          <ChevronRight size={28} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {activeScreen === 'doc-category' && selectedCategory && (
                  <motion.div
                    key="category"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-6 max-w-4xl mx-auto"
                  >
                    {selectedCategory.articles.map((art, i) => (
                      <motion.div
                        key={art.id}
                        custom={i}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => openArticle(art)}
                        className="p-8 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-[3rem] transition-all flex justify-between items-center cursor-pointer group shadow-sm hover:shadow-xl"
                      >
                        <div className="flex items-center gap-7">
                          <div className="w-16 h-16 rounded-[1.5rem] bg-white shadow-md flex items-center justify-center text-gray-400 group-hover:text-[#40E0D0] transition-all group-hover:scale-110">
                            <art.icon size={30} />
                          </div>
                          <div>
                            <h5 className="font-black text-gray-900 text-xl tracking-tight mb-1">{art.title}</h5>
                            <p className="text-base text-gray-400 font-medium">{art.subtitle}</p>
                          </div>
                        </div>
                        <div className="px-8 py-3 bg-white text-[12px] font-black text-[#40E0D0] border border-gray-100 uppercase tracking-widest rounded-2xl shadow-sm group-hover:bg-[#40E0D0] group-hover:text-white group-hover:border-[#40E0D0] transition-all">Ver Manual</div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeScreen === 'doc-article' && selectedArticle && (
                  <motion.div
                    key="article"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="max-w-4xl mx-auto space-y-16"
                  >
                    <div className="bg-white p-16 rounded-[4.5rem] border border-gray-100 text-center relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF69B4] via-[#40E0D0] to-[#FF69B4] animate-pulse"></div>
                      <motion.div
                        initial={{ scale: 0.8, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-24 h-24 bg-pink-50 rounded-[2.2rem] shadow-xl flex items-center justify-center text-[#FF69B4] mx-auto mb-10"
                      >
                        <selectedArticle.icon size={48} strokeWidth={2.5} />
                      </motion.div>
                      <h3 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight leading-tight">{selectedArticle.title}</h3>
                      <p className="text-gray-400 font-black uppercase text-[12px] tracking-[0.5em]">{selectedArticle.subtitle}</p>
                    </div>

                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-10 px-4">
                        <div className="h-px bg-gray-100 flex-1"></div>
                        <span className="text-[12px] font-black text-gray-300 uppercase tracking-[0.5em]">Execução Passo a Passo</span>
                        <div className="h-px bg-gray-100 flex-1"></div>
                      </div>

                      {selectedArticle.steps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex flex-col md:flex-row gap-8 p-10 bg-white rounded-[3.5rem] border border-gray-50 shadow-sm hover:shadow-2xl transition-all group group relative"
                        >
                          <div className="w-16 h-16 rounded-[2rem] bg-pink-50 text-[#FF69B4] flex items-center justify-center font-black text-2xl shrink-0 group-hover:bg-[#FF69B4] group-hover:text-white group-hover:scale-110 transition-all duration-500 shadow-lg shadow-pink-100/50">{i + 1}</div>
                          <div className="space-y-4">
                            <h5 className="text-2xl font-black text-gray-900 tracking-tight">{step.title}</h5>
                            <p className="text-gray-500 leading-relaxed font-medium text-lg">{step.desc}</p>
                            {step.example && (
                              <div className="mt-4 p-5 bg-teal-50/50 rounded-2xl border border-teal-100 flex gap-4 items-start">
                                <div className="p-1.5 bg-white rounded-lg text-teal-500 shadow-sm shrink-0 mt-1">
                                  <Lightbulb size={18} />
                                </div>
                                <div>
                                  <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest block mb-1">Exemplo Prático</span>
                                  <p className="text-teal-900/70 font-bold text-sm italic italic">"{step.example}"</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {selectedArticle.tip && (
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="bg-indigo-900 border border-white/10 p-12 rounded-[4rem] flex flex-col md:flex-row gap-10 items-center text-white shadow-2xl relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="w-20 h-20 bg-white/10 rounded-[2rem] flex items-center justify-center text-indigo-300 shadow-xl shrink-0 group-hover:rotate-12 transition-transform">
                          <Rocket size={40} className="animate-pulse" />
                        </div>
                        <div className="relative z-10 flex-1 text-center md:text-left">
                          <span className="text-[11px] font-black text-indigo-300 uppercase tracking-[0.4em] block mb-2">Dica Pro BellaAI</span>
                          <p className="text-xl font-bold leading-relaxed">{selectedArticle.tip}</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {activeScreen === 'support' && (
                  <motion.div
                    key="support"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="max-w-2xl mx-auto text-center space-y-12 py-10"
                  >
                    <div className="relative inline-block">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-40 h-40 bg-yellow-400 rounded-[4rem] flex items-center justify-center text-white mx-auto shadow-[0_30px_60px_-15px_rgba(250,204,21,0.5)]"
                      >
                        <Smile size={80} fill="currentColor" strokeWidth={1} />
                      </motion.div>
                      <motion.div
                        animate={{ y: [-5, 5, -5], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl shadow-xl"
                      >
                        <Sparkles className="text-yellow-500" size={24} />
                      </motion.div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900">Total Suporte VIP</h3>
                      <p className="text-gray-400 font-semibold text-xl max-w-md mx-auto leading-relaxed">Nossos especialistas estão online para transformar suas dúvidas em resultados.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <textarea
                          className="w-full h-64 bg-gray-50 border-2 border-gray-100 rounded-[3.5rem] p-10 outline-none focus:border-yellow-400/40 focus:bg-white transition-all font-bold text-gray-700 shadow-inner resize-none text-lg"
                          placeholder="Como podemos te ajudar hoje? Descreva detalhadamente..."
                          value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)}
                        ></textarea>
                        <div className="absolute bottom-6 right-10 text-[10px] font-black text-gray-300 uppercase tracking-widest">A BellaAI lerá sua mensagem</div>
                      </div>
                      <button
                        onClick={() => {
                          if (!supportMessage.trim()) return;
                          setIsSendingSupport(true);
                          setTimeout(() => {
                            setIsSendingSupport(false);
                            setSupportMessage('');
                            onShowToast('✨ Mensagem recebida! Nossa equipe entrará em contato em breve.');
                            setActiveScreen('hub');
                          }, 2000);
                        }}
                        disabled={isSendingSupport || !supportMessage.trim()}
                        className="w-full py-8 bg-gray-900 text-white rounded-[2.5rem] font-black text-lg uppercase tracking-[0.4em] shadow-2xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                      >
                        {isSendingSupport ? <Loader2 className="animate-spin" size={24} /> : (
                          <>Enviar Mensagem <Zap size={20} fill="currentColor" className="text-yellow-400" /></>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer com Glassmorphism */}
            <div className="p-8 md:p-12 bg-white/80 backdrop-blur-md border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8 shrink-0 relative z-50">
              <div className="flex items-center gap-8">
                <div className="w-16 h-16 bg-gray-900 rounded-[1.8rem] shadow-xl flex items-center justify-center text-white relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF69B4] to-transparent opacity-0 group-hover:opacity-40 transition-opacity"></div>
                  <User size={32} strokeWidth={2.5} className="relative z-10" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-gray-300 uppercase tracking-[0.4em] mb-2">Seu Nível de Acesso</p>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-black text-gray-900 capitalize bg-gray-50 px-5 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
                      {user.role === 'master_admin' ? <Crown size={16} className="text-yellow-500" /> : <ShieldCheck size={16} className="text-teal-500" />}
                      {user.role.replace('_', ' ')}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hidden sm:block">Sistema Online</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-5 w-full md:w-auto">
                <button
                  onClick={() => { setActiveScreen('docs'); setSearchQuery(''); }}
                  className={`flex-1 md:flex-none px-10 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${activeScreen === 'docs' ? 'bg-[#FF69B4] text-white shadow-2xl shadow-pink-200' : 'bg-white border-2 border-gray-50 text-gray-500 hover:bg-gray-50'}`}
                >
                  <BookOpen size={20} /> Biblioteca
                </button>
                <button
                  onClick={() => { setActiveScreen('support'); setSearchQuery(''); }}
                  className={`flex-1 md:flex-none px-10 py-5 rounded-[1.8rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${activeScreen === 'support' ? 'bg-yellow-400 text-white shadow-2xl shadow-yellow-100' : 'bg-gray-900 text-white hover:bg-black shadow-xl'}`}
                >
                  <MessageCircle size={20} /> Suporte
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HelpSystem;
