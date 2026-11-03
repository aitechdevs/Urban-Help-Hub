import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('customer payment policies describe current checkout and separate payouts without obsolete Stripe promises', async () => {
  for (const route of ['terms', 'privacy', 'refund-policy']) {
    for (const file of ['index.html', 'index.txt']) {
      const body = await readFile(new URL(`../public_html/${route}/${file}`, import.meta.url), 'utf8');
      assert.doesNotMatch(body, /Stripe/);
    }
  }
  const terms = await readFile(new URL('../public_html/terms/index.html', import.meta.url), 'utf8');
  assert.match(terms, /Customer checkout is provided through PayPal/);
  assert.match(terms, /Helper payouts are arranged separately from customer checkout/);
  assert.match(terms, /30% platform commission/);
});
