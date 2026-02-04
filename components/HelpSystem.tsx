
import React, { useState, useMemo } from 'react';
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
  Link2, UsersRound
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
}

interface DocArticle {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  steps: Step[];
  roles: UserRole[] | 'all';
  tip?: string;
}

interface DocCategory {
  id: string;
  title: string;
  icon: any;
  roles: UserRole[] | 'all';
  articles: DocArticle[];
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

  // --- MANUAL MESTRE ATUALIZADO COM AS NOVAS FUNCIONALIDADES ---
  const masterDocs: DocCategory[] = [
    {
      id: 'crm-mastery',
      title: 'CRM & Relacionamento',
      icon: UsersRound,
      roles: ['master_admin', 'company_admin', 'attendant'],
      articles: [
        {
          id: 'magnetic-links',
          title: 'Links Magnéticos (Hub)',
          subtitle: 'Agendamento com identificação automática.',
          icon: Link2,
          roles: ['master_admin', 'company_admin', 'attendant'],
          steps: [
            { title: 'Localize a Cliente', desc: 'No menu CRM, encontre o card da cliente desejada.' },
            { title: 'Gerar Link', desc: 'Clique no ícone de Link (Azul). O sistema gera uma URL única com os dados criptografados.' },
            { title: 'Envio Inteligente', desc: 'Copie e envie no WhatsApp. Quando a cliente abrir, o nome e telefone dela já estarão preenchidos!' }
          ],
          tip: 'A tecnologia #booking garante que o link funcione em qualquer servidor sem erros de "Página não encontrada". 💎'
        },
        {
          id: 'whatsapp-crm',
          title: 'WhatsApp Direto',
          subtitle: 'Contato rápido sem salvar número.',
          icon: MessageCircle,
          roles: ['master_admin', 'company_admin', 'attendant'],
          steps: [
            { title: 'Atalho Verde', desc: 'Toque no ícone de chat verde no card da cliente dentro do CRM.' },
            { title: 'Conversa Instantânea', desc: 'O sistema abre o WhatsApp Web ou App direto na conversa com a cliente.' }
          ],
          tip: 'O layout foi ajustado para não cobrir o nome da cliente em telas pequenas! 📱'
        }
      ]
    },
    {
      id: 'client-vip',
      title: 'Espaço da Cliente',
      icon: Crown,
      roles: ['client'],
      articles: [
        {
          id: 'fast-booking',
          title: 'Como Agendar',
          subtitle: 'Seu momento de beleza em 30 segundos.',
          icon: Calendar,
          roles: 'all',
          steps: [
            { title: 'Serviço', desc: 'Escolha o que deseja fazer hoje.' },
            { title: 'Profissional', desc: 'Selecione seu especialista favorito.' },
            { title: 'Horário', desc: 'Veja as vagas livres em tempo real e confirme.' }
          ],
          tip: 'Se você recebeu um link VIP, seus dados serão reconhecidos na hora! ✨'
        },
        {
          id: 'loyalty-how',
          title: 'Meus Pontos',
          subtitle: 'Transforme beleza em prêmios.',
          icon: Gift,
          roles: 'all',
          steps: [
            { title: 'Acumule', desc: 'Cada serviço gera pontos automaticamente.' },
            { title: 'Acompanhe', desc: 'Veja sua barra de progresso no painel inicial.' },
            { title: 'Resgate', desc: 'Ao atingir a meta, seu prêmio estará pronto no checkout.' }
          ]
        }
      ]
    },
    {
      id: 'admin-intelligence',
      title: 'Gestão & IA',
      icon: Cpu,
      roles: ['master_admin', 'company_admin'],
      articles: [
        {
          id: 'bella-ai-tips',
          title: 'BellaAI Marketing',
          subtitle: 'Textos que vendem sozinhos.',
          icon: Sparkles,
          roles: ['master_admin', 'company_admin'],
          steps: [
            { title: 'Objetivo', desc: 'Escolha se quer recuperar inativos ou anunciar novidades.' },
            { title: 'Gerar Texto', desc: 'Clique no botão de IA e receba uma copy vibrante pronta para o WhatsApp.' }
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
          cards.push(art);
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

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500 backdrop-blur-xl bg-gray-900/40">
          <div className="absolute inset-0" onClick={closeHub}></div>

          <div className="bg-white/95 w-full md:max-w-5xl h-[95vh] md:h-auto md:max-h-[90vh] rounded-[2.5rem] md:rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col border border-white relative animate-in zoom-in-95 duration-500">

            <div className="p-6 md:p-10 pb-4 md:pb-6 flex justify-between items-center shrink-0 bg-gradient-to-b from-gray-50/50 to-transparent">
              <div className="flex items-center gap-5">
                {activeScreen !== 'hub' && (
                  <button onClick={goBack} className="p-4 bg-white shadow-sm hover:bg-gray-100 text-gray-600 rounded-[1.5rem] transition-all active:scale-90 border border-gray-100">
                    <ArrowLeft size={22} />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="text-[#FF69B4]" size={18} />
                    <span className="text-[11px] font-black text-[#FF69B4] uppercase tracking-[0.3em]">BellaAI Knowledge Experience</span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-black text-gray-900 tracking-tight leading-none">
                    {activeScreen === 'hub' && (searchQuery ? "Resultados encontrados" : "Como podemos ajudar?")}
                    {activeScreen === 'docs' && "Biblioteca de Manuais"}
                    {activeScreen === 'doc-category' && selectedCategory?.title}
                    {activeScreen === 'doc-article' && selectedArticle?.title}
                    {activeScreen === 'support' && "Suporte Prioritário"}
                  </h2>
                </div>
              </div>
              <button onClick={closeHub} className="p-4 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-[1.5rem] transition-all active:rotate-90">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-6 md:pb-10 scrollbar-hide">
              {activeScreen === 'hub' && (
                <div className="space-y-10 fade-in">
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FF69B4] transition-colors" size={24} />
                    <input
                      type="text"
                      placeholder="Pesquise por 'link', 'whatsapp', 'fidelidade'..."
                      className="w-full bg-gray-100/50 border-2 border-gray-50 rounded-[2rem] py-5 pl-16 pr-8 outline-none focus:border-[#FF69B4]/30 focus:bg-white transition-all font-bold text-lg shadow-inner"
                      value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {searchResults ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                      {searchResults.length > 0 ? searchResults.map(art => (
                        <div key={art.id} onClick={() => openArticle(art)} className="p-6 bg-white border border-gray-100 rounded-[2.5rem] hover:border-[#40E0D0] transition-all flex items-center gap-5 cursor-pointer group shadow-sm hover:shadow-xl">
                          <div className="w-16 h-16 rounded-3xl bg-[#40E0D0]/10 text-[#40E0D0] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                            <art.icon size={28} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-gray-900 truncate">{art.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1 font-medium">{art.subtitle}</p>
                          </div>
                          <ChevronRight size={20} className="ml-auto text-gray-300 group-hover:text-[#40E0D0] group-hover:translate-x-1 transition-all" />
                        </div>
                      )) : (
                        <div className="col-span-full py-20 text-center space-y-4">
                          <SearchCode size={60} className="mx-auto text-gray-200" />
                          <p className="text-gray-400 font-bold">Nenhum tutorial encontrado.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {filteredCategories.slice(0, 3).map((cat) => (
                          <div key={cat.id} onClick={() => openCategory(cat)} className="bg-gray-50/50 border border-gray-100 hover:border-[#FF69B4]/30 p-8 rounded-[3rem] transition-all hover:bg-white hover:shadow-2xl group cursor-pointer relative overflow-hidden">
                            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                              <cat.icon size={120} />
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-[#FF69B4] group-hover:rotate-12 transition-transform">
                              <cat.icon size={30} />
                            </div>
                            <h4 className="font-black text-xl text-gray-900 mb-2">{cat.title}</h4>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed mb-6">{cat.articles.length} guias práticos.</p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#FF69B4] uppercase tracking-widest">
                              Ver Detalhes <ArrowRight size={14} />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        <button onClick={() => setActiveScreen('docs')} className="flex-1 p-8 bg-gray-900 text-white rounded-[3rem] flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-gray-200">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center"><BookOpen size={28} /></div>
                            <div className="text-left">
                              <h5 className="font-black text-lg">Biblioteca Completa</h5>
                              <p className="text-xs text-gray-400 font-medium">Confira todos os manuais BellaAI.</p>
                            </div>
                          </div>
                          <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </button>

                        <button onClick={() => setActiveScreen('support')} className="flex-1 p-8 bg-[#40E0D0] text-white rounded-[3rem] flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-teal-100">
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                              <Zap size={28} />
                            </div>
                            <div className="text-left">
                              <h5 className="font-black text-lg">Falar com Suporte</h5>
                              <p className="text-xs text-teal-100 font-medium">Estamos online para ajudar!</p>
                            </div>
                          </div>
                          <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeScreen === 'docs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in">
                  {filteredCategories.map((cat) => (
                    <div
                      key={cat.id} onClick={() => openCategory(cat)}
                      className="p-8 bg-white border border-gray-100 rounded-[3rem] hover:shadow-2xl transition-all group cursor-pointer flex justify-between items-center hover:border-[#FF69B4]/20 shadow-sm"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-400 group-hover:text-[#FF69B4] group-hover:bg-pink-50 transition-all group-hover:scale-110">
                          <cat.icon size={32} />
                        </div>
                        <div>
                          <h4 className="font-black text-xl text-gray-900 group-hover:text-[#FF69B4] transition-colors">{cat.title}</h4>
                          <span className="text-[11px] font-black text-gray-300 uppercase tracking-[0.2em]">{cat.articles.length} Artigos</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#FF69B4] group-hover:text-white transition-all">
                        <ChevronRight size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeScreen === 'doc-category' && selectedCategory && (
                <div className="space-y-5 fade-in max-w-3xl mx-auto">
                  {selectedCategory.articles.map((art) => (
                    <div key={art.id} onClick={() => openArticle(art)} className="p-6 bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 rounded-[2.5rem] transition-all flex justify-between items-center cursor-pointer group shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#40E0D0] transition-colors">
                          <art.icon size={22} />
                        </div>
                        <div>
                          <span className="font-black text-gray-800 group-hover:text-gray-900 text-lg block">{art.title}</span>
                          <p className="text-sm text-gray-400 font-medium">{art.subtitle}</p>
                        </div>
                      </div>
                      <div className="px-6 py-2 bg-white text-[11px] font-black text-[#FF69B4] uppercase tracking-widest rounded-full shadow-sm group-hover:bg-[#FF69B4] group-hover:text-white transition-all">Abrir Guia</div>
                    </div>
                  ))}
                </div>
              )}

              {activeScreen === 'doc-article' && selectedArticle && (
                <div className="max-w-3xl mx-auto space-y-12 fade-in">
                  <div className="bg-gradient-to-br from-gray-50 to-white p-12 rounded-[4rem] border border-gray-100 text-center relative overflow-hidden shadow-inner">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF69B4] via-[#40E0D0] to-[#FF69B4] animate-[shimmer_3s_infinite]"></div>
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-[#FF69B4] mx-auto mb-6">
                      <selectedArticle.icon size={40} />
                    </div>
                    <h3 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">{selectedArticle.title}</h3>
                    <p className="text-gray-500 font-bold uppercase text-[11px] tracking-[0.3em]">{selectedArticle.subtitle}</p>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black text-gray-300 uppercase tracking-[0.4em] ml-2">Passo a Passo</h4>
                    {selectedArticle.steps.map((step, i) => (
                      <div key={i} className="flex gap-6 p-8 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all group animate-in slide-in-from-left-4" style={{ animationDelay: `${i * 150}ms` }}>
                        <div className="w-12 h-12 rounded-2xl bg-pink-50 text-[#FF69B4] flex items-center justify-center font-black text-lg shrink-0 group-hover:bg-[#FF69B4] group-hover:text-white transition-all duration-500">{i + 1}</div>
                        <div className="space-y-1">
                          <h5 className="text-xl font-black text-gray-900 tracking-tight">{step.title}</h5>
                          <p className="text-gray-500 leading-relaxed font-medium text-base">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedArticle.tip && (
                    <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100 flex gap-6 items-center">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                        <Lightbulb size={28} className="animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Dica da BellaAI</span>
                        <p className="text-indigo-900 font-bold leading-relaxed">{selectedArticle.tip}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeScreen === 'support' && (
                <div className="max-w-lg mx-auto text-center space-y-10 fade-in">
                  <div className="relative">
                    <div className="w-32 h-32 bg-yellow-400 rounded-[3rem] flex items-center justify-center text-white mx-auto shadow-2xl animate-bounce">
                      <Smile size={60} fill="currentColor" />
                    </div>
                    <Sparkles className="absolute top-0 right-[30%] text-yellow-500 animate-pulse" size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black tracking-tight">Alguma dúvida?</h3>
                    <p className="text-gray-500 font-medium text-lg">Nossa equipe de especialistas está pronta para te atender.</p>
                  </div>
                  <div className="space-y-4">
                    <textarea
                      className="w-full h-48 bg-gray-50 border-2 border-transparent rounded-[2.5rem] p-8 outline-none focus:border-yellow-400/30 focus:bg-white transition-all font-bold text-gray-700 shadow-inner resize-none"
                      placeholder="Descreva sua dúvida detalhadamente..."
                      value={supportMessage} onChange={(e) => setSupportMessage(e.target.value)}
                    ></textarea>
                    <button
                      onClick={() => { setIsSendingSupport(true); setTimeout(() => { setIsSendingSupport(false); setSupportMessage(''); onShowToast('Mensagem enviada! Retornaremos em breve. ✨'); setActiveScreen('hub'); }, 1500); }}
                      className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      {isSendingSupport ? <Loader2 className="animate-spin" /> : "Enviar p/ Suporte ✨"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 md:p-10 bg-gray-50/50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 shrink-0">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center border text-[#FF69B4] border-pink-50`}>
                  <Shield size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Status de Acesso</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-800 capitalize bg-white px-3 py-1 rounded-lg border border-gray-200">
                      {user.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => { setActiveScreen('docs'); setSearchQuery(''); }}
                  className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeScreen === 'docs' ? 'bg-[#FF69B4] text-white shadow-xl shadow-pink-100' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <BookOpen size={18} /> Manuais
                </button>
                <button
                  onClick={() => { setActiveScreen('support'); setSearchQuery(''); }}
                  className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeScreen === 'support' ? 'bg-yellow-400 text-white shadow-xl' : 'bg-gray-900 text-white hover:bg-black'}`}
                >
                  Suporte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpSystem;
