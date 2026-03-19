# MARC JSONS — Portfolio Case Study (Design Lens)

**Role:** Solo designer and developer
**Type:** Figma plugin (TypeScript)
**Status:** V1 complete — iOS and Android (Material Design 3) generation shipping
**Stack:** TypeScript, esbuild, Figma Plugin API

---

## The Problem

Every design system handoff hits the same wall: tokens exist somewhere — a Notion table, a JSON file, a Tokens Studio export — but getting them into Figma as a usable, visual style guide is manual, tedious, and inconsistent.

The real friction is not technical. It is translation. A designer understands that `brand-500` means "primary action blue." A handoff table knows it as a hex string. The Figma canvas knows nothing about intent at all. MARC JSONS bridges that gap: paste your tokens, get a complete visual style guide and component library — branded to your system, on the canvas, ready to use.

The harder-to-name problem was this: design systems are contextually complex even when structurally simple. The data is easy to store. The hard part is turning it into something a whole team can actually read, reference, and build from — especially when every team names their tokens differently.

---

## The Approach: Design Decisions That Shaped the Build

---

### 1. Semantic Intent Resolution — Designing for Real-World Messiness [UX+UI]

**The user problem:** Designers name tokens idiosyncratically. `brand-500`, `primary`, `action-blue`, `blue` — all meaning the same thing. A tool that requires exact naming conventions immediately fails most real teams.

**UX Thinking:** This was fundamentally a systems empathy problem. The user's workflow already has a naming scheme. The tool should adapt to the user, not vice versa. Requiring reformatting before use is friction that kills adoption — and it signals to the designer that the tool was built without them in mind.

The semantic resolver in `tokenResolver.ts` treats naming inconsistency not as user error but as the default state. It maps component needs ("I need a primary color") to keyword sets (`["primary"], ["brand"], ["main"], ["accent"]`) searched in priority order, with a graceful fallback chain if nothing matches.

**UI Craft:** This system is invisible to the user — which is exactly right. It should feel like the plugin just understands their tokens, not like they had to do anything special to make it work. The fallback values (iOS system defaults like `#007AFF`) were chosen intentionally: if the plugin has to guess, it guesses something platform-appropriate and visually coherent, not arbitrary.

**Key Trade-off:** A stricter resolver would produce more predictable output. A looser one accepts more inputs but risks wrong matches (e.g., a token named `error-brand` matching on "brand" when "destructive" was the better intent). The keyword priority ordering — and requiring all keywords in a set to match — was the mechanism for managing that risk without requiring convention from the user.

---

### 2. The Plugin UI — A Three-Step Mental Model [UX+UI]

**The user problem:** Figma plugin panels are small. A tool that outputs something as complex as a full component library needs to set clear expectations about what it does, how to start, and what will happen.

**UX Thinking:** The header of the panel communicates the entire workflow in three numbered steps: "1 Paste or upload tokens → 2 Pick sections → 3 Generate." This is not decorative; it is the mental model the user needs to not feel lost. Every subsequent control in the UI maps to one of those three steps.

The generate button starts disabled and only activates once input is detected. This is a small thing, but it prevents a class of "nothing happened" confusion — the user can only click Generate when there is something to generate from.

**UI Craft:** The plugin uses a teal brand color (`#00B5AD`) consistently as the active/action signal across the format badge, the segment controls, and the primary button. There is only one visual weight of emphasis — users always know what the system considers the primary action. The generate button has a subtle lift-and-shadow hover state (`translateY(-1px)`) that provides physical affordance without being decorative.

The status bar at the bottom persists across all states — idle, generating (with spinner and progress bar), success, error — at the same visual position. Users always know where to look for feedback.

**Key Decision:** The "Confused? Start Here" button is a secondary CTA placed after the primary Generate button, not buried in a menu. Onboarding help should be findable without making experienced users feel condescended to. Making it a labeled button rather than a `?` icon means users can read the offer, not just guess at it.

---

### 3. Format Detection — Removing the "Reformat First" Tax [UX]

**The user problem:** Two major design token standards exist (W3C DTCG and Tokens Studio), plus teams that just use flat JSON or export markdown tables from Notion. Requiring format conversion before use creates a "you need to do something else first" moment that breaks the flow.

**UX Thinking:** The plugin auto-detects format on paste. A JSON token input triggers the JSON parser; anything else tries the markdown parser. Within JSON, the parser handles DTCG (`$type`/`$value`), Tokens Studio (`type`/`value`), and flat key-value objects — including recursive resolution of token references like `{color.brand.500}`.

