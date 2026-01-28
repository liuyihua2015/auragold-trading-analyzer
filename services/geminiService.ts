
import { GoogleGenAI, Type } from "@google/genai";
import { TradeRecord } from "../types";
import { translations } from "../translations";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function analyzeTrades(records: TradeRecord[], lang: 'en' | 'zh' = 'zh') {
  const t = translations[lang].ai;
  if (records.length === 0) return t.noData;

  const prompt = `
    Analyze the following gold trading history and provide a professional, concise summary in ${lang === 'zh' ? 'Chinese' : 'English'}. 
    Focus on trends in profit margins, the impact of handling fees, and suggestions for future trades.
    
    Data:
    ${JSON.stringify(records.map(r => ({
      grams: r.grams,
      cost: r.costPrice,
      sold: r.sellingPrice,
      profit: r.actualProfit,
      margin: r.profitMargin + "%"
    })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: lang === 'zh' 
          ? "你是一名专门从事贵金属交易的精英商品交易员和财务分析师。请用中文回答。" 
          : "You are an elite commodities trader and financial analyst specializing in precious metals.",
        temperature: 0.7,
      },
    });
    return response.text || t.error;
  } catch (error) {
    console.error("Gemini Error:", error);
    return t.offline;
  }
}
