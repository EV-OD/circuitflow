
import { GoogleGenAI, Type } from '@google/genai';
import { ComponentCategory } from '../../types';

// Initialize the API client
// Ensure API_KEY is present to prevent silent failures
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-to-prevent-crash' });

// Define the interface for the prompt structure
interface AIComponentResponse {
  type: string;
  label: string;
  category: string;
  symbol: string;
  description: string;
  ports: { id: string; name: string }[];
  defaultProperties: { key: string; value: string }[];
}

export async function generateComponentFromDatasheet(formData: FormData) {
  console.log("--- Starting Analysis (Gemini 2.5 Flash) ---");
  try {
    if (!apiKey) {
        throw new Error("System configuration error: API Key missing.");
    }

    const file = formData.get('datasheet') as File;
    if (!file) {
      throw new Error('No file uploaded');
    }

    console.log(`Processing file: ${file.name} (${file.size} bytes)`);

    // Optimized Base64 conversion using FileReader (Non-blocking)
    const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1]; 
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });

    console.log("File converted to Base64. Sending to Gemini...");

    const prompt = `
      You are an expert electronics engineer.
      Analyze the attached component datasheet (PDF or Image).
      
      Extract the following information to create a virtual component model:
      1. Component Name (Label)
      2. Unique type identifier (snake_case)
      3. Short description
      4. List of Pins/Ports (ID and Name).
      5. Electrical properties for simulation (Voltage, Current, etc).
      6. Symbol: ['generic', 'resistor', 'capacitor', 'diode', 'transistor_npn', 'transistor_nmos']. Use 'generic' for ICs.
    `;

    // Switching to gemini-2.5-flash for speed. It is capable of datasheet extraction.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: file.type, data: base64String } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Unique snake_case identifier" },
            label: { type: Type.STRING, description: "Display name e.g. 'NE555 Timer'" },
            description: { type: Type.STRING },
            symbol: { type: Type.STRING, description: "One of: generic, resistor, capacitor, diode, transistor_npn" },
            category: { type: Type.STRING, description: "Always return 'REAL_WORLD'" },
            ports: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING }
                }
              }
            },
            defaultProperties: {
              type: Type.ARRAY,
              items: {
                 type: Type.OBJECT,
                 properties: {
                    key: { type: Type.STRING },
                    value: { type: Type.STRING }
                 }
              }
            }
          }
        }
      }
    });

    console.log("Gemini response received.");

    if (!response.text) throw new Error("No response from AI");
    
    const data = JSON.parse(response.text) as AIComponentResponse;

    // Post-process to calculate visual port positions (Simple Box Layout)
    const portCount = data.ports.length;
    const sideCount = Math.ceil(portCount / 2);
    const spacing = 20;
    const height = Math.max(60, sideCount * spacing + 20);
    const width = 60;

    const processedPorts = data.ports.map((p, i) => {
        const isLeft = i < sideCount;
        const indexOnSide = isLeft ? i : (i - sideCount);
        // Calculate Y position centered
        const y = ((indexOnSide + 1) * spacing) - (height / 2) - 10;
        
        return {
            id: p.id,
            x: isLeft ? -width/2 : width/2,
            y: y
        };
    });

    // Convert properties array to object
    const propsObj: Record<string, string | number> = {};
    if (data.defaultProperties) {
        data.defaultProperties.forEach(p => {
            propsObj[p.key] = p.value;
        });
    }

    console.log("Component successfully generated:", data.label);

    return {
        success: true,
        component: {
            type: data.type,
            label: data.label,
            category: ComponentCategory.REAL_WORLD,
            symbol: data.symbol as any,
            defaultProperties: propsObj,
            ports: processedPorts,
            description: data.description
        }
    };

  } catch (error: any) {
    console.error("AI Generation Failed:", error);
    return { success: false, error: error.message || "Unknown error occurred" };
  }
}
