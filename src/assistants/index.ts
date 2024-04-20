import OpenAI from "openai";
import { ENV } from "../env.js";
import { OrdinanceEventHandler } from "./ordinances.js";
import { OperatorEventHandler } from "./operator.js";

// CONSIDER: Is this generalizable? Would the Operator use this to talk to sub-assistants? I think so.
export class Assistants {
  private openai;
  private operatorAssistantId: string;
  constructor(
    organization = ENV.OPENAI_ORGANIZATION,
    project = ENV.OPENAI_PROJECT,
    apiKey = ENV.OPENAI_API_KEY,
    operatorAssistantId = ENV.OPENAI_ASSISTANT_ID_OPERATOR,
  ) {
    this.openai = new OpenAI({ organization, project, apiKey });
    this.operatorAssistantId = operatorAssistantId;
  }

  public async createThread() {
    console.log("createThread")
    return await this.openai.beta.threads.create();
  }

  public async addMessage(threadId: string, content: string) {
    console.log(`addMessage (${threadId}): ${content}`)
    return await this.openai.beta.threads.messages.create(threadId, {
      content,
      role: "user",
    });
  }

  public async createRun(threadId: string) {
    console.log(`createRun: ${threadId}`)
    const operatorEventHandler = new OperatorEventHandler(this.openai);
    operatorEventHandler.on(
      "event",
      operatorEventHandler.onEvent.bind(operatorEventHandler),
    );
    const stream = this.openai.beta.threads.runs.stream(threadId, {
      assistant_id: this.operatorAssistantId,
    });

    // This is so janky. We're awaiting the stream events to emit them to our handler. 
    // This is great until the handler makes tool calls. The subsequent event after tool 
    // output submission aren't in this stream and we'll return. That's why we do 
    // this janky promise creation. Need to sit and think about how to best do this.
    const promise = operatorEventHandler.asPromise();
    for await (const event of stream) {
      operatorEventHandler.emit("event", event);
    }
    return promise;
  }
}
