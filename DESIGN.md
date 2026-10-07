---
name: Mihenk
description: Yıldız Siber Tehdit İstihbaratı. Every analysis is a TLP-marked intelligence brief on paper, not a dashboard.
colors:
  canvas: "#EEEFEC"
  sheet: "#FFFFFF"
  sunken: "#F6F6F3"
  line: "#DADBD6"
  line-strong: "#B9BBB4"
  ink: "#15171C"
  ink-2: "#43474F"
  ink-3: "#62666E"
  ink-inverse: "#E9EAEC"
  night: "#121418"
  night-2: "#1C1F25"
  night-3: "#2A2E36"
  night-text: "#A7ABB3"
  band-black: "#000000"
  petrol-50: "#E7F0F1"
  petrol-100: "#CFE1E3"
  petrol-600: "#146070"
  petrol-700: "#0F4C5C"
  petrol-800: "#0B3A47"
  risk-critical: "#B4161F"
  risk-high: "#B8430B"
  risk-medium: "#8F5B07"
  risk-low: "#2C6E47"
  risk-unknown: "#5B616B"
  brass: "#D2B15C"
  tlp-red: "#FF2B2B"
  tlp-amber: "#FFC000"
  tlp-green: "#33FF00"
  tlp-clear: "#FFFFFF"
typography:
  assessment:
    fontFamily: "Source Serif 4 Variable, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "normal"
  headline:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.01em"
  verdict:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Source Serif 4 Variable, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: "1.625rem"
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  body-sm:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  label:
    fontFamily: "Public Sans Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1.125rem"
  data:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    fontFeature: "'tnum' 1, 'zero' 1"
rounded:
  sm: "3px"
  DEFAULT: "4px"
spacing:
  control: "36px"
  control-hero: "48px"
  sheet-x: "32px"
  sheet-x-mobile: "20px"
  sheet-y: "24px"
  gutter: "24px"
  sidebar: "248px"
  rail: "272px"
  page-max: "1180px"
components:
  button-primary:
    backgroundColor: "{colors.petrol-700}"
    textColor: "{colors.sheet}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 14px"
    height: "{spacing.control}"
  button-primary-hover:
    backgroundColor: "{colors.petrol-800}"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 14px"
    height: "{spacing.control}"
  button-secondary-hover:
    backgroundColor: "{colors.sunken}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 14px"
    height: "{spacing.control}"
  field:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 12px"
    height: "{spacing.control}"
  field-indicator:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "{typography.data}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 48px 0 44px"
    height: "{spacing.control-hero}"
  sheet:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.DEFAULT}"
    padding: "24px 32px"
  tlp-band:
    backgroundColor: "{colors.band-black}"
    textColor: "{colors.tlp-amber}"
    typography: "{typography.data}"
    padding: "8px 32px"
  severity-tag-critical:
    backgroundColor: "rgba(180,22,31,0.07)"
    textColor: "{colors.risk-critical}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.night-text}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.DEFAULT}"
    padding: "0 12px"
    height: "{spacing.control}"
  nav-item-active:
    backgroundColor: "{colors.night-3}"
    textColor: "{colors.sheet}"
---

# Design System: Mihenk

## Overview

**Creative North Star: "The Marked Brief"**

Mihenk presents every analysis as an intelligence brief printed on white paper and laid on a cool grey desk. The sheet carries a black TLP band at top and bottom, an indicator in monospace, one serif assessment sentence, a verdict word with a banded linear score, then numbered sections of findings and evidence. The interface is the desk around the paper: a near-black sidebar that shares the TLP band's black, a page title, and a single indicator field.

Density is documentary rather than console-like. Hairline rules divide sections, tables run edge to edge inside the sheet, and the only colour that acts is petrol. Red is kept for severity and danger, and the official TLP 2.0 colours appear only on black. The logo is the supplied raster mark (`docs/logo.jpg`: white crescent, eagle and star on dark grey), shown at 32px with 5px corners and a Night-3 hairline ring. Brass survives as the single ornament, on the active sidebar icon.

The rejected category default is the dark navy console with neon accents, ring gauges and card grids. The previous dark navy and gold identity is retired.

