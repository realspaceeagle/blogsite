---
title: "About"
date: 2024-01-01T00:00:00+00:00
draft: false
type: "page"
layout: "single"
weight: 1
---

<style>
:root {
  --about-bg: #e7ecff;
  --about-bg-alt: #f4f6ff;
  --about-surface: #ffffff;
  --about-border: #c3cef0;
  --about-accent: #2b4aeb;
  --about-accent-soft: rgba(43, 74, 235, 0.16);
  --about-text: #0f172a;
  --about-muted: #475062;
}

.about-resume {
  max-width: 960px;
  margin: 0 auto;
  padding: 2.4rem 2rem 4rem;
  background: linear-gradient(175deg, var(--about-bg-alt), var(--about-bg));
  border-radius: 20px;
  box-shadow: 0 22px 55px rgba(26, 39, 75, 0.22);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--about-text);
}

.about-resume a { color: var(--about-accent); text-decoration: none; }
.about-resume a:hover { text-decoration: underline; }

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.8rem;
  flex-wrap: wrap;
}

.avatar-frame {
  width: 168px;
  height: 168px;
  border-radius: 999px;
  border: 5px solid var(--about-surface);
  box-shadow: 0 16px 32px rgba(18, 29, 63, 0.28);
  background: linear-gradient(140deg, rgba(43, 74, 235, 0.4), rgba(145, 167, 255, 0.6));
  background-image: url('/images/profile.jpg');
  background-size: cover;
  background-position: center;
}

.about-resume h1 {
  font-size: 2.6rem;
  letter-spacing: 0.02em;
  margin: 0;
}

.about-resume .tagline {
  margin-top: 0.3rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--about-muted);
}

.profile-hint {
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: var(--about-muted);
}

.about-resume h2 {
  margin-top: 3rem;
  margin-bottom: 1.1rem;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--about-muted);
}

.contact-list {
  margin: 2rem 0 2.6rem;
  padding: 1.4rem 1.8rem;
  background: var(--about-surface);
  border: 1px solid var(--about-border);
  border-radius: 16px;
  display: grid;
  gap: 0.7rem;
  box-shadow: 0 18px 36px rgba(26, 39, 75, 0.12);
}

