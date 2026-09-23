# Lawliet - project brief

Source of truth for the copy on this demo site. Everything here is pulled from the product
repository at `github.com/sarat1kyan/lawliet` so the landing page stays accurate. If a claim
on the site changes, change it here too.

## One line

Compliance operations for people who have to prove it: continuous control assessment, drift
detection, and auditor-grade evidence across every managed asset, from one console you run
yourself.

## What it is

A self-hosted security and compliance operations platform. It runs entirely on your own
infrastructure and nothing about your estate leaves it. The licence verifies against a local
RSA-4096 signature, so it works fully air-gapped with no check-in and no phone-home.

## The load-bearing idea

Most tooling gives you a score. The hard part is the sentence after it: why that score,
which control, on which host, at what time, and where is the artefact that proves it to an
auditor who does not trust you. Every score decomposes into per-control, per-host outcomes
with timestamps; every outcome can be pulled into an evidence bundle carrying content hashes;
a control is marked compliant only after remediation is validated, not attempted.

## Pull-only agents (the key differentiator)

Nothing ever connects to a monitored host. Commands sit in a server-side queue, HMAC-signed
with a timestamp. Hosts heartbeat outbound on a timer, receive signed commands in the reply,
verify signature and clock skew, then execute.

- No listening port on an endpoint. Nothing to expose, roaming laptops behind NAT work.
- Commands arrive on the next heartbeat, worst case about a minute at the default interval.
- A command older than 10 minutes or more than 60 seconds in the future is rejected.

## Modules

- Operations: Overview, Environment, Assets, Compliance, Evidence, Hardening, Operations
- Investigation: Forensics, Defense, FIM, Review queue
- Network and data: Network discovery, Firewall governance, DLP
- Administration: Settings, API keys and audit trail, SSO, Setup, Sandbox

Worth calling out:
- Compliance scoring counts not_assessed controls in the denominator, so a partial scan
  reports lower, not perfect.
- Hardening does real remediation with approval, rollback and post-change validation.
- Network discovery uses twelve techniques (ARP, ICMP, mDNS, SSDP, NetBIOS, SNMP, banner
  and TLS inspection, OUI lookup and more) instead of a TCP sweep.
- Firewall rule-set analysis does set-based shadow and duplicate detection with CIDR and
  port containment.
- Evidence bundles export as JSON or standalone HTML across five scopes, secrets redacted,
  SHA-256 of every referenced artefact recorded alongside it.

## Frameworks mapped

CIS Benchmarks (deepest coverage), NIST 800-53, NIST CSF 2.0, DISA STIG, ISO 27001,
PCI-DSS, HIPAA, SOC 2, GDPR.

## Architecture

- frontend: Next.js 14 App Router, TypeScript, Tailwind. 36 page routes.
- backend: FastAPI, async SQLAlchemy, Alembic. 23 routers, 35 migrations.
- agents: Python for Linux, macOS, Windows. Pull-only, HMAC-signed, Ed25519 self-upgrade.
- license-server: offline-capable licence issuance and revocation.
- PostgreSQL for production, SQLite for tests, Redis for cache and queues. One compose file.

## Test and CI facts

3,266 backend tests and 206 frontend tests (3,472 total). CI gates on four jobs: backend on
SQLite, backend on real PostgreSQL, frontend suite with typecheck and lint, and a Docker
smoke test that builds images and boots the stack.

## Product maturity (state it honestly)

- Field-tested end to end: Linux agent (install, heartbeat, compliance scanning, FIM, DLP,
  command signing, signed self-upgrade) against real Ubuntu hosts and PostgreSQL; network
  discovery against a real network; full offline install from a distributed bundle.
- Implemented and tested, not yet field-tested: macOS and Windows agents; hardening has run
  against lab hosts only.
- Deliberately absent: multi-tenancy. One organisation per deployment, on purpose.

## Licensing

Source is MIT. The product licence gates features, agent counts and tenancy at runtime across
starter, professional and enterprise tiers, verified locally against an RSA-4096 signature.

## Brand

- Mark: a blade "L" inside a targeting reticle.
- Palette: graphite near-black surfaces (#06080d, #0c0e18, #111422), single electric-blue
  accent (#4f89f5 / #256bff), semantic status green/amber/red/cyan used sparingly.
- Geometry: blade-sharp corners, minimal radius. No rounded, kit-look corners.
- Type: Space Grotesk (display), Inter (body), JetBrains Mono (signal text).
- Writing style: plain hyphens, never em or en dashes.

## Links

- Source and docs: https://github.com/sarat1kyan/lawliet
- This demo site source: https://github.com/sarat1kyan/lawliet-demo
