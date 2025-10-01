---
title: "Nmap Command Cheatsheet"
date: 2024-01-15T00:00:00+00:00
draft: false
categories: ["cheatsheets"]
tags: ["nmap", "scanning", "reconnaissance", "network-security", "penetration-testing"]
description: "Comprehensive Nmap command reference for network discovery, port scanning, and security assessment tasks."
---

# 🔍 Nmap Command Cheatsheet

Nmap (Network Mapper) is a powerful network discovery and security auditing tool. This cheatsheet covers the most commonly used Nmap commands for penetration testing and network reconnaissance.

---

## 🎯 Basic Scanning

### Host Discovery
```bash
# Ping scan - discover live hosts
nmap -sn 192.168.1.0/24

# No ping scan - treat all hosts as online
nmap -Pn target.com

# List scan - just list targets to scan
nmap -sL 192.168.1.0/24
```

### Port Scanning
```bash
# TCP SYN scan (default)
nmap -sS target.com

# TCP connect scan
nmap -sT target.com

# UDP scan
nmap -sU target.com

# Scan specific ports
nmap -p 80,443,22 target.com

# Scan port ranges
nmap -p 1-1000 target.com

# Scan all ports
nmap -p- target.com
```

---

## 🚀 Advanced Scanning

### Service Detection
```bash
# Service version detection
nmap -sV target.com

# Aggressive service detection
nmap -sV --version-intensity 9 target.com

# Operating system detection
nmap -O target.com

# Combined OS and service detection
nmap -A target.com
```

### Script Scanning
```bash
# Default NSE scripts
nmap -sC target.com

# Specific script categories
nmap --script vuln target.com
nmap --script auth target.com
nmap --script discovery target.com

# Run specific scripts
nmap --script http-enum target.com
nmap --script ssl-cert target.com
```

---

## 🎛️ Timing and Performance

### Timing Templates
```bash
# Paranoid (0) - Very slow, IDS evasion
nmap -T0 target.com

# Sneaky (1) - Slow, IDS evasion
nmap -T1 target.com

# Polite (2) - Slow, less bandwidth
nmap -T2 target.com

# Normal (3) - Default timing
nmap -T3 target.com

# Aggressive (4) - Fast, assume good network
nmap -T4 target.com

# Insane (5) - Very fast, assume excellent network
nmap -T5 target.com
```

### Custom Timing
```bash
# Custom timing options
nmap --min-rate 1000 target.com
nmap --max-rate 5000 target.com
nmap --min-parallelism 100 target.com
```

---

## 🥷 Stealth and Evasion

### Stealth Techniques
```bash
# SYN stealth scan
nmap -sS target.com

# FIN scan
nmap -sF target.com

# NULL scan
nmap -sN target.com

# Xmas scan
nmap -sX target.com

# ACK scan
nmap -sA target.com
```

### Evasion Options
```bash
# Fragment packets
nmap -f target.com

# Decoy scanning
nmap -D RND:10 target.com
nmap -D decoy1,decoy2,ME target.com

# Source port manipulation
nmap --source-port 53 target.com

# Spoof MAC address
nmap --spoof-mac 0 target.com
```

---

## 📊 Output and Reporting

### Output Formats
```bash
# Normal output
nmap -oN scan.txt target.com

# XML output
nmap -oX scan.xml target.com

# Grepable output
nmap -oG scan.gnmap target.com

# All formats
nmap -oA scan target.com
```

### Verbose Output
```bash
# Verbose level 1
nmap -v target.com

# Verbose level 2
nmap -vv target.com

# Debug output
nmap -d target.com
nmap -dd target.com
```

---

## 🎯 Target Specification

### Single Targets
```bash
# Scan single host
nmap 192.168.1.1
nmap target.com

# Scan multiple hosts
nmap 192.168.1.1 192.168.1.2
nmap target1.com target2.com
```

