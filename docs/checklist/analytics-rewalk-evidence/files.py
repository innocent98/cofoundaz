"""Check the CONTENTS of every file the re-walk downloaded (run with the API venv: needs pypdf).

Usage: python -I files.py <downloads dir> <out json>
Seeded values: Revenue 777,700 kobo (7777.00), Marketing clicks 4321, impressions 98765.
Rule (D-ANA-4): a file never carries a number of a hub the requester cannot open.
"""

import csv
import io
import json
import re
import sys
import zipfile
from pathlib import Path

from pypdf import PdfReader


def text_of(p: Path) -> str:
    if p.suffix == ".pdf":
        return "\n".join(page.extract_text() or "" for page in PdfReader(str(p)).pages)
    if p.suffix == ".xlsx":
        with zipfile.ZipFile(p) as z:
            parts = [z.read(n).decode("utf8", "replace") for n in z.namelist() if n.startswith("xl/") and n.endswith(".xml")]
        return re.sub(r"<[^>]+>", " ", "\n".join(parts))
    raw = p.read_text("utf8")
    list(csv.reader(io.StringIO(raw)))  # must parse as CSV
    return raw


def main():
    d, out = Path(sys.argv[1]), Path(sys.argv[2])
    rows = []
    for p in sorted(d.iterdir()):
        role = p.name.split("-")[0]
        t = text_of(p)
        has_clicks = bool(re.search(r"(?<![\d.])4,?321(?![\d])", t))
        has_rev = bool(re.search(r"7,?777", t))
        locked = bool(re.search(r"Locked", t))
        r = {"file": p.name, "role": role, "bytes": p.stat().st_size, "has_4321": has_clicks, "has_7777": has_rev,
             "has_locked_text": locked, "has_as_of": bool(re.search(r"as of", t, re.I))}
        if role == "accountant":
            r["ok"] = (not has_clicks) and locked and has_rev
            r["rule"] = "no marketing number; Locked text present; revenue present"
        else:
            r["ok"] = (p.suffix in (".pdf", ".xlsx", ".csv")) and len(t) > 50
            r["rule"] = "file parses and is not empty"
        rows.append(r)
    out.write_text(json.dumps(rows, indent=1))
    bad = [r for r in rows if not r["ok"]]
    print(f"{len(rows) - len(bad)}/{len(rows)} files ok")
    for r in bad:
        print("BAD", r)


if __name__ == "__main__":
    main()
