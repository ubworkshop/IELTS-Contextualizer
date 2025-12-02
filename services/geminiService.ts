import { GoogleGenAI, Type } from "@google/genai";
import { VocabularyAnalysis } from "../types";

// Initialize the Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to extract relevant sentences locally before sending to LLM
// This saves tokens and improves relevance.
export const extractRelevantSentences = (
  documents: { id: string; name: string; content: string }[],
  keyword: string
): { sentence: string; docId: string; docName: string }[] => {
  const matches: { sentence: string; docId: string; docName: string }[] = [];
  const lowerKeyword = keyword.toLowerCase();

  // Regex to split text into sentences (naïve approach handling common endings)
  // Looks for periods, exclamation marks, or question marks followed by space or end of line.
  const sentenceRegex = /[^.!?]+[.!?]+(?=\s|$)/g;
  
  // Number of sentences to include before and after the match
  const CONTEXT_WINDOW = 2;

  for (const doc of documents) {
    const sentences = doc.content.match(sentenceRegex);
    if (!sentences) continue;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      if (sentence.toLowerCase().includes(lowerKeyword)) {
        // Define the window indices
        const start = Math.max(0, i - CONTEXT_WINDOW);
        const end = Math.min(sentences.length, i + CONTEXT_WINDOW + 1);
        
        // Create the context block
        const contextBlock = sentences
          .slice(start, end)
          .map(s => s.trim())
          .join(' ');

        matches.push({
          sentence: contextBlock,
          docId: doc.id,
          docName: doc.name
        });
      }
    }
  }

  // Deduplicate matches based on exact text content
  const uniqueMatches = new Map();
  matches.forEach(m => {
    if (!uniqueMatches.has(m.sentence)) {
      uniqueMatches.set(m.sentence, m);
    }
  });

  // Limit to top 8 examples to avoid overwhelming the prompt/user
  return Array.from(uniqueMatches.values()).slice(0, 8);
};

export const analyzeVocabularyInContext = async (
  keyword: string,
  examples: { sentence: string; docId: string; docName: string }[]
): Promise<VocabularyAnalysis[]> => {
  if (examples.length === 0) {
    return [];
  }

  const model = "gemini-2.5-flash";

  // Prepare the structured input for the model
  const examplesText = examples
    .map((ex, index) => `Example ${index + 1}: ${ex.sentence}`)
    .join("\n\n");

  const prompt = `
    I am an IELTS student. I have found the word "${keyword}" in my reading materials.
    
    Here are the text excerpts where I found it:
    ${examplesText}

    For each example, please provide:
    1. The Chinese translation of the text excerpt (focusing on the sentence containing the keyword).
    2. The specific meaning of "${keyword}" as it is used in *this specific context* (e.g., is it a verb, noun? what shade of meaning?).

    Return the result as a strict JSON array matching the requested schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              exampleIndex: {
                type: Type.INTEGER,
                description: "The index of the example provided (1-based)",
              },
              chineseTranslation: {
                type: Type.STRING,
                description: "Natural Chinese translation of the text snippet.",
              },
              wordMeaningInContext: {
                type: Type.STRING,
                description: "Explanation of the keyword's meaning and usage in this specific context.",
              },
            },
            required: ["exampleIndex", "chineseTranslation", "wordMeaningInContext"],
          },
        },
      },
    });

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No data returned from Gemini");
    }

    const parsedData = JSON.parse(jsonText) as {
      exampleIndex: number;
      chineseTranslation: string;
      wordMeaningInContext: string;
    }[];

    // Merge the AI analysis back with the original document metadata
    return parsedData.map((item) => {
      const original = examples[item.exampleIndex - 1];
      return {
        originalSentence: original.sentence,
        chineseTranslation: item.chineseTranslation,
        wordMeaningInContext: item.wordMeaningInContext,
        sourceDocId: original.docId,
        sourceDocName: original.docName,
      };
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze vocabulary. Please check your API key and try again.");
  }
};
