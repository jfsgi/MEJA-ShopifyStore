#!/usr/bin/env python3
"""
theme_check.py — lightweight, deterministic sanity checks for the MEJA OS 2.0 theme.

Not a replacement for Shopify's `theme-check`; this runs offline in CI and catches the
mistakes that actually broke things during scaffolding:
  1. Every `{% schema %}` block parses as JSON.
  2. Liquid braces are balanced (`{% %}` and `{{ }}`) per file.
  3. Every section `type` referenced by a JSON template has a matching section file.
  4. Every snippet referenced via `{% render '...' %}` / `{% include '...' %}` exists.

Exit non-zero on any failure.
"""
import json, glob, os, re, sys

errors = []

# 1. schema JSON
for path in glob.glob("theme/sections/*.liquid"):
    src = open(path, encoding="utf-8").read()
    m = re.search(r"\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}", src, re.S)
    if m:
        try:
            json.loads(m.group(1))
        except Exception as e:
            errors.append(f"{path}: invalid {{% schema %}} JSON: {e}")

# 2. brace balance (per file)
for path in glob.glob("theme/**/*.liquid", recursive=True):
    src = open(path, encoding="utf-8").read()
    if src.count("{%") != src.count("%}"):
        errors.append(f"{path}: unbalanced tag braces {{% ... %}}")
    if src.count("{{") != src.count("}}"):
        errors.append(f"{path}: unbalanced output braces {{{{ ... }}}}")

# 3. template -> section exists
for path in glob.glob("theme/templates/**/*.json", recursive=True):
    data = json.load(open(path, encoding="utf-8"))
    for key, sec in (data.get("sections") or {}).items():
        t = sec.get("type")
        if t and not os.path.exists(f"theme/sections/{t}.liquid"):
            errors.append(f"{path}: section type '{t}' -> missing theme/sections/{t}.liquid")

# 4. render/include snippet exists
for path in glob.glob("theme/**/*.liquid", recursive=True):
    src = open(path, encoding="utf-8").read()
    for name in re.findall(r"\{%-?\s*(?:render|include)\s+'([^']+)'", src):
        snippet = name.split(",")[0].strip()
        if not os.path.exists(f"theme/snippets/{snippet}.liquid"):
            errors.append(f"{path}: render '{snippet}' -> missing theme/snippets/{snippet}.liquid")

if errors:
    print("THEME CHECK FAILED:")
    print("\n".join(" - " + e for e in errors))
    sys.exit(1)

n_sec = len(glob.glob("theme/sections/*.liquid"))
n_tpl = len(glob.glob("theme/templates/**/*.json", recursive=True))
print(f"theme sanity OK ({n_sec} sections, {n_tpl} JSON templates)")
