+++
title = 'Nginx Configuration Analysis Cheatsheet'
date = '2024-01-01'
draft = false
description = 'Guide for analyzing nginx configurations during penetration testing, including virtual hosts, proxy configurations, and security misconfigurations'
tags = ['nginx', 'web-server', 'configuration-analysis', 'virtual-hosts', 'pentesting']
categories = ['cheatsheets']
+++

# Nginx Configuration Analysis Cheatsheet

## Finding Nginx Configuration Files

### Common Configuration Locations
```bash
# Main nginx configuration
/etc/nginx/nginx.conf
/usr/local/nginx/conf/nginx.conf
/usr/local/etc/nginx/nginx.conf

# Site-specific configurations
/etc/nginx/sites-available/
/etc/nginx/sites-enabled/
/etc/nginx/conf.d/

# Default site configuration
/etc/nginx/sites-available/default
/etc/nginx/sites-enabled/default

# Additional includes
/etc/nginx/snippets/
/etc/nginx/modules-enabled/
```

### Finding Configuration Files
```bash
# Locate nginx configuration
find / -name "nginx.conf" 2>/dev/null
find / -name "*.conf" -path "*nginx*" 2>/dev/null

# Check nginx process for config location
ps aux | grep nginx
nginx -t  # Test configuration and show file paths
nginx -T  # Dump configuration

# Find all nginx-related files
locate nginx.conf
locate sites-available
locate sites-enabled
```

---

## Main Configuration Analysis

### nginx.conf Structure
```nginx
# Global context
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

# Events context
events {
    worker_connections 768;
    multi_accept on;
    use epoll;
}

# HTTP context
http {
    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;  # Security: Hide nginx version
    
    # MIME types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    
    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### Security-Relevant Directives
```bash
# Check for security headers
grep -r "server_tokens" /etc/nginx/
grep -r "add_header" /etc/nginx/

# Version disclosure
grep -r "server_tokens" /etc/nginx/
# Should be: server_tokens off;

# File upload limits
grep -r "client_max_body_size" /etc/nginx/

# Request limits
grep -r "limit_req" /etc/nginx/
grep -r "limit_conn" /etc/nginx/
```

---

## Virtual Host Discovery

### Finding Virtual Hosts
```bash
# List all site configurations
ls -la /etc/nginx/sites-available/
ls -la /etc/nginx/sites-enabled/

# Extract server names from configurations
grep -r "server_name" /etc/nginx/sites-available/
grep -r "server_name" /etc/nginx/sites-enabled/

# Check for wildcard or catch-all configurations
grep -r "server_name.*\*" /etc/nginx/
grep -r "default_server" /etc/nginx/
```

### Virtual Host Configuration Analysis
```nginx
# Example virtual host configuration
server {
    listen 80;
    listen [::]:80;
    
    # Primary domain and aliases
    server_name example.com www.example.com;
    
    # Document root
    root /var/www/html;
    index index.html index.htm index.php;
    
    # Locations
    location / {
        try_files $uri $uri/ =404;
    }
    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
    }
}