### Range Scanning
```bash
# CIDR notation
nmap 192.168.1.0/24

# Range notation
nmap 192.168.1.1-254

# Wildcard notation
nmap 192.168.1.*

# Multiple ranges
nmap 192.168.1-2.1-254
```

### Input from File
```bash
# Read targets from file
nmap -iL targets.txt

# Exclude targets
nmap 192.168.1.0/24 --exclude 192.168.1.1
nmap 192.168.1.0/24 --excludefile exclude.txt
```

---

## 🔐 Common Use Cases

### Web Server Assessment
```bash
# Quick web server scan
nmap -p 80,443 -sV --script http-* target.com

# SSL/TLS assessment
nmap -p 443 --script ssl-* target.com

# Web vulnerability scan
nmap -p 80,443 --script vuln target.com
```

### Network Discovery
```bash
# Quick network overview
nmap -sn -PE -PA21,23,80,3389 192.168.1.0/24

# Comprehensive network scan
nmap -sS -A -T4 192.168.1.0/24

# Fast top ports scan
nmap --top-ports 1000 -T4 192.168.1.0/24
```

### Database Scanning
```bash
# MySQL scanning
nmap -p 3306 --script mysql-* target.com

# MSSQL scanning
nmap -p 1433 --script ms-sql-* target.com

# Oracle scanning
nmap -p 1521 --script oracle-* target.com
```

---

## 📡 Firewall and IDS Evasion

### Bypass Techniques
```bash
# Fragment packets
nmap -f -f target.com

# Use decoys
nmap -D RND:10 192.168.1.1

# Zombie scan (idle scan)
nmap -sI zombie_host target.com

# Source routing
nmap --ip-options "L 192.168.1.1" target.com
```

### Timing Evasion
```bash
# Very slow scan
nmap -T0 -sS target.com

# Random delay
nmap --scan-delay 5s target.com

# Custom timing
nmap --min-rate 1 --max-rate 5 target.com
```

---

## 🛠️ Useful Scripts

### Vulnerability Detection
```bash
# CVE detection
nmap --script vuln target.com

# SMB vulnerabilities
nmap --script smb-vuln-* target.com

# Web vulnerabilities
nmap --script http-vuln-* target.com
```

### Information Gathering
```bash
# DNS information
nmap --script dns-* target.com

# SNMP information
nmap -sU -p 161 --script snmp-* target.com

# Banner grabbing
nmap --script banner target.com
```

---

## ⚡ One-Liner Commands

### Quick Scans
```bash
# Fast TCP scan
nmap -sS -T4 --top-ports 1000 target.com

# UDP service discovery
nmap -sU -T4 --top-ports 100 target.com

# Comprehensive scan
nmap -sS -sU -T4 -A --top-ports 1000 target.com
```

### Specific Services
```bash
# Web services
nmap -p 80,443,8080,8443 -sV --script http-title,http-headers target.com

# Mail services
nmap -p 25,110,143,993,995 -sV target.com

# FTP services
nmap -p 21 --script ftp-* target.com
```

---

## 📋 Best Practices

### Ethical Scanning
- Always obtain proper authorization
- Use appropriate timing to avoid DoS
- Document all scanning activities
- Respect rate limits and firewalls

### Performance Tips
- Use `-T4` for faster scans on good networks
- Scan top ports first with `--top-ports`
- Use UDP scanning sparingly (it's slow)
- Combine multiple scan types efficiently

### Stealth Considerations
- Use `-T1` or `-T2` for stealth
- Fragment packets with `-f`
- Use decoys with `-D`
- Scan from multiple source IPs

---

## 🔗 Additional Resources

- **Official Nmap Documentation**: https://nmap.org/docs.html
- **NSE Script Database**: https://nmap.org/nsedoc/
- **Nmap Network Scanning Book**: https://nmap.org/book/

---

*⚠️ **Legal Notice**: This cheatsheet is for educational and authorized testing purposes only. Always ensure you have explicit permission before scanning any network or system.*