**Key Characteristics:**
- Paper sheet on cool canvas; one sheet per brief, hairline-ruled sections.
- Three voices: serif for the assessment and document headings, sans for UI, mono only for indicator and reference values.
- Petrol is the one action hue; red carries severity; TLP colours live on black.
- Square-ish 4px corners, flat surfaces, one soft paper shadow.
- Print is a first-class output: TLP bands repeat on every printed page.

## Colors

A cool, nearly achromatic paper-and-ink palette with one petrol action hue, a reserved severity family, and the official TLP marking colours confined to black.

### Primary
- **Petrol** (petrol-700): the only brand and action colour. Primary buttons, links (example indicators), similarity bars, the skip link. Petrol Deep (petrol-800) is its hover and pressed state and the text colour on Petrol Wash.
- **Petrol Focus** (petrol-600): focus outlines (2px, 2px offset) and the focused field border plus its 20% ring.
- **Petrol Wash** (petrol-50) and **Petrol Mist** (petrol-100): the success confirmation box after a rule is added, link hover backgrounds, and text selection.

### Secondary
- **Severity Family** (risk-critical, risk-high, risk-medium, risk-low, risk-unknown): Critical Red, Burnt Orange, Ochre, Field Green and Slate. They appear as text, as 7-8% tinted tag backgrounds, and as solid fills on the score scale and the 1px ticks in the recent-analyses list. Critical Red also signals danger: error alerts, the deny-list icon, and the armed "Sil" (delete) confirmation.
- **TLP Marking** (tlp-red, tlp-amber, tlp-green, tlp-clear): the FIRST TLP 2.0 colours, used only as text on the black TLP band and in the black TLP selector.

### Tertiary
- **Touchstone Brass** (brass): the icon of the active sidebar item. Nothing else uses it.

### Neutral
- **Cool Paper** (canvas): the page background and the desk the sheets sit on.
- **Sheet White** (sheet): briefs, the analyst rail, fields and secondary buttons.
- **Sunken Paper** (sunken): table row hover, the rule-entry form strip, the empty state's contents column, and disabled fields.
- **Hairline** (line) / **Rule** (line-strong): Hairline divides sections and rows. Rule marks table headers and the borders of controls.
- **Ink** (ink), **Ink Secondary** (ink-2), **Ink Tertiary** (ink-3): primary text, supporting text, and labels/meta. Ink also fills the score marker.
- **Night** (night, night-2, night-3, night-text): the sidebar and mobile top bar, their hover and active fills, and their text.
- **Band Black** (band-black): the TLP band and the TLP selector tray. These are pure black, darker than Night, so the marking colours read as they would in the official standard.

### Dark Theme
Every colour is a CSS variable (`src/index.css`) holding RGB channels, so the same Tailwind token names serve both themes and opacity modifiers keep working. The theme is chosen in the sidebar (Açık / Koyu / Sistem), stored under `mihenk.theme`, and applied to `html[data-theme]` by an inline script in `index.html` before first paint. Print always uses the light values.

| Token | Light | Dark |
|---|---|---|
| canvas | #EEEFEC | #0E1013 |
| sheet | #FFFFFF | #16191E |
| sunken | #F6F6F3 | #1C2026 |
| line / line-strong | #DADBD6 / #B9BBB4 | #2A2F37 / #3B414B |
| ink / ink-2 / ink-3 | #15171C / #43474F / #62666E | #E7E9EC / #B6BAC2 / #8D929B |
| night (sidebar) | #121418 | #08090B |
| petrol-700 (action) | #0F4C5C | #3C9DAF |
| on-accent (text on petrol or red fills) | #FFFFFF | #071417 |
| risk critical / high / medium / low | #B4161F / #B8430B / #8F5B07 / #2C6E47 | #F2666E / #F28C50 / #E2AE45 / #55BF82 |

**The Same Paper Rule.** Dark is the same brief rendered in graphite: the TLP bands stay pure black, brass and the TLP colours do not change, and nothing gains glow or gradient. Text on a filled accent always uses `on-accent`, never a literal white.

### Named Rules
**The One Action Hue Rule.** Petrol is the only colour that means "you can act here." Do not create a second accent for buttons, links, tabs or selection. Active tabs use an ink underline, not a colour.

