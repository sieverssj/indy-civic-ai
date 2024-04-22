# indy-civic-ai

The goal of this project is to create a Web App that is a delegate in front of a series of OpenAI Assistants that are trained to answer civics related questions for Indianapolis and Marion County.

_Disclaimer_: This project is not affiliated with the city of Indianapolis or Marion County in any official capacity. This is one Indianapolis resident's side project.

## Methodology

The main assumption here is that it is intractable to configure a single OpenAI Assistant to answer the wide variety of questions that could fall under the broad category of "civics". Instead I'd like to approach this as many Assistants that are configured on a specific area and a top-level Assistant that acts as an operator, connecting users to the right Assistant under the covers.

The current implementation is using the "operator as broker" methodology.

For posterity, there are two possible approaches I considered:

1. The user truly switches assistants. They go from talking to the Operator assistant to the sub-assistant. The Civis API keeps track of which assistant the user should be talking to at any given time. The Operator in this scenario is like a switchboard operator, simply connecting the user to the right place.
   - Pros: The operator can be pretty dumb. The Civics API itself manages message passing between all assistants and keeps track of meta-threads.
   - Cons: We may lose a consistent voice for the end user, especially if sub-assistants are on different models. Conversation context may get lost for longer conversations with multiple assistant switches, making for awkward conversations with users.
2. The operator is a true broker. It sends messages to sub-assistants which potentially return JSON as their response formats. The operator takes that information and uses it to craft responses. Sub-assistants become not much more than intelligent agents for a set of data or APIs. The user is never talking directly to any sub-assistant.
   - Pros: All user interaction is tuned by the Operator. Operator never loses any context of user interaction.
   - Cons: We're doubling the cost of each message because it has to be processed by the operator and at least one other sub-assistant.

_Note_: For this project, OpenAI Assistants are currently created by hand in a Personal organization in their own Project.

### Interacting with Assistants

To interact with an assistant, we'll need to:

1. Start a Thread: https://platform.openai.com/docs/assistants/overview/step-2-create-a-thread
1. Take in user input to create a Message in that thread: https://platform.openai.com/docs/assistants/overview/step-3-add-a-message-to-the-thread
1. Create a Run for that thread: https://platform.openai.com/docs/assistants/tools/function-calling/step-3-initiate-a-run
1. Inspect responses for Function calls and call out to fulfill those functions: See the link in the previous step
1. Return the result of the run to the user, along with the thread id. This allows future calls providing the threadId as a way to continue the conversation

## Assistants

- [Operator](./src/assistants/operator/README.md)
- [Ordinances](./src/assistants/ordinances/README.md)

## Current state

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

- Legislation
  - Look what Ashlee Boyer did! https://unofficial-iga-updates.vercel.app/ - https://docs.api.iga.in.gov/
- Maps, zoning, property info
  - Basically everything you can access through https://maps.indy.gov/
- Voting/Elections
  - Indy Vote Times: http://indyvotetimes.org/
  - General voting info: https://vote.indy.gov/
- General services (mayor's action line, potholes, trash pickup, etc..):
  - https://www.indy.gov/agency/mayors-action-center
- Neighborhood boundaries and associations
  - Might just be maps.indy.gov again, or data.indy.gov
- Local groups, points of interest: TODO
- Places to seek help: TODO
- Other
  - https://data.indy.gov/ has a ton of datasets. Not sure how easily accessible they are programatically

## What's next?

### Sooner

- General cleanup and refactoring to make the code more readable
- Think about testability
- Put some actual thought into the request and response structure (maybe it's too soon for that)
- Rethink the `AssistantEventHandler` model. There's a lot of boilerplate shared between the 2 `handleRequiresAction` implementations right now

### Later

- Hosting the API somewhere
- Simple UI to interact with things
- Better error handling, especially for billing and rate limiting errors
- Capture some user metadata when they start a chat. This can be provided as additional instructions for a better UX.
- Add Telemetry to the API calls

### Much Later

- Datastore to keep thread history
- Datastore also allows us to codify assistant creation by creating the assistant and storing its ID in a store
- Datastore allows multiple environments if ever necessary
