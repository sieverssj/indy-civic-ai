# indy-civic-ai

The goal of this project is to create a REST API that is a delegate in front of a series of OpenAI Assistants that are trained to answer civics related questions for Indianapolis and Marion County.

## Ordinances

We'll start with one assistant that can answer questions of Municipal Ordinances. It leverages the [Municode Website for Indianpolis - Marion County, IN](https://library.municode.com/in/indianapolis_-_marion_county/codes/code_of_ordinances)

The Assistant was manually created here: https://platform.openai.com/assistants/asst_Ro2w1A8EZ0PXc1WaUdh9mfhi

To interact with this assistant, we'll need to:

1. Start a Thread: https://platform.openai.com/docs/assistants/overview/step-2-create-a-thread
1. Take in user input to create a Message in that thread: https://platform.openai.com/docs/assistants/overview/step-3-add-a-message-to-the-thread
1. Create a Run for that thread: https://platform.openai.com/docs/assistants/tools/function-calling/step-3-initiate-a-run
1. Inspect responses for Function calls: See the link in the previous step

We likely need to generate a session ID of some sort to track the actual user session. Or is the thread ID enough? Maybe that's enough.

## Where are we?
At this point in time the server runs, it creates a thread, adds a static message, runs the thread, calls out to tools which respond with static responses, and then returns a response. In short, it's wired up and "working".

## What's next?

### Immediately Next
* Remove all the static bits:
  * Message content should come from POST body
  * Tools should make real calls
* Allow endpoints to take a thread ID to continue a conversation that's already been started

### Future
* Simple UI to interact with things
* Better error handling
* More assistants that we can pivot between
* Capture some user metadata when they start a chat
