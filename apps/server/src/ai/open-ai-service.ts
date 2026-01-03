import OpenAI from 'openai';

let openAIClient: OpenAI | undefined;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_PROJECT_ID && process.env.OPENAI_ORG_ID) {
  openAIClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    project: process.env.OPENAI_PROJECT_ID,
    organization: process.env.OPENAI_ORG_ID,
  });
}

type BookInsights = {
  genres: string[];
  summary: string;
};

export async function getBookInsights(
  bookTitle: string,
  bookAuthor: string
): Promise<BookInsights | null> {
  if (!openAIClient) {
    return null;
  }

  const completion = await openAIClient.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You are an expert librarian. You know everything about every book. Respond with details about the book given the title and author. Return a JSON object with "genres" (array of strings) and "summary" (string).',
      },
      {
        role: 'user',
        content: `What can you tell me about the book ${bookTitle} by ${bookAuthor}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content) as BookInsights;
  } catch {
    return null;
  }
}
