import * as rm from "typed-rest-client/RestClient.js";

type MunicodeSearchResult = {
  NumberOfHits: number;
  Hits: Array<MunicodeSearchHit>;
};

type MunicodeSearchHit = {
  NodeId: string;
  Title: string;
  ContentFragment: string;
};

type MunicodeGetResult = {
  Docs: Array<MunicodeDoc>;
};

type MunicodeDoc = {
  Id: string;
  Title: string;
  Content: string;
};

type OrdinanceSummary = {
  ordinanceId: string;
  title: string;
  excerpt: string;
};

type Ordinance = {
  ordinanceId: string;
  title: string;
  content: string;
};

export class MunicodeApi {
  private client: rm.RestClient;

  constructor(
    protocol: String = "https",
    host: String = "api.municode.com",
    port: number = 443,
  ) {
    const baseUrl = `${protocol}://${host}:${port}`;
    this.client = new rm.RestClient("stanton-sandbox", baseUrl);
  }

  public async searchMunicipalCode(
    searchText: string,
  ): Promise<Array<OrdinanceSummary> | null> {
    const response = await this.client.get<MunicodeSearchResult>(
      `/search?clientId=2720&contentTypeId=CODES&fragmentSize=200&isAdvanced=false&isAutocomplete=false&mode=CLIENTMODE&pageNum=1&pageSize=10&searchText=${searchText}&sort=0&stateId=14&titlesOnly=false`,
    );
    if (response.statusCode !== 200 || response.result == null) {
      console.log(
        `An error occurred searching for "${searchText}": (${response.statusCode}): ${response.result}`,
      );
      // TODO: What should we actually be returning here?
      return null;
    }

    // This returns HTML strings. Let's crudely clean it up.
    // CONSIDER: Can the Assistant just handle the HTML fragments without issue?
    const searchResults = response.result;
    const sanitizedResults = searchResults.Hits.map((hit) => {
      return {
        ordinanceId: hit.NodeId,
        title: hit.Title.replace(/<\/?[^>]+(>|$)/g, "").trim(),
        excerpt: hit.ContentFragment.replace(/<\/?[^>]+(>|$)/g, "")
          .replace(/\n/g, "")
          .replace(/\s{2,}/g, "")
          .trim(),
      };
    });
    return sanitizedResults;
  }

  public async getMunicipalCode(
    ordinanceId: string,
  ): Promise<Ordinance | null> {
    const response = await this.client.get<MunicodeGetResult>(
      `/CodesContent?isAdvancedSearch=false&jobId=451186&nodeId=${ordinanceId}&productId=12016`,
    );
    if (response.statusCode !== 200 || response.result == null) {
      console.log(
        `An error occurred looking up ordinance with ID "${ordinanceId}": (${response.statusCode}): ${response.result}`,
      );
      // TODO: What should we actually be returning here?
      return null;
    }

    // This returns HTML strings. Let's crudely clean it up.
    // We also get back a bunch of "nearby" ordinances, so we'll filter down to just the one we care about
    // CONSIDER: Can the Assistant just handle the HTML fragments without issue?
    const getResults = response.result;
    return getResults.Docs.filter((doc) => doc.Id === ordinanceId).map(
      (doc) => {
        return {
          ordinanceId: doc.Id,
          title: doc.Title,
          content: doc.Content.replace(/<\/?[^>]+(>|$)/g, "")
            .replace(/\n/g, "")
            .replace(/\s{2,}/g, "")
            .trim(),
        };
      },
    )[0];
  }
}