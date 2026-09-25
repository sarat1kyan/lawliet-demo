"""
Writes the static docs pages in docs/. The output is committed, so the site needs no build.

    python3 tools/generate_docs.py

Edit the page bodies here, not the generated HTML. docs/installation-guide.html is not
generated: it is the customer installation guide, copied from the product repository.
"""
import sys
from pathlib import Path

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent / "docs"
PAGES = [
    ("index.html", "Overview", "Start here"),
    ("getting-started.html", "Getting started", "Start here"),
    ("installation-guide.html", "Installation guide (printable)", "Start here"),
    ("platform.html", "Platform modules", "Using Lawliet"),
    ("agents.html", "Agents", "Using Lawliet"),
    ("security.html", "Security model", "Using Lawliet"),
    ("licensing.html", "Licensing and suites", "Running it"),
    ("operations.html", "Operations and updates", "Running it"),
    ("releases.html", "Releases", "Releases"),
]

# Extra per-page scripts appended before the shared docs script.
SCRIPTS = {
    "releases.html": '<script src="../assets/js/releases.js?v=8" defer></script>',
}

LOGO = ('<picture><source srcset="../assets/img/brand/mark-56.webp 1x, ../assets/img/brand/mark-112.webp 2x" type="image/webp">'
        '<img class="mark" src="../assets/img/brand/mark-56.png" width="28" height="28" alt="Lawliet"></picture>'
        '<picture class="word-pic"><source srcset="../assets/img/brand/wordmark-240.webp 1x, ../assets/img/brand/wordmark-480.webp 2x" type="image/webp">'
        '<img class="word" src="../assets/img/brand/wordmark-240.png" width="240" height="20" alt="LAWLIET"></picture>')

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} | Lawliet documentation</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#020304">
<link rel="icon" href="../assets/img/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="32x32" href="../assets/img/favicon-32x32.png">
<link rel="apple-touch-icon" href="../assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500&display=swap">
<link rel="stylesheet" href="../assets/css/tokens.css?v=8">
<link rel="stylesheet" href="../assets/css/docs.css?v=8">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="hdr">
  <a class="lockup" href="../" aria-label="Lawliet home">""" + LOGO + """</a>
  <nav class="nav" aria-label="Primary">
    <a href="../#platform">Platform</a>
    <a href="../#security">Security</a>
    <a href="../#pricing">Pricing</a>
    <a href="./" aria-current="true">Docs</a>
  </nav>
  <div class="hdr-cta">
    <a class="btn btn-primary" href="../#demo">Book a demo</a>
    <button class="menu-btn" id="menuBtn" type="button" aria-label="Open menu" aria-expanded="false"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button>
  </div>
</header>
<div class="sheet glass-rail" id="sheet" aria-hidden="true"><div class="sheet-inner">
  <a href="../#platform">Platform</a><a href="../#security">Security</a><a href="../#pricing">Pricing</a><a href="./">Docs</a>
  <a class="btn btn-primary" href="../#demo">Book a demo</a>
</div></div>
<div class="docs-layout">
  <aside class="docs-nav" aria-label="Documentation">
{sidenav}
  </aside>
  <main class="doc" id="main">
"""

FOOT = """{nextlinks}
  </main>
</div>
<footer class="site-foot">
  <div class="foot-base"><span>Lawliet. Self-hosted security and compliance.</span><span><a href="mailto:info@justlawliet.net">info@justlawliet.net</a></span></div>
