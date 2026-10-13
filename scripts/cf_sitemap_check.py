import json
import os
import urllib.request
from datetime import datetime, timedelta, timezone

TOKEN = os.environ["CLOUDFLARE_API_TOKEN_WAF"]
ZONE_ID = os.environ["CLOUDFLARE_ZONE_ID"]
OWN_IP = "2001:41d0:305:2100::3f9b"

now = datetime.now(timezone.utc)
since = now - timedelta(hours=24)

query = """
query($zoneTag: String!, $since: Time!, $until: Time!) {
  viewer {
    zones(filter: {zoneTag: $zoneTag}) {
      httpRequestsAdaptive(
        limit: 1000,
        filter: {
          datetime_geq: $since,
          datetime_leq: $until,
          clientRequestPath: "/sitemap.xml"
        }
      ) {
        datetime
        edgeResponseStatus
        userAgent
        clientIP
      }
    }
  }
}
"""

payload = {
    "query": query,
    "variables": {
        "zoneTag": ZONE_ID,
        "since": since.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "until": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    },
}

req = urllib.request.Request(
    "https://api.cloudflare.com/client/v4/graphql",
    data=json.dumps(payload).encode("utf-8"),
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    },
    method="POST",
)

with urllib.request.urlopen(req, timeout=30) as resp:
    body = json.loads(resp.read().decode("utf-8"))

print(json.dumps(body, indent=2)[:3000])

errors = body.get("errors")
if errors:
    print("GRAPHQL ERRORS:", errors)

try:
    rows = body["data"]["viewer"]["zones"][0]["httpRequestsAdaptive"]
except Exception as e:
    rows = []
    print("Could not parse rows:", e)

print(f"\nTotal requêtes /sitemap.xml dernières 24h: {len(rows)}")

real_googlebot = []
fake_googlebot = []
other = []

for r in rows:
    ua = r.get("userAgent", "") or ""
    ip = r.get("clientIP", "")
    if "Googlebot" in ua:
        if ip == OWN_IP:
            fake_googlebot.append(r)
        else:
            real_googlebot.append(r)
    else:
        other.append(r)

print(f"UA Googlebot depuis NOTRE IP (faux, à ignorer): {len(fake_googlebot)}")
print(f"UA Googlebot depuis IP EXTERNE (vrai Googlebot potentiel): {len(real_googlebot)}")
print(f"Autres requêtes: {len(other)}")

if real_googlebot:
    print("\n=== VRAI GOOGLEBOT DETECTE ===")
    for r in real_googlebot:
        print(r)

with open("scripts/cf_sitemap_check_result.json", "w") as f:
    json.dump(
        {
            "total": len(rows),
            "fake_googlebot_own_ip": len(fake_googlebot),
            "real_googlebot_external": len(real_googlebot),
            "real_googlebot_rows": real_googlebot,
            "other_count": len(other),
        },
        f,
        indent=2,
    )
