
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { getBellaAIResponse } from '../services/geminiService';
import { Language } from '../i18n';

interface ChatBellaAIProps {
  lang: Language;
}

const ChatBellaAI: React.FC<ChatBellaAIProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);

  const initialMessage = lang === 'pt'
    ? 'Oi! 🌸 Estou aqui pronta para deixar o Studio Lívia Nicolly vibrante. O que vamos fazer hoje?'
    : lang === 'es'
      ? '¡Hola! 🌸 Estoy lista para hacer que el Studio Lívia Nicolly sea vibrante. ¿Qué haremos hoy?'
      : 'Hi! 🌸 I\'m here ready to make Studio Lívia Nicolly vibrant. What shall we do today?';

  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: initialMessage }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    const aiResponse = await getBellaAIResponse(userMsg, lang);
    setMessages(prev => [...prev, { role: 'ai', text: aiResponse }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      {isOpen ? (
        <div className="w-80 md:w-96 h-[500px] bg-white rounded-[2rem] shadow-2xl flex flex-col border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#FF69B4] p-5 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="font-bold">BellaAI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:rotate-90 transition-transform">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F5F5]/30">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                  ${m.role === 'user'
                    ? 'bg-[#FF69B4] text-white rounded-tr-none'
                    : 'bg-white text-gray-700 shadow-sm rounded-tl-none'}
                `}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm animate-pulse flex gap-1">
                  <div className="w-2 h-2 bg-pink-200 rounded-full"></div>
                  <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={lang === 'pt' ? "Fale com a BellaAI..." : lang === 'es' ? "Habla con BellaAI..." : "Talk to BellaAI..."}
              className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#FF69B4] outline-none"
            />
            <button
              onClick={handleSend}
              className="p-2 bg-[#FF69B4] text-white rounded-xl shadow-lg shadow-pink-100 hover:scale-110 transition-transform"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[#FF69B4] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform vibrant-glow"
        >
          <MessageCircle size={28} />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#40E0D0] border-2 border-white rounded-full animate-bounce"></div>
        </button>
      )}
    </div>
  );
};

export default ChatBellaAI;
