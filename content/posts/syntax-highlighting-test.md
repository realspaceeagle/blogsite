+++
date = '2024-01-31T00:00:00+00:00'
draft = true
title = 'Syntax Highlighting Test'
tags = ['testing', 'development']
categories = ['development']
+++

# Syntax Highlighting Test

Testing different programming languages with our Ubuntu terminal styling.

## Bash/Shell Commands

```bash
#!/bin/bash
# Network enumeration script
TARGET=$1
if [ -z "$TARGET" ]; then
    echo "Usage: $0 <target_ip>"
    exit 1
fi

echo "Starting scan of $TARGET"
nmap -sS -sV -sC -O -A $TARGET
```

## Python Code

```python
#!/usr/bin/env python3
import sys
import subprocess

def scan_network(target):
    """Perform network scan using nmap"""
    try:
        result = subprocess.run(['nmap', '-sn', target], 
                              capture_output=True, text=True)
        return result.stdout
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "192.168.1.0/24"
    scan_result = scan_network(target)
    print(scan_result)
```

## JavaScript Code

```javascript
// Network scanner web interface
class NetworkScanner {
    constructor(apiEndpoint) {
        this.apiEndpoint = apiEndpoint;
        this.results = [];
    }

    async scanTarget(target) {
        try {
            const response = await fetch(`${this.apiEndpoint}/scan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target })
            });
            return await response.json();
        } catch (error) {
            console.error('Scan failed:', error);
            return null;
        }
    }
}
```

## SQL Queries

```sql
-- Database schema for network scan results
CREATE TABLE scan_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    target_ip VARCHAR(15) NOT NULL,
    scan_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    open_ports JSON,
    services TEXT,
    INDEX idx_target (target_ip),
    INDEX idx_date (scan_date)
);

-- Insert scan results
INSERT INTO scan_results (target_ip, open_ports, services) 
VALUES ('192.168.1.10', 
        '{"80": "http", "443": "https", "22": "ssh"}',
        'Apache/2.4.41, OpenSSH/8.2p1');
```

## Java Code

```java
import java.net.*;
import java.util.concurrent.*;

public class NetworkScanner {
    private final ExecutorService executor;
    
    public NetworkScanner(int threads) {
        this.executor = Executors.newFixedThreadPool(threads);
    }
    
    public void scanRange(String network, int startPort, int endPort) {
        for (int port = startPort; port <= endPort; port++) {
            final int currentPort = port;
            executor.submit(() -> {
                try (Socket socket = new Socket()) {
                    socket.connect(new InetSocketAddress(network, currentPort), 1000);
                    System.out.println("Port " + currentPort + " is open");
                } catch (Exception e) {
                    // Port is closed or filtered
                }
            });
        }
    }
}
```

## JSON Configuration

```json
{
    "scanner_config": {
        "default_timeout": 5000,
        "thread_pool_size": 100,
        "scan_types": [
            "tcp_connect",
            "tcp_syn", 
            "udp_scan"
        ],
        "output_formats": {
            "json": true,
            "xml": false,
            "csv": true
        }
    }
}
```

## YAML Configuration

```yaml
# Network scanner configuration
scanner:
  name: "UbuntuScanner"
  version: "1.0.0"
  
  settings:
    timeout: 5000
    threads: 50
    retry_attempts: 3
    
  targets:
    - network: "192.168.1.0/24"
      ports: [22, 80, 443, 8080]
    - network: "10.0.0.0/8" 
      ports: [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995]
      
  output:
    format: json
    file: "/tmp/scan_results.json"
    verbose: true
```