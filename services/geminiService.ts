import { GoogleGenAI } from "@google/genai";
import { BetInputs, BetResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeBetWithGemini = async (inputs: BetInputs, result: BetResult): Promise<string> => {
  try {
    // Convert inputs to numbers for formatting
    const prob = Number(inputs.probability);
    const odd = Number(inputs.houseOdd);
    const stake = Number(inputs.stake);

    const prompt = `
      Você é um analista de apostas esportivas sênior (Punter) especializado em matemática e EV+.
      Analise a seguinte oportunidade de aposta:

      DADOS DA APOSTA:
      - Probabilidade Real (Minha Análise): ${prob.toFixed(2)}%
      - Odd da Casa: ${odd}
      - Stake: R$ ${stake}

      CÁLCULOS DO SISTEMA:
      - Odd Justa (Fair Line): ${result.fairOdd.toFixed(2)}
      - EV (Esperança Matemática): ${(result.evDecimal * 100).toFixed(2)}%
      - Resultado Monetário Esperado: R$ ${result.evMonetary.toFixed(2)}
      - Status: ${result.isPositive ? "EV+ POSITIVO" : "EV- NEGATIVO"}

      Forneça uma análise concisa de no máximo 3 parágrafos.
      1. Explique por que a aposta é boa ou ruim comparando a Odd da Casa com a Odd Justa (Conceito de Valor).
      2. Dê uma dica estratégica sobre gestão de banca baseada na agressividade deste EV.
      3. Mantenha um tom profissional, analítico e direto.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }, // Disable thinking for faster response on simple analysis
        temperature: 0.7,
      }
    });

    return response.text || "Não foi possível gerar a análise no momento.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Erro ao conectar com o analista virtual. Verifique sua chave de API.";
  }
};