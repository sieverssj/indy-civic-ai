# Operator Assistant

The top-level assistant that delegates to other sub-assistants to provide answers.

## Functions

This assistant implements 2 functions: `get_assistants` and `delegate_assistants`.

### get_assistants

`get_assistants` returns metadata about each registered sub-assistant to allow the Operator to be informed of its capabilities.

### delegate_assistants

`delegate_assistants` takes an `assistantId` and a `message` and invokes the given assistant with the given message and returns its response.

CONSIDER: Should this also take a `threadId` as a parameter? Are there cases where the operator will have an ongoing conversation with a sub-assistant?