**The Reserved Red Rule.** The red family (risk-*) carries severity, always paired with a shape icon and a word. Critical Red also marks danger (errors, deny-list, destructive confirmation). It is never decoration, branding or emphasis.

**The Touchstone Rule.** Brass appears only on the active nav icon. Never use it for actions, states, severity, charts or highlights.

**The Marking On Black Rule.** TLP colours appear only on band-black (the TLP bands and the selector). Never put them on paper or use them as UI colours.

## Typography

**Display Font:** Source Serif 4 Variable (with Georgia, serif), with optical sizing
**Body Font:** Public Sans Variable (with ui-sans-serif, system-ui)
**Label/Mono Font:** JetBrains Mono Variable (with ui-monospace, SFMono-Regular), with tabular figures and slashed zero

All three fonts are self-hosted through @fontsource-variable.

**Character:** The serif gives the brief its document voice: the assessment reads like a written judgement. Public Sans is plain civic UI. JetBrains Mono shows that a string is evidence: an indicator, a reference number or a score.

### Hierarchy
- **Assessment** (serif 400 with a 600 subject, 1.5rem on mobile and 1.875rem from sm, 1.25-1.3 line height, max 46ch): the single estimative sentence at the top of each brief. Used once per sheet.
- **Headline** (sans 600, 1.5rem, -0.01em): page titles ("Gösterge analizi", "Analist kuralları").
- **Verdict** (sans 700, 1.75rem, line height 1, -0.015em, in the severity colour with its shape icon): the verdict word. Used once per brief.
- **Title** (serif 600, 1.0625rem, -0.005em): document section headings, preceded by a mono section number in ink-3.
- **Body** (sans 400, 0.9375rem / 1.5rem): base text. Finding headings use it at 600.
- **Body Small** (sans 400, 0.8125rem / 1.25rem, relaxed leading in prose, max 70ch): finding descriptions, tables, buttons.
- **Label** (sans 500, 0.75rem, ink-3, sentence case): field and table labels, section meta.
- **Data** (mono, 0.8125rem, tnum and zero): indicators, patterns, references, timestamps, scores, finding points.

### Named Rules
**The Three Voices Rule.** Serif for judgement (assessment, document headings, wordmark), sans for interface, and mono only for machine values. Never set UI copy in mono or values in sans.

**The Sentence-Case Label Rule.** Labels are small and sentence case. There are no uppercase tracked eyebrows. The only uppercase text is the TLP marking itself, which is a standard label.

## Layout

There is a fixed 248px Night sidebar from lg (1024px). Below that it becomes an off-canvas drawer over a 40% Night scrim, opened from a 56px sticky Night top bar. Main content is centred in a 1180px column with 16px side padding (32px from sm) and 32px top padding (40px from lg).

The analysis page stacks the title, the 48px indicator field and the content area. From lg the content becomes a two-column grid: the brief and a 272px sticky analyst rail, with a 24px gutter. Inside a sheet, sections use 32px horizontal padding (20px on mobile) and 24px vertical padding, separated by full-width hairlines. Controls are 36px tall; the hero search field and its button are 48px.

Below sm, tables become stacked definition lists, so evidence is never clipped or scrolled sideways. The rules table is the exception: it scrolls horizontally at a minimum width of 640px. In print, the sidebar, search and rail are hidden, the brief spans the full width without shadow or border, and the TLP bands repeat on every page.

## Elevation & Depth

The system is flat paper. One soft shadow lifts sheets off the canvas, and everything inside a sheet is separated by hairlines and Sunken Paper tints, never by more shadow. Depth also comes from contrast: the black sidebar and bands frame the white paper.

### Shadow Vocabulary
- **Paper** (`box-shadow: 0 1px 2px rgba(21,23,28,0.06), 0 8px 24px -12px rgba(21,23,28,0.14)`): every sheet (brief, rail, rules sheet, empty state) and the hero indicator field. It is removed in print.

### Named Rules
**The One Paper Rule.** Only sheets and the hero field cast a shadow. No glow, no coloured shadow, no stacked cards.

## Shapes

