"""Build the static update without Node.js on the hosting server.
Python 3.9+: python build-static.py BASELINE_DIRECTORY OUTPUT_DIRECTORY
Edit editable-static-modules/*.js or interaction.css, then rerun this script.
"""
from pathlib import Path
import hashlib, json, shutil, sys
ROOT=Path(__file__).resolve().parent
baseline=Path(sys.argv[1]).resolve(); output=Path(sys.argv[2]).resolve()
if baseline==output or baseline in output.parents or output in baseline.parents:
 raise SystemExit('Baseline and output must be separate directories, neither inside the other.')
if output.exists(): raise SystemExit('Choose a new output directory to avoid overwriting files.')
shutil.copytree(baseline,output)
additional = ROOT/'additional-pages'
if additional.exists():
 for page in additional.rglob('*'):
  if page.is_file():
   destination=output/page.relative_to(additional)
   destination.parent.mkdir(parents=True,exist_ok=True)
   shutil.copy2(page,destination)
modules={'3z7kpjdxhk9g9.js':'customer-dashboard.js','2xyu6i7z9-1f2.js':'helper-dashboard.js','00_divqgx52wz.js':'post-a-task.js','18p2y51jd2uau.js':'homepage.js','0i2gzk2ivtd8m.js':'admin-dashboard.js','13f5v16xue57s.js':'admin-helper.js'}
manifest={}
for original,source in modules.items():
 data=(ROOT/'editable-static-modules'/source).read_bytes()
 name='uhh-'+source[:-3]+'-'+hashlib.sha256(data).hexdigest()[:12]+'.js'
 target=output/'_next/static/chunks'/name;target.write_bytes(data)
 manifest[original]=name
# New asset names prevent browsers from reusing the old dashboard code.
for path in output.rglob('*'):
 if path.is_file() and path.suffix in {'.html','.txt','.js','.json'}:
  text=path.read_text(); changed=text
  for old,new in manifest.items():changed=changed.replace(old,new)
  if changed!=text:path.write_text(changed)
css=(ROOT/'editable-static-modules/interaction.css').read_bytes()
cssname='uhh-interaction-'+hashlib.sha256(css).hexdigest()[:12]+'.css'
(output/'_next/static/chunks'/cssname).write_bytes(css)
# Extend the existing, loaded CSS. This also reaches routes loaded by client navigation.
# Version all original CSS assets whose bytes are changed.
for oldpath in list((baseline/'_next/static/chunks').glob('*.css')):
 name=oldpath.name;data=oldpath.read_bytes()+b'\n'+css
 new='uhh-'+hashlib.sha256(data).hexdigest()[:12]+'.css'
 (output/'_next/static/chunks'/new).write_bytes(data)
 manifest[name]=new
 for path in output.rglob('*'):
  if path.is_file() and path.suffix in {'.html','.txt','.js','.json'}:
   text=path.read_text()
   if name in text:path.write_text(text.replace(name,new))
(ROOT/'build-manifest.json').write_text(json.dumps(manifest,indent=2,sort_keys=True))
print('Built static site:',output)
print('Preserved original assets for clients with cached pages. Updated asset references:',len(manifest))
# Replace the shared notification module wherever Turbopack duplicated it.
notification_rules=ROOT/'notification-module-replacements.json'
if notification_rules.exists():
 rules=json.loads(notification_rules.read_text())
 bell=(ROOT/'editable-static-modules/notification-bell-module.js').read_text().strip()
 links={}
 for path in list((output/'_next/static/chunks').glob('*.js')):
  original=path.read_text(); changed=original
  for old in rules['bells']:changed=changed.replace(old,bell)
  for rule in rules['messages']:changed=changed.replace(rule['old'],rule['new'])
  if changed!=original:
   name='uhh-linked-'+hashlib.sha256(changed.encode()).hexdigest()[:12]+'.js'
   (path.parent/name).write_text(changed);links[path.name]=name
 for path in output.rglob('*'):
  if path.is_file() and path.suffix in {'.html','.txt','.js','.json'}:
   original=path.read_text();changed=original
   for old,new in links.items():changed=changed.replace(old,new)
   if changed!=original:path.write_text(changed)
 manifest.update(links)
 (ROOT/'build-manifest.json').write_text(json.dumps(manifest,indent=2,sort_keys=True))
 print('Updated notification links and conversation selection:',len(links),'chunks')

# Retain earlier prepared admin assets unchanged for clients with cached pages.
# Copy after shared-module replacement so old filenames remain byte-identical.
compatibility = ROOT/'compatibility-assets'
if compatibility.exists():
 for asset in compatibility.rglob('*'):
  if asset.is_file():
   destination=output/asset.relative_to(compatibility)
   destination.parent.mkdir(parents=True,exist_ok=True)
   shutil.copy2(asset,destination)