</footer>
<script src="../assets/js/docs.js?v=8" defer></script>
{extra}
</body>
</html>
"""


def sidenav(current: str) -> str:
    out, group = [], None
    for file, label, g in PAGES:
        if g != group:
            if group is not None:
                out.append("      </ul></div>")
            out.append(f"      <div><p>{g}</p><ul>")
            group = g
        cur = ' aria-current="page"' if file == current else ""
        out.append(f'        <li><a href="{file}"{cur}>{label}</a></li>')
    out.append("      </ul></div>")
    return "\n".join(out)


def nextlinks(current: str) -> str:
    files = [p for p in PAGES if p[0] != "installation-guide.html"]
    i = [p[0] for p in files].index(current)
    prev = files[i - 1] if i > 0 else None
    nxt = files[i + 1] if i + 1 < len(files) else None
    parts = ['    <nav class="doc-next" aria-label="Next and previous">']
    parts.append(f'      <a href="{prev[0]}"><small>Previous</small><b>{prev[1]}</b></a>' if prev else "      <span></span>")
    parts.append(f'      <a href="{nxt[0]}" style="text-align:right"><small>Next</small><b>{nxt[1]}</b></a>' if nxt else "      <span></span>")
    parts.append("    </nav>")
    return "\n".join(parts)


BODY = {}

BODY["index.html"] = ("Overview", "What Lawliet is, how it is delivered and where to start.", """
    <h1>Lawliet documentation</h1>
    <p class="intro">Lawliet is a self-hosted compliance and security operations platform. It runs on one Linux server you control, watches your hosts through small pull-only agents, and keeps every result, and the evidence behind it, on that server.</p>

    <div class="doc-cards">
      <a href="getting-started.html"><b>Getting started</b><span>Requirements, installation, activation and your first hosts.</span></a>
      <a href="platform.html"><b>Platform modules</b><span>What each module does, from compliance to forensics.</span></a>
      <a href="security.html"><b>Security model</b><span>Agents, signed commands, roles, four-eyes approval and two-factor.</span></a>
      <a href="licensing.html"><b>Licensing and suites</b><span>Suites, build your own, offline activation, renewals and expiry.</span></a>
      <a href="agents.html"><b>Agents</b><span>Supported systems, what agents collect and how they are enrolled.</span></a>
      <a href="operations.html"><b>Operations and updates</b><span>Backups, updates, retention and forwarding to your SIEM.</span></a>
      <a href="releases.html"><b>Release notes</b><span>What changed in every version, newest first.</span></a>
    </div>

    <h2>How it is delivered</h2>
    <p>You receive a signed bundle built for your organisation. It installs with one command, carries no licence, and runs without internet access. When the installer finishes it prints this installation's fingerprint; send it to us and we return a licence that works on that installation only.</p>
    <ol>
      <li><strong>Install</strong> the bundle on a Linux server with Docker.</li>
      <li><strong>Sign in</strong>, set your own password and enrol two-factor.</li>
      <li><strong>Activate</strong> with the licence issued for your fingerprint.</li>
      <li><strong>Enrol your hosts</strong> and schedule the first scans.</li>
    </ol>
    <div class="note"><p>Operators installing a bundle can follow the <a href="installation-guide.html">printable installation guide</a>, which walks through every step with checkboxes and troubleshooting.</p></div>

    <h2>Getting help</h2>
    <p>Write to <a href="mailto:support@justlawliet.net">support@justlawliet.net</a>. On the server, <code>./lawliet doctor</code> collects a diagnostics file for us; it holds no passwords and no data. Security issues go to <a href="mailto:security@justlawliet.net">security@justlawliet.net</a>.</p>
""")

BODY["getting-started.html"] = ("Getting started", "Requirements, installation, first sign-in, activation and enrolling hosts.", """
    <h1>Getting started</h1>
    <p class="intro">From a bundle to a running, activated platform with its first hosts reporting. Plan for about twenty minutes.</p>

    <h2 id="requirements">Requirements</h2>
    <div class="table"><table>
      <thead><tr><th>You need</th><th>Details</th></tr></thead>
      <tbody>
        <tr><td>A Linux server</td><td>Any current 64-bit distribution: Ubuntu, Debian, RHEL, Rocky or Alma. Intel/AMD or ARM.</td></tr>
        <tr><td>Size</td><td>4 CPU cores, 8 GB RAM and 40 GB free disk for a small estate. Give it more as the number of hosts grows.</td></tr>
        <tr><td>Docker</td><td>Docker Engine 24 or newer with the Compose plugin, usable by the account you install with.</td></tr>
        <tr><td>Tools</td><td><code>bash</code>, <code>curl</code> and <code>tar</code>. <code>openssl</code> only if the installer is to create a self-signed certificate.</td></tr>
        <tr><td>Internet</td><td>Not required. Lawliet installs and runs air-gapped.</td></tr>
      </tbody>
    </table></div>

    <h2 id="network">Network</h2>
    <div class="table"><table>
      <thead><tr><th>Port</th><th>Direction</th><th>Purpose</th></tr></thead>
      <tbody>
        <tr><td><code>443/tcp</code></td><td>Users and agents to the server</td><td>Console, API and agent heartbeats</td></tr>
        <tr><td><code>80/tcp</code></td><td>Optional</td><td>Redirects to HTTPS</td></tr>
        <tr><td><code>5514/udp</code>, <code>5514/tcp</code></td><td>Devices to the server</td><td>Syslog from network devices and servers</td></tr>
        <tr><td><code>123/udp</code></td><td>Both ends</td><td>Time sync. Signed commands are refused when clocks drift too far.</td></tr>
      </tbody>
    </table></div>
    <p>Monitored hosts open no port at all. Every connection starts at the agent.</p>

    <h2 id="install">Install</h2>
    <p>Copy the bundle to the server, check its SHA-256 against the one we sent, then:</p>
    <pre><code>tar xzf lawliet-docker-*.tar.gz
