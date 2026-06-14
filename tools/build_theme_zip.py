"""Package the theme into an uploadable Shopify theme .zip (standard dirs only)."""
import zipfile, os, sys
OUT = sys.argv[1] if len(sys.argv) > 1 else "meja-scandi-theme.zip"
INCLUDE = ["assets", "config", "layout", "locales", "sections", "snippets", "templates"]
with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for d in INCLUDE:
        base = os.path.join("theme", d)
        for root, _, files in os.walk(base):
            for f in files:
                full = os.path.join(root, f)
                z.write(full, os.path.relpath(full, "theme"))  # zip root = theme contents
print("wrote", OUT)