Corners are nearly square: 4px on sheets, buttons, fields and alert boxes, and 3px on severity tags, the score marker, the TLP selector segments, kbd hints and scale end caps. The logo tile is 5px. Full circles appear only as 6px source-coverage dots: filled Field Green when a source answered, an ink-3 outline ring when it did not. Rules are 1px hairlines. The score scale is four segments separated by 2px gaps. Non-active bands are dimmed to 16% opacity.

## Components

### Buttons
Plain and firm, labelled in semibold sans.
- **Shape:** 4px corners, 36px tall, 14px horizontal padding, 8px icon gap.
- **Primary:** Petrol with white text; Petrol Deep on hover and press; 35% Petrol when disabled. There is one per view (Analiz et, Kural ekle).
- **Secondary:** Sheet White with a Rule border and Ink text. On hover the border darkens to ink-3 on Sunken Paper. Rail actions are full-width and left-aligned with a 16px icon in ink-2 or in the meaning colour (deny in red, allow in green).
- **Quiet:** no border; ink-2 text that turns ink on Sunken Paper when hovered.
- **Focus:** 2px Petrol Focus outline with a 2px offset everywhere. It is white on the black TLP selector.

### Chips
- **Severity Tag:** 3px corners, semibold 0.75rem text in the severity colour on a 7-8% tint of the same colour, led by a shape-coded icon (octagon critical, triangle high, circle medium, check low, minus unknown). The large variant is 0.875rem with 10px padding.

### Cards / Containers
- **Sheet:** 4px corners, Sheet White, Hairline border, Paper shadow. Sections inside are separated by hairlines rather than nested cards.

### Inputs / Fields
- **Style:** Sheet White, Rule border, 4px corners, 36px tall.
- **Focus:** the border shifts to Petrol Focus with a 2px ring at 20% Petrol. On hover the border becomes ink-3. Disabled fields turn Sunken Paper. Petrol is used for the caret, and placeholders are ink-3.
- **Indicator Field:** 48px tall, mono value with a sans placeholder, leading search icon, a "/" kbd shortcut hint, and the Paper shadow.

### Navigation
- **Sidebar:** Night background. Items are 36px tall, sans 0.8125rem medium, night-text, Night-2 on hover. The active item is Night-3 with white text and a brass icon. Recent analyses show a mono score, a 1px severity tick and a truncated mono indicator.
- **Tabs (rules):** 48px, semibold; the active tab has a 2px ink underline. The tab icon takes its meaning colour only when active.

### TLP Band (signature)
A black strip at the top and bottom of every brief: the TLP marking in mono semibold in its official colour, the document line in 75% white sans, and the MHK reference and timestamp in mono. Changing the marking in the rail's black four-segment selector recolours both bands (200ms). In print, the bands are forced to print their colours.

### Score Scale (signature)
A banded linear 0-100 scale instead of a ring gauge. There are four severity segments; only the active one is at full strength. An ink marker with a mono value moves to the score once (700ms ease-out). Below each segment are its threshold number in mono and its band label.

## Do's and Don'ts

### Do:
- **Do** use one sheet per document and divide it with hairlines (line), numbered serif section titles and edge-to-edge tables.
- **Do** pair every severity colour with its shape icon and its word; colour never carries severity alone.
- **Do** label missing intelligence in ink-3 as not queried or unknown, never as clean or green.
- **Do** set every indicator, reference, timestamp and score in JetBrains Mono with tabular figures.
- **Do** keep transitions to 150-200ms colour/opacity changes with the out curve (cubic-bezier(0.22, 1, 0.36, 1)); sheets enter with a 220ms 6px rise; honour reduced motion.
- **Do** keep the TLP band on every printed page of a brief.

### Don't:
- **Don't** use Touchstone Brass (brass) for actions, states, severity, charts or highlights; it lives only on the active nav icon.
- **Don't** use the red family for branding, emphasis or decoration; it is for severity and danger.
- **Don't** place TLP colours anywhere except on band-black.
- **Don't** add a second action hue next to petrol.
- **Don't** use ring gauges, card grids, neon accents, glows or a dark navy console theme. The dark theme is the same paper brief in graphite, never navy with neon.
- **Don't** add uppercase tracked eyebrows or kickers above headings.
- **Don't** add decorative gradients to surfaces; the skeleton loading shimmer is the only gradient.
- **Don't** round past 5px or stack shadows inside a sheet.
