# indy-civic-ai

The goal of this project is to create a REST API that is a delegate in front of a series of OpenAI Assistants that are trained to answer civics related questions for Indianapolis and Marion County.

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

### What's next?

#### Sooner
* General cleanup and refactoring to make the code more readable


#### Later
* Hosting the API somewhere
* Simple UI to interact with things
* Better error handling, especially for billing and rate limiting errors
* More assistants that we can pivot between
* Capture some user metadata when they start a chat. This can be provided as additional instructions for a better UX.

