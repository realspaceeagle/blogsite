+++
date = '2024-01-30T00:00:00+00:00'
draft = false
title = 'Network Enumeration Techniques'
tags = ['networking', 'security', 'enumeration', 'nmap']
categories = ['security']
+++

# Network Enumeration Techniques

A comprehensive guide to network enumeration using various tools and techniques. This post covers the essential methods for discovering and mapping network infrastructure.

## Basic Network Discovery

### Nmap Host Discovery

```bash
# Ping sweep to discover live hosts
$ nmap -sn 192.168.1.0/24
Starting Nmap 7.94 ( https://nmap.org ) at 2024-01-30 10:00 UTC
Nmap scan report for 192.168.1.1
Host is up (0.045s latency).
Nmap scan report for 192.168.1.10
Host is up (0.023s latency).
Nmap scan report for 192.168.1.15
Host is up (0.067s latency).
Nmap done: 256 IP addresses (3 hosts up) scanned in 8.45 seconds
```

### Port Scanning

```bash
# Comprehensive port scan
$ nmap -sS -sV -sC -O -A 192.168.1.10
Starting Nmap 7.94 ( https://nmap.org ) at 2024-01-30 10:05 UTC
Nmap scan report for 192.168.1.10
Host is up (0.023s latency).

PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5
80/tcp   open  http    Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Welcome to Apache2 Ubuntu Default Page
443/tcp  open  https   Apache httpd 2.4.41 ((Ubuntu))
|_http-server-header: Apache/2.4.41 (Ubuntu)
|_http-title: Welcome to Apache2 Ubuntu Default Page
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 15.23 seconds
```

## Service Enumeration

### HTTP/HTTPS Enumeration

```bash
# Directory enumeration with gobuster
$ gobuster dir -u http://192.168.1.10 -w /usr/share/wordlists/dirb/common.txt
===============================================================
Gobuster v3.1.0
===============================================================
[+] Url:            http://192.168.1.10
[+] Method:         GET
[+] Threads:        10
[+] Wordlist:       /usr/share/wordlists/dirb/common.txt
[+] Status Codes:   200,204,301,302,307,401,403
[+] User Agent:     gobuster/3.1.0
[+] Timeout:        10s
===============================================================
2024/01/30 10:10:00 Starting gobuster
===============================================================
/admin                (Status: 200) [Size: 1234]
/images               (Status: 200) [Size: 5678]
/scripts              (Status: 200) [Size: 2345]
===============================================================
2024/01/30 10:10:15 Finished
===============================================================
```

### SSH Enumeration

```bash
# SSH version detection and key enumeration
$ ssh -V
OpenSSH_8.2p1 Ubuntu-4ubuntu0.5, OpenSSL 1.1.1f 31 Mar 2020

$ ssh-keyscan -t rsa,dsa,ecdsa,ed25519 192.168.1.10
# 192.168.1.10:22 SSH-2.0-OpenSSH_8.2p1 Ubuntu-4ubuntu0.5
192.168.1.10 ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7...
192.168.1.10 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIG...
```

## Advanced Techniques

### UDP Port Scanning

```bash
# UDP port scan for common services
$ nmap -sU --top-ports 1000 192.168.1.10
Starting Nmap 7.94 ( https://nmap.org ) at 2024-01-30 10:15 UTC
Nmap scan report for 192.168.1.10
Host is up (0.023s latency).

PORT     STATE         SERVICE
53/udp   open          domain
123/udp  open          ntp
161/udp  open          snmp
500/udp  open|filtered isakmp
Nmap done: 1 IP address (1 host up) scanned in 45.67 seconds
```

### SNMP Enumeration

```bash
# SNMP community string enumeration
$ onesixtyone -c /usr/share/metasploit-framework/data/wordlists/snmp_default_pass.txt 192.168.1.10
Scanning 1 hosts, 122 communities
192.168.1.10 [public] Linux router 4.15.0-99-generic #100-Ubuntu SMP Wed Apr 22 20:32:56 UTC 2020 x86_64
192.168.1.10 [internal] Linux router 4.15.0-99-generic #100-Ubuntu SMP Wed Apr 22 20:32:56 UTC 2020 x86_64

# SNMP walk with valid community string
$ snmpwalk -v2c -c public 192.168.1.10
iso.3.6.1.2.1.1.1.0 = STRING: "Linux router 4.15.0-99-generic"
iso.3.6.1.2.1.1.2.0 = OID: iso.3.6.1.4.1.8072.3.2.10
iso.3.6.1.2.1.1.3.0 = Timeticks: (123456) 0:20:34.56

# Extract running processes (potential password exposure)
$ snmpwalk -v2c -c internal 192.168.1.10 1.3.6.1.2.1.25.4.2.1.2
iso.3.6.1.2.1.25.4.2.1.2.1 = STRING: "kernel"
iso.3.6.1.2.1.25.4.2.1.2.123 = STRING: "/usr/local/bin/login.py kj23sadkj123as0-d213"

# System information
$ snmpget -v2c -c public 192.168.1.10 1.3.6.1.2.1.1.5.0  # Hostname
iso.3.6.1.2.1.1.5.0 = STRING: "router"
```