cd lawliet-*/
./lawliet install</code></pre>
    <p>The installer checks the machine, asks a few questions (the address users will reach, and how to handle the certificate), generates every secret, starts the stack and verifies the API, the console and the database schema. It ends by printing the console address, a one-time administrator password and the installation fingerprint.</p>

    <h2 id="sign-in">First sign-in</h2>
    <ol>
      <li>Open the console address and sign in with the one-time password.</li>
      <li>Choose your own password: at least 12 characters, common passwords refused.</li>
      <li>Set up two-factor authentication with any TOTP app, and save the ten recovery codes.</li>
    </ol>

    <h2 id="activate">Activate</h2>
    <p>Until a licence is installed, the console opens on its activation screen. It shows the installation fingerprint, which is also printed by <code>./lawliet licence</code> on the server.</p>
    <ol>
      <li>Send the fingerprint to us. It identifies this installation and nothing else: no host name, address or data.</li>
      <li>Paste the licence key you receive into the activation screen, or run <code>./lawliet licence &lt;key-file&gt;</code> on the server.</li>
    </ol>
    <div class="note"><p>The licence is checked on your server. Nothing is sent anywhere, and the key works on this installation only.</p></div>

    <h2 id="hosts">Enrol your hosts</h2>
    <p>On the server, <code>./lawliet token</code> prints a ready-to-run install command for Linux, Windows and macOS, with the server address and enrolment token filled in. The same commands are under <strong>Environment</strong>, <strong>Install agent</strong> in the console.</p>
    <pre><code># Linux, as root
curl -sSL https://your-server/api/v1/agents/download/linux | sudo bash -s -- \\
  --server https://your-server --token &lt;enrolment-token&gt;</code></pre>
    <p>Within a minute the host appears under <strong>Environment</strong>. See <a href="agents.html">Agents</a> for the other platforms and for self-signed certificates.</p>

    <h2 id="team">Add your team</h2>
    <p>Create an account for each person under <strong>Settings</strong>, <strong>Users</strong>, and give each a role. Every new user sets their own password and enrols two-factor at first sign-in. If you use the security officer roles, see <a href="security.html#dual-control">dual control</a>.</p>
