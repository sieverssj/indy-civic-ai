# Operator Assistant

The top-level assistant that delegates to other sub-assistants to provide answers.

## Functions

This assistant implements 2 functions: `get_assistants` and `delegate_assistants`.

### get_assistants

`get_assistants` returns metadata about each registered sub-assistant to allow the Operator to be informed of its capabilities.

### delegate_assistants

`delegate_assistants` takes an `assistantId`, a `message`, and an optional `threadId` and invokes the given assistant with the given message and returns its response. The `threadId` is returned from previous calls and is used for conversation continuity.
