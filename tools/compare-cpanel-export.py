"""Compare fresh exported source/public assets without reading or publishing secrets.

This cannot verify database contents, private uploads or running server state.
Both inputs must be fresh cPanel export directories, not this repository itself.
"""
import argparse
import hashlib
import json
from pathlib import Path

EXCLUDED_PARTS = {'.git', 'node_modules', 'vendor', '.next', 'storage'}
EXCLUDED_SUFFIXES = {'.log', '.sql', '.sqlite', '.sqlite3', '.pem', '.key'}


def manifest(root):
    result = {}
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if any(part in EXCLUDED_PARTS for part in relative.parts):
            continue
        if path.is_symlink():
            raise ValueError(f'Symlink requires manual inspection: {relative}')
        if not path.is_file():
            continue
        if (path.name.startswith('.env') and not path.name.endswith('example')) or path.suffix in EXCLUDED_SUFFIXES:
            continue
        if relative.parts[:2] == ('bootstrap', 'cache') or path.name == 'error_log':
            continue
        result[relative.as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    return result


def compare(prepared, fresh):
    expected, actual = manifest(prepared), manifest(fresh)
    return {
        'prepared_files': len(expected), 'fresh_files': len(actual),
        'missing_from_fresh': sorted(expected.keys() - actual.keys()),
        'extra_in_fresh': sorted(actual.keys() - expected.keys()),
        'changed': sorted(name for name in expected.keys() & actual.keys() if expected[name] != actual[name]),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frontend', type=Path, required=True, help='Fresh public_html export directory')
    parser.add_argument('--backend', type=Path, required=True, help='Fresh backend-api source export directory')
    parser.add_argument('--output', type=Path, required=True, help='Local JSON report destination')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    for path in (args.frontend, args.backend):
        if not path.is_dir():
            parser.error('Both fresh export directories must exist')
        if path.resolve().is_relative_to(root):
            parser.error('Fresh exports must be outside the repository; self-comparison is not production verification')
    report = {
        'exact_production_backup': False,
        'scope': 'Source/public assets only; excludes secrets, database, dependencies and private storage',
        'frontend': compare(root / 'frontend/public_html', args.frontend),
        'backend': compare(root / 'backend-api', args.backend),
    }
    report['source_and_public_assets_match'] = all(not section[key] for section in (report['frontend'], report['backend']) for key in ('missing_from_fresh', 'extra_in_fresh', 'changed'))
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print('Source/public asset comparison:', 'MATCH' if report['source_and_public_assets_match'] else 'DIFFERENCES FOUND')
    print('This is not a verification of production databases, private files or runtime configuration.')
    return 0 if report['source_and_public_assets_match'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