""")

BODY["platform.html"] = ("Platform modules", "What each Lawliet module does.", """
    <h1>Platform modules</h1>
    <p class="intro">Every module writes to the same evidence store, review queue and audit trail. Which modules are available depends on your <a href="licensing.html">suite</a>.</p>

    <h2 id="compliance">Continuous compliance</h2>
    <p>Scans run on a schedule or on demand, across the whole estate, one host or a chosen set. Each score decomposes into per-control, per-host results with timestamps. A host that could not be reached counts as <strong>not assessed</strong>, so a partial scan reports a lower score rather than a perfect one.</p>
    <p>Between scans, drift detection compares each result with the last one and records every control that changed. Drift that needs attention goes to the review queue.</p>
    <h3>Frameworks and benchmarks</h3>
    <div class="table"><table>
      <thead><tr><th>Group</th><th>Content</th></tr></thead>
      <tbody>
        <tr><td>Standards</td><td>CIS Controls v8, NIST SP 800-53 Rev. 5, NIST CSF, ISO/IEC 27001:2022, ISO/IEC 27701, PCI DSS v4.0, SOC 2 Type II, HIPAA Security Rule, GDPR technical controls, CMMC 2.0</td></tr>
        <tr><td>Linux benchmarks</td><td>CIS Linux, CIS RHEL and CentOS, CIS Debian and Ubuntu, CIS Arch Linux, DISA STIG Linux</td></tr>
        <tr><td>Windows benchmarks</td><td>CIS Windows 10 and 11, CIS Windows Server 2019 and 2022, DISA STIG Windows Server</td></tr>
        <tr><td>macOS benchmarks</td><td>CIS macOS</td></tr>
      </tbody>
    </table></div>
    <p>Automated checks for the standards run on Linux hosts.</p>

    <h2 id="reports">Scheduled reports</h2>
    <p>Dated reports per framework over a period. A framework that was not scanned in that period is shown as not assessed, never left out.</p>

    <h2 id="evidence">Evidence bundles</h2>
    <p>Collect evidence across scans, drift, remediation and attestations into one bundle, and export it as JSON or a standalone HTML report. Secrets are redacted, and the SHA-256 of every referenced artefact is recorded alongside it.</p>

    <h2 id="hardening">Hardening</h2>
    <p>Remediation runs on the host through the agent, with approval before and rollback after. A control is marked compliant only when a re-check passes, never because a fix was attempted. Changes to critical assets need extra approval.</p>

    <h2 id="siem">SIEM</h2>
    <p>Receives syslog (RFC 5424 and RFC 3164), CEF, LEEF and JSON. Detection rules come in five kinds: threshold, sequence, first seen, went quiet and spike. Events can be forwarded to your own SIEM; see <a href="operations.html#forwarding">forwarding</a>.</p>
    <p>Log collection and detection are in the Operate and Complete suites. Forwarding to an external SIEM is in every suite.</p>

    <h2 id="fim">File integrity monitoring</h2>
    <p>Agents watch the paths you choose and report every addition, change and deletion with the old and new hash, in a hash-chained history per file. Events link to the compliance controls they affect and have an analyst workflow.</p>

    <h2 id="dlp">Data loss prevention</h2>
    <p>Detects credentials and personal data, blocks inline where content is inspected, and stores findings redacted. Incidents move through an analyst workflow from new to closed.</p>

    <h2 id="defence">Active defence</h2>
    <p>Quarantine a file, kill a process, block an IP, isolate a host, disable a user or reset credentials, on Linux, Windows and macOS. Each action is a signed command. The console shows it as dispatched until the agent confirms it ran.</p>

    <h2 id="forensics">Digital forensics</h2>
    <p>Cases with chain of custody. Uploaded artefacts get YARA scanning and static analysis: strings, entropy and extraction of IP addresses, domains, URLs, email addresses and file hashes.</p>

    <h2 id="network">Network discovery</h2>
    <p>Twelve techniques: ARP, routing table, ICMP, TCP connect, service banners, TLS certificates, reverse DNS, mDNS, SSDP, NetBIOS, SNMP system description and MAC vendor lookup. Switches, printers and appliances are identified rather than listed as unknown.</p>

    <h2 id="firewall">Firewall governance</h2>
    <p>Full rule parsing for Cisco ASA and iptables, and policy parsing for FortiGate. Rule sets are checked for any-any rules, duplicates and shadowed rules. Configurations can be fetched over SSH from ASA, FortiGate, PAN-OS and Junos.</p>

    <h2 id="queue">Review queue</h2>
    <p>One deduplicated queue of what needs a decision, across compliance, FIM, DLP, forensics, hardening, firewall and intelligence. Every decision is recorded. Nothing is remediated automatically.</p>

    <h2 id="assets">Asset intelligence and audit trail</h2>
    <p>An inventory of every managed host with its criticality, which feeds risk scoring and gates critical hardening. The audit trail records every action, who took it and who approved it, and can be filtered and exported.</p>
