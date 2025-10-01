+++
title = 'CORS Cheatsheet'
date = '2024-01-01'
draft = false
description = 'Typical CORS misconfigurations, exploitation paths, and secure configuration patterns.'
tags = ['cors', 'web-security', 'cheatsheet']
categories = ['cheatsheets']
+++

# CORS Cheatsheet

## Evaluation Checklist

- Inspect all `Access-Control-*` headers in the response.
- Map the origin reflection rules (`Access-Control-Allow-Origin`).
- Check whether credentials are allowed (`Access-Control-Allow-Credentials: true`).
- Test both simple and preflighted requests.
- Record browser console output for rejected preflights.

## Common Misconfigurations

| Pattern | Risk |
|---------|------|
| `Access-Control-Allow-Origin: *` with credentials allowed | Full privilege leakage |
| Origin reflection using `Origin: https://subdomain.attacker.com` | Arbitrary origin escalation |
| `Access-Control-Allow-Headers: *` | Arbitrary header injection |
| Missing `Vary: Origin` | Cache poisoning |

## Simple Exploit Template

```javascript
fetch('https://target.app/api/profile', {
  credentials: 'include'
})
  .then(res => res.text())
  .then(console.log);
```

## Preflight Control

```javascript
fetch('https://target.app/api/update', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Version': '2'
  },
  body: JSON.stringify({ plan: 'pro' })
});
```

## Testing Tips

- For wildcard origins, send `Origin: https://evil.test`.
- Validate response headers for each interesting endpoint (REST, GraphQL, legacy).
- Leverage the browser devtools network inspector to capture preflight failures.
- Use curl with `-H "Origin:"` to reproduce outside the browser.

## Secure Defaults

- Explicitly list allowed origins.
- Only allow credentials when required and limit to trusted origins.
- Restrict methods to the minimal set (`GET`, `POST`, etc.).
- Restrict headers to required custom headers only.
- Ensure sensitive endpoints require server-side authorization beyond CORS.

---

*Coordinate findings with application owners: CORS is an access control layer, not a standalone security control.*

