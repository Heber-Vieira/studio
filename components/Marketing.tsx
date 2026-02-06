
import React, { useState, useMemo } from 'react';
import { COLORS } from '../constants';
import { MessageSquare, Gift, Heart, Send, Sparkles, CheckCircle, X, Bell, Zap, Clock, Smartphone, ChevronRight, Loader2, User, ArrowRight, SkipForward, Copy } from 'lucide-react';
import { getBellaAIResponse } from '../services/geminiService';
import { Client, Appointment, SalonSettings } from '../types';

interface MarketingViewProps {
  clients?: Client[];
  appointments?: Appointment[];
  settings?: SalonSettings;
  onUpdateSettings?: (s: SalonSettings) => void;
  onShowToast?: (msg: string) => void;
}

const MarketingView: React.FC<MarketingViewProps> = ({
  clients = [],
  appointments = [],
  settings,
  onUpdateSettings,
  onShowToast
}) => {
  const [copyInput, setCopyInput] = useState('');
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState('Promoção');
  const [campaignSent, setCampaignSent] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // States for the sequence sender
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{ title: string; reach: string; clients: Client[] } | null>(null);

  // Execution state for mass sending
  const [executingCampaign, setExecutingCampaign] = useState<{
    clients: Client[];
    currentIndex: number;
    title: string;
  } | null>(null);

  // Default automations state if not present
  const currentAutomations = settings?.automations || {
    reminder24h: true,
    confirmation2h: false,
    feedbackPostService: false,
    birthdayGreeting: true,
    reengagement45d: false,
  };

  const toggleAutomation = (key: keyof NonNullable<SalonSettings['automations']>) => {
    if (!settings || !onUpdateSettings) return;

    const newAutomations = {
      ...currentAutomations,
      [key]: !currentAutomations[key]
    };

    onUpdateSettings({
      ...settings,
      automations: newAutomations
    });
  };

  // Logic to find target clients for campaigns
  const inactiveClients = useMemo(() => {
    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);
    return clients.filter(c => new Date(c.lastVisit) < fortyFiveDaysAgo);
  }, [clients]);

  const birthdayClients = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return clients.filter(c => {
      if (!c.birthDate) return false;
      const bDate = new Date(c.birthDate);
      return bDate.getMonth() === currentMonth;
    });
  }, [clients]);

  const preventiveClients = useMemo(() => {
    return clients.filter(c => c.tags.includes('Mechas') || c.tags.includes('Progressiva'));
  }, [clients]);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const context = copyInput.trim() || `Criar uma mensagem criativa focada em ${selectedObjective} para clientes do salão.`;
      const prompt = `Gere uma mensagem curta e cativante para WhatsApp para o objetivo "${selectedObjective}". 
      Contexto: ${context}. 
      IMPORTANTE: Se quiser citar o nome da cliente, use obrigatoriamente o marcador [Nome].
      Use o estilo BellaAI (minimalista vibrante, emojis, tom amigável).`;

      const response = await getBellaAIResponse(prompt, 'pt');
      setGeneratedCopy(response);
    } catch (error) {
      console.error("Erro ao gerar copy:", error);
      if (onShowToast) onShowToast("Erro ao conectar com a BellaAI. Tente novamente.");
      setGeneratedCopy("Olá [Nome]! 🌸 Temos uma novidade incrível para você no Studio. Venha conferir! (Texto fallback)");
    } finally {
      setIsLoading(false);
    }
  };

  // State for Demo Confirmation Modal
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [pendingCampaignTitle, setPendingCampaignTitle] = useState('');

  const startSendingSequence = (targetClients: Client[], title: string) => {
    if (targetClients.length === 0) {
      setPendingCampaignTitle(title);
      setIsDemoModalOpen(true);
      return;
    }

    setSelectedCampaign(null);
    setExecutingCampaign({
      clients: targetClients,
      currentIndex: 0,
      title: title
    });
  };

  const confirmDemoMode = () => {
    setIsDemoModalOpen(false);
    const demoClients = [{
      id: 'demo-1',
      name: 'Cliente Teste',
      phone: '5511999999999',
      lastVisit: new Date().toISOString(),
      totalSpent: 100,
      loyaltyPoints: 0,
      tags: ['Demo']
    }];

    setExecutingCampaign({
      clients: demoClients,
      currentIndex: 0,
      title: pendingCampaignTitle
    });
  };

  const sendToCurrentClient = () => {
    if (!executingCampaign) return;

    const client = executingCampaign.clients[executingCampaign.currentIndex];
    const messageBase = generatedCopy || copyInput;

    const phone = client.phone.replace(/\D/g, '');
    const firstName = client.name.split(' ')[0];
    const personalizedMessage = messageBase
      .replace(/\[Nome\]/gi, firstName)
      .replace(/\{nome\}/gi, firstName);

    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(personalizedMessage)}`;
    window.open(url, '_blank');

    // Move to next or finish
    if (executingCampaign.currentIndex < executingCampaign.clients.length - 1) {
      setExecutingCampaign({
        ...executingCampaign,
        currentIndex: executingCampaign.currentIndex + 1
      });
    } else {
      setExecutingCampaign(null);
      setCampaignSent(true);
      setTimeout(() => setCampaignSent(false), 4000);
    }
  };

  const skipCurrentClient = () => {
    if (!executingCampaign) return;
    if (executingCampaign.currentIndex < executingCampaign.clients.length - 1) {
      setExecutingCampaign({
        ...executingCampaign,
        currentIndex: executingCampaign.currentIndex + 1
      });
    } else {
      setExecutingCampaign(null);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#FF69B4] to-[#C71585] p-8 rounded-[3rem] text-white shadow-xl shadow-pink-200 relative overflow-hidden group">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-4 py-1.5 rounded-full backdrop-blur-md">
            <Sparkles size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">BellaAI Intelligence</span>
          </div>
          <h2 className="text-4xl font-black mb-4 tracking-tight">Potencialize seu Studio 🌸</h2>
          <p className="text-pink-50 mb-8 text-lg font-medium leading-relaxed">
            Reduza o no-show em até 50% e recupere clientes inativos com mensagens automáticas e personalizadas via WhatsApp.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => startSendingSequence(clients, "Campanha Geral")}
              className="bg-white text-[#FF69B4] px-8 py-4 rounded-2xl font-black shadow-lg flex items-center gap-2 hover:scale-105 transition-transform active:scale-95 group-hover:rotate-1"
            >
              <Send size={18} /> Iniciar Campanha Agora
            </button>
            <button
              onClick={() => setIsAutomationModalOpen(true)}
              className="bg-transparent border-2 border-white/30 px-8 py-4 rounded-2xl font-black hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <Zap size={18} /> Configurar Automação
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[80px]"></div>
      </div>

      {/* Modal: Automação Inteligente */}
      {isAutomationModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300 relative border border-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-[#FF69B4] shadow-sm">
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Automação BellaAI</h3>
                  <p className="text-sm text-gray-400 font-medium">Configure disparos automáticos via WhatsApp.</p>
                </div>
              </div>
              <button onClick={() => setIsAutomationModalOpen(false)} className="p-3 bg-gray-50 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AutomationToggle
                title="Lembrete 24h"
                desc="Disparo automático 24h antes."
                active={currentAutomations.reminder24h}
                onToggle={() => toggleAutomation('reminder24h')}
              />
              <AutomationToggle
                title="Confirmação 2h"
                desc="Check-in 2 horas antes do início."
                active={currentAutomations.confirmation2h}
                onToggle={() => toggleAutomation('confirmation2h')}
              />
              <AutomationToggle
                title="Feedback Pós"
                desc="Mensagem após finalização."
                active={currentAutomations.feedbackPostService}
                onToggle={() => toggleAutomation('feedbackPostService')}
              />
              <AutomationToggle
                title="Aniversariantes"
                desc="Parabéns automático no dia."
                active={currentAutomations.birthdayGreeting}
                onToggle={() => toggleAutomation('birthdayGreeting')}
              />
              <div className="md:col-span-2">
                <AutomationToggle
                  title="Recuperação Automática (45d)"
                  desc="Manda oferta se o cliente sumir por 45 dias."
                  active={currentAutomations.reengagement45d}
                  onToggle={() => toggleAutomation('reengagement45d')}
                />
              </div>
            </div>

            <div className="bg-orange-50 p-6 rounded-[2rem] border border-orange-100 flex gap-4 items-start">
              <div className="p-2 bg-white rounded-xl text-orange-500 shadow-sm"><Bell size={18} /></div>
              <p className="text-xs text-orange-800 font-bold leading-relaxed">
                Note: A automação requer que a aba do WhatsApp Web esteja aberta em algum computador com o plugin BellaConnector ativo. ✨
              </p>
            </div>

            <button
              onClick={() => {
                setIsAutomationModalOpen(false);
                if (onShowToast) onShowToast("Configurações de automação salvas! ✨");
              }}
              className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      )}

      {/* Modal: Demo Mode Confirmation */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300 text-center border-4 border-white/50">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500 mb-2">
              <Sparkles size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900">Modo de Demonstração</h3>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Nenhum cliente encontrado para esta campanha. Deseja simular o envio com um <b>Cliente Teste</b>?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDemoMode}
                className="py-3 bg-amber-400 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-amber-500 transition-colors shadow-lg shadow-amber-100"
              >
                Simular
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <CampaignCard
          title="Recuperação de Inativos"
          desc="Clientes que não voltam há mais de 45 dias."
          reach={`${inactiveClients.length} clientes`}
          icon={<Heart className="text-[#FF69B4]" />}
          color="#FF69B4"
          onTrigger={() => startSendingSequence(inactiveClients, "Recuperação de Inativos")}
        />
        <CampaignCard
          title="Aniversariantes do Mês"
          desc="Mande um presente especial para fidelizar."
          reach={`${birthdayClients.length} clientes`}
          icon={<Gift className="text-[#FFD700]" />}
          color="#FFD700"
          onTrigger={() => startSendingSequence(birthdayClients, "Aniversariantes")}
        />
        <CampaignCard
          title="Lembretes Preventivos"
          desc="Ideal para mechas e progressivas (90 dias)."
          reach={`${preventiveClients.length} clientes`}
          icon={<Sparkles className="text-[#40E0D0]" />}
          color="#40E0D0"
          onTrigger={() => startSendingSequence(preventiveClients, "Manutenção Preventiva")}
        />
      </div>

      {/* Copy Generator Section */}
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-pink-50 rounded-3xl text-[#FF69B4] shadow-sm">
            <MessageSquare size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-gray-900">Gerador de Copy para WhatsApp</h3>
            <p className="text-gray-500 font-medium italic">Deixe a BellaAI escrever textos impossíveis de ignorar ✨</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Objetivo da Campanha</label>
            <div className="grid grid-cols-2 gap-4">
              {['Promoção', 'Retorno', 'Novidade', 'Aviso'].map(item => (
                <button
                  key={item}
                  onClick={() => setSelectedObjective(item)}
                  className={`p-5 rounded-3xl border-2 font-black transition-all text-center uppercase text-[10px] tracking-widest ${selectedObjective === item ? 'border-[#FF69B4] bg-[#FF69B4]/5 text-[#FF69B4] shadow-inner' : 'border-transparent bg-gray-50 text-gray-400 hover:bg-white hover:border-gray-100'}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contexto ou Oferta</label>
              <textarea
                className="w-full h-40 p-6 bg-gray-50 border-none rounded-[2rem] focus:ring-4 focus:ring-[#FF69B4]/5 outline-none shadow-sm font-medium text-gray-700 placeholder:text-gray-400 resize-none"
                placeholder="Ex: Oferecer 10% de desconto... (Ou deixe em branco para uma sugestão automática)"
                value={copyInput}
                onChange={e => setCopyInput(e.target.value)}
              ></textarea>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-5 bg-[#FF69B4] text-white rounded-[2rem] font-black text-xl shadow-xl shadow-pink-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Sparkles size={20} /> Gerar Texto Mágico ✨</>}
            </button>
          </div>

          <div className="bg-[#F9FAFB] p-8 rounded-[3rem] border border-gray-100 flex flex-col h-full relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FF69B4]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-6 block">Resultado Sugerido pela BellaAI</span>
            <div className="flex-1 italic text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">
              {generatedCopy || "Selecione um objetivo e clique em gerar para ver a mágica acontecer... 🌸"}
            </div>
            {generatedCopy && (
              <div className="flex gap-4 mt-8 animate-in slide-in-from-bottom-4 duration-500">
                <button
                  onClick={() => startSendingSequence(clients, "Campanha Personalizada")}
                  className="flex-[2] py-4 bg-[#40E0D0] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Enviar p/ Lista
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCopy);
                    setIsCopied(true);
                    if (onShowToast) onShowToast("Texto copiado! ✨");
                    setTimeout(() => setIsCopied(false), 2000);
                  }}
                  className={`flex-1 py-4 border rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 ${isCopied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                >
                  {isCopied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  {isCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Campaign Execution (The actual sending engine) */}
      {executingCampaign && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl space-y-8 animate-in zoom-in duration-300 relative overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-2 bg-gray-100">
              <div
                className="h-full bg-[#40E0D0] transition-all duration-500"
                style={{ width: `${((executingCampaign.currentIndex + 1) / executingCampaign.clients.length) * 100}%` }}
              />
            </div>

            <div className="space-y-2">
              <div className="w-20 h-20 bg-teal-50 text-[#40E0D0] rounded-[2rem] flex items-center justify-center mx-auto mb-4 shadow-inner">
                <User size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {executingCampaign.clients[executingCampaign.currentIndex].name}
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">
                Cliente {executingCampaign.currentIndex + 1} de {executingCampaign.clients.length}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-[2rem] text-left border border-gray-100 max-h-40 overflow-y-auto scrollbar-hide">
              <p className="text-xs text-gray-400 font-black uppercase mb-2 tracking-widest">Prévia da Mensagem</p>
              <p className="text-sm text-gray-600 font-medium italic leading-relaxed">
                {(generatedCopy || copyInput).replace(/\[Nome\]/gi, executingCampaign.clients[executingCampaign.currentIndex].name.split(' ')[0])}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={sendToCurrentClient}
                className="w-full py-5 bg-[#40E0D0] text-white rounded-1.8rem font-black text-lg shadow-xl shadow-teal-50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Send size={22} /> Enviar WhatsApp <ArrowRight size={18} />
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={skipCurrentClient}
                  className="py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                  <SkipForward size={14} /> Pular
                </button>
                <button
                  onClick={() => setExecutingCampaign(null)}
                  className="py-4 bg-rose-50 text-rose-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2"
                >
                  <X size={14} /> Parar
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-300 font-medium italic">
              Dica: O WhatsApp abrirá em uma nova aba. Volte aqui para o próximo.
            </p>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {campaignSent && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 z-[200] border-4 border-white/10 backdrop-blur-xl">
          <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
            <CheckCircle size={28} />
          </div>
          <div>
            <span className="font-black text-lg block leading-none">Campanha Finalizada! 🚀</span>
            <span className="text-xs font-medium opacity-80">Mensagens enviadas com sucesso para a lista.</span>
          </div>
        </div>
      )}
    </div>
  );
};

const CampaignCard: React.FC<{ title: string; desc: string; reach: string; icon: React.ReactNode; color: string; onTrigger: () => void }> = ({ title, desc, reach, icon, color, onTrigger }) => (
  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
    <div>
      <div className="mb-6 bg-gray-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
        {icon}
      </div>
      <h4 className="text-xl font-black mb-2 group-hover:text-[#FF69B4] transition-colors tracking-tight">{title}</h4>
      <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8">{desc}</p>
    </div>
    <div className="flex items-center justify-between pt-6 border-t border-gray-50">
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Público Alvo</span>
        <span className="text-lg font-black text-gray-900 leading-none mt-1">{reach}</span>
      </div>
      <button
        onClick={onTrigger}
        className="px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 group-hover:shadow-lg active:scale-95"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        Ativar <ChevronRight size={16} />
      </button>
    </div>
  </div>
);

const AutomationToggle: React.FC<{ title: string; desc: string; active: boolean; onToggle?: () => void }> = ({ title, desc, active, onToggle }) => {
  return (
    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:bg-white transition-colors cursor-pointer group" onClick={onToggle}>
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-[#40E0D0] text-white' : 'bg-gray-200 text-gray-400'}`}>
          <Bell size={20} />
        </div>
        <div>
          <h4 className="font-bold text-gray-900 group-hover:text-[#40E0D0] transition-colors">{title}</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{desc}</p>
        </div>
      </div>
      <div className={`w-14 h-8 rounded-full relative transition-all duration-300 p-1 ${active ? 'bg-[#40E0D0]' : 'bg-gray-200'}`}>
        <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </div>
  );
}

export default MarketingView;