""")

BODY["agents.html"] = ("Agents", "Supported systems, enrolment and what Lawliet agents collect.", """
    <h1>Agents</h1>
    <p class="intro">A small service on each monitored host. It connects out to your Lawliet server on a heartbeat and never listens on a port.</p>

    <h2 id="platforms">Supported systems</h2>
    <div class="table"><table>
      <thead><tr><th>Platform</th><th>Runs as</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Linux: Ubuntu 22.04 and 24.04, Debian 11 and 12, RHEL and Rocky 8 and 9</td><td>systemd service</td><td>Field-tested</td></tr>
        <tr><td>Windows</td><td>Scheduled task as SYSTEM</td><td>Supported</td></tr>
        <tr><td>macOS</td><td>launchd service</td><td>Supported</td></tr>
      </tbody>
    </table></div>
    <p>The Linux agent needs Python 3.10 or newer.</p>

    <h2 id="collects">What an agent does</h2>
    <ul>
      <li>Runs compliance checks when a scan asks for them.</li>
      <li>Watches the paths you choose for file integrity changes.</li>
      <li>Reports data loss prevention findings, stored redacted.</li>
      <li>Sends host metrics, processes and connections for the inventory.</li>
      <li>Carries out signed commands: remediation and containment.</li>
    </ul>

    <h2 id="enrol">Enrolling a host</h2>
    <p>Run <code>./lawliet token</code> on the server, or open <strong>Environment</strong>, <strong>Install agent</strong> in the console, and copy the command for the platform.</p>
    <pre><code># Linux, as root
curl -sSL https://your-server/api/v1/agents/download/linux | sudo bash -s -- \\
  --server https://your-server --token &lt;enrolment-token&gt;

# Windows, PowerShell as Administrator
Invoke-WebRequest https://your-server/api/v1/agents/download/windows -OutFile install.ps1
.\\install.ps1 -Server https://your-server -Token &lt;enrolment-token&gt;

# macOS
curl -sSL https://your-server/api/v1/agents/download/macos | sudo bash -s -- \\
  --server https://your-server --token &lt;enrolment-token&gt;</code></pre>
    <div class="note"><p>Using a self-signed certificate? Each host has to trust it. <code>./lawliet tls --export</code> writes the certificate to copy to your hosts.</p></div>

    <h2 id="commands">How commands reach a host</h2>
    <p>Commands wait in a queue on the server. On its next heartbeat the agent collects them, checks each one's HMAC-SHA256 signature and timestamp, and runs it. A command older than ten minutes, or more than a minute in the future, is refused. This is why time sync matters on both ends.</p>

    <h2 id="upgrades">Agent upgrades</h2>
    <p>Agents can upgrade themselves to a release signed with an Ed25519 key that we hold offline. An agent refuses any release without a valid signature. Automatic upgrade is off by default.</p>
""")

BODY["security.html"] = ("Security model", "How Lawliet protects the hosts it watches and the actions it can take.", """
    <h1>Security model</h1>
    <p class="intro">A platform that can change every host it watches is a target. These are the controls that stand between that capability and someone misusing it.</p>

    <h2 id="agents">Pull-only agents</h2>
    <p>Nothing connects to a monitored host. Agents open no listening port and reach the server on a heartbeat, which also means laptops behind NAT and hosts in segmented networks work without firewall exceptions towards them.</p>

    <h2 id="commands">Signed commands</h2>
    <p>Every command is signed with HMAC-SHA256 using the agent's own token, and carries a timestamp. Agents refuse a command that is older than ten minutes or more than a minute in the future, so a captured command cannot be replayed later.</p>

    <h2 id="roles">Roles and permissions</h2>
    <p>Seven built-in roles: Super administrator, Left Security Officer, Right Security Officer, Administrator, Analyst, Auditor and Viewer. You can create your own roles and give individual users extra grants or denials. When a grant and a denial meet, the denial wins.</p>

    <h2 id="dual-control">Dual control</h2>
    <p>Critical actions wait for a second person to approve them. By default this covers changes to users and roles, the approval policy itself, containment, remediation, firewall pushes, deleting agents, licences, platform updates, API keys and agent releases.</p>
    <p>The Left and Right Security Officers approve each other's requests, and nobody can approve their own. Pending requests appear under <strong>Approvals</strong>. Which actions need approval, and who approves whom, is set under <strong>Settings</strong>, <strong>Access control</strong>, <strong>Dual control</strong>.</p>

    <h2 id="sign-in">Sign-in</h2>
    <ul>
      <li>Two-factor authentication (TOTP) is required by default, with ten single-use recovery codes.</li>
      <li>The installation's first administrator must replace the one-time password before anything else opens.</li>
      <li>Passwords shorter than 12 characters, or well known, are refused.</li>
      <li>Single sign-on with OIDC is available; local sign-in remains for break-glass access.</li>
    </ul>

    <h2 id="api-keys">API keys</h2>
    <p>Service accounts use API keys with one of three scopes: read-only, run scans or ingest. Keys are stored only as SHA-256 hashes.</p>

    <h2 id="audit">Audit trail</h2>
    <p>Every action is recorded with the user, the time and, for critical actions, the approver. Audit records are kept for two years by default.</p>

    <h2 id="delivery">Delivery and updates</h2>
    <ul>
      <li>Each bundle carries a signed manifest of every file in it.</li>
      <li>The server application ships compiled to native code for Intel/AMD and ARM.</li>
      <li>Licences are RSA-4096 signed and verified on your server, with no licence server and no telemetry.</li>
      <li>Agent releases are signed with a separate Ed25519 key held offline.</li>
    </ul>

    <h2 id="data">Where your data lives</h2>
    <p>On your server, in PostgreSQL and Redis on the internal container network. Neither is published on a host port. Nothing is sent to us.</p>

    <h2 id="disclosure">Reporting a vulnerability</h2>
    <p>Write to <a href="mailto:security@justlawliet.net">security@justlawliet.net</a>.</p>
