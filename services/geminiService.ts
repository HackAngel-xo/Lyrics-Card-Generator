import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { SongInfo } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const songInfoSchema = {
  type: Type.OBJECT,
  properties: {
    songTitle: {
      type: Type.STRING,
      description: 'The official title of the song.'
    },
    artist: {
      type: Type.STRING,
      description: 'The name of the primary artist or band.'
    },
    fullLyrics: {
      type: Type.STRING,
      description: 'The full, complete lyrics of the song. Include line breaks between verses and chorus.'
    },
    albumArtDescription: {
      type: Type.STRING,
      description: 'A vivid and detailed visual description of the original album cover art associated with the song.'
    }
  },
  required: ['songTitle', 'artist', 'fullLyrics', 'albumArtDescription']
};

export async function fetchSongInfo(query: string): Promise<SongInfo> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Based on the song query "${query}", provide the official song title, artist name, the full lyrics, and a detailed visual description of the original album cover art.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: songInfoSchema,
      }
    });

    const text = response.text.trim();
    const parsed = JSON.parse(text);
    // Basic validation
    if (!parsed.fullLyrics || !parsed.songTitle || !parsed.artist) {
      throw new Error("Received incomplete song data from API.");
    }
    return parsed as SongInfo;

  } catch (error) {
    console.error("Error fetching song info:", error);
    throw new Error("Failed to get song details from Gemini API.");
  }
}

export async function generateAlbumArt(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

        if (imagePart?.inlineData) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }
    } catch (error) {
        console.error("Error generating album art:", error);
        throw new Error("Failed to generate album art from Gemini API.");
    }
}
