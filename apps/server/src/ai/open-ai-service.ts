import OpenAI from 'openai';
import { z } from 'zod';

const BookInsights = z.object({
  genres: z.array(z.string()),
  summary: z.string(),
});

let cachedClient: OpenAI | null = null;

function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const project = process.env.OPENAI_PROJECT_ID;
  const organization = process.env.OPENAI_ORG_ID;

  if (!cachedClient) {
    cachedClient = new OpenAI({
      apiKey,
      ...(project ? { project } : {}),
      ...(organization ? { organization } : {}),
    });
  }
  return cachedClient;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {}

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }

  throw new Error(`Model did not return JSON. Got: ${text.slice(0, 200)}…`);
}

export async function getBookInsights(bookTitle: string, bookAuthor: string) {
  const client = getClient();
  if (!client) return undefined;

  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert librarian. Respond ONLY with a JSON object with fields: {"genres": string[], "summary": string}.',
      },
      {
        role: 'user',
        content: `Give me genres and a short summary for "${bookTitle}" by ${bookAuthor}.`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content ?? '{}';
  const data = safeJsonParse(content);

  return BookInsights.parse(data);
}