""")

BODY["licensing.html"] = ("Licensing and suites", "Lawliet suites, offline activation, renewals and expiry.", """
    <h1>Licensing and suites</h1>
    <p class="intro">Lawliet licences are verified on your own server. There is no licence server, no check-in and no internet needed, at activation or afterwards.</p>

    <h2 id="suites">Suites</h2>
    <div class="table"><table>
      <thead><tr><th>Suite</th><th>For</th><th>Includes</th></tr></thead>
      <tbody>
        <tr><td>Comply</td><td>Proving the estate is compliant and fixing what is not</td><td>Continuous compliance and drift, hardening with approval and rollback, scheduled reports, network discovery and topology, firewall rule-set review</td></tr>
        <tr><td>Operate</td><td>Watching the estate every day and acting on it</td><td>Log collection, search and detection, file integrity monitoring, data loss prevention, alerts in one review queue</td></tr>
        <tr><td>Complete</td><td>Watching, proving and investigating on the host</td><td>Everything in Comply and Operate, plus digital forensics and active defence</td></tr>
      </tbody>
    </table></div>
    <p>Every suite includes the review queue, evidence bundles, SIEM forwarding, role-based access, four-eyes approval, two-factor sign-in, the audit trail, all updates and email support. Each suite is sized on its own for up to 30, 100, 500, 1,000 or 3,000 agents, or every host with a site licence.</p>

    <h3 id="other-ways">Other ways to buy</h3>
    <ul>
      <li>30-day evaluation on your own hardware, 5 agents, demo data, free.</li>
      <li>60-day pilot, up to 50 agents, on Complete; the fee is credited if you subscribe.</li>
      <li>90-day run-it-yourself licence for one project, any suite; credited in full if you subscribe within 60 days.</li>
      <li>Perpetual licence for air-gapped and public-sector sites, with maintenance.</li>
    </ul>

    <h2 id="build-your-own">Build your own</h2>
    <p>If a suite does not fit, build a licence from individual modules. A build is sized with the same tiers as the suites and includes the same base, and the licence carries exactly the modules you choose.</p>
    <div class="table"><table>
      <thead><tr><th>Module</th><th>What it covers</th><th>Rule</th></tr></thead>
      <tbody>
        <tr><td>Compliance and hardening</td><td>Scans against CIS, NIST, ISO 27001, PCI DSS and more; drift; hardening with approval and rollback; scheduled reports and evidence</td><td>Sold on its own</td></tr>
        <tr><td>Firewall governance</td><td>Rule-set review and optimisation for 14 firewall vendors; export for import; live apply with four-eyes approval; monitoring of connected firewalls</td><td>Sold on its own; the number of firewalls grows with the size tier</td></tr>
        <tr><td>Network discovery and topology</td><td>Discovery across your segments, device inventory, topology</td><td>Only together with Firewall governance</td></tr>
        <tr><td>Log collection and detection</td><td>Collection, search, Sigma and correlation rules, alerts, entity risk, dashboards</td><td>Sold on its own</td></tr>
        <tr><td>Data loss prevention</td><td>Custom policies, data discovery and where-is-this-file, blocking of USB, uploads, print and email on Linux</td><td>Sold on its own</td></tr>
        <tr><td>File integrity monitoring</td><td>Custom policies, on-host baseline and verify, the process behind each change</td><td>Sold on its own</td></tr>
        <tr><td>Forensics and hunting</td><td>Live response, triage and memory capture, case timeline, fleet IOC and YARA hunts</td><td>Sold on its own</td></tr>
        <tr><td>Active defence</td><td>Isolate, block, quarantine, kill and disable on the host, each with undo and four-eyes approval</td><td>Needs at least one of Forensics and hunting, Log collection and detection, Data loss prevention or File integrity monitoring</td></tr>
      </tbody>
    </table></div>
    <p>Every build includes the same base as the suites: review queue, evidence bundles, SIEM forwarding, role-based access, four-eyes approval, two-factor sign-in, the audit trail, all updates and email support. Builds use the same sizes as the suites (up to 30, 100, 500, 1,000 or 3,000 agents, or a site licence) and have a minimum size.</p>
    <p>A suite always costs less than buying its modules one by one, so a suite is the better value when it fits. Build your own when you need less, or a different mix.</p>

    <h2 id="activation">Activation</h2>
    <p>Bundles ship without a licence. The licence is issued to the installation you create:</p>
    <ol>
      <li>The installer prints the installation fingerprint: 32 characters that identify this installation and nothing else.</li>
      <li>You send it to us by any channel.</li>
      <li>We return a licence key bound to that fingerprint.</li>
      <li>You paste it into the console's activation screen, or run <code>./lawliet licence &lt;key-file&gt;</code>.</li>
    </ol>
    <p>A bound key refuses to activate on any other installation, so a copied bundle or key is useless elsewhere.</p>

    <h2 id="renewal">Renewal</h2>
    <p>A renewed key is entered the same way, under <strong>Settings</strong>, <strong>Licence</strong>, or with <code>./lawliet licence</code>. It takes effect immediately and stays in place across restarts and updates. A key older than the one in use is refused.</p>

    <h2 id="expiry">When a licence expires</h2>
    <p>The platform pauses: the console and API refuse requests until a valid licence is installed. Sign-in, two-factor, the licence page and pending approvals stay available so a renewal can be entered. Your data is untouched.</p>

    <h2 id="engagements">One-time engagements</h2>
    <p>A single job, such as a compliance assessment with hardening, a network map or a firewall review, runs on an <strong>engagement licence</strong>. It carries only the modules that job needs and a host limit, for a fixed work window.</p>
    <ol>
      <li><strong>Work window.</strong> The job's modules work normally. The console shows the engagement's reference and the days left.</li>
      <li><strong>Close-out.</strong> The platform turns read-only. You can still export evidence bundles and generate reports.</li>
      <li><strong>Decommission.</strong> Under <strong>Settings</strong>, <strong>Licence</strong>, <em>Decommission all agents</em> tells every agent to remove itself from its host. Under dual control it needs a second approver.</li>
      <li><strong>Expiry.</strong> At the end of close-out the licence expires. <code>./lawliet uninstall</code> removes the server.</li>
    </ol>
    <p>A host that will not check in again can be cleaned by hand: <code>sudo bash install_linux.sh --uninstall</code>, <code>sudo bash install_macos.sh --uninstall</code>, or <code>install_windows.ps1 -Uninstall</code>.</p>

    <h2 id="reinstall">Reinstalling or moving servers</h2>
    <p>The fingerprint belongs to the installation's configuration volume. A restore of a backup onto the same installation keeps it. A fresh installation on a new server has a new fingerprint and needs a new key; ask us before you move.</p>
