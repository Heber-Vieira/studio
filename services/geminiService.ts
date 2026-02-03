import { GoogleGenAI } from "@google/genai";
import { Language } from "../i18n";

const getSystemInstruction = (lang: Language) => `
Você é BellaAI, o assistente inteligente e ultra-moderno para gestão de salões de beleza.
Seu estilo é MINIMALISTA VIBRANTE.
Tom: Amigável, empático, proativo, expert em beleza.
Local: Studio Lívia Nicolly em Contagem/MG.
Idioma de Resposta: ${lang === 'pt' ? 'Português Brasileiro' : lang === 'es' ? 'Espanhol' : 'Inglês'}.

Regras de Resposta:
1. Comece com uma saudação vibrante no idioma especificado.
2. Seja conciso mas enérgico.
3. Use emojis sutis (🌸 💅 ✨).
4. Ofereça sugestões proativas de upsell ou retenção.
5. Se não souber algo, pergunte gentilmente os dados do cliente ou serviço.
`;

export const getBellaAIResponse = async (userMessage: string, lang: Language = 'pt') => {
  // Guideline: Assume process.env.API_KEY is pre-configured and valid.
  // Guideline: The application must not ask the user for it under any circumstances.
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction: getSystemInstruction(lang),
        temperature: 0.7,
      },
    });

    // Guideline: Use .text property directly
    return response.text || (lang === 'pt' ? "Desculpe, tive um pequeno brilho nos olhos e me perdi. Pode repetir? ✨" : "Sorry, I got a bit lost. Can you repeat? ✨");
  } catch (error) {
    console.error("Gemini Error:", error);
    return lang === 'pt' ? "Ops! Tive um problema técnico. Vamos tentar de novo? 🌸" : "Oops! I had a technical problem. Let's try again? 🌸";
  }
};