import OpenAI from 'openai';
import { z } from 'zod';

let openAIClient: OpenAI | undefined;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_PROJECT_ID && process.env.OPENAI_ORG_ID) {
  openAIClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    project: process.env.OPENAI_PROJECT_ID,
    organization: process.env.OPENAI_ORG_ID,
  });
}

const BookInsights = z.object({
  genres: z.array(z.string()),
  summary: z.string(),
});

export async function getBookInsights(bookTitle: string, bookAuthor: string) {
  if (!openAIClient) return;

  const completion = await openAIClient.responses.parse({
    model: 'gpt-4o-mini', // oder: gpt-4o
    input: [
      {
        role: 'system',
        content:
          'You are an expert librarian. Respond with details about the book given title + author.',
      },
      {
        role: 'user',
        content: `What can you tell me about the book "${bookTitle}" by ${bookAuthor}?`,
      },
    ],
    schema: BookInsights,
  });

  return completion.output;
}

