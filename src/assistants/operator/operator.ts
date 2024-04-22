import type { Run } from "openai/resources/beta/threads/index.mjs";
import { AssistantEventHandler } from "../events.js";
import OpenAI from "openai";
import { ENV } from "../../env.js";
import { Assistant } from "../assistant.js";
import { OrdinanceAssistant } from "../ordinance/ordinance.js";

class OperatorEventHandler extends AssistantEventHandler {
  private assistantRegistry: Record<string, Assistant<any>>;
  constructor(client: OpenAI, assistantRegistry: Record<string, Assistant<any>>) {
    super(client);
    this.assistantRegistry = assistantRegistry;
  }

  async handleRequiresAction(data: Run): Promise<any> {
    try {
      if (data.required_action === null) {
        // CONSIDER: Do nothing. This should never happen, I think.
        return;
      }

      // TODO: Clean this up - it's getting hard to parse. Ideally we would have a way to do this that 
      // doesn't require implementors to know the guts of OpenAI calls. A simple toolName -> function map might suffice.
      const toolOutputs = await Promise.all(
        data.required_action.submit_tool_outputs.tool_calls.map(
          async (toolCall) => {
            console.log(
              `Tool Call: ${toolCall.function.name}(${toolCall.function.arguments})`,
            );
            if (toolCall.function.name === "get_assistants") {
              // FIXME: We need a registry, but for now we'll hardcode a response to the Ordinances assistant.
              const assistants = {
                assistants: [
                  {
                    assistantId: ENV.OPENAI_ASSISTANT_ID_ORDINANCES,
                    name: "Municipal Ordinances",
                    description: "Knowledgeable about Marion County and Indianapolis Code of Ordinances"
                  }
                ]
              }
              return {
                tool_call_id: toolCall.id,
                output: JSON.stringify(assistants),
              };
            } else if (toolCall.function.name === "delegate_assistant") {
              const functionArgs = JSON.parse(toolCall.function.arguments) as {
                assistantId: string,
                message: string,
              };
              const assistant = this.assistantRegistry[functionArgs.assistantId];
              // TODO: Return a better error
              if (!assistant) {
                return {
                  tool_call_id: toolCall.id,
                  output: `Assistant with id "${functionArgs.assistantId}" not found`
                }
              }
              const thread = await assistant.createThread();
              await assistant.addMessage(thread.id, functionArgs.message);
              const responseMessage = await assistant.createRun(thread.id);
              return {
                tool_call_id: toolCall.id,
                output: JSON.stringify(responseMessage),
              };
            } else {
              // TODO: Handle this
              return {
                tool_call_id: toolCall.id,
                output: "Error",
              };
            }
          },
        ),
      );
      return toolOutputs;
    } catch (error) {
      console.error("Error processing required action:", error);
    }
  }
}

export class Operator extends Assistant<OperatorEventHandler> {
  private assistantRegistry: Record<string, Assistant<any>>
  constructor(
    organization = ENV.OPENAI_ORGANIZATION,
    project = ENV.OPENAI_PROJECT,
    apiKey = ENV.OPENAI_API_KEY
  ) {
    super(new OpenAI({ organization, project, apiKey }), ENV.OPENAI_ASSISTANT_ID_OPERATOR);
    this.assistantRegistry = {
      [ENV.OPENAI_ASSISTANT_ID_ORDINANCES]: new OrdinanceAssistant(this.openai, ENV.OPENAI_ASSISTANT_ID_ORDINANCES)
    }
  }

  protected getEventHandler(): OperatorEventHandler {
    return new OperatorEventHandler(this.openai, this.assistantRegistry);
  }
}
