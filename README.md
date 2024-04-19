# indy-civic-ai

The goal of this project is to create a Web App that is a delegate in front of a series of OpenAI Assistants that are trained to answer civics related questions for Indianapolis and Marion County. 

_Disclaimer_: This project is not affiliated with the city of Indianapolis or Marion County in any official capacity. This is one Indianapolis resident's side project.

## Methodology
To interact with an assistant, we'll need to:

1. Start a Thread: https://platform.openai.com/docs/assistants/overview/step-2-create-a-thread
1. Take in user input to create a Message in that thread: https://platform.openai.com/docs/assistants/overview/step-3-add-a-message-to-the-thread
1. Create a Run for that thread: https://platform.openai.com/docs/assistants/tools/function-calling/step-3-initiate-a-run
1. Inspect responses for Function calls and call out to fulfill those functions: See the link in the previous step
1. Return the result of the run to the user, along with the thread id. This allows future calls providing the threadId as a way to continue the conversation


## Ordinances

We'll start with one assistant that can answer questions of Municipal Ordinances. It leverages the [Municode Website for Indianpolis - Marion County, IN](https://library.municode.com/in/indianapolis_-_marion_county/codes/code_of_ordinances)

The Assistant was manually created here: https://platform.openai.com/assistants/asst_Ro2w1A8EZ0PXc1WaUdh9mfhi

### Functions

This assistant implements 2 functions: `search_municipal_code` and `get_municipal_code`. These function implementations are backed by the (undocumented) Municode API. 

`search_municipal_code` relies on calls like `GET https://api.municode.com/search?clientId=2720&contentTypeId=CODES&fragmentSize=200&isAdvanced=false&isAutocomplete=false&mode=CLIENTMODE&pageNum=1&pageSize=10&searchText=<search text>&sort=0&stateId=14&titlesOnly=false` where the `searchText` query param contains the search phrase generated by the assistant.

`get_municipal_code` relies on calls like `GET https://api.municode.com/CodesContent?isAdvancedSearch=false&jobId=451186&nodeId=<node id>&productId=12016` where `nodeId` is an identifier returned in the `search_municipal_code` results.

### Current state
At this point, the client works end-to-end. Here's an example use case:

Start a new thread with a simple question
```
curl --location 'http://localhost:3000/chat' \
--header 'Content-Type: application/json' \
--data '{
    "message": "Can you tell me about noise ordinances?"
}'
```

Example return - truncated for clarity
```
{
    "data": [
        {
            "type": "text",
            "text": {
                "value": "There are several noise ordinances in Marion County. Here are a few examples:\n\n1. Sec. 391-302. - Unlawful noises: This ordinance prohibits making noise that is plainly audible to a person with normal hearing above normal ambient noise levels at a distance of fifty (50) feet from the source of the noise.

                <snip />

                Please let me know if you would like more information on any specific ordinance.",
                "annotations": []
            }
        }
    ],
    "meta": {
        "threadId": "my_thread_id"
    }
}
```

Make a followup call for information about a specific ordinance
```
curl --location 'http://localhost:3000/chat' \
--header 'Content-Type: application/json' \
--data '{
    "message": "Tell me more about the Unlawful noises ordinance",
    "threadId": "my_thread_id"
}'
```

Example return - this has been truncated, as it returns the full ordinance text
```
{
    "data": [
        {
            "type": "text",
            "text": {
                "value": "The Unlawful Noises ordinance in Marion County is outlined in Section 391-302. Here are the key points of this ordinance:\n\n1. 
                <snip />
                For specific details and complete information, it is recommended to refer to the full text of the ordinance.",
                "annotations": []
            }
        }
    ],
    "meta": {
        "threadId": "my_thread_id"
    }
}
```

## Other Assistants
This is a place to gather ideas about other assistants that could be created.
* Legislation
  * Look what Ashlee Boyer did! https://unofficial-iga-updates.vercel.app/ - https://docs.api.iga.in.gov/
* Maps, zoning, property info
  * Basically everything you can access through https://maps.indy.gov/
* Voting/Elections
  * Indy Vote Times: http://indyvotetimes.org/
  * General voting info: https://vote.indy.gov/
* General services (mayor's action line, potholes, trash pickup, etc..):
  * https://www.indy.gov/agency/mayors-action-center
* Neighborhood boundaries and associations
  * Might just be maps.indy.gov again, or data.indy.gov
* Local groups, points of interest: TODO
* Places to seek help: TODO
* Other
  * https://data.indy.gov/ has a ton of datasets. Not sure how easily accessible they are programatically

## What's next?

### Sooner
* General cleanup and refactoring to make the code more readable
* Think about testability


### Later
* Hosting the API somewhere
* Simple UI to interact with things
* Better error handling, especially for billing and rate limiting errors
* More assistants that we can pivot between
* Capture some user metadata when they start a chat. This can be provided as additional instructions for a better UX.

### Much Later
* Datastore to keep thread history
* Datastore also allows us to codify assistant creation by creating the assistant and storing its ID in a store
* Datastore allows multiple environments if ever necessary

