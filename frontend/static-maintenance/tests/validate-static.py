"""Check static rebuild reproducibility, SEO preservation and local HTML assets."""
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "public_html"
MAINTENANCE = ROOT / "static-maintenance"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.metadata = []
        self.assets = []
        self.title = False
        self.jsonld = False

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "meta" or (tag == "link" and values.get("rel") in {"canonical", "alternate"}):
            self.metadata.append((tag, sorted(attrs)))
        if tag == "title":
            self.title = True
        if tag == "script" and values.get("type") == "application/ld+json":
            self.jsonld = True
        asset = values.get("src") if tag in {"script", "img"} else values.get("href") if tag == "link" and values.get("rel") == "stylesheet" else None
        if asset and asset.startswith("/") and not asset.startswith("//"):
            self.assets.append(unquote(urlsplit(asset).path))

    def handle_data(self, data):
        if self.title or self.jsonld:
            self.metadata.append(data)

    def handle_endtag(self, tag):
        if tag == "title":
            self.title = False
        if tag == "script":
            self.jsonld = False


def files(root):
    return {str(p.relative_to(root)): sha256(p.read_bytes()).hexdigest()
            for p in root.rglob("*") if p.is_file()}


def metadata_hash(path):
    page = Page()
    page.feed(path.read_text())
    return sha256(json.dumps(page.metadata, ensure_ascii=True).encode()).hexdigest()


def main():
    with TemporaryDirectory(prefix="uhh-static-") as temp:
        output = Path(temp) / "public_html"
        subprocess.run([sys.executable, str(MAINTENANCE / "build-static.py"),
                        str(ROOT / "static-baseline"), str(output)], check=True)
        expected, actual = files(SITE), files(output)
        differences = sorted(name for name in expected.keys() | actual.keys()
                             if expected.get(name) != actual.get(name))
        assert not differences, f"Static rebuild differs: {differences}"
        print(f"PASS: byte-identical rebuild of {len(expected)} files")

    fixture = json.loads((Path(__file__).parent / "seo-baseline.json").read_text())
    for name, expected in fixture["html_metadata"].items():
        assert metadata_hash(SITE / name) == expected, f"SEO metadata changed: {name}"
    for name, expected in fixture["hosting_and_seo_files"].items():
        assert sha256((SITE / name).read_bytes()).hexdigest() == expected, f"Hosting/SEO file changed: {name}"
    print(f'PASS: {len(fixture["html_metadata"])} original HTML SEO metadata sets and {len(fixture["hosting_and_seo_files"])} hosting/SEO files')

    missing = set()
    pages = list(SITE.rglob("*.html"))
    for path in pages:
        page = Page()
        page.feed(path.read_text())
        missing.update(asset for asset in page.assets if not (SITE / asset.lstrip("/")).is_file())
    assert not missing, f"Missing HTML assets: {sorted(missing)}"
    print(f"PASS: local assets resolve for {len(pages)} HTML pages")


if __name__ == "__main__":
    main()
