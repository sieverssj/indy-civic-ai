import type OpenAI from "openai";
import type { AssistantEventHandler } from "./events.js";

// CONSIDER: Is this generalizable? Would the Operator use this to talk to sub-assistants? I think so.
export abstract class Assistant<AEH extends AssistantEventHandler> {
  protected openai;
  private assistantId: string;
  constructor(
    openai: OpenAI,
    assistantId: string,
  ) {
    this.openai = openai;
    this.assistantId = assistantId;
  }

  public getAssistantId(): string {
    return this.assistantId;
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
    const eventHandler = this.getEventHandler();
    eventHandler.on(
      "event",
      eventHandler.onEvent.bind(eventHandler),
    );
    const stream = this.openai.beta.threads.runs.stream(threadId, {
      assistant_id: this.assistantId,
    });

    // CONSIDER: This is so janky. We're awaiting the stream events to emit them to our handler. 
    // This is great until the handler makes tool calls. The subsequent event after tool 
    // output submission aren't in this stream and we'll return. That's why we do 
    // this janky promise creation. Need to sit and think about how to best do this.
    const promise = eventHandler.asPromise();
    for await (const event of stream) {
      eventHandler.emit("event", event);
    }
    return promise;
  }

  /**
   * Returns the event handler for the given assistant. Sub-classes must provide an implementation of an AssistantEventHandler.
   * 
   * CONSIDER: For any given implementation can the handler be a singleton?
   */
  protected abstract getEventHandler(): AEH;
}