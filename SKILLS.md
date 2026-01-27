# Available Skills for UI/UX Development

This document catalogs the available skills that can be used by agents to create comprehensive UI/UX improvement plans and implementations.

## UI/UX Pro Max Skill

**Location:** `.agent/skills/ui-ux-pro-max/`

**Description:** Comprehensive UI/UX design intelligence with 67 styles, 96 color palettes, 56 font pairings, 98 UX guidelines, and 25 chart types across 13 technology stacks.

### Capabilities

The UI/UX Pro Max skill provides:

1. **Design System Generation**: Create complete design systems with product patterns, styles, colors, typography, and effects
2. **Multi-Domain Search**: Search across product types, styles, colors, typography, charts, and UX guidelines
3. **Stack-Specific Guidelines**: Get best practices for React, Next.js, Vue, Svelte, SwiftUI, Flutter, and more
4. **Reasoning-Based Recommendations**: Apply AI reasoning rules to select optimal design choices
5. **Hierarchical Design Persistence**: Master design system with page-specific overrides

### Key Domains

- **Product**: SaaS, e-commerce, portfolio, dashboard, landing page recommendations
- **Style**: Glassmorphism, minimalism, dark mode, brutalism, and 67+ other styles
- **Typography**: 56+ font pairings from Google Fonts
- **Color**: 96+ palettes optimized by product type and industry
- **Landing**: Page structure patterns and CTA strategies
- **Chart**: 25+ chart types with library recommendations
- **UX**: Best practices, anti-patterns, accessibility guidelines
- **Stacks**: React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, and more

### How to Use

The skill is accessed via Python scripts:

```bash
# Generate complete design system (REQUIRED FIRST STEP)
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system -p "Project Name"

# Search specific domain for details
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain> [-n <max_results>]

# Get stack-specific guidelines
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack <stack_name>
```

### Workflow for UI/UX Improvements

1. **Analyze Requirements**: Extract product type, style keywords, industry, and tech stack
2. **Generate Design System**: Always start with `--design-system` flag for comprehensive recommendations
3. **Supplement with Details**: Use domain searches for additional specifics (charts, UX, typography)
4. **Apply Stack Guidelines**: Get implementation best practices for the target technology
5. **Validate Quality**: Use the pre-delivery checklist in SKILL.md

### Example Usage

For a healthcare SaaS dashboard:

```bash
# Step 1: Generate design system
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "healthcare saas dashboard professional" --design-system -p "HealthCare Dashboard"

# Step 2: Get chart recommendations
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "real-time trends health metrics" --domain chart

# Step 3: Get UX best practices
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "animation accessibility loading" --domain ux

# Step 4: Get React best practices
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "performance state management" --stack react
```

## Professional UI Quality Rules

Before delivering any UI/UX work, ensure:

### Visual Elements
- ✅ Use SVG icons (Heroicons, Lucide) - never emojis
- ✅ Stable hover states without layout shifts
- ✅ Correct brand logos from official sources
- ✅ Consistent icon sizing (24x24 viewBox with w-6 h-6)

### Interaction
- ✅ `cursor-pointer` on all clickable elements
- ✅ Visual feedback on hover (color, shadow, border)
- ✅ Smooth transitions (150-300ms)
- ✅ Visible focus states for keyboard navigation

### Contrast & Accessibility
- ✅ Light mode text with 4.5:1 contrast minimum
- ✅ Glass/transparent elements visible in light mode
- ✅ Borders visible in both light and dark modes
- ✅ All images have alt text
- ✅ Form inputs have labels
- ✅ `prefers-reduced-motion` respected

### Layout
- ✅ Floating elements with proper edge spacing
- ✅ No content hidden behind fixed navbars
- ✅ Responsive at 375px, 768px, 1024px, 1440px
- ✅ No horizontal scroll on mobile

## For More Information

See the complete documentation at `.agent/skills/ui-ux-pro-max/SKILL.md`
