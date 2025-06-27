import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
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
  genres: z.string().array(),
  summary: z.string(),
});

export async function getBookInsights(bookTitle: string, bookAuthor: string) {
  const completion = await openAIClient?.beta.chat.completions.parse({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert librarian. You know everything about every book. Respond with details about the book given the title and author',
      },
      {
        role: 'user',
        content: `What can you tell me about the book ${bookTitle} by ${bookAuthor}`,
      },
    ],
    response_format: zodResponseFormat(BookInsights, 'book_insights'),
  });

  return completion?.choices[0].message.parsed;
}
