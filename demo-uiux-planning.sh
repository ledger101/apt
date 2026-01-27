#!/bin/bash

# UI/UX Planning Agent Workflow Demonstration
# This script shows how to use the UI/UX Pro Max skill to create improvement plans

echo "==============================================="
echo "UI/UX Planning Agent - Workflow Demonstration"
echo "==============================================="
echo ""

# Step 1: Project Analysis
echo "Step 1: Analyzing project type and requirements..."
echo "  → Project: APT (Asset & Personnel Tracking)"
echo "  → Type: Enterprise ERP Dashboard"
echo "  → Industry: Multi-domain (Fleet, Finance, Personnel, OHS)"
echo "  → Stack: Angular + SCSS"
echo ""

# Step 2: Generate Design System
echo "Step 2: Generating design system recommendations..."
echo "  → Running: UI/UX Pro Max skill"
echo ""

# Check if the skill exists
if [ ! -f ".agent/skills/ui-ux-pro-max/scripts/search.py" ]; then
  echo "❌ Error: UI/UX Pro Max skill not found at .agent/skills/ui-ux-pro-max/"
  exit 1
fi

python3 .agent/skills/ui-ux-pro-max/scripts/search.py \
  "enterprise ERP dashboard professional accessible multi-domain" \
  --design-system \
  -p "APT - Asset & Personnel Tracking"

echo ""
echo "✅ Design system generated!"
echo ""

# Step 3: Get UX Guidelines
echo "Step 3: Fetching UX best practices..."
echo "  → Searching: accessibility, loading states, error handling"
echo ""

python3 .agent/skills/ui-ux-pro-max/scripts/search.py \
  "accessibility animation loading error-handling" \
  --domain ux \
  -n 5

echo ""
echo "✅ UX guidelines retrieved!"
echo ""

# Step 4: Get Chart Recommendations (for dashboard)
echo "Step 4: Getting chart/visualization recommendations..."
echo "  → Searching: dashboard metrics trends"
echo ""

python3 .agent/skills/ui-ux-pro-max/scripts/search.py \
  "dashboard trends metrics comparison" \
  --domain chart \
  -n 5

echo ""
echo "✅ Chart recommendations retrieved!"
echo ""

# Step 5: Get Stack-Specific Guidelines
echo "Step 5: Fetching Angular-specific best practices..."
echo "  → Stack: Angular (using React as proxy - similar patterns)"
echo ""

python3 .agent/skills/ui-ux-pro-max/scripts/search.py \
  "performance component optimization" \
  --stack react \
  -n 3

echo ""
echo "✅ Stack guidelines retrieved!"
echo ""

# Summary
echo "==============================================="
echo "Planning Complete!"
echo "==============================================="
echo ""
echo "The UI/UX Planning Agent would now:"
echo "  1. Synthesize all the above recommendations"
echo "  2. Analyze the current application structure"
echo "  3. Create a comprehensive improvement plan (like ui-ux-improvement-plan-EXAMPLE.md)"
echo "  4. Prioritize changes by impact and effort"
echo "  5. Create implementation roadmap with phases"
echo ""
echo "Next Steps:"
echo "  → Review the generated plan: ui-ux-improvement-plan-EXAMPLE.md"
echo "  → Hand off to implementation agent for Phase 1"
echo "  → Implement changes following the quality checklist"
echo ""
echo "For more information:"
echo "  → SKILLS.md - Available UI/UX skills"
echo "  → UI-UX-AGENT-GUIDE.md - Usage guide"
echo "  → .agent/agents/uiux-planner.md - Agent configuration"
echo ""