""")

BODY["operations.html"] = ("Operations and updates", "Day-to-day commands, backups, updates, retention and SIEM forwarding.", """
    <h1>Operations and updates</h1>
    <p class="intro">Everything is done with <code>./lawliet</code> from the deployment folder. <code>./lawliet help</code> lists it all.</p>

    <h2 id="commands">Day-to-day commands</h2>
    <div class="table"><table>
      <thead><tr><th>Command</th><th>What it does</th></tr></thead>
      <tbody>
        <tr><td><code>./lawliet status</code></td><td>Health, licence, version and connected hosts</td></tr>
        <tr><td><code>./lawliet backup</code></td><td>A database backup into <code>./backups</code>. HTTPS installations also take one daily.</td></tr>
        <tr><td><code>./lawliet restore &lt;file&gt;</code></td><td>Restores a backup and restarts. Asks before replacing anything.</td></tr>
        <tr><td><code>./lawliet update &lt;bundle&gt;</code></td><td>Upgrades to a newer bundle. See below.</td></tr>
        <tr><td><code>./lawliet restart</code></td><td>Restarts and waits until healthy. Data is never touched.</td></tr>
        <tr><td><code>./lawliet logs backend -f</code></td><td>Follows a service's logs</td></tr>
        <tr><td><code>./lawliet passwd</code></td><td>Resets the administrator password</td></tr>
        <tr><td><code>./lawliet tls</code></td><td>Shows or replaces the certificate</td></tr>
        <tr><td><code>./lawliet licence</code></td><td>Shows the licence and the installation fingerprint, or installs a key</td></tr>
        <tr><td><code>./lawliet token</code></td><td>Prints the agent install commands</td></tr>
        <tr><td><code>./lawliet doctor</code></td><td>Collects a diagnostics file for support, with no passwords and no data</td></tr>
      </tbody>
    </table></div>

    <h2 id="updates">Updates</h2>
    <p>Updates arrive as a new signed bundle. Copy it to the server and, from the current deployment folder:</p>
    <pre><code>./lawliet update lawliet-docker-&lt;version&gt;-&lt;organisation&gt;.tar.gz</code></pre>
    <p>It backs up the database first and stops if the backup fails, installs the new version beside the current one, runs the database migrations, and checks the schema and version before it finishes. Your licence and settings carry over.</p>

    <h2 id="retention">Retention</h2>
    <p>Each kind of record has its own retention period, and 0 keeps it forever. The defaults are 180 days for file integrity events, 365 days for data loss prevention incidents, and 730 days for compliance results and the audit trail.</p>

    <h2 id="syslog">Receiving syslog</h2>
    <p>Point network devices and servers at the Lawliet server on port 5514, UDP or TCP. Accepted formats are RFC 5424, RFC 3164, CEF, LEEF and JSON.</p>

    <h2 id="forwarding">Forwarding to your SIEM</h2>
    <p>Lawliet can forward events as CEF, LEEF, RFC 5424 or JSON, over syslog (UDP, TCP or TLS) or HTTPS. HTTPS forwarding works with Splunk HEC, Microsoft Sentinel and Sumo Logic.</p>
