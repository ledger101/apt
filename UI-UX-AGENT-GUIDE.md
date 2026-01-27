# UI/UX Agent Quick Start Guide

This guide shows you how to use the UI/UX planning agent to create improvement plans for your application.

## Overview

The UI/UX improvement workflow uses a two-agent approach:

1. **Planning Agent** (uiux-planner): Analyzes and creates detailed improvement plans
2. **Implementation Agent**: Executes the improvements based on the plan

## Prerequisites

- Python 3.x installed
- Access to the repository with `.agent/skills/ui-ux-pro-max/` skill

## Step 1: Understand Available Skills

First, review what's available:

```bash
# Read about available UI/UX skills
cat SKILLS.md

# Explore the UI/UX Pro Max skill documentation
cat .agent/skills/ui-ux-pro-max/SKILL.md
```

## Step 2: Invoke the UI/UX Planning Agent

The planning agent will:
- Analyze your application's current UI/UX
- Use the UI/UX Pro Max skill to generate design recommendations
- Create a comprehensive improvement plan

**What to provide to the agent:**
- Brief description of your application (product type, industry, purpose)
- Current pain points or specific areas to improve (optional)
- Target tech stack (React, Angular, Vue, etc.)

**What the agent will do:**
1. Explore your codebase
2. Identify the project structure and tech stack
3. Generate design system recommendations using UI/UX Pro Max skill
4. Create `ui-ux-improvement-plan.md` with detailed specifications
5. Prioritize improvements by impact and effort

## Step 3: Review the Improvement Plan

Once the planning agent completes, review the generated plan:

```bash
# Read the improvement plan
cat ui-ux-improvement-plan.md
```

The plan will include:
- Executive summary of current state
- Design system recommendations (colors, typography, styles)
- Component-level improvements with priorities
- Page-level enhancements
- UX improvements (accessibility, interactions)
- Implementation roadmap with phases
- Quality checklist for verification

## Step 4: Implement the Changes

Hand off the plan to an implementation agent or developer:

```
"Please implement the improvements in ui-ux-improvement-plan.md, 
starting with Phase 1 (Critical improvements)"
```

The implementation agent will:
- Read the improvement plan
- Follow the specifications exactly
- Implement changes in priority order
- Verify against the quality checklist

## Example: Complete Workflow

### Scenario: Improve Dashboard UI/UX

1. **User Request to Planning Agent:**
   ```
   "Create a UI/UX improvement plan for our healthcare patient dashboard. 
   It's built with Angular and Tailwind CSS. We want a more professional 
   and accessible design."
   ```

2. **Planning Agent Actions:**
   - Explores Angular components in `/src/app/`
   - Identifies it as a healthcare SaaS dashboard
   - Runs: `python3 .agent/skills/ui-ux-pro-max/scripts/search.py "healthcare saas dashboard professional accessible" --design-system -p "Patient Dashboard"`
   - Gets UX guidelines: `python3 .agent/skills/ui-ux-pro-max/scripts/search.py "accessibility animation loading" --domain ux`
   - Creates `ui-ux-improvement-plan.md`

3. **User Reviews Plan:**
   ```bash
   cat ui-ux-improvement-plan.md
   ```

4. **User Requests Implementation:**
   ```
   "Implement Phase 1 of ui-ux-improvement-plan.md"
   ```

5. **Implementation Agent:**
   - Reads the plan
   - Implements changes to components
   - Tests responsiveness
   - Verifies accessibility
   - Checks quality checklist

## Tips for Best Results

### For Planning Phase

- **Be Specific**: Describe your product type and industry clearly
- **Identify Pain Points**: Mention specific UI/UX issues if known
- **State Constraints**: Mention any design systems or brand guidelines to follow
- **Clarify Tech Stack**: Specify frameworks and libraries in use

### For Implementation Phase

- **Follow the Plan**: Trust the design system recommendations
- **Implement in Phases**: Start with critical improvements
- **Test Thoroughly**: Verify each change works across devices
- **Use Quality Checklist**: Ensure professional quality standards

## UI/UX Pro Max Skill Commands

The planning agent will use these commands:

```bash
# Generate complete design system
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system -p "Project Name"

# Get UX guidelines
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "accessibility animation" --domain ux

# Get chart recommendations
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "dashboard metrics" --domain chart

# Get typography options
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "professional elegant" --domain typography

# Get stack-specific guidelines
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "performance optimization" --stack react
```

## Common Use Cases

### Case 1: Landing Page Redesign
```
"Create a UI/UX improvement plan for our SaaS landing page. 
We need better conversion-focused design."
```

### Case 2: Dashboard Enhancement
```
"Improve the UI/UX of our analytics dashboard. It should be 
data-dense but clear, with good data visualization."
```

### Case 3: Accessibility Improvements
```
"Create a plan to improve accessibility across our application. 
Focus on WCAG 2.1 AA compliance."
```

### Case 4: Mobile Responsiveness
```
"Plan improvements to make our web app fully responsive on 
mobile devices (375px to 768px)."
```

## Troubleshooting

### Issue: Planning agent doesn't understand the project
**Solution:** Provide more context about product type, industry, and current tech stack

### Issue: Design recommendations don't match brand
**Solution:** Specify brand guidelines or design constraints upfront

### Issue: Plan is too ambitious
**Solution:** Ask the agent to focus on specific areas or create a phased approach

### Issue: Implementation unclear
**Solution:** Ask the planning agent to add more technical details or examples

## Resources

- **SKILLS.md**: Overview of available UI/UX skills
- **`.agent/skills/ui-ux-pro-max/SKILL.md`**: Detailed skill documentation
- **`.agent/agents/uiux-planner.md`**: Planning agent configuration
- **`.agent/agents/README.md`**: Agent system documentation

## Support

For questions or issues with the UI/UX agent system:
1. Review the agent configuration files
2. Check SKILLS.md for available capabilities
3. Consult UI/UX Pro Max skill documentation
4. Test the skill commands manually to verify they work
