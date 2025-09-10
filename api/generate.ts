import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from "@google/genai";

// --- Type definitions (copied from frontend for server-side use) ---
interface ComicPanel {
  image: string;
  text: string;
}
interface PanelPromptData {
  image_prompt: string;
  panel_text?: string;
}
interface CharacterImage {
  base64: string;
  mimeType: string;
}
// --- End of Type definitions ---

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function generatePanelPrompts(story: string, characters: CharacterImage[], includeText: boolean, numPanels: number): Promise<PanelPromptData[]> {
    const panelPromptSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                image_prompt: {
                    type: Type.STRING,
                    description: "A detailed, dynamic, and visually rich prompt for an AI image generator, including character descriptions and art style.",
                },
                ...(includeText && {
                    panel_text: {
                        type: Type.STRING,
                        description: "The short, punchy narration or dialogue for this panel. Should fit in a comic book caption.",
                    }
                })
            },
            required: ["image_prompt", ...(includeText ? ["panel_text"] : [])],
        },
    };

    const prompt = `
        You are a creative and funny comic book writer with an expert eye for art styles and character details. Your task is to generate prompts for a ${numPanels}-panel comic strip.

        **Analysis Phase:**
        1.  **Art Style:** First, CAREFULLY ANALYZE the art style shared across all provided character images. Identify key features like line work, coloring, shading, and overall mood. Let's call this the "source art style".
        2.  **Character Details:** Next, for each character image provided ("Character 1", "Character 2", etc.), create a concise but detailed description of their key visual features (e.g., "Character 1 is a male with short, spiky blonde hair, wearing round glasses and a blue hoodie."). You will use these exact descriptions later.

        **Generation Phase:**
        Based on the story below, create a series of ${numPanels} detailed image prompts.

        **Story:** "${story}"

        **Instructions for EACH of the ${numPanels} panels:**
        1.  **Start with the Art Style:** Every image prompt MUST begin with a description of the "source art style" you identified. This is non-negotiable for visual consistency.
        2.  **Incorporate Character Details:** When a character appears in a panel, you MUST use the detailed description you created for them in the Analysis Phase. For instance, if the panel includes Character 1, the prompt should say "...featuring Character 1 (male with short, spiky blonde hair, wearing round glasses and a blue hoodie)...". This ensures characters look the same in every panel.
        3.  **Describe the Scene:** Detail the background, character actions, expressions, and composition based on the story for that specific panel.

        ${
            includeText
                ? `For each panel, also create a "panel_text" with short, punchy narration or dialogue that fits in a comic book caption or speech bubble.`
                : `CRITICAL: Do NOT generate any "panel_text". The comic strip must be purely visual and wordless. The image prompts should describe scenes without any need for text, speech bubbles, or sound effects.`
        }

        Your final output must be a JSON array of exactly ${numPanels} objects that strictly follows the provided schema. Do not include any extra text, explanations, or markdown formatting before or after the JSON.
    `;

    const imageParts = characters.map(char => ({
        inlineData: {
            data: char.base64,
            mimeType: char.mimeType,
        },
    }));

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [{ text: prompt }, ...imageParts] },
        config: { responseMimeType: "application/json", responseSchema: panelPromptSchema },
    });
    
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText);
    if (Array.isArray(parsedJson) && parsedJson.length > 0) {
        return parsedJson as PanelPromptData[];
    }
    throw new Error("Parsed JSON is not a valid array of panel prompts.");
}

async function generateImage(prompt: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
    }
    throw new Error("Image generation failed for a panel.");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { story, characters, includeText, numPanels } = req.body;

        if (!story || !characters || characters.length === 0 || !numPanels) {
            return res.status(400).json({ error: 'Missing required parameters.' });
        }

        const panelPrompts = await generatePanelPrompts(story, characters, includeText, numPanels);

        if (panelPrompts.length !== numPanels) {
            throw new Error(`Expected ${numPanels} panel prompts, but received ${panelPrompts.length}.`);
        }

        const imageGenerationPromises = panelPrompts.map(p => {
            let finalImagePrompt = p.image_prompt;
            if (!includeText) {
                 finalImagePrompt += ", wordless, no text, no speech bubbles, no letters";
            }
            return generateImage(finalImagePrompt);
        });

        const generatedImages = await Promise.all(imageGenerationPromises);

        const finalPanels: ComicPanel[] = panelPrompts.map((promptData, index) => ({
            image: `data:image/jpeg;base64,${generatedImages[index]}`,
            text: promptData.panel_text || "",
        }));

        return res.status(200).json({ panels: finalPanels });

    } catch (err: any) {
        console.error("Error in serverless function:", err);
        return res.status(500).json({ error: err.message || 'An internal server error occurred.' });
    }
}