# Subdomain configuration
server {
    listen 80;
    server_name subdomain.example.com;
    
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

### Real-World Example: Soccer HTB
```nginx
# From Soccer HTB - Multiple virtual hosts found
server {
    listen 80;
    listen [::]:80;
    server_name soccer.htb;
    root /var/www/html;
    index index.html index.htm index.nginx-debian.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
}

# Additional virtual host discovered
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

---

## Proxy Configuration Analysis

### Reverse Proxy Configurations
```nginx
# Basic reverse proxy
location / {
    proxy_pass http://backend_server;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# WebSocket proxy configuration
location /websocket {
    proxy_pass http://localhost:9091;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}

# Load balancing
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

location / {
    proxy_pass http://backend;
}
```

### Proxy Security Issues
```bash
# Check for missing security headers
grep -r "proxy_set_header.*X-Forwarded" /etc/nginx/
grep -r "proxy_set_header.*Host" /etc/nginx/

# Check for proxy_pass misconfigurations
grep -r "proxy_pass" /etc/nginx/

# Look for internal service exposure
grep -r "proxy_pass.*127.0.0.1\|localhost" /etc/nginx/

# Check for missing trailing slashes (path traversal)
grep -r "proxy_pass.*[^/]$" /etc/nginx/
```

---

## SSL/TLS Configuration Analysis

### SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    server_name example.com;
    
    # SSL certificates
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/private.key;
    
    # SSL protocols and ciphers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # SSL security headers
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
}
```

### SSL Security Checks
```bash
# Check SSL configuration
grep -r "ssl_" /etc/nginx/

# Check for weak SSL protocols
grep -r "ssl_protocols" /etc/nginx/
# Should not include SSLv2, SSLv3, TLSv1, TLSv1.1

# Check SSL certificate paths
grep -r "ssl_certificate" /etc/nginx/

# Check for HSTS headers
grep -r "Strict-Transport-Security" /etc/nginx/

# Check for security headers
grep -r "add_header" /etc/nginx/
```

---

## Location Block Analysis

### Location Matching Patterns
```nginx
# Exact match
location = /exact-path {
    return 200 "Exact match";
}

# Prefix match
location /prefix {
    # Matches /prefix, /prefix/, /prefix/anything
}

# Regular expression (case sensitive)
location ~ \.php$ {
    # Matches files ending with .php
}

# Regular expression (case insensitive)
location ~* \.(jpg|jpeg|png|gif)$ {
    # Matches image files (case insensitive)
}

# Prefix match with priority
location ^~ /priority {
    # High priority prefix match
}
```

### Security-Critical Locations
```bash
# Check for admin/management interfaces
grep -r "location.*admin" /etc/nginx/
grep -r "location.*management" /etc/nginx/
grep -r "location.*dashboard" /etc/nginx/

# Check for file upload locations
grep -r "location.*upload" /etc/nginx/
grep -r "client_max_body_size" /etc/nginx/

# Check for API endpoints
grep -r "location.*api" /etc/nginx/
grep -r "location.*/api" /etc/nginx/

# Check for hidden files/directories
grep -r "location.*\\\." /etc/nginx/
```

### Dangerous Location Configurations
```nginx
# Dangerous: Unrestricted file access
location /files/ {
    alias /var/www/files/;
    # Can lead to path traversal
}

# Dangerous: PHP execution in upload directory
location /uploads/ {
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fmp.sock;
        # Allows execution of uploaded PHP files
    }
}

# Dangerous: Proxy without validation
location /proxy/ {
    proxy_pass $arg_url;
    # Open proxy vulnerability
}
```

---

## Access Control Analysis

### Access Restrictions
```nginx
# IP-based access control
location /admin {
    allow 192.168.1.0/24;
    allow 127.0.0.1;
    deny all;
}

# Authentication required
location /protected {
    auth_basic "Protected Area";
    auth_basic_user_file /etc/nginx/.htpasswd;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

location /login {
    limit_req zone=login burst=5 nodelay;
}
```

### Access Control Issues
```bash
# Check for missing access controls
grep -r "allow\|deny" /etc/nginx/
grep -r "auth_basic" /etc/nginx/

# Check for rate limiting
grep -r "limit_req" /etc/nginx/
grep -r "limit_conn" /etc/nginx/

# Check for CORS configurations
grep -r "add_header.*Access-Control" /etc/nginx/
```

---

## File and Directory Analysis

### Document Root Analysis
```bash
# Find document roots
grep -r "root " /etc/nginx/sites-available/
grep -r "alias " /etc/nginx/sites-available/

# Check document root permissions
ls -la /var/www/html/
ls -la /root/app/views/  # From Soccer HTB example

# Look for sensitive files in document roots
find /var/www/ -name "*.conf" -o -name "*.config" -o -name "*.bak" 2>/dev/null
find /var/www/ -name ".env" -o -name "*.sql" -o -name "*.log" 2>/dev/null
```

### File Serving Configuration
```bash
# Check autoindex settings
grep -r "autoindex" /etc/nginx/

# Check for hidden file access
grep -r "location.*\\\." /etc/nginx/

# Check MIME type configurations
grep -r "mime.types" /etc/nginx/
grep -r "default_type" /etc/nginx/
```

---

## Log Analysis

### Nginx Log Configuration
```nginx
# Access log format
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for"';

access_log /var/log/nginx/access.log main;
error_log /var/log/nginx/error.log warn;

# Custom log for specific location
location /api/ {
    access_log /var/log/nginx/api.log;
}
```

### Log File Analysis
```bash
# Find nginx log files
find /var/log -name "*nginx*" 2>/dev/null
grep -r "access_log\|error_log" /etc/nginx/

# Analyze access logs for reconnaissance
tail -f /var/log/nginx/access.log
grep "404" /var/log/nginx/access.log | head -20
grep "POST" /var/log/nginx/access.log | head -10

# Look for error patterns
tail -f /var/log/nginx/error.log
grep -i "error\|fail\|denied" /var/log/nginx/error.log
```

---

## Module and Extension Analysis

### Loaded Modules
```bash
# Check compiled modules
nginx -V 2>&1 | grep -o with-[a-z_]*
nginx -V 2>&1 | grep -o without-[a-z_]*

# Check dynamic modules
ls -la /etc/nginx/modules-enabled/
ls -la /usr/lib/nginx/modules/

# Check module loading in config
grep -r "load_module" /etc/nginx/
```

### Security-Relevant Modules
```bash
# Check for security modules
nginx -V 2>&1 | grep -i "security\|waf\|firewall"

# Check for authentication modules
nginx -V 2>&1 | grep -i "auth"

# Check for rate limiting modules
nginx -V 2>&1 | grep -i "limit"

# Check for SSL/TLS modules
nginx -V 2>&1 | grep -i "ssl\|tls"
```

---

## Configuration Testing and Validation

### Syntax Testing
```bash
# Test nginx configuration syntax
nginx -t
nginx -T  # Test and dump configuration

# Test specific configuration file
nginx -t -c /path/to/nginx.conf

# Check configuration hierarchy
nginx -T | grep -E "^#|server_name|listen|location"
```

### Runtime Analysis
```bash
# Check running nginx processes
ps aux | grep nginx

# Check listening ports
ss -tlnp | grep nginx
netstat -tlnp | grep nginx

# Check nginx status (if enabled)
curl http://localhost/nginx_status
```

---

## Common Misconfigurations

### Path Traversal Issues
```nginx
# Vulnerable alias configuration
location /files {
    alias /var/www/files/;
    # Missing trailing slash can cause path traversal
}

# Correct configuration
location /files/ {
    alias /var/www/files/;
}
```

### Information Disclosure
```nginx
# Version disclosure
server_tokens on;  # Should be off

# Autoindex enabled
location / {
    autoindex on;  # May expose directory contents
}

# Error page information disclosure
error_page 404 /404.html;
# Should use custom error pages
```

### Proxy Misconfigurations
```nginx
# Open proxy vulnerability
location /proxy {
    proxy_pass $arg_url;  # Dangerous - allows arbitrary URLs
}

# SSRF via proxy_pass
location ~ /proxy/(.+) {
    proxy_pass http://$1;  # Can access internal services
}
```

---

## Extraction Commands for Pentesting

### Quick Configuration Extraction
```bash
# Extract all server names (virtual hosts)
grep -r "server_name" /etc/nginx/ | grep -v "#" | awk '{print $2}' | sort -u

# Extract all proxy_pass destinations
grep -r "proxy_pass" /etc/nginx/ | grep -v "#" | awk '{print $2}' | sort -u

# Extract all document roots
grep -r "root " /etc/nginx/ | grep -v "#" | awk '{print $2}' | sort -u

# Extract all listening ports
grep -r "listen" /etc/nginx/ | grep -v "#" | awk '{print $2}' | sort -u
```

### One-liner Configuration Analysis
```bash
# Complete nginx configuration dump
find /etc/nginx -name "*.conf" -exec cat {} \; 2>/dev/null

# Extract virtual hosts with their configurations
awk '/server_name/ {server=$2} /listen/ {port=$2} /root/ {docroot=$2} /}/ {print server, port, docroot; server=""; port=""; docroot=""}' /etc/nginx/sites-enabled/*

# Find potential security issues
grep -r -E "(server_tokens on|autoindex on|proxy_pass \$|allow all)" /etc/nginx/
```

---

## Real-World Example: Soccer HTB Analysis

### Initial Discovery
```bash
# Found nginx configuration in compromised system
www-data@soccer:/etc/nginx/sites-enabled$ ls -la
total 8
drwxr-xr-x 2 root root 4096 Nov 17  2022 .
drwxr-xr-x 8 root root 4096 Nov 17  2022 ..
lrwxrwxrwx 1 root root   34 Nov 17  2022 default -> /etc/nginx/sites-available/default
lrwxrwxrwx 1 root root   41 Nov 17  2022 soc-player.htb -> /etc/nginx/sites-available/soc-player.htb
```

### Configuration Analysis
```bash
# Extract virtual host information
$ cat soc-player.htb
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

### Key Findings
1. **Additional virtual host discovered**: `soc-player.soccer.htb`
2. **Internal service exposed**: Application running on `localhost:3000`
3. **WebSocket support**: Configuration for WebSocket upgrades
4. **Document root**: `/root/app/views` (unusual location)

---

## Automation Scripts

### Nginx Configuration Parser
```bash
#!/bin/bash
# nginx_analyzer.sh - Extract key information from nginx configs

NGINX_PATH="/etc/nginx"

echo "=== Nginx Configuration Analysis ==="
echo

echo "Virtual Hosts:"
grep -r "server_name" $NGINX_PATH/ | grep -v "#" | awk '{print $3}' | sort -u
echo

echo "Listening Ports:"
grep -r "listen" $NGINX_PATH/ | grep -v "#" | awk '{print $2}' | sort -u | head -10
echo

echo "Proxy Destinations:"
grep -r "proxy_pass" $NGINX_PATH/ | grep -v "#" | awk '{print $2}' | sort -u
echo

echo "Document Roots:"
grep -r "root " $NGINX_PATH/ | grep -v "#" | awk '{print $2}' | sort -u
echo

echo "Potential Security Issues:"
grep -r -E "(server_tokens on|autoindex on|allow all)" $NGINX_PATH/ 2>/dev/null
```

---

## Security Recommendations

### Hardening Configuration
```nginx
# Security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

# Hide nginx version
server_tokens off;

# Rate limiting
limit_req_zone $binary_remote_addr zone=global:10m rate=10r/s;
limit_req zone=global burst=20 nodelay;

# File upload restrictions
client_max_body_size 10M;

# Disable autoindex
autoindex off;
```

### Monitoring and Logging
```bash
# Enhanced logging format
log_format detailed '$remote_addr - $remote_user [$time_local] '
                   '"$request" $status $body_bytes_sent '
                   '"$http_referer" "$http_user_agent" '
                   '$request_time $upstream_response_time';

# Log monitoring commands
tail -f /var/log/nginx/access.log | grep -E "(4[0-9]{2}|5[0-9]{2})"
awk '$9 ~ /^[45]/ {print $0}' /var/log/nginx/access.log | tail -20
```

---

*Always ensure proper authorization before analyzing nginx configurations on systems you don't own. This information should be used for legitimate security testing and system administration purposes only.*