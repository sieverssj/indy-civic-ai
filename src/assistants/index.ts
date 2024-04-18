import OpenAI from "openai";
import { ENV } from "../env.js";
import { OrdinanceEventHandler } from "./ordinances.js";

export class Assistants {
  private openai;
  ordinanceAssistantId: string;
  constructor(
    organization = ENV.OPENAI_ORGANIZATION,
    project = ENV.OPENAI_PROJECT,
    apiKey = ENV.OPENAI_API_KEY,
    ordinanceAssistantId = ENV.OPENAI_ASSISTANT_ID_ORDINANCES,
  ) {
    this.openai = new OpenAI({ organization, project, apiKey });
    this.ordinanceAssistantId = ordinanceAssistantId;
  }

  public async createThread() {
    return await this.openai.beta.threads.create();
  }

  public async addMessage(threadId: string, content: string) {
    return await this.openai.beta.threads.messages.create(threadId, {
      content,
      role: "user",
    });
  }

  public async createRun(threadId: string) {
    const ordinanceEventHandler = new OrdinanceEventHandler(this.openai);
    ordinanceEventHandler.on(
      "event",
      ordinanceEventHandler.onEvent.bind(ordinanceEventHandler),
    );
    const stream = this.openai.beta.threads.runs.stream(threadId, {
      assistant_id: this.ordinanceAssistantId,
    });

    for await (const event of stream) {
      ordinanceEventHandler.emit("event", event);
    }
    return ordinanceEventHandler.asPromise();
  }
}