.contact-item {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.contact-item span:first-child {
  font-weight: 600;
  color: var(--about-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
}

.summary {
  background: var(--about-surface);
  border-left: 5px solid var(--about-accent);
  padding: 1.25rem 1.6rem;
  border-radius: 16px;
  box-shadow: 0 18px 38px rgba(26, 39, 75, 0.1);
}

.pill-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.95rem;
}

.pill-list li {
  padding: 0.95rem 1.25rem;
  background: var(--about-surface);
  border: 1px solid var(--about-border);
  border-radius: 14px;
  box-shadow: 0 16px 32px rgba(26, 39, 75, 0.1);
}

.pill-list strong {
  display: block;
  margin-bottom: 0.3rem;
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  color: var(--about-muted);
  text-transform: uppercase;
}

.grid {
  display: grid;
  gap: 1.3rem;
}

@media (min-width: 720px) {
  .grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.card {
  background: var(--about-surface);
  border: 1px solid var(--about-border);
  border-radius: 16px;
  padding: 1.2rem 1.4rem;
  box-shadow: 0 20px 36px rgba(26, 39, 75, 0.12);
}

.card h3 { margin: 0; font-size: 1.05rem; color: var(--about-text); }
.card ul { margin: 0.75rem 0 0 1.1rem; padding: 0; }
.card ul li { margin-bottom: 0.35rem; }

.timeline {
  border-left: 2px solid var(--about-border);
  margin-left: 0.5rem;
  padding-left: 1.6rem;
  display: grid;
  gap: 1.6rem;
}

.timeline-entry { position: relative; }

.timeline-entry::before {
  content: "";
  position: absolute;
  left: -1.75rem;
  top: 0.35rem;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--about-accent);
  box-shadow: 0 0 0 5px var(--about-accent-soft);
}

.timeline-entry h3 { margin: 0; font-size: 1.05rem; }
.timeline-entry em { display: block; margin: 0.4rem 0 0.55rem; color: var(--about-muted); }

.badges {
  display: grid;
  gap: 1.1rem;
}

@media (min-width: 640px) {
  .badges { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.badge {
  border: 1px solid var(--about-border);
  border-radius: 16px;
  padding: 1rem 1.2rem;
  background: var(--about-surface);
  box-shadow: 0 18px 34px rgba(26, 39, 75, 0.1);
}

.badge strong { display: block; }
.badge em { display: block; color: var(--about-muted); margin: 0.35rem 0; }

.list-simple { margin: 0; padding-left: 1.2rem; }

.highlights {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 1rem;
}

.highlights li {
  padding: 0.9rem 1.2rem;
  border-radius: 16px;
  background: var(--about-surface);
  border: 1px solid var(--about-border);
  box-shadow: 0 20px 38px rgba(26, 39, 75, 0.12);
}
</style>

<div class="about-resume">

  <div class="profile-header">
    <div class="avatar-frame"></div>
    <div class="profile-text">
      <h1>Araharan Loganayagam</h1>
      <p class="tagline">Cybersecurity Engineer | Cloud &amp; AI Security Specialist</p>
      <p class="profile-hint">Drop your headshot at <code>static/images/profile.jpg</code> (recommended 320×320) to replace the placeholder gradient.</p>
    </div>
  </div>

  <div class="contact-list">
    <div class="contact-item"><span>Location</span><span>London, United Kingdom</span></div>
    <div class="contact-item"><span>Email</span><span><a href="mailto:araharan.x.loganayagam@hotmail.com">araharan.x.loganayagam@hotmail.com</a></span></div>
    <div class="contact-item"><span>LinkedIn</span><span><a href="https://www.linkedin.com/in/dream4ip/">linkedin.com/in/dream4ip</a></span></div>
    <div class="contact-item"><span>GitHub</span><span><a href="https://github.com/realspaceeagle">github.com/realspaceeagle</a></span></div>
    <div class="contact-item"><span>Medium</span><span><a href="https://medium.com/@haranloga95">medium.com/@haranloga95</a></span></div>
    <div class="contact-item"><span>Twitter</span><span><a href="https://twitter.com/haran_loga">@haran_loga</a></span></div>
  </div>

  <h2>Professional Snapshot</h2>
  <div class="summary">
    I help teams build resilient security programs across cloud, AI, and modern application stacks. My work spans penetration testing, DevSecOps, AI security research, and incident response, with a focus on translating fast-changing threat intelligence into practical defensive strategies.
  </div>

  <h2>Focus Areas</h2>
  <ul class="pill-list">
    <li><strong>Cloud-native defense</strong> Harden AWS, Azure, and GCP estates with guardrails, telemetry, and automation.</li>
    <li><strong>AI security</strong> Secure architecture reviews for AI workloads and ML supply chains.</li>
    <li><strong>DevSecOps enablement</strong> Policy-as-code, automated testing, and secure delivery pipelines.</li>
    <li><strong>Threat-informed operations</strong> Offensive research that accelerates detection engineering and purple teaming.</li>
    <li><strong>Security enablement</strong> Workshops, community engagement, and long-form writing that upskills teams.</li>
  </ul>

  <h2>Security Philosophy</h2>
  <ul class="pill-list">
    <li><strong>Defense in depth</strong> Layered controls that reduce blast radius and support rapid recovery.</li>
    <li><strong>Zero trust by default</strong> Continuous verification across identities, services, and data flows.</li>
    <li><strong>Shift-left</strong> Embed security guardrails into design, code, and build pipelines.</li>
    <li><strong>Continuous monitoring</strong> Blend telemetry, automation, and playbooks for real-time response.</li>
    <li><strong>Shared knowledge</strong> Open collaboration that raises the baseline for the wider security community.</li>
  </ul>

  <h2>Technical Expertise</h2>
  <div class="grid two">
    <section class="card">
      <h3>Cloud &amp; DevSecOps</h3>
      <ul>
        <li><strong>AWS:</strong> IAM hardening, GuardDuty, Security Hub, Config, CloudTrail analytics.</li>
        <li><strong>Azure:</strong> Sentinel playbooks, Defender for Cloud, Key Vault, Purview integration.</li>
        <li><strong>GCP:</strong> Security Command Center, IAM, Cloud Armor, Binary Authorization.</li>
        <li><strong>Containers &amp; IaC:</strong> Kubernetes RBAC, network policies, Terraform compliance, GitLab CI and Jenkins security gates.</li>
      </ul>
    </section>
    <section class="card">
      <h3>Threat Detection &amp; Response</h3>
      <ul>
        <li>SIEM engineering with Splunk, Azure Sentinel, and Elastic Security.</li>
        <li>Threat hunting aligned to MITRE ATT&amp;CK, Sigma, and YARA rule development.</li>
        <li>Incident response across forensics, malware triage, and timeline reconstruction.</li>
      </ul>
    </section>
    <section class="card">
      <h3>Offensive Security Toolkit</h3>
      <ul>
        <li>Reconnaissance with Nmap, Amass, Subfinder, theHarvester, Shodan, Censys.</li>
        <li>Web application testing using Burp Suite, OWASP ZAP, SQLMap, Gobuster.</li>
        <li>Exploitation and post-exploitation with Metasploit, Cobalt Strike, BloodHound.</li>
        <li>Cloud and container assessments with Prowler, ScoutSuite, Trivy, Falco, Aqua.</li>
      </ul>
    </section>
    <section class="card">
      <h3>Programming &amp; Automation</h3>
      <ul>
        <li><strong>Python:</strong> Security automation, ML-assisted detection, threat tooling.</li>
        <li><strong>Go:</strong> High-performance scanners and cloud security utilities.</li>
        <li><strong>Bash:</strong> System hardening, log triage, infrastructure automation.</li>
        <li><strong>PowerShell:</strong> Active Directory assessments and Windows endpoint defense.</li>
      </ul>
    </section>
    <section class="card">
      <h3>Frameworks &amp; Standards</h3>
      <ul>
        <li><strong>Offensive:</strong> MITRE ATT&amp;CK, OWASP Testing Guide, PTES.</li>
        <li><strong>Defensive:</strong> NIST CSF, CIS Controls, ISO 27001/27002.</li>
        <li><strong>Compliance:</strong> GDPR, SOC 2, PCI DSS, cloud shared responsibility models.</li>
      </ul>
    </section>
  </div>

  <h2>Education</h2>
  <div class="timeline">
    <section class="timeline-entry">
      <h3>University of West London</h3>
      <em>MSc Cyber Security (Distinction) | London, United Kingdom | 2022-2023</em>
      <p>Coursework: Infrastructure automation, penetration testing, security operations, ML for security.</p>
    </section>
    <section class="timeline-entry">
      <h3>University of Moratuwa</h3>
      <em>BSc (Hons) Information Technology (Second Class Upper) | Moratuwa, Sri Lanka | 2017-2021</em>
      <p>Coursework: Data structures, software architecture, NLP, computer networks, project management.</p>
    </section>
  </div>

  <h2>Research &amp; Projects</h2>
  <div class="grid three">
    <section class="card">
      <h3>Blockchain &amp; ML-based Malware Detection</h3>
      <p>Designed a decentralized malware detection platform combining proof-of-work consensus with ML classifiers for file integrity validation.</p>
    </section>
    <section class="card">
      <h3>Kids Learning Enhancement via NLP</h3>
      <p>Built an interactive question-driven learning assistant leveraging BERT, LSTM, and Google APIs to generate personalised educational video summaries.</p>
    </section>
    <section class="card">
      <h3>Agri Aid Social Network</h3>
      <p>Delivered a full-stack web and mobile solution that connects farmers and middlemen with real-time weather insights, community forums, and marketplace tooling.</p>
    </section>
  </div>

  <h2>Certifications &amp; Continuous Learning</h2>
  <div class="badges">
    <section class="badge">
      <strong>Offensive Security Certified Professional (OSCP)</strong>
      <em>Status: In progress</em>
      Advanced penetration testing and ethical hacking.
    </section>
    <section class="badge">
      <strong>Practical Ethical Hacking</strong>
      <em>TCM Security</em>
      Hands-on penetration testing and adversary simulation.
    </section>
    <section class="badge">
      <strong>Google Computer Networking</strong>
      <em>Google</em>
      Network fundamentals, routing, and protocols.
    </section>
    <section class="badge">
      <strong>Cybersecurity Tools &amp; Attacks</strong>
      <em>IBM</em>
      Security tooling, threat analysis, and incident response concepts.
    </section>
    <section class="badge">
      <strong>Go Programming</strong>
      <em>HackerRank</em>
      Advanced Go development for security automation.
    </section>
  </div>

  <h2>Community &amp; Leadership</h2>
  <ul class="pill-list">
    <li><strong>Hands-on learning</strong> Active participant in Hack The Box labs and CTF events to sharpen offensive skills.</li>
    <li><strong>Mentorship</strong> Volunteer and mentor across cybersecurity forums and local community initiatives.</li>
    <li><strong>Global citizenship</strong> AIESEC Global Village contributor supporting charity programs in Sri Lanka.</li>
    <li><strong>Inclusive teamwork</strong> Frequent traveller fostering multicultural awareness and collaboration.</li>
  </ul>

  <h2>What You'll Find on the Blog</h2>
  <ul class="list-simple">
    <li>Advanced reconnaissance, OSINT, and adversary emulation walkthroughs.</li>
    <li>Linux hardening and automation playbooks for production estates.</li>
    <li>Cloud security architecture patterns spanning IAM, Kubernetes, and DevSecOps.</li>
    <li>Research notes on AI/ML security, threat modelling, and red team tactics.</li>
    <li>Capture the Flag write-ups, tooling breakdowns, and incident response primers.</li>
  </ul>

  <h2>Highlights &amp; Recognition</h2>
  <ul class="highlights">
    <li>MSc Cyber Security (Distinction), University of West London, 2023.</li>
    <li>Published research on blockchain-backed malware detection for collaborative defense.</li>
    <li>Ongoing technical writing and workshops that equip practitioners with applied security skills.</li>
  </ul>

</div>