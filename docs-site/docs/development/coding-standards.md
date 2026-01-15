# Coding Standards

## Architecture rules

- Renderer = UI only

- Main = integrations + OS access

- Shared = types + normalization

## TypeScript

- strict enabled

- prefer explicit return types in main service methods

- no any for API payloads; define DTOs

## Logging

- main process logs are structured

- redact tokens

- renderer logs minimal (UI events)

## Error handling

- main returns typed errors over IPC

- renderer uses error boundaries and friendly empty states

## UI

- consistent layout for:

  - Runs → Run Detail → Failure Detail

- performance: paginate lists and cache responses

