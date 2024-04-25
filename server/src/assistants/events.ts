import EventEmitter from "node:events";
import type OpenAI from "openai";

// CONSIDER: Can we clean up this handler typing stuff?
export type FunctionCallHandler<T, R> = (functionArgs: T) => Promise<R>;

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

  // CONSIDER: Should we introduce generics to this class to allow FunctionCallHandler to avoid explicit any?
  private functionCallHandlers: Record<string, FunctionCallHandler<any, any>>;
  constructor(client: OpenAI) {
    super();
    this.client = client;
    this.functionCallHandlers = {};
  }

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
          console.log(`assistant(${event.data.thread_id}) > Message completed`);
          this.message = event.data.content;
          break;
        case "thread.run.completed":
          console.log(`assistant(${event.data.thread_id}) > Over and out.`);
          if (this.resolve) {
            this.resolve(this.message);
          }
          break;
        case "thread.run.failed":
        case "thread.run.cancelling":
        case "thread.run.cancelled":
        case "thread.run.expired":
          console.log(`assistant(${event.data.thread_id}) > Error encountered`);
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

  // CONSIDER: Why make this protected? Do we really want to necessitate sub-classes of this for each assistant or can it be generic?
  // Maybe the answer will depend on how we can end up doing stronger typing around these function calls.
  protected registerFunctionCallHandler<T, R>(
    fnName: string,
    fn: FunctionCallHandler<T, R>,
  ) {
    this.functionCallHandlers[fnName] = fn;
  }

  /**
   * If a "thread.run.requires_action" event is received, this will be called.
   *
   * @param data
   *
   * @returns Tool outputs, which can be anything right now. TODO: We should lock this down to some specific data format or structure.
   */
  private async handleRequiresAction(
    data: OpenAI.Beta.Threads.Runs.Run,
  ): Promise<any> {
    try {
      if (data.required_action === null) {
        // CONSIDER: Do nothing. This should never happen, I think.
        return;
      }

      // TODO: Clean this up - it's getting hard to parse
      const toolOutputs = await Promise.all(
        data.required_action.submit_tool_outputs.tool_calls.map(
          async (toolCall) => {
            const fnName = toolCall.function.name;
            const fnArgsString = toolCall.function.arguments;
            console.log(`Tool Call: ${fnName}(${fnArgsString})`);
            const fn = this.functionCallHandlers[toolCall.function.name];
            if (!fn) {
              // TODO: What to do here?
              console.log(`Handler not found for ${fnName}`);
            }
            const fnResponse = await fn(JSON.parse(fnArgsString));
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify(fnResponse),
            };
          },
        ),
      );
      return toolOutputs;
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }

  private async submitToolOutputs(
    toolOutputs: any,
    runId: string,
    threadId: string,
  ) {
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
