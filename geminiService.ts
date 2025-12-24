
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GenerationResult } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateQuestStep(
  scenario: string,
  history: string,
  baseImageBase64: string | null
): Promise<GenerationResult> {
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      Ты — ведущий абсурдной игры "Жандос во времени".
      Сценарий: ${scenario}
      Текущая история: ${history}
      
      Жандос — персонаж с забавными привычками (постоянно ищет зарядку, любит перекусить в неподходящий момент, пытается все "оптимизировать" и ленится, если можно).
      
      Напиши следующую главу приключений (около 3-4 предложений). 
      Затем напиши 3 варианта действий для Жандоса.
      И создай короткий, точный промпт на английском для генерации изображения Жандоса в этом окружении. 
      Промпт должен описывать Жандоса как "A young Asian man with short dark hair, wearing [themed clothes], in [themed setting], cinematic lighting, detailed background".
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          storyText: { type: Type.STRING },
          choices: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          imagePrompt: { type: Type.STRING }
        },
        required: ["storyText", "choices", "imagePrompt"]
      }
    }
  });

  const response = await model;
  const result = JSON.parse(response.text) as GenerationResult;

  // Now generate the image using the flash-image model
  // We use the base image of Zhandos to preserve his likeness if possible
  let finalImageUrl = 'https://picsum.photos/800/800'; // Fallback
  
  if (baseImageBase64) {
    try {
      const imgModel = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: baseImageBase64.split(',')[1],
                mimeType: 'image/jpeg',
              },
            },
            {
              text: `Generate an image where this person's head and face is seamlessly integrated onto a body that matches this description: ${result.imagePrompt}. Ensure the lighting matches the scene. Realistic style.`,
            },
          ],
        },
      });

      for (const part of imgModel.candidates[0].content.parts) {
        if (part.inlineData) {
          finalImageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (e) {
      console.error("Image generation failed", e);
    }
  }

  return { ...result, imagePrompt: finalImageUrl }; // We swap prompt with the actual URL for simplicity in this flow
}