### Service Version Detection

```bash
# Detailed service version detection
$ nmap -sV -sC -p 80,443,22,21,25,53,110,143,993,995 192.168.1.10
Starting Nmap 7.94 ( https://nmap.org ) at 2024-01-30 10:20 UTC
Nmap scan report for 192.168.1.10
Host is up (0.023s latency).

PORT     STATE SERVICE VERSION
21/tcp   open  ftp     vsftpd 3.0.3
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.5
25/tcp   open  smtp    Postfix smtpd
53/tcp   open  domain  ISC BIND 9.16.1
80/tcp   open  http    Apache httpd 2.4.41 ((Ubuntu))
110/tcp  open  pop3    Dovecot pop3d
143/tcp  open  imap    Dovecot imapd
443/tcp  open  https   Apache httpd 2.4.41 ((Ubuntu))
993/tcp  open  imaps   Dovecot imapd
995/tcp  open  pop3s   Dovecot pop3d
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

### SMB/NetBIOS Enumeration

```bash
# SMB enumeration with smbclient
$ smbclient -L //192.168.1.10 -N
Anonymous login successful

    Sharename       Type      Comment
    ---------       ----      -------
    print$          Disk      Printer Drivers
    shared          Disk      Shared Files
    IPC$            IPC       IPC Service (Samba 4.13.17)

# Enumerate SMB shares
$ enum4linux -a 192.168.1.10
Starting enum4linux v0.9.1 ( http://labs.portcullis.co.uk/application/enum4linux/ )

[+] Target Information
    Target ........... 192.168.1.10
    RID Range ........ 500-550,1000-1050
    Username ......... ''
    Password ......... ''

# SMB version detection
$ nmap --script smb-protocols 192.168.1.10
PORT    STATE SERVICE
445/tcp open  microsoft-ds

Host script results:
| smb-protocols: 
|   dialects: 
|     NT LM 0.12 (SMBv1) [dangerous, but default]
|     2.1
|     3.0
|_    3.1.1

# Check for SMB vulnerabilities
$ nmap --script smb-vuln* 192.168.1.10
```

### DNS Enumeration

```bash
# DNS zone transfer attempt
$ dig axfr @192.168.1.10 example.com
; <<>> DiG 9.18.12 <<>> axfr @192.168.1.10 example.com
; (1 server found)
;; global options: +cmd
example.com.        3600    IN    SOA    ns1.example.com. admin.example.com. 2024013001 3600 1800 604800 86400
example.com.        3600    IN    NS     ns1.example.com.
www.example.com.    3600    IN    A      192.168.1.10
mail.example.com.   3600    IN    A      192.168.1.11

# DNS enumeration with dnsrecon
$ dnsrecon -d example.com -t axfr -n 192.168.1.10
[+] Testing NS Servers for Zone Transfer
[+] Checking for Zone Transfer for example.com name servers
[+] Zone Transfer was successful!!
[+] NS ns1.example.com 192.168.1.10
```

## Automation Scripts

### Bash Enumeration Script

```bash
#!/bin/bash
# Network enumeration automation script

TARGET=$1
if [ -z "$TARGET" ]; then
    echo "Usage: $0 <target_ip>"
    exit 1
fi

echo "Starting comprehensive enumeration of $TARGET"
echo "=============================================="

# Host discovery
echo "[+] Host discovery..."
nmap -sn $TARGET

# Port scan
echo "[+] Port scanning..."
nmap -sS -sV -sC -O -A $TARGET

# HTTP enumeration
echo "[+] HTTP enumeration..."
gobuster dir -u http://$TARGET -w /usr/share/wordlists/dirb/common.txt

# SSH enumeration
echo "[+] SSH enumeration..."
ssh-keyscan -t rsa,dsa,ecdsa,ed25519 $TARGET

echo "Enumeration complete!"
```

## Best Practices

### 1. Stealth Scanning
- Use `-sS` for SYN scans
- Adjust timing with `-T` options
- Use decoy scans when needed

### 2. Service Identification
- Always use `-sV` for version detection
- Combine with `-sC` for default scripts
- Use `-A` for aggressive scanning

### 3. Documentation
- Save all output to files
- Use timestamps in filenames
- Document findings systematically

## Conclusion

Network enumeration is a crucial phase in penetration testing and security assessments. These techniques provide a solid foundation for discovering and mapping network infrastructure.

---

*Remember to always obtain proper authorization before performing network enumeration on any systems.*
