---
title: "HTB: {{ replace .Name "-" " " | title }}"
date: {{ .Date }}
draft: false
categories: ["HackTheBox"]
tags: ["hackthebox", "penetration-testing"]
summary: "HackTheBox {{ replace .Name "-" " " | title }} writeup - [Brief machine description and main techniques used]"
cover:
    image: "/images/htb/{{ .Name }}/card.png"
    alt: "HackTheBox {{ replace .Name "-" " " | title }}"
    caption: "HackTheBox {{ replace .Name "-" " " | title }}"
    relative: false
showToc: true
TocOpen: false
hidemeta: false
comments: false
description: "Detailed walkthrough of HackTheBox {{ replace .Name "-" " " | title }} machine, covering enumeration, exploitation, and privilege escalation techniques."
keywords: ["hackthebox", "{{ .Name }}", "penetration testing", "ctf", "writeup"]
---

## Summary

HackTheBox {{ replace .Name "-" " " | title }} is a [difficulty] [OS] machine that involves [brief description of main exploitation path]. The machine teaches [key learning objectives].

## Machine Info

| **Machine Name** | {{ replace .Name "-" " " | title }} |
|------------------|-------|
| **OS** | [Windows/Linux] |
| **Difficulty** | [Easy/Medium/Hard/Insane] |
| **Creator** | [Creator Name] |
| **Release Date** | [Release Date] |
| **Retire Date** | [Retire Date] |
| **IP Address** | 10.10.10.xxx |

## Skills Required

- [Skill 1]
- [Skill 2] 
- [Skill 3]

## Skills Learned

- [Learning 1]
- [Learning 2]
- [Learning 3]

## Enumeration

### Nmap

Starting with a basic port scan:

```bash
nmap -sC -sV -oA {{ .Name }} 10.10.10.xxx
```

```
# Nmap scan results here
```

Full port scan to check for additional services:

```bash
nmap -p- --min-rate 10000 10.10.10.xxx
```

### Service Enumeration

#### Port [Port Number] - [Service Name]

[Detailed enumeration of each service found]

```bash
# Commands used for service enumeration
```

```
# Output from enumeration
```

## Initial Access

### [Vulnerability/Technique Used]

[Detailed explanation of the vulnerability found and how it's exploited]

```bash
# Exploitation commands
```

```
# Command output
```

### Shell as [username]

[Description of initial access gained]

```bash
# Commands to stabilize shell or enumerate further
```

## Privilege Escalation

### Enumeration

[Description of privilege escalation enumeration]

```bash
# Commands for privesc enumeration
```

```
# Enumeration results
```

### [Privilege Escalation Technique]

[Detailed explanation of privilege escalation method]

```bash
# Privilege escalation commands
```

```
# Command output
```

### Root Flag

[Description of obtaining root access]

```bash
# Commands to get root flag
```

## Beyond Root

### [Additional Analysis Topic 1]

[Optional section for deeper analysis, unintended solutions, or additional learning]

### [Additional Analysis Topic 2]

[More technical details, alternative methods, or security implications]

## Mitigation

- [Mitigation 1]: [Explanation]
- [Mitigation 2]: [Explanation]
- [Mitigation 3]: [Explanation]

## Key Takeaways

- [Learning point 1]
- [Learning point 2]
- [Learning point 3]

## References

- [Reference 1]
- [Reference 2]
- [Reference 3]

---

**Machine IP:** 10.10.10.xxx  
**Date Completed:** {{ .Date }}  
**Tools Used:** [List of main tools used]