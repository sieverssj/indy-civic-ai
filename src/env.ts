import "dotenv/config";

export interface Environment {
  OPENAI_ORGANIZATION: string;
  OPENAI_PROJECT: string;
  OPENAI_API_KEY: string;
  OPENAI_ASSISTANT_ID_ORDINANCES: string;
}
export const ENV = {
  OPENAI_ORGANIZATION: process.env.OPENAI_ORGANIZATION,
  OPENAI_PROJECT: process.env.OPENAI_PROJECT,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_ASSISTANT_ID_ORDINANCES: process.env.OPENAI_ASSISTANT_ID_ORDINANCES,
} as Environment;
