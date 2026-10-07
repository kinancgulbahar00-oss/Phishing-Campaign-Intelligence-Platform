---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: ["src/components"]
---

# Mihenk app shell — Analiz + Kurallar

Mode: Operate. Audience: SOC/CTI analysts triaging one indicator at a time, desktop, long sessions. Task: paste URL/domain → read verdict → check evidence → export/print or copy for a ticket → optionally add to allow/deny rules. Constraints: backend unchanged; no past-analysis endpoint (recent list is browser-local and labelled so); missing intel shown as "sorgulanmadı", never as clean.

## Direction contract

THESIS: Every analysis is an intelligence brief, not a dashboard. The report is a TLP-marked document sheet: assessment sentence first, score on a banded linear scale, numbered findings, evidence table. Refuses the category default: dark navy console, neon accent, ring gauge, card grid.

OWN-WORLD: Cool paper canvas #EEEFEC, white sheet, ink #15171C, hairline rules #DADBD6; near-black sidebar #121418 echoing the TLP band; petrol #0F4C5C is the only brand/action hue; red family reserved for severity; official TLP colours on black. Source Serif 4 for assessment and document headings, Public Sans for UI, JetBrains Mono only for indicator values. Square-ish corners (4px), no gradients, no glow.

STORY: Analyst sees the verdict word and estimative sentence within a second, trusts it because each finding is numbered with its reason and evidence, then acts (print, copy summary, add to deny list).

FIRST VIEWPORT: Left 248px black sidebar with Mihenk wordmark, nav (Analiz, Kurallar), browser-local recent analyses. Main: page title + full-width indicator field with petrol "Analiz et" primary. Below, the brief sheet: black TLP band (TLP label + MHK reference + timestamp), indicator in mono, serif assessment sentence, verdict word + 0–100 banded scale with marker; right analyst rail with TLP selector, Yazdır, Özeti kopyala, Engel/İzin listesine ekle.

FORM: TLP-marked CTI intelligence brief; candidate 1 of my ordered list (pick card); seed key 925c4fb1. Signature move: TLP marking selector restyles the brief's top and bottom bands and carries into print. Motion: 180ms state transitions; the score marker travels to its position once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
