# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

SOC and CTI analysts inside an organisation's security team. Through the working day they receive suspicious URLs and domains (user-reported emails, alerts, tickets) and must triage each one quickly: is it phishing, how sure are we, why, and what goes in the ticket or report. Repeated, high-frequency use; the analyst often has the tool open beside a SIEM, ticketing system, or mail client.

## Product Purpose

Turns a single indicator (URL or domain) into an explainable threat verdict in seconds: a weighted 0–100 risk score with a level, the findings that produced it, and the supporting indicator evidence. Success means the analyst can decide and document a verdict without opening five other tools, and can defend that verdict because every point of the score has a stated reason.

## Positioning

Explainability first. The score is never a black box: each rule that fired is listed with its severity and a plain-language reason, and analysts can steer the engine with their own whitelist/blacklist rules. Built for Turkish-language analysts and Turkish phishing patterns (bank, cargo/kargo, crypto exchange impersonation).

## Operating Context

- Analyst pastes an indicator, runs analysis, reads verdict and reasons, checks IOC evidence, exports/prints the report for a ticket.
- Analysts maintain allow/deny rules (domain, IP, full URL) that short-circuit or bias analysis.
- Runs as a self-hosted service (Docker Compose; FastAPI serves the built SPA from `dist/`).

## Capabilities and Constraints

- Stack: React 18 + Vite + Tailwind CSS 3, `lucide-react` icons. Backend is FastAPI and is out of scope for the frontend redesign.
- API (base `VITE_API_BASE_URL`, default `http://localhost:8000`):
  - `POST /analyze/url` → `{ id, url, risk_score (0–100), risk_level (CRITICAL|HIGH|MEDIUM|LOW), reasons[{rule_name, description, severity, contribution}], ioc_details{domain, registrar, domain_age_days, domain_registration_date, ip_address, abuse_score, ip_reports_count, abuse_status, url, vt_positives, vt_total, vt_status, has_https, tls_status, target_brand, target_sector, page_status, page_title, final_url, page_fields}, related_domains[{domain, similarity}] }`
  - `GET/POST /lists`, `DELETE /lists/{id}` — whitelist/blacklist rules `{id, list_type, entry_type (domain|ip|url), pattern, description, created_at}`.
  - `GET /ioc/{id}`, `GET /campaign/{id}` exist; there is no endpoint to list past analyses or campaigns.
- External intel may be missing (no API key → `abuse_status` / `vt_status` = `no_api_key`); the UI must present absent data honestly.
- Report export is currently browser print.
- Brand impersonation (2026-10-07): catalog of 218 Turkish-market institutions across 18 sectors in `backend/data/tr_brands.json` (official domains, URL aliases, weak aliases that need a sector lure, on-page display names), served at `GET /brands` and shown on the Kurum kataloğu page. Unlisted public bodies are caught by entity words (belediye, valilik, bakanlığı…) outside restricted suffixes (.gov.tr, .bel.tr, .edu.tr…). The catalog is a curated list, not every organisation in Turkey; analysts extend it by editing the JSON.
- Page content probe (`backend/core/page_probe.py`, `PAGE_FETCH_ENABLED`): fetches the page without JavaScript, public IPs only (SSRF guard per redirect hop), 600 KB / ~10 s cap; extracts title, site name, logos, sensitive form fields (password, card, T.C. kimlik, SMS code), external form targets and Telegram/Discord exfiltration.

## Brand Commitments

- Product name: **Mihenk** (confirmed 2026-10-07). From "mihenk taşı", the touchstone used to test whether gold is genuine: the product tests whether an indicator is authentic or counterfeit. Descriptor: "Yıldız Siber Tehdit İstihbaratı". Logo: `docs/logo.jpg` (white crescent, eagle and star on dark grey; confirmed 2026-10-07). Replaces "CTI Phishing Platform".
- The previous visual identity (dark navy + gold) is not binding.
- UI language is Turkish.

## Evidence on Hand

- `docs/dashboard.png`: screenshot of the current UI analysing `kucoins-signin.com` (score 82, critical).
- No customers, testimonials, benchmarks, certifications, or pricing exist; none may be invented.

## Product Principles

1. Every number earns its reason: a score is shown together with the findings that produced it.
2. Triage speed over decoration: the verdict is readable at a glance, details are one scan away.
3. Honest about missing data: unknown or unqueried sources are labelled as such, never shown as clean.
4. Analyst stays in control: their allow/deny rules are first-class, not a buried setting.

## Accessibility & Inclusion

Long sessions on desktop monitors; severity must never be encoded by colour alone (label + colour). Keyboard-operable search and rule management.
