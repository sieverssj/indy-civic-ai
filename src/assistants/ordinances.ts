import EventEmitter from "node:events";
import OpenAI from "openai";

export class OrdinanceEventHandler extends EventEmitter {
  private client: OpenAI;
  resolve:
    | ((value: OpenAI.Beta.Threads.Messages.MessageContent[]) => void)
    | undefined;
  reject:
    | ((reason?: OpenAI.Beta.Threads.Runs.Run | OpenAI.ErrorObject) => void)
    | undefined;
  message: OpenAI.Beta.Threads.Messages.MessageContent[] = [];
  constructor(client: OpenAI) {
    super();
    this.client = client;
  }

  asPromise() {
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  async onEvent(event: OpenAI.Beta.Assistants.AssistantStreamEvent) {
    try {
      console.log(`Event ${event.event}`);
      switch (event.event) {
        case "thread.run.requires_action":
          await this.handleRequiresAction(
            event.data,
            event.data.id,
            event.data.thread_id,
          );
          break;
        case "thread.message.completed":
          this.message = event.data.content;
          break;
        case "thread.run.completed":
          if (this.resolve) {
            this.resolve(this.message);
          }
          break;
        case "thread.run.failed":
        case "thread.run.cancelling":
        case "thread.run.cancelled":
        case "thread.run.expired":
        case "error":
          if (this.reject) {
            this.reject(event.data);
          }
          break;
        default:
          console.log(`${event.event}`);
      }
    } catch (error) {
      console.error("Error handling event:", error);
    }
  }

  async handleRequiresAction(
    data: OpenAI.Beta.Threads.Runs.Run,
    runId: string,
    threadId: string,
  ) {
    try {
      // FIXME: Can data.required_action really be null?
      const toolOutputs =
        data.required_action?.submit_tool_outputs.tool_calls.map(
          (toolCall: { function: { name: string }; id: any }) => {
            console.log(`Tool Call: ${toolCall.function.name}`);
            if (toolCall.function.name === "search_municipal_code") {
              // FIXME: Go search the municipal codes.
              return {
                tool_call_id: toolCall.id,
                output:
                  '{results:[{ "nodeId": "TITIIPUORSA_CH391NU_ARTIIINO", "title": "ARTICLE III. - NOISE", "excerpt": "" }, { "nodeId": "TITIIPUORSA_CH391NU_ARTIIINO_S391-302UNNO", "title": "Sec. 391-302. - Unlawful noises.", "excerpt": "making of noise that is plainly audible to a person with normal hearing abovenormal ambient noise levels at a distance of fifty (50) feet from the source of thenoise on any" }, { "nodeId": "TITIIIPUHEWE_CH611MOVE_ARTIINGE_S611-102MUREST", "title": "Sec. 611-102. - Mufflers required; standards.", "excerpt": "vehicles and equipment, the mufflingor noise abatement device shall be at least sufficient to eliminate noise emissionfrom the motor vehicle or equipment by the guidelines set" }, { "nodeId": "TITIIPUORSA_CH391NU_ARTIIINO_S391-301PUPO", "title": "Sec. 391-301. - Public policy.", "excerpt": "unreasonable noise, and a determination of violation of thischapter may not be based on the content of any message conveyed during the creationof any noise or the identity" }, { "nodeId": "TITIIPUORSA_CH391NU_ARTVAIUSNOSOBR_S391-501DE", "title": "Sec. 391-501. - Definitions.", "excerpt": "any machine or device for the amplification of music, the human voiceor any other noise or sound; such term shall not be construed as including warningdevices on authorized" }, { "nodeId": "TITIVBUCORELI_CH895HOAWCA_S895-7RECOEQCA", "title": "Sec. 895-7. - Required construction and equipment of carriages.", "excerpt": "with a rubbercovering thick enough to protect the streets from damage and to keep noise to a minimum;" }, { "nodeId": "TITIIIPUHEWE_CH744DEST_ARTVLASC_S744-501PU", "title": "Sec. 744-501. - Purpose.", "excerpt": "uses requiringa buffer or screen between uses; to minimize the harmful impact of noise, dust andother debris, motor vehicle headlight glare or other artificial light intrusions" }, { "nodeId": "TITIIIPUHEWE_CH744DEST_ARTVLASC_S744-506TRYAEDBU", "title": "Sec. 744-506. - Transitional yard and edge buffering.", "excerpt": "shrubs per 25 feet of lot line, with spacing designedto minimize sound, light, and noise impacts.2." }, { "nodeId": "TITIIIPUHEWE_CH740GEPR_ARTIPUAP_S740-102PU", "title": "Sec. 740-102. - Purposes.", "excerpt": "values,reduced storm water runoff and soil erosion with associated cost savings, noise buffering,improved aesthetics, reduced energy costs from shade in summer and windbreaks" }, { "nodeId": "TITIIIPUHEWE_CH744DEST_ARTIX2018RESIRE_S744-904MASARE", "title": "Sec. 744-904. - Maintenance, safety and removal.", "excerpt": "OutdoorAdvertising Signs which are required to be elevated or relocated due to a noise abatementor safety measure, grade changes, construction, directional sign, highway" }]}',
              };
            } else if (toolCall.function.name === "get_municipal_code") {
              // FIXME: Go fetch the municipal codes
              return {
                tool_call_id: toolCall.id,
                output:
                  '{"nodeId":"TITIIPUORSA_CH391NU_ARTIIINO_S391-302UNNO","title":"Sec. 391-302. - Unlawful noises.","content":"(a)For purposes of this chapter, unreasonable noise shall mean sound that is of a volume,frequency, or pattern that prohibits, disrupts, injures, or endangers the health,safety, welfare, prosperity, comfort, or repose of reasonable persons of ordinarysensitivities within the city, given the time of day and environment in which thesound is made.(b)Except as otherwise provided in this section, it shall be unlawful for any personto make, continue, or cause to be made or continued any unreasonable noise."}',
              };
            }
          },
        );
      // Submit all the tool outputs at the same time
      await this.submitToolOutputs(toolOutputs, runId, threadId);
    } catch (error) {
      console.error("Error processing required action:", error);
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
