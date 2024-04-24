import OpenAI from "openai";
import { AssistantEventHandler } from "../events.js";
import { Assistant } from "../assistant.js";
import { MunicodeApi } from "./municode.js";

type SearchMunicipalCodeArgs = {
  text: string;
};

type GetMunicipalCodeArgs = {
  ordinanceId: string;
};

class OrdinanceEventHandler extends AssistantEventHandler {
  private municodeClient: MunicodeApi;

  constructor(client: OpenAI) {
    super(client);
    this.municodeClient = new MunicodeApi();
    this.registerFunctionCallHandler(
      "search_municipal_code",
      (args: SearchMunicipalCodeArgs) =>
        this.municodeClient.searchMunicipalCode(args.text),
    );
    this.registerFunctionCallHandler(
      "get_municipal_code",
      (args: GetMunicipalCodeArgs) =>
        this.municodeClient.getMunicipalCode(args.ordinanceId),
    );
  }
}

export class OrdinanceAssistant extends Assistant {
  protected getEventHandler(): OrdinanceEventHandler {
    return new OrdinanceEventHandler(this.openai);
  }
}
