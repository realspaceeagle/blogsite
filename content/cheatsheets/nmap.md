+++
title = 'Nmap Cheatsheet - Complete Port Scanning Reference'
date = '2024-01-01'
draft = false
description = 'Comprehensive Nmap cheatsheet covering port scanning, network discovery, service enumeration, and advanced scanning techniques for penetration testing'
tags = ['nmap', 'network-security', 'reconnaissance', 'scanning']
categories = ['cheatsheets']
+++

# Nmap Cheatsheet - Complete Reference Guide

## Table of Contents
- [Basic Scanning](#basic-scanning)
- [Host Discovery](#host-discovery) 
- [Port Scanning Techniques](#port-scanning-techniques)
- [Service & Version Detection](#service--version-detection)
- [Script Engine (NSE)](#script-engine-nse)
- [Stealth & Evasion](#stealth--evasion)
- [Output Formats](#output-formats)
- [Advanced Techniques](#advanced-techniques)

---

## Basic Scanning

### Simple Host Scan
```bash
# Basic scan of single host
nmap 192.168.1.100

# Scan multiple hosts
nmap 192.168.1.100-110
nmap 192.168.1.100,102,104

# Scan subnet
nmap 192.168.1.0/24
```

### Common Port Ranges
```bash
# Scan top 1000 ports (default)
nmap target

# Scan specific ports
nmap -p 80,443,22,21 target

# Scan port ranges
nmap -p 1-65535 target
nmap -p- target  # All ports shorthand

# Scan top ports
nmap --top-ports 100 target
```

---

## Host Discovery

### Ping Scans
```bash
# No port scan, just ping
nmap -sn 192.168.1.0/24

# TCP SYN ping
nmap -PS target

# TCP ACK ping  
nmap -PA target

# UDP ping
nmap -PU target

# Skip ping (assume host is up)
nmap -Pn target
```

### ARP Discovery
```bash
# ARP ping scan (local network)
nmap -PR 192.168.1.0/24

# List scan (no ping, no port scan)
nmap -sL 192.168.1.0/24
```

---

## Port Scanning Techniques

### TCP Scans
```bash
# TCP SYN scan (default, stealthy)
nmap -sS target

# TCP Connect scan (full connection)
nmap -sT target

# TCP ACK scan (firewall detection)
nmap -sA target

# TCP Window scan
nmap -sW target

# TCP Maimon scan
nmap -sM target
```

### UDP Scans
```bash
# UDP scan (slow but important)
nmap -sU target

# Combined TCP/UDP scan
nmap -sS -sU target

# Fast UDP scan (top ports)
nmap -sU --top-ports 100 target
```

### Specialized Scans
```bash
# FIN scan (stealth)
nmap -sF target

# NULL scan (stealth)
nmap -sN target

# Xmas scan (stealth)
nmap -sX target

# Idle scan (ultra stealth)
nmap -sI zombie_host target
```

---

## Service & Version Detection

### Version Detection
```bash
# Service version detection
nmap -sV target

# Aggressive version detection
nmap -sV --version-intensity 9 target

# Light version detection
nmap -sV --version-intensity 2 target
```

### OS Detection
```bash
# OS fingerprinting
nmap -O target

# Aggressive OS detection
nmap -O --osscan-guess target

# OS detection with version scanning
nmap -O -sV target
```

### Combined Detection
```bash
# Aggressive scan (OS, version, scripts, traceroute)
nmap -A target

# Standard aggressive scan with common ports
nmap -A -T4 target
```

---

## Script Engine (NSE)

### Default Scripts
```bash
# Run default scripts
nmap -sC target
nmap --script=default target

# Combine with version detection
nmap -sC -sV target
```

### Script Categories
```bash
# Vulnerability scripts
nmap --script=vuln target

# Authentication scripts
nmap --script=auth target

# Brute force scripts
nmap --script=brute target

# Discovery scripts
nmap --script=discovery target

# Malware detection
nmap --script=malware target
```

### Specific Scripts
```bash
# HTTP enumeration
nmap --script=http-enum target

# SMB enumeration
nmap --script=smb-enum-shares target

# DNS information
nmap --script=dns-brute target

# SSL certificate info
nmap --script=ssl-cert target

# Heartbleed detection
nmap --script=ssl-heartbleed target
```

### Script Arguments
```bash
# Pass arguments to scripts
nmap --script=http-form-brute --script-args userdb=users.txt,passdb=pass.txt target

# Multiple script arguments
nmap --script=smb-brute --script-args userdb=users.txt,unpwdb.timelimit=60s target
```

---

## Stealth & Evasion

### Timing Templates
```bash
# Paranoid (very slow, IDS evasion)
nmap -T0 target

# Sneaky (slow, IDS evasion)
nmap -T1 target

# Polite (normal, no bandwidth flooding)
nmap -T2 target

# Normal (default)
nmap -T3 target

# Aggressive (fast, reliable networks)
nmap -T4 target

# Insane (very fast, sacrifice accuracy)
nmap -T5 target
```

### Firewall Evasion
```bash
# Fragment packets
nmap -f target

# Specify MTU
nmap --mtu 24 target

# Decoy scanning
nmap -D RND:10 target
nmap -D decoy1,decoy2,ME,decoy3 target

# Source IP spoofing
nmap -S spoofed_ip target

# Source port specification
nmap --source-port 53 target
nmap -g 53 target
```

### Advanced Evasion
```bash
# Random delay between probes
nmap --scan-delay 5s target

# Random host order
nmap --randomize-hosts target

# Bad checksum (firewall testing)
nmap --badsum target

# Data length
nmap --data-length 25 target
```

---

## Output Formats

### Standard Output
```bash
# Normal output
nmap target

# Verbose output
nmap -v target
nmap -vv target  # More verbose

# Debug output
nmap -d target
nmap -dd target  # More debug info
```

### File Output
```bash
# Normal format
nmap -oN scan_results.txt target

# XML format
nmap -oX scan_results.xml target

# Grepable format
nmap -oG scan_results.gnmap target

# All formats
nmap -oA scan_results target

# Script kiddie format
nmap -oS scan_results.txt target
```

---

## Advanced Techniques

### Performance Optimization
```bash
# Parallel host scanning
nmap --min-hostgroup 50 --max-hostgroup 100 target

# Parallel port scanning
nmap --min-parallelism 50 --max-parallelism 100 target

# Packet rate control
nmap --min-rate 1000 --max-rate 5000 target

# Timeout control
nmap --host-timeout 300s target
```

### Network Interface Control
```bash
# Specify interface
nmap -e eth0 target

# Specify source IP
nmap -S 192.168.1.50 target

# IPv6 scanning
nmap -6 target
```

### Firewall/IDS Testing
```bash
# ACK scan for firewall rules
nmap -sA -p 1-1000 target

# Window scan for firewall detection
nmap -sW target

# FIN scan to bypass simple firewalls
nmap -sF target
```

---

## Practical Examples

### Web Server Enumeration
```bash
# Comprehensive web server scan
nmap -p 80,443 -sV --script=http-enum,http-headers,http-methods,ssl-cert target

# WordPress enumeration
nmap -p 80,443 --script=http-wordpress-enum target
```

### SMB Enumeration
```bash
# Complete SMB enumeration
nmap -p 445 --script=smb-enum-domains,smb-enum-groups,smb-enum-processes,smb-enum-sessions,smb-enum-shares,smb-enum-users target

# SMB vulnerability scan
nmap -p 445 --script=smb-vuln-* target
```

### Database Enumeration
```bash
# MySQL enumeration
nmap -p 3306 --script=mysql-enum,mysql-info,mysql-databases,mysql-variables target

# MSSQL enumeration  
nmap -p 1433 --script=ms-sql-info,ms-sql-empty-password,ms-sql-xp-cmdshell target

# Oracle enumeration
nmap -p 1521 --script=oracle-sid-brute,oracle-enum-users target
```

### Mail Server Enumeration
```bash
# SMTP enumeration
nmap -p 25,465,587 --script=smtp-enum-users,smtp-commands,smtp-open-relay target

# POP3/IMAP enumeration
nmap -p 110,143,993,995 --script=pop3-capabilities,imap-capabilities target
```

---

## NSE Script Development

### Basic Script Structure
```lua
-- nmap script example
local nmap = require "nmap"
local shortport = require "shortport"

description = [[
Script description here
]]

author = "Your Name"
license = "Same as Nmap--See https://nmap.org/book/man-legal.html"
categories = {"default", "discovery"}

portrule = shortport.port_or_service(80, "http")

action = function(host, port)
    return "Script output"
end
```

---

## Common Nmap Commands Quick Reference

| Command | Description |
|---------|-------------|
| `nmap -sS target` | TCP SYN scan |
| `nmap -sU target` | UDP scan |
| `nmap -sV target` | Version detection |
| `nmap -O target` | OS detection |
| `nmap -A target` | Aggressive scan |
| `nmap -sC target` | Default scripts |
| `nmap -p- target` | All ports |
| `nmap -T4 target` | Aggressive timing |
| `nmap -Pn target` | Skip ping |
| `nmap -oA results target` | All output formats |

---

## Tips & Best Practices

### Performance Tips
- Use `-T4` for faster scans on reliable networks
- Combine `-sS -sU` for comprehensive coverage
- Use `--top-ports` for quick reconnaissance
- Leverage `--min-rate` and `--max-rate` for speed control

### Stealth Considerations
- Use `-T0` or `-T1` for stealth scanning
- Implement decoy scanning with `-D`
- Fragment packets with `-f` to evade detection
- Use source port manipulation with `-g`

### Legal & Ethical Notes
> ⚠️ **Warning**: Only scan systems you own or have explicit permission to test. Unauthorized scanning may be illegal in your jurisdiction.

---

*This cheatsheet covers the essential Nmap commands and techniques for network reconnaissance and security assessment. For complete documentation, refer to the official Nmap documentation at nmap.org.*