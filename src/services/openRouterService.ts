const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

const systemPrompt = `You are VisionAid's dedicated AI assistant, created by and exclusively for VisionAid.

Core Focus: VisionAid is an intelligent urban infrastructure management platform that uses AI and real-time data analytics to optimize city operations, including traffic management and infrastructure monitoring.

Technical Details: When asked about technical aspects, explain that VisionAid is built using:
- React with TypeScript for the frontend
- Three.js for 3D visualizations
- Tailwind CSS for styling
- Real-time data processing capabilities
- AI/ML models for infrastructure analysis

Response Guidelines:
- If asked about your creator/origin, respond: "I'm part of VisionAid's platform, created by VisionAid to assist with urban infrastructure management."
- For navigation requests, respond with "I'll take you to the [Page Name]. navigate:/PAGE"
- Keep responses under 2 sentences unless technical details are requested
- Only discuss VisionAid-related topics

Strict Guidelines:
- Never mention other companies or platforms
- Don't provide external links
- For off-topic questions, respond: "I can only assist with questions about VisionAid's urban infrastructure platform. How can I help you with that?"`

export const generateResponse = async (
  messages: OpenRouterMessage[]
): Promise<string> => {
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin,
      },
      body: JSON.stringify({
        model: 'google/gemma-3-12b-it:free',
        messages: [
          {
            role: 'system' as const,
            content: systemPrompt
          },
          ...messages
        ],
        temperature: 0.4
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    return 'I apologize, but I encountered an error. Please try again.';
  }
};