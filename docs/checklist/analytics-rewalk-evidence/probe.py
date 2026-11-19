"""API boundary probe per role for the re-walk's security observations (local scratch API :8031 only).
Usage: python -I probe.py <users.json> <out.json>"""
import json, sys
import httpx
u = json.load(open(sys.argv[1]))
c = httpx.Client(base_url="http://127.0.0.1:8031/api/v1", timeout=30)
H = {}
for r in ["founder", "team_member", "accountant", "mentor", "business_consultant", "investor", "legal_advisor"]:
    t = c.post("/auth/login", json={"email": u[r]["email"], "password": u[r]["password"]}).json()["data"]["access_token"]
    H[r] = {"Authorization": f"Bearer {t}", "X-Workspace-Id": u["_workspace"]}
A = "/analytics"
rep, priv, tmr = u["_report"], u["_private_report"], u["_tm_report"]
fexp = u["_exports"][0]
cases = [
    ("investor", "GET", f"{A}/overview", None, 403), ("legal_advisor", "GET", f"{A}/overview", None, 403),
    ("investor", "GET", f"{A}/reports", None, 403), ("legal_advisor", "GET", f"{A}/reports/{rep}", None, 403),
    ("legal_advisor", "GET", f"{A}/exports", None, 403),
    ("mentor", "GET", f"{A}/overview", None, 403), ("business_consultant", "GET", f"{A}/overview", None, 403),
    ("mentor", "GET", f"{A}/reports/{priv}", None, 404), ("accountant", "GET", f"{A}/reports/{priv}", None, 404),
    ("team_member", "GET", f"{A}/reports/{priv}", None, 404),
    ("mentor", "POST", f"{A}/reports/{rep}/run", {}, 403), ("mentor", "POST", f"{A}/reports/{rep}/export", {"format": "pdf"}, 403),
    ("business_consultant", "GET", f"{A}/exports", None, 403),
    ("accountant", "POST", f"{A}/reports/{rep}/export", {"format": "pdf"}, None),
    ("accountant", "POST", f"{A}/exports/data-tables", {"metrics": ["marketing.clicks"], "format": "csv"}, 422),
    ("accountant", "GET", f"{A}/exports/{fexp}", None, 404), ("team_member", "GET", f"{A}/exports/{fexp}", None, 404),
    ("accountant", "GET", f"{A}/exports/{fexp}/download", None, 404),
    ("team_member", "PATCH", f"{A}/reports/{rep}", {"version": 1, "name": "x"}, 403),
    ("team_member", "GET", f"{A}/reports/{rep}/shares", None, 403),
    ("team_member", "DELETE", f"{A}/reports/{rep}", None, 403),
    ("founder", "GET", f"{A}/reports/{tmr}", None, 200),
    ("accountant", "GET", f"{A}/by-hub?hub=marketing", None, 403), ("accountant", "GET", f"{A}/custom-metrics", None, None),
]
out = []
for role, m, p, body, want in cases:
    r = c.request(m, p, headers=H[role], json=body)
    out.append({"role": role, "req": f"{m} {p.replace(u['_workspace'], '<ws>')}", "status": r.status_code, "expected": want,
                "ok": want is None or r.status_code == want, "body": r.text[:160]})
# accountant sees mentor-shared report blocks as locks? and no numbers for marketing in its view of the run
d = c.get(f"{A}/reports/{rep}", headers=H["mentor"]).json()["data"]
out.append({"role": "mentor", "req": "GET report blocks", "locked": [b.get("needs") for b in d["blocks"] if b.get("locked")],
            "ok": all(set(b) <= {"id", "type", "locked", "needs", "needs_label"} for b in d["blocks"] if b.get("locked"))})
runs = c.get(f"{A}/reports/{rep}/runs", headers=H["mentor"]).json()
out.append({"role": "mentor", "req": "GET runs (frozen run payload)", "has_7777": "777700" in json.dumps(runs), "ok": "777700" not in json.dumps(runs)})
json.dump(out, open(sys.argv[2], "w"), indent=1)
bad = [o for o in out if not o["ok"]]
print(f"{len(out)-len(bad)}/{len(out)} probes as expected"); [print("UNEXPECTED", b) for b in bad]
for o in out:
    if o.get("expected") is None and "status" in o: print("INFO", o["role"], o["req"], o["status"], o["body"][:100])
