import type { Run } from "openai/resources/beta/threads/index.mjs";
import { AssistantEventHandler } from "./events.js";
import type OpenAI from "openai";
import { ENV } from "../env.js";

export class OperatorEventHandler extends AssistantEventHandler {
  constructor(client: OpenAI) {
    super(client);
  }

  async handleRequiresAction(data: Run): Promise<any> {
    try {
      if (data.required_action === null) {
        // CONSIDER: Do nothing. This should never happen, I think.
        return;
      }

      // TODO: Clean this up - it's getting hard to parse
      const toolOutputs = await Promise.all(
        data.required_action.submit_tool_outputs.tool_calls.map(
          async (toolCall) => {
            console.log(
              `Tool Call: ${toolCall.function.name}(${toolCall.function.arguments})`,
            );
            if (toolCall.function.name === "get_assistants") {
              // TODO: We need a registry, but for now we'll hardcode a response to the Ordinances assistant.
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
              // TODO: Implement this
              return {
                tool_call_id: toolCall.id,
                output: JSON.stringify(""),
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