""")

BODY["releases.html"] = ("Releases", "Every Lawliet release, newest first, with what changed and how it was proven.", """
    <h1>Releases</h1>
    <p class="intro">Every Lawliet release, newest first. Each entry lists what changed in the release and how each claim was proven against a real target.</p>

    <p class="rel-status" id="relStatus" role="status" aria-live="polite">Loading release notes...</p>

    <div class="rel-current" id="relCurrent" hidden></div>

    <div class="rel-controls" id="relControls" hidden>
      <div class="rel-field">
        <label for="relSearch">Filter</label>
        <input id="relSearch" type="search" placeholder="Filter by text" autocomplete="off">
      </div>
      <div class="rel-field">
        <label for="relChannel">Channel</label>
        <select id="relChannel"><option value="all">All</option><option value="stable">Stable</option><option value="beta">Beta</option></select>
      </div>
      <button type="button" id="relExpand" class="rel-toggle">Expand all</button>
      <span class="rel-count" id="relCount" aria-live="polite"></span>
    </div>

    <nav class="rel-index" id="relIndex" aria-label="All versions" hidden></nav>

    <div class="rel-list" id="relList"></div>

    <noscript><p class="rel-noscript">The release history is rendered from a data file and needs JavaScript. Enable JavaScript to see every version, or write to <a href="mailto:info@justlawliet.net">info@justlawliet.net</a> for the release notes.</p></noscript>
""")

for file, (title, desc, body) in BODY.items():
    html = HEAD.format(title=title, desc=desc, sidenav=sidenav(file)) + body + FOOT.format(nextlinks=nextlinks(file), extra=SCRIPTS.get(file, ""))
    (OUT / file).write_text(html, encoding="utf-8")
    print("wrote", file)
