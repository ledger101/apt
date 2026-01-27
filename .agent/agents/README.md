# Agent Configurations

This directory contains agent configuration files that define specialized agents for different tasks in the project.

## Available Agents

### UI/UX Planning Agent

**File:** `uiux-planner.md`

**Purpose:** Creates comprehensive UI/UX improvement plans before implementation

**Use Case:** When you need to improve the user interface or user experience of the application, use this agent to first create a detailed plan. The plan can then be handed off to an implementation agent.

**Workflow:**
1. Invoke the UI/UX Planning Agent
2. Agent analyzes the current state of the application
3. Agent uses SKILLS.md and UI/UX Pro Max skill to generate recommendations
4. Agent creates `ui-ux-improvement-plan.md` with detailed specifications
5. Implementation agent reads the plan and executes the changes

## How to Create New Agents

1. Create a new `.md` file in this directory
2. Use the following template:

```markdown
---
name: agent-name
version: 1.0.0
description: Brief description of the agent's purpose
author: Team Name
created: YYYY-MM-DD
---

# Agent Name

## Purpose
[What this agent does]

## Responsibilities
[List of specific tasks]

## Skills and Resources
[What skills/tools this agent uses]

## Workflow
[Step-by-step process]

## Output Format
[What this agent produces]

## Example Usage
[How to invoke this agent]
```

3. Document the agent in this README

## Best Practices

- **Single Responsibility**: Each agent should have a clear, focused purpose
- **Use Skills**: Leverage available skills documented in SKILLS.md
- **Clear Outputs**: Define what the agent produces
- **Handoff Ready**: Ensure outputs can be used by other agents
- **Documented Workflow**: Provide step-by-step processes
- **Quality Standards**: Include verification checklists

## Skills Reference

All agents can reference skills documented in `/SKILLS.md`:

- UI/UX Pro Max: Design systems, styles, colors, typography, UX guidelines

## Agent Communication

Agents can communicate through:

- **Shared Documents**: One agent creates, another reads (e.g., improvement plans)
- **Standardized Formats**: Markdown files with consistent structure
- **Version Control**: Git commits preserve agent outputs
- **Documentation**: Clear specifications in agent configs

## Example: Two-Agent Workflow

```
User Request: "Improve the dashboard UI/UX"
    ↓
Step 1: Invoke UI/UX Planning Agent
    ↓
Agent creates: ui-ux-improvement-plan.md
    ↓
Step 2: Invoke Implementation Agent
    ↓
Agent reads plan and implements changes
    ↓
Result: Improved dashboard with documented plan
```

## Contributing

When adding new agents:

1. Ensure they follow the template structure
2. Document their purpose and workflow clearly
3. Update this README with the new agent
4. Test the agent configuration before committing
5. Add examples of usage