A color-coded format badge appears inline with the textarea label the moment the plugin recognizes the format — green for Markdown, blue for JSON. This is immediate confirmation that the paste worked and was understood. It closes a feedback loop that would otherwise require clicking Generate to discover.

**Key Trade-off:** Auto-detection means the user gives up explicit control over which parser runs. The risk is misdetection. The decision was to make the detection logic opinionated: if it starts with `{`, it is JSON; anything else is markdown. That single heuristic handles 99% of real inputs correctly, and the format badge lets users catch the 1% before they generate.

---

### 4. Graduated Variable Sync — Control Proportional to Risk [UX+UI]

**The user problem:** Figma Variables sync is potentially destructive. Replacing all variables in a live design file can silently break component bindings. But a binary on/off forces users to choose between "do nothing" and "potentially break everything."

**UX Thinking:** The four graduated modes — Don't Sync, Add New, Smart Update, Replace All — give users a risk ladder. Each step increases power and increases scope of change. The mental model is: start safe, escalate only as needed.

The context hint below the segment control updates dynamically as you select each mode: "Variables won't be created or modified" through to "Removes all variables in this collection. This cannot be undone." The warning for Replace All is rendered in amber rather than the default gray — the one place in the UI where color is used to signal risk rather than just brand identity.

**UI Craft:** The four-segment control is rendered as a single bordered container with flush-adjacent segments — a visual unit, not four separate buttons. This communicates that these are related options on a spectrum, not independent toggles. The active segment fills with the brand teal, while inactive segments sit on a near-white background. The visual weight difference between "selected" and "not selected" is large enough to be unambiguous at small text sizes.

**Key Trade-off:** Four options is at the edge of what a segment control handles gracefully at the plugin's width (420px). The label text had to be kept to 1–2 words per segment ("Don't Sync," "Add New," "Smart Update," "Replace All"). Going to five modes would require a dropdown — a meaningful interaction cost increase.

---

### 5. Platform and Device Layout — Legibility at Any Scale [UX+UI]

**The user problem:** A design system may target iPhone only, both iPhone and iPad, or both Apple and Android simultaneously. A single undifferentiated component list fails for anything beyond the simplest case.

**UX Thinking:** Three distinct layout modes determined at generation time:

- Single device: flat vertical component flow, no wrappers
- Multiple devices, same platform: vertical with labeled per-device sub-sections
- Both platforms: horizontal two-column canvas view, Apple left, Android right

The canvas output adapts to match the scope of the user's selection. They do not need to think about layout — the generator handles it as a function of what they said they were targeting.

**UI Craft:** The platform selector (Apple / Android / Both) and device checkboxes are co-located in a single "Platform & Devices" section. The style hint below the device checkboxes updates to reflect the implied output — "iOS 26 components" for iPhone — so users can confirm intent before generating. Apple Watch and Mac are present as checkboxes but the device list communicates what component vocabulary applies to each selection.

**Key Decision:** Android components use the same device-column generator pattern as iOS, which means adding the Android generator required no architectural change — only a new rendering module. This architectural decision made the UI decision to expose "Both" as a first-class option low-risk to ship.

---

### 6. Cross-Platform Generation — A Product Stance, Not a Scope Decision [UX]

**The design system argument:** A tool that generates iOS components but defers Android to "V2" implicitly claims that one platform is canonical and the other is a port. That is not how serious multi-platform design systems work. If the token resolver knows what "primary" and "surface" mean semantically, it should be able to express those intents in Material Design 3 idioms as well as iOS idioms.

**UX Thinking:** The decision to ship 15 MD3-authentic Android components in V1 was a product stance about what the tool claims to be. A design system tool that only works for one platform makes a statement about its users — that their cross-platform work is a secondary concern. The architecture already separated token resolution (platform-agnostic) from component rendering (platform-specific). The MD3 generator consumed the exact same semantic token output as the iOS generator.

The standard I held myself to: each Android component should be visually recognizable to an Android designer, not just technically distinct from iOS. MD3 has its own shape system, state-layer model, and type scale. Getting these right required studying the spec, not pattern-matching from iOS.

**Key Trade-off Considered:** Shallow Android components — iOS shapes wearing a different stylesheet — would have been faster to ship. The risk of that approach is that it undermines the tool's credibility with the exact audience (cross-platform design teams) most likely to find it valuable. The cost of building it right was a few days of spec study and rendering work, not an architectural change. That asymmetry made the decision clear.

---

### 7. Graceful Degradation — Partial Input Should Produce Partial Output, Not Failure [UX]

**The user problem:** Real token inputs are incomplete. A team might have colors but no typography, or spacing but no shadows. A tool that fails on incomplete input requires the user to have complete input before they can use it — which defeats the purpose of a tool that helps teams build toward completeness.

