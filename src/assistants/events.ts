import EventEmitter from "node:events";
import type OpenAI from "openai";

/**
 * An abstract event handler that should work for any assistant. Assistants need to implement `handleRequiresAction` to handle any tool calls.
 *
 * This class handles all event control flow, including a janky way to get a Promise to know when we're done.
 */
export abstract class AssistantEventHandler extends EventEmitter {
  private client: OpenAI;
  private resolve:
    | ((value: OpenAI.Beta.Threads.Messages.MessageContent[]) => void)
    | undefined;
  private reject:
    | ((reason?: OpenAI.Beta.Threads.Runs.Run | OpenAI.ErrorObject) => void)
    | undefined;
  private message: OpenAI.Beta.Threads.Messages.MessageContent[] = [];
  constructor(client: OpenAI) {
    super();
    this.client = client;
  }
  /**
   * Subclasses must implement a way to handle any required actions. If a "thread.run.requires_action" event is received, this will be called.
   *
   * @param data
   *
   * @returns Tool outputs, which can be anything right now. TODO: We should lock this down to some specific data format or structure.
   */
  abstract handleRequiresAction(
    data: OpenAI.Beta.Threads.Runs.Run,
  ): Promise<any>;

  asPromise(): Promise<OpenAI.Beta.Threads.Messages.MessageContent[]> {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  async onEvent(event: OpenAI.Beta.Assistants.AssistantStreamEvent) {
    try {
      switch (event.event) {
        case "thread.run.requires_action":
          const toolOutputs = await this.handleRequiresAction(event.data);
          // Submit all the tool outputs at the same time
          // console.log(`TOOL OUTPUTS\n${JSON.stringify(toolOutputs)}`);
          await this.submitToolOutputs(
            toolOutputs,
            event.data.id,
            event.data.thread_id,
          );
          break;
        case "thread.message.completed":
          // This can be very chatty but useful for debugging.
          // console.log(`assistant(${event.data.thread_id}) > ${JSON.stringify(event.data.content)}`)
          console.log(`assistant(${event.data.thread_id}) > Message completed`)
          this.message = event.data.content;
          break;
        case "thread.run.completed":
          console.log(`assistant(${event.data.thread_id}) > Over and out.`)
          if (this.resolve) {
            this.resolve(this.message);
          }
          break;
        case "thread.run.failed":
        case "thread.run.cancelling":
        case "thread.run.cancelled":
        case "thread.run.expired":
          console.log(`assistant(${event.data.thread_id}) > Error encountered`)
        case "error":
          if (this.reject) {
            this.reject(event.data);
          }
          break;
        default:
        // This is really chatty but useful to see the full control flow
        // console.log(`${event.event}`);
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  async submitToolOutputs(toolOutputs: any, runId: string, threadId: string) {
    try {
      // Use the submitToolOutputsStream helper
      const stream = this.client.beta.threads.runs.submitToolOutputsStream(
        threadId,
        runId,
        { tool_outputs: toolOutputs },
      );
      for await (const event of stream) {
        this.emit("event", event);
      }
    } catch (error) {
      console.error("Error submitting tool outputs:", error);
    }
  }
}
