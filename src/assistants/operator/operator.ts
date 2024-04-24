import type { Run } from "openai/resources/beta/threads/index.mjs";
import { AssistantEventHandler } from "../events.js";
import OpenAI from "openai";
import { ENV } from "../../env.js";
import { Assistant } from "../assistant.js";
import { OrdinanceAssistant } from "../ordinance/ordinance.js";

type DelegateAssistantArgs = {
  assistantId: string;
  message: string;
  threadId?: string;
};

class OperatorEventHandler extends AssistantEventHandler {
  private assistantRegistry: Record<string, Assistant>;
  constructor(client: OpenAI, assistantRegistry: Record<string, Assistant>) {
    super(client);
    this.assistantRegistry = assistantRegistry;
    this.registerFunctionCallHandler("get_assistants", async (args) => {
      // FIXME: This should be dynamic
      return {
        assistants: [
          {
            assistantId: ENV.OPENAI_ASSISTANT_ID_ORDINANCES,
            name: "Municipal Ordinances",
            description:
              "Knowledgeable about Marion County and Indianapolis Code of Ordinances",
          },
        ],
      };
    });
    this.registerFunctionCallHandler(
      "delegate_assistant",
      async (args: DelegateAssistantArgs) => {
        const assistant = this.assistantRegistry[args.assistantId];
        if (!assistant) {
          return `Assistant with id "${args.assistantId}" not found`;
        }
        const threadId = args.threadId ?? (await assistant.createThread()).id;
        await assistant.addMessage(threadId, args.message);
        const responseMessage = await assistant.createRun(threadId);
        return {
          threadId,
          responseMessage,
        };
      },
    );
  }
}

export class Operator extends Assistant {
  private assistantRegistry: Record<string, Assistant>;
  constructor(
    organization = ENV.OPENAI_ORGANIZATION,
    project = ENV.OPENAI_PROJECT,
    apiKey = ENV.OPENAI_API_KEY,
  ) {
    super(
      new OpenAI({ organization, project, apiKey }),
      ENV.OPENAI_ASSISTANT_ID_OPERATOR,
    );
    this.assistantRegistry = {
      [ENV.OPENAI_ASSISTANT_ID_ORDINANCES]: new OrdinanceAssistant(
        this.openai,
        ENV.OPENAI_ASSISTANT_ID_ORDINANCES,
      ),
    };
  }

  protected getEventHandler(): OperatorEventHandler {
    return new OperatorEventHandler(this.openai, this.assistantRegistry);
  }
}
