+++
date = '2024-02-05T00:00:00+00:00'
draft = false
title = 'Linux System Administration Essentials'
tags = ['linux', 'sysadmin', 'automation', 'bash']
categories = ['system-administration']
+++

# Linux System Administration Essentials

Essential commands and techniques for Linux system administration, covering everything from basic operations to advanced automation.

## System Information

### Basic System Info

```bash
# System information
$ uname -a
Linux server01 5.4.0-74-generic #83-Ubuntu SMP Sat May 8 02:35:39 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux

# CPU information
$ lscpu
Architecture:                    x86_64
CPU op-mode(s):                  32-bit, 64-bit
Byte Order:                      Little Endian
Address sizes:                   39 bits physical, 48 bits virtual
CPU(s):                          4
On-line CPU(s) list:              0-3
Thread(s) per core:              2
Core(s) per socket:              2
Socket(s):                       1
Vendor ID:                       GenuineIntel
CPU family:                      6
Model:                           142
Model name:                      Intel(R) Core(TM) i5-8250U CPU @ 1.60GHz
Stepping:                        10
CPU MHz:                         1800.000
CPU max MHz:                     3400.0000
CPU min MHz:                     400.0000
BogoMIPS:                        3600.00
Virtualization:                  VT-x
L1d cache:                       32K
L1i cache:                       32K
L2 cache:                        256K
L3 cache:                        6144K
```

### Memory and Storage

```bash
# Memory usage
$ free -h
              total        used        free      shared  buff/cache   available
Mem:           7.7G        2.1G        4.2G         45M        1.4G        5.3G
Swap:          2.0G          0B        2.0G

# Disk usage
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        20G  8.5G   11G  45% /
/dev/sda2       100G   45G   50G  48% /home
tmpfs           3.9G     0  3.9G   0% /dev/shm
tmpfs           3.9G  8.0M  3.9G   1% /run
tmpfs           3.9G     0  3.9G   0% /sys/fs/cgroup
```

## Process Management

### Process Monitoring

```bash
# Running processes
$ ps aux | head -10
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.1 168032 11984 ?        Ss   Jan25   0:01 /sbin/init
root           2  0.0  0.0      0     0 ?        S    Jan25   0:00 [kthreadd]
root           3  0.0  0.0      0     0 ?        I<   Jan25   0:00 [rcu_gp]
root           4  0.0  0.0      0     0 ?        I<   Jan25   0:00 [rcu_par_gp]
root           6  0.0  0.0      0     0 ?        I<   Jan25   0:00 [kworker/0:0H-kblockd]
root           8  0.0  0.0      0     0 ?        I<   Jan25   0:00 [mm_percpu_wq]
root           9  0.0  0.0      0     0 ?        S    Jan25   0:00 [ksoftirqd/0]
root          10  0.0  0.0      0     0 ?        I<   Jan25   0:00 [rcu_sched]
root          11  0.0  0.0      0     0 ?        I<   Jan25   0:00 [rcu_bh]
root          12  0.0  0.0      0     0 ?        S    Jan25   0:00 [migration/0]

# Process tree
$ pstree
systemd─┬─ModemManager───2*[{ModemManager}]
        ├─NetworkManager───2*[{NetworkManager}]
        ├─accounts-daemon───2*[{accounts-daemon}]
        ├─acpid
        ├─avahi-daemon───avahi-daemon
        ├─bluetoothd
        ├─colord───2*[{colord}]
        ├─cron
        ├─dbus-daemon
        ├─gdm3───gdm-session-wor───gdm-wayland-ses───gnome-session-b───gnome-session-c───gnome-shell───3*[{gnome-shell}]
        ├─irqbalance
        ├─kerneloops
        ├─packagekitd───2*[{packagekitd}]
        ├─polkitd───2*[{polkitd}]
        ├─rsyslogd───3*[{rsyslogd}]
        ├─snapd───8*[{snapd}]
        ├─systemd─┬─(sd-pam)
        │         └─user@1000.service─┬─dbus-daemon
        │                           ├─gnome-keyring-d───3*[{gnome-keyring-d}]
        │                           ├─pulseaudio───2*[{pulseaudio}]
        │                           └─tracker-miner-f───2*[{tracker-miner-f}]
        ├─systemd-journal
        ├─systemd-logind
        ├─systemd-resolve
        ├─systemd-timesyn───{systemd-timesyn}
        ├─systemd-udevd
        ├─thermald───4*[{thermald}]
        ├─udisksd───4*[{udisksd}]
        ├─unattended-upgr───{unattended-upgr}
        ├─upowerd───2*[{upowerd}]
        ├─whoopsie───2*[{whoopsie}]
        └─wpa_supplicant
```

## Service Management

### Systemd Services

