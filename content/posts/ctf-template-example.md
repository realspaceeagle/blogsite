---
title: "CTF Writeup Template - Example Usage"
date: 2024-12-30T00:00:00Z
draft: true
categories: ["HackTheBox", "Templates"]
tags: ["hackthebox", "template", "writeup-guide"]
summary: "Example demonstration of the new CTF writeup template with all available shortcodes and formatting."
showToc: true
TocOpen: false
hidemeta: false
comments: false
description: "Learn how to use the new CTF writeup template system with practical examples and shortcode demonstrations."
keywords: ["ctf", "template", "writeup", "hackthebox", "guide"]
---

## Template Overview

This post demonstrates the new CTF writeup template system inspired by 0xdf's format. The template includes specialized shortcodes and styling for professional-looking security writeups.

## Machine Information

Use the `machine-info` shortcode to display machine details:

{{< machine-info 
    name="Example Machine" 
    os="Linux" 
    difficulty="Medium" 
    creator="0xdf" 
    release="2024-01-15" 
    retire="2024-06-15" 
    ip="10.10.10.123" 
>}}

## Skills Sections

### Skills Required and Learned

Use the `skills-box` shortcode for organized skill lists:

<div class="skills-section">
{{< skills-box type="required" >}}
- Web application enumeration
- SQL injection techniques
- Linux privilege escalation
- Basic networking knowledge
{{< /skills-box >}}

{{< skills-box type="learned" >}}
- Advanced SQLMap usage
- Custom payload development
- Container escape techniques
- SUID binary exploitation
{{< /skills-box >}}
</div>

## Terminal Commands

Use the `terminal` shortcode for command demonstrations:

{{< terminal prompt="kali@kali" host="~/htb/example" >}}
nmap -sC -sV -oA initial 10.10.10.123
{{< /terminal >}}

## Code Blocks with Syntax Highlighting

Regular code blocks work as usual:

```bash
# Port scan
nmap -p- --min-rate 10000 10.10.10.123

# Service enumeration
gobuster dir -u http://10.10.10.123 -w /usr/share/wordlists/dirb/common.txt
```

## Flag Display

Use the `flag` shortcode to highlight captured flags:

{{< flag type="user" flag="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6" />}}

{{< flag type="root" flag="z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4" />}}

## Highlighted Elements

The template includes CSS classes for highlighting important elements:

- IP addresses: <span class="ip-address">10.10.10.123</span>
- Ports: <span class="port">80/tcp</span>, <span class="port">443/tcp</span>
- Services: <span class="service">Apache</span>, <span class="service">MySQL</span>
- Vulnerabilities: <span class="vulnerability">SQL Injection</span>

## Step-by-Step Process

Use the `step` class for organized walkthrough sections:

<div class="step">

### Initial Enumeration

Starting with a comprehensive port scan to identify available services.

```bash
nmap -sC -sV -p- 10.10.10.123
```

</div>

<div class="step">

### Web Application Analysis

Analyzing the discovered web application for potential vulnerabilities.

```bash
gobuster dir -u http://10.10.10.123 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

</div>

<div class="step">

### Exploitation

Exploiting the identified SQL injection vulnerability.

```bash
sqlmap -u "http://10.10.10.123/login.php" --data="username=admin&password=test" --batch --dbs
```

</div>

## Usage Instructions

### Creating New CTF Writeups

1. Use the CTF archetype:
   ```bash
   hugo new posts/htb-machinename.md --kind=ctf
   ```

2. Fill in the machine information using the shortcodes

3. Follow the established structure for consistency

### Available Shortcodes

- `machine-info` - Machine details table
- `skills-box type="required|learned"` - Skills sections  
- `terminal` - Terminal command blocks
- `flag type="user|root"` - Flag display boxes

### CSS Classes

- `.ip-address` - Highlight IP addresses
- `.port` - Highlight port numbers
- `.service` - Highlight service names
- `.vulnerability` - Highlight vulnerabilities
- `.step` - Step-by-step sections

This template system ensures consistent, professional-looking CTF writeups that are both educational and visually appealing.