**UX Thinking:** Three places where graceful degradation is explicit:

**Font loading:** When a component needs a typeface that is not in the user's Figma account, it tries the requested family, falls back to Inter at the same weight, then falls back to Inter Regular. A component always renders. The missed fonts are tracked and surfaced in the generation summary so the user knows what fell back — they get both a working output and the information to improve it.

**Token resolution:** The semantic resolver always returns a value. If no token matches and no metadata is available, an iOS-system default is returned. Components never break because a token was missing.

**Variable sync on free plans:** Adding a Dark mode to a variable collection requires a paid Figma plan. The plugin catches that API exception, logs it to the summary ("Could not add Dark mode — may require paid plan"), and continues syncing light-mode variables. It does not abort.

The underlying principle: fail loudly only when the user gave us nothing at all. Otherwise, deliver the best possible output from what they provided, and tell them what you could not do.

---

## The Build: How the Architecture Reflects Design Values

The file structure reflects a strict boundary between concerns:

```
src/
  code.ts              — plugin sandbox entry, orchestrates generation pipeline
  parser/              — input parsing (markdown, JSON, types)
  generators/
    tokenResolver.ts   — semantic intent → token value (platform-agnostic)
    componentGenerator.ts    — 15 iOS HIG components
    md3ComponentGenerator.ts — 15 Material Design 3 components
    variableGenerator.ts     — 4-mode Figma Variables sync
    shared.ts          — layout primitives, font loading with fallback
  ui.html              — plugin panel UI
```

The `DesignSystem` type is the central contract — every parser produces it, every generator consumes it. This meant adding the JSON parser required zero changes to generators. Adding the MD3 generator required zero changes to the parser or resolver. The architecture enforced the design principle that token intent and platform expression are separate concerns.

---

## What I Learned

**On designing for other designers:** The hardest design problem was accepting that users would give the plugin incomplete, inconsistent, or idiosyncratic input, and that the system needed to have an answer for all of it. The semantic resolver and fallback chains exist because I kept asking "what happens if a designer names their primary color `action-blue`?" The answer could not be "it breaks."

**On tool UX at a small scale:** A plugin panel is 420px wide. Every UI decision compounds — there is no room for redundant chrome, unclear affordances, or controls that require explanation. The three-step header, the format badge, the dynamic variable sync hint, the amber Replace All warning — each earns its place by doing one specific job. The discipline of a constrained canvas forces clarity.

**On platform authenticity as a design standard:** Learning the MD3 spec well enough to implement it properly — shape tokens, state layers, type scale — forced precision I would not have needed if I had just mirrored iOS component shapes. The design background made me better at knowing what "correct" looked like. The engineering work made me capable of achieving it.

**On scope as a product argument:** The 15 iOS / 15 Android component count was a deliberate product decision. Everything above that number adds diminishing returns for V1. Everything below feels incomplete. Getting that number right is a design decision, not a technical one.

---

## Artifacts Worth Capturing

- The plugin panel at four states: empty (button disabled), format detected (green/blue badge active), generating (progress bar + spinner), done (success message) — this four-panel sequence tells the whole interaction story
- The variable sync segment control with the Replace All warning state visible in amber
- Side-by-side: same token input generating the iOS Button vs. MD3 FilledButton — same `primary` color intent, different platform expression
- The two-column cross-platform canvas: Apple components left, Android components right, from a single generation run
- A before/after showing raw markdown token table → generated style guide section, to anchor the "translation layer" framing
- The `tokenResolver.ts` keyword-to-intent map — a concrete artifact of the "design around inconsistency" principle
- Generated iOS component library (15 components with variants) and MD3 library side-by-side

---

## The Larger Story

MARC JSONS is an argument about where friction in the design-to-development workflow actually lives. It is not in the tokens themselves — it is in the translation between token data and a team's shared visual understanding.

The semantic resolver is the clearest expression of that argument. It treats naming inconsistency not as a problem to correct but as a constraint to design around. That is a systems-thinking move, not an engineering one.

The cross-platform decision sharpens the argument further. Tokens express semantic intent. iOS and Android are both downstream consumers of that intent. The fact that I could add 15 MD3 components without touching the resolver or the parser is not a coincidence — it validates that the architecture understood what tokens actually are.

This project also marks a real expansion in what I can build. Twelve months ago I could describe this tool clearly but not implement it. Now I can do both. The design background made me a better architect (I knew what the output had to be before writing the first line). The engineering work made me a better designer (I understand the constraints and leverage points in a way I did not before).

---

*Last updated: March 17, 2026*
