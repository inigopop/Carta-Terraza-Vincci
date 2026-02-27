import { GoogleGenAI } from "@google/genai";
import { MenuItem, PAIRING_SCHEMA, COCKTAILS, SNACKS } from "../constants";

// Use a safe way to access the API key that works in both AI Studio and production builds
const getApiKey = () => {
  try {
    // Vite will replace this exact string with the value during build
    return process.env.GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export async function getPairingRecommendation(item: MenuItem, isCocktail: boolean, lang: 'es' | 'en' = 'es') {
  const otherList = isCocktail ? SNACKS : COCKTAILS;
  const otherListNames = otherList.map(i => lang === 'es' ? i.name : (i.nameEn || i.name)).join(", ");
  
  const prompt = lang === 'es' ? `
    Eres un sommelier y mixólogo experto de "The Botanical Lounge" en Vincci Hoteles.
    Tu misión es recomendar el maridaje perfecto para un cliente.

    El cliente ha seleccionado: "${item.name}" (${isCocktail ? 'Cóctel' : 'Snack'}).
    Detalles del producto: ${item.description || item.ingredients?.join(", ")}.
    
    Por favor, elige el mejor acompañamiento EXCLUSIVAMENTE de esta lista de ${isCocktail ? 'Snacks' : 'Cócteles'}: [${otherListNames}].
    
    Explica la armonía de sabores de forma elegante, breve y profesional.
    Responde siempre en español.
  ` : `
    You are an expert sommelier and mixologist at "The Botanical Lounge" in Vincci Hotels.
    Your mission is to recommend the perfect pairing for a customer.

    The customer has selected: "${item.nameEn || item.name}" (${isCocktail ? 'Cocktail' : 'Snack'}).
    Product details: ${item.descriptionEn || item.description || item.ingredientsEn?.join(", ") || item.ingredients?.join(", ")}.
    
    Please choose the best accompaniment EXCLUSIVELY from this list of ${isCocktail ? 'Snacks' : 'Cocktails'}: [${otherListNames}].
    
    Explain the harmony of flavors in an elegant, brief, and professional way.
    Always respond in English.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: PAIRING_SCHEMA,
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error getting recommendation:", error);
    
    // Fallback logic: Pick a random item from the other list to show "possibilities"
    const randomIndex = Math.floor(Math.random() * otherList.length);
    const fallbackItem = otherList[randomIndex];
    const fallbackItemName = lang === 'es' ? fallbackItem.name : (fallbackItem.nameEn || fallbackItem.name);

    return {
      recommendation: lang === 'es' 
        ? `Este acompañamiento realza los matices de tu elección, creando una experiencia equilibrada y sofisticada en nuestro lounge.`
        : `This accompaniment enhances the nuances of your choice, creating a balanced and sophisticated experience in our lounge.`,
      reason: lang === 'es' 
        ? "Armonía de sabores seleccionada por nuestro criterio de sommelier (Modo Offline)."
        : "Harmony of flavors selected by our sommelier criteria (Offline Mode).",
      suggestedItem: fallbackItemName
    };
  }
}
