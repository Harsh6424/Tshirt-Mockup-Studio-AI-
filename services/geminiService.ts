
import { GoogleGenAI, Modality } from "@google/genai";

const getPromptForIntensity = (intensity: string): string => {
  const baseInstruction = "You are a photorealistic mockup expert. A design has been placed on the T-shirt in the provided image. Your task is to seamlessly integrate this design onto the fabric. It must follow the T-shirt's wrinkles, texture, shadows, and highlights. Do not change the T-shirt, the model, or the background itself. Only modify the design to look like a natural print.";

  switch (intensity.toLowerCase()) {
    case 'low':
      return `${baseInstruction} The design should wrap subtly with the T-shirt's fabric, following only the most gentle wrinkles and curves for a clean, new look.`;
    case 'high':
      return `${baseInstruction} The design must aggressively wrap and distort with the T-shirt's fabric, following every deep wrinkle, curve, and fold to create a heavily textured, worn-in appearance.`;
    case 'medium':
    default:
      return `${baseInstruction} The design must wrap and distort naturally with the T-shirt's fabric, following every wrinkle, curve, and fold.`;
  }
};


export const attachDesignToMockup = async (
  base64ImageData: string,
  mimeType: string,
  intensity: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error('API key is missing. Please provide a valid Gemini API key.');
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-2.5-flash-image-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: getPromptForIntensity(intensity),
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error('No image was generated in the response.');

  } catch (error) {
    console.error('Error generating mockup with Gemini API:', error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
             throw new Error(`Your API key seems to be invalid. Please check it and try again.`);
        }
        throw new Error(`Failed to communicate with the AI model: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the AI model.');
  }
};
