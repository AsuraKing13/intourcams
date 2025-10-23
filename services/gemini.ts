import { GoogleGenAI, Type } from "@google/genai";
import { AppEvent } from '../types.ts';

// Helper to get a formatted error message
const getFormattedError = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
        const apiError = err as { message: string; details?: string; hint?: string; code?: string };
        return `API Error: ${apiError.message}${apiError.details ? ` Details: ${apiError.details}` : ''}`;
    }
    try {
        return `An unexpected error occurred: ${JSON.stringify(err)}`;
    } catch {
        return 'An unknown and un-serializable error occurred.';
    }
};

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a marketing description for a tourism cluster.
 */
export const generateClusterDescription = async (name: string, categories: string[], vibe: string): Promise<string> => {
    try {
        const prompt = `As a creative tourism copywriter, write a short, engaging marketing description for a tourism spot in Sarawak, Malaysia named "${name}" which falls under the categories "${categories.join(', ')}". ${vibe ? `The desired tone is "${vibe}". Craft the description in a compelling, ${vibe} style.` : ''} Highlight its key attractions in 2-3 concise sentences.`;
        
        const response = await ai.models.generateContent({ 
            model: 'gemini-2.5-flash', 
            contents: prompt 
        });

        return response.text.trim();
    } catch (error) {
        throw new Error(getFormattedError(error));
    }
};

/**
 * Generates an analytical summary for events in a given year.
 */
type GroundingChunk = { web?: { uri?: string; title?: string } };
export const generateEventAnalyticsInsight = async (events: AppEvent[], year: number): Promise<{ summary: string; sources: GroundingChunk[] }> => {
    if (events.length === 0) {
        return { summary: "No event data for this year to analyze.", sources: [] };
    }
    
    try {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyData = monthNames.map(name => ({ month: name, 'Number of Events': 0 }));
        events.forEach(event => {
            const monthIndex = new Date(event.start_date).getMonth();
            monthlyData[monthIndex]['Number of Events']++;
        });

        const eventTitles = events.map(e => e.title).slice(0, 100).join(', ');
        const monthlyCounts = monthlyData.map(m => `${m.month}: ${m['Number of Events']}`).join(', ');

        const prompt = `
            As a professional data analyst preparing a report for the Sarawak Tourism Board, your task is to analyze the provided event data for Sarawak in the year ${year}. You must use the web search tool *only* to support and add context to your analysis of the given data.

            The primary source of your analysis is the following dataset:
            - A list of event titles for the year, including: ${eventTitles}.
            - The monthly distribution of these events, as follows: ${monthlyCounts}.

            Based on this data, construct your analytical report:
            1.  Start by stating the total number of events recorded for the year.
            2.  Analyze the distribution of events throughout the year based on the monthly counts provided, identifying peak and off-peak periods.
            3.  Examine the provided event titles to identify recurring themes or major categories of events held.
            4.  Use web search to gather supporting details (e.g., significance, scale, public reception) for the *specific* events or themes you identified from the data. Use this external information to add context to why certain periods were busy or to elaborate on the nature of the key events.
            5.  Conclude with a neutral, data-driven summary of the event landscape for the year.
            6. In a final, separate paragraph, provide a predictive outlook for the next year. Based on the identified trends (peak seasons, recurring major events), suggest potential growth areas or periods that might see increased activity. Frame this as a strategic forecast.

            The final output must be in a formal report style, written in the third person, and presented in 3-4 concise paragraphs. Avoid speculative or marketing language in the main analysis, but the final predictive paragraph should be clearly framed as a forecast.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const summary = response.text;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return { summary, sources };
    } catch (error) {
        console.error("Error in generateEventAnalyticsInsight:", getFormattedError(error));
        return { summary: "Could not generate AI-powered insights at this time. The model may have had an issue with the request.", sources: [] };
    }
};

/**
 * Generates trip recommendations based on user preferences and available items.
 */
interface Recommendation {
    id: string;
    type: 'cluster' | 'event';
    name: string;
    justification: string;
    location: string;
}
export const generateItineraryRecommendations = async (preferences: any, items: any[]): Promise<Recommendation[]> => {
    let responseText = ''; // To store raw response for logging
    try {
        const dataForAI = items.map(item => {
            if (item.itemType === 'cluster') {
                return { id: item.id, name: item.name, location: item.display_address || item.location, category: item.category.join(', ') };
            } else { // 'event'
                return { id: item.id, name: item.title, location: item.display_address || item.location_name, category: item.category, start_date: item.start_date, end_date: item.end_date };
            }
        });

        const prompt = `
            You are an expert travel planner for Sarawak, Malaysia. Your task is to analyze the user's preferences holistically and recommend the top 5 most suitable activities or locations from the provided data. You must consider how the preferences interact with each other to create a practical and enjoyable itinerary.

            User Preferences:
            - Location Focus: ${preferences.location || 'Anywhere in Sarawak'}
            - Desired Activities: ${Array.from(preferences.activities).join(', ') || 'Any'}
            - Trip Duration: ${preferences.duration} days
            - Budget: Approximately RM ${preferences.budget} per person

            Your Reasoning Framework:
            1.  **Duration & Location:** A short duration (${preferences.duration} days) means recommendations should be geographically clustered to minimize travel time. For longer durations, you can suggest a wider area. If a location is specified, prioritize options within or very near that location.
            2.  **Budget & Activities:** A lower budget suggests prioritizing free attractions, affordable food spots, or clusters with no entry fees. A higher budget allows for paid tours, ticketed events, and more premium experiences.
            3.  **Interests & Synergy:** Combine interests intelligently. For a user interested in 'Nature' and 'Adventure', a national park with trekking is a better fit than a cultural village. For 'Food' and 'Culture', a historic bazaar with famous local dishes is ideal.
            4.  **Events vs. Clusters:** Prioritize events if their dates align with a potential trip and match the user's interests. Otherwise, focus on clusters which are generally always available.

            Available Data (Note: Full descriptions are not provided, infer from name and category):
            ${JSON.stringify(dataForAI)}

            Based on your holistic analysis, return a JSON array of the top 5 recommendations. For each recommendation, provide a concise justification explaining *why* it's a great match, referencing the interactions between the user's preferences. Ensure the 'type' is either 'cluster' or 'event'.
        `;
        
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "The original ID of the cluster or event from the provided data." },
                    type: { type: Type.STRING, description: "Must be either 'cluster' or 'event'." },
                    name: { type: Type.STRING, description: "The name of the cluster or event." },
                    location: { type: Type.STRING, description: "The location or address of the item." },
                    justification: { type: Type.STRING, description: "A short, engaging explanation of why this is a good match for the user's preferences." }
                },
                required: ["id", "type", "name", "location", "justification"]
            }
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });
        
        responseText = response.text.trim();
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            responseText = jsonMatch[1];
        }

        const result = JSON.parse(responseText);
        if (Array.isArray(result)) {
            const isValidResult = result.every(item => 
                typeof item === 'object' && item !== null &&
                'id' in item && 'type' in item && 'name' in item &&
                'location' in item && 'justification' in item
            );
            if (isValidResult) {
                return result;
            }
        }
        // This will be caught by the catch block below.
        throw new Error("The AI returned a JSON object with an invalid structure.");
    } catch (error) {
        // Log more helpful info and re-throw a formatted error.
        console.error(`AI Itinerary Generation Failed. Raw response from model was: "${responseText}"`, error);
        throw new Error(`AI generation failed: ${getFormattedError(error)}`);
    }
};