```bash
# Service status
$ systemctl status apache2
● apache2.service - The Apache HTTP Server
     Loaded: loaded (/lib/systemd/system/apache2.service; enabled; vendor preset: enabled)
     Active: active (running) since Mon 2024-01-30 10:00:00 UTC; 2h 15min ago
       Docs: https://httpd.apache.org/docs/2.4/
   Main PID: 1234 (apache2)
      Tasks: 55 (limit: 4915)
     Memory: 12.5M
     CGroup: /system.slice/apache2.service
             ├─1234 /usr/sbin/apache2 -k start
             ├─1235 /usr/sbin/apache2 -k start
             └─1236 /usr/sbin/apache2 -k start

Jan 30 10:00:00 server01 systemd[1]: Starting The Apache HTTP Server...
Jan 30 10:00:00 server01 apache2[1234]: AH00558: apache2: Could not reliably determine the server's fully qualified domain name
Jan 30 10:00:00 server01 systemd[1]: Started The Apache HTTP Server.

# Start/stop services
$ sudo systemctl start apache2
$ sudo systemctl stop apache2
$ sudo systemctl restart apache2
$ sudo systemctl reload apache2

# Enable/disable services
$ sudo systemctl enable apache2
$ sudo systemctl disable apache2
```

## Log Management

### System Logs

```bash
# System log
$ journalctl -u apache2
-- Logs begin at Mon 2024-01-30 10:00:00 UTC, end at Mon 2024-01-30 12:15:00 UTC. --
Jan 30 10:00:00 server01 systemd[1]: Starting The Apache HTTP Server...
Jan 30 10:00:00 server01 apache2[1234]: AH00558: apache2: Could not reliably determine the server's fully qualified domain name
Jan 30 10:00:00 server01 systemd[1]: Started The Apache HTTP Server.

# Real-time log monitoring
$ journalctl -u apache2 -f
-- Logs begin at Mon 2024-01-30 10:00:00 UTC. --
Jan 30 12:15:00 server01 apache2[1234]: [client 192.168.1.100:45678] "GET / HTTP/1.1" 200 1234 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
Jan 30 12:15:01 server01 apache2[1234]: [client 192.168.1.101:45679] "GET /favicon.ico HTTP/1.1" 404 1234 "-" "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
```

## Automation Scripts

### System Health Check Script

```bash
#!/bin/bash
# System health check script

echo "=== System Health Check ==="
echo "Date: $(date)"
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime)"
echo ""

echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

echo "=== Memory Usage ==="
free -h | grep Mem | awk '{print "Used: " $3 " / " $2 " (" $3/$2*100 "%)"}'

echo "=== Disk Usage ==="
df -h | grep -E '^/dev/' | awk '{print $1 ": " $3 " / " $2 " (" $5 ")"}'

echo "=== Top Processes ==="
ps aux --sort=-%cpu | head -5

echo "=== Network Connections ==="
netstat -tuln | grep LISTEN | wc -l

echo "=== Service Status ==="
systemctl is-active apache2
systemctl is-active mysql
systemctl is-active ssh
```

### Backup Script

```bash
#!/bin/bash
# Automated backup script

BACKUP_DIR="/backups"
SOURCE_DIR="/var/www/html"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
echo "Creating backup: $BACKUP_FILE"
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" -C /var/www html

# Verify backup
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "Backup created successfully: ${BACKUP_DIR}/${BACKUP_FILE}"
    echo "Backup size: $(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)"
else
    echo "Backup failed!"
    exit 1
fi

# Clean old backups (keep last 7 days)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
echo "Old backups cleaned up"
```

## Security Hardening

### Firewall Configuration

```bash
# UFW (Uncomplicated Firewall)
$ sudo ufw status
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
22/tcp (v6)                ALLOW       Anywhere (v6)
80/tcp (v6)                ALLOW       Anywhere (v6)
443/tcp (v6)               ALLOW       Anywhere (v6)

# Configure firewall rules
$ sudo ufw default deny incoming
$ sudo ufw default allow outgoing
$ sudo ufw allow ssh
$ sudo ufw allow 80/tcp
$ sudo ufw allow 443/tcp
$ sudo ufw enable
```

### SSH Hardening

```bash
# SSH configuration
$ sudo nano /etc/ssh/sshd_config

# Key settings:
Port 2222
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2

# Restart SSH service
$ sudo systemctl restart ssh
```

## Performance Monitoring

### System Metrics

```bash
# CPU and memory monitoring
$ htop
# Interactive process viewer with real-time metrics

# I/O monitoring
$ iostat -x 1
Linux 5.4.0-74-generic (server01)    01/30/2024  _x86_64_    (4 CPU)

avg-cpu:  %user   %nice %system %iowait  %steal   %idle
           2.50    0.00    1.25    0.25    0.00   96.00

Device            r/s     w/s     rkB/s     wkB/s   rrqm/s   wrqm/s  %rrqm  %wrqm r_await w_await aqu-sz rareq-sz wareq-sz  svctm  %util
sda               0.00    0.00      0.00      0.00     0.00     0.00   0.00   0.00    0.00    0.00   0.00     0.00     0.00   0.00   0.00
```

## Conclusion

These Linux system administration techniques provide a solid foundation for managing and maintaining Linux systems. Regular monitoring, automation, and security hardening are essential for production environments.

---

*Always test commands in a safe environment before running them on production systems.*
