"""Fixture-only tests: passing them does not verify production files."""
import importlib.util
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

spec = importlib.util.spec_from_file_location('compare', Path(__file__).parents[1] / 'compare-cpanel-export.py')
compare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(compare)


class SnapshotComparisonTest(unittest.TestCase):
    def test_reports_changed_missing_and_added_source(self):
        with TemporaryDirectory() as tmp:
            a, b = Path(tmp) / 'prepared', Path(tmp) / 'fresh_fixture'
            a.mkdir(); b.mkdir()
            (a / 'same.js').write_text('same'); (b / 'same.js').write_text('same')
            (a / 'changed.js').write_text('before'); (b / 'changed.js').write_text('after')
            (a / 'missing.html').write_text('before'); (b / 'extra.html').write_text('after')
            result = compare.compare(a, b)
            self.assertEqual(result['changed'], ['changed.js'])
            self.assertEqual(result['missing_from_fresh'], ['missing.html'])
            self.assertEqual(result['extra_in_fresh'], ['extra.html'])

    def test_ignores_private_data_and_retains_hosting_configuration(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ['.env', 'customer.sql', 'private.key', 'app.log']:
                (root / name).write_text('private fixture content')
            (root / '.htaccess').write_text('public hosting rules')
            (root / '.env.example').write_text('APP_KEY=')
            self.assertEqual(set(compare.manifest(root)), {'.htaccess', '.env.example'})

    def test_symlinks_require_manual_inspection(self):
        with TemporaryDirectory() as tmp:
            root = Path(tmp); (root / 'escape').symlink_to('/etc/hosts')
            with self.assertRaises(ValueError):
                compare.manifest(root)


if __name__ == '__main__':
    unittest.main()
