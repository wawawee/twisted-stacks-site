# TwistedStacks Namecheap DNS

Vercel already has these custom domains assigned to the right projects:

| Subdomain | Vercel project | Current fallback |
| --- | --- | --- |
| `pongg.twistedstacks.com` | `twisted-pongg` | `https://www.twistedstacks.com` |
| `anslag.twistedstacks.com` | `app` | `https://anslag.twistedstacks.com` |
| `silversmeden.twistedstacks.com` | `silversmeden` | `https://silversmeden.vercel.app` |
| `skatterevision.twistedstacks.com` | `twisted-pongg` host rewrite | `https://www.twistedstacks.com/skatterevision.html` |

## Add These Records In Namecheap

Keep the existing `@`, `www`, MX, TXT, SPF, DKIM, DMARC, and ImproveMX records.

Add or update only these CNAME records:

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| `CNAME` | `pongg` | `cname.vercel-dns.com` | `Automatic` or `300` |
| `CNAME` | `anslag` | `cname.vercel-dns.com` | `Automatic` or `300` |
| `CNAME` | `silversmeden` | `cname.vercel-dns.com` | `Automatic` or `300` |
| `CNAME` | `skatterevision` | `cname.vercel-dns.com` | `Automatic` or `300` |

## Namecheap Click Path

1. Open Namecheap.
2. Go to `Domain List`.
3. Click `Manage` on `twistedstacks.com`.
4. Open `Advanced DNS`.
5. Under `Host Records`, click `Add New Record`.
6. Choose `CNAME Record`.
7. Enter the host and value from the table above.
8. Save all changes.

If Namecheap already has a record with the same host, edit that existing row instead of adding a duplicate.

## Verify

After saving, DNS can take a few minutes. Check:

```bash
dig +short CNAME anslag.twistedstacks.com
dig +short CNAME silversmeden.twistedstacks.com
dig +short CNAME pongg.twistedstacks.com
dig +short CNAME skatterevision.twistedstacks.com
```

Each should return a Vercel DNS target, usually `cname.vercel-dns.com` or a Vercel-managed canonical name.
