# Agents Module

This module contains the core logic for AI agents, including:
- Agent event handling (`agent-events.ts`)
- Task queue management (`agent-task-queue.ts`)
- Tool usage integration (`agent-tool-usage.ts`)
- Main agent implementation (`agent-base.ts`)

## Extending Agents

To create a new agent, extend `GenericAgent` and override `handleTask` for custom task logic.

## Dependency Injection

Agent dependencies (tool registry, memory, etc.) can be injected for modularity and testability.

## Event Contracts

See `agent-events.ts` for event handler wiring and extension patterns.

## Testing

Unit tests are provided for all submodules in `__tests__`.

## Usage Example

```typescript
import { GenericAgent } from './agent-base';

const agent = new GenericAgent('agent-id', { /* config */ });
await agent.initialize();
agent.emit('taskAdded', { /* task */ });
```
