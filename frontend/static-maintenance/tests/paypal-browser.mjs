/** Isolated browser regression: synthetic SDK/API only; no provider calls or real money.
 * UHH_PLAYWRIGHT_MODULE may point to an existing @playwright/test/index.mjs.
 * UHH_CHROMIUM_MODULE may point to @sparticuz/chromium/build/index.js.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const { chromium, expect } = await import(process.env.UHH_PLAYWRIGHT_MODULE || '@playwright/test');
let options = { headless: true };
if (process.env.UHH_CHROMIUM_MODULE) {
  const { default: packaged } = await import(process.env.UHH_CHROMIUM_MODULE);
  options = { ...options, executablePath: await packaged.executablePath(), args: packaged.args.filter(x => x !== '--single-process') };
}
const port = process.env.UHH_BROWSER_PORT || '3332';
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['server.mjs'], { cwd: fileURLToPath(new URL('../../', import.meta.url)), env: { ...process.env, PORT: port, HOST: '127.0.0.1', NEXT_TELEMETRY_DISABLED: '1' }, stdio: 'ignore' });
let browser;
try {
  let ready = false;
  for (let n = 0; n < 150; n++) {
    try { if ((await fetch(base + '/api/migration-health')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Isolated Next runtime starts');
  browser = await chromium.launch(options);
  for (const width of [1440, 390]) {
    for (const scenario of ['success', 'cancel', 'failure']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
      const user = { id: 1, name: 'Test Customer', email: 'test@example.test', role: 'customer', status: 'active' };
      await context.addInitScript(user => { localStorage.setItem('urbanhelphub_token', 'synthetic-token'); localStorage.setItem('urbanhelphub_user', JSON.stringify(user)); }, user);
      const page = await context.newPage();
      const requests = [], errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/*', async route => {
        const request = route.request(), url = new URL(request.url());
        if (url.hostname === 'www.paypal.com' && url.pathname === '/sdk/js') {
          assert.equal(url.searchParams.get('client-id'), 'public-test-client');
          assert.equal(url.searchParams.get('currency'), 'CAD');
          return route.fulfill({ contentType: 'application/javascript', body: `window.uhhPayPal={Buttons(options){window.paypalOptions=options;return {isEligible:()=>true,render:async target=>{const b=document.createElement('button');b.textContent='Synthetic PayPal';b.onclick=async()=>{b.disabled=true;try{const id=await options.createOrder();if(${JSON.stringify(scenario)}==='cancel')options.onCancel();else await options.onApprove({orderID:id});}catch{options.onError();}finally{b.disabled=false;}};target.appendChild(b);},close:async()=>{document.querySelectorAll('[aria-label="Pay with PayPal"] button').forEach(b=>b.remove());}};}};` });
        }
        if (url.pathname.startsWith('/__backend/api/')) {
          requests.push({ path: url.pathname, body: request.postDataJSON() });
          let data = {}, status = 200, success = true;
          if (url.pathname.endsWith('/user')) data = { user };
          if (url.pathname.endsWith('/customer/profile')) data = { user };
          if (url.pathname.endsWith('/customer/tasks')) data = [{ id: 7, title: 'Completed cleaning', status: 'completed', city: 'Toronto', province: 'Ontario', candidates: [{ assignment_id: 9, helper_name: 'Test Helper', status: 'completed' }], payment: { id: 4, status: 'pending', currency: 'CAD', total_amount: 100, platform_fee: 30 } }];
          if (url.pathname.endsWith('/notifications')) data = { notifications: [], unread_count: 0 };
          if (url.pathname.endsWith('/paypal/config')) data = { client_id: 'public-test-client', currency: 'CAD', mode: 'sandbox' };
          if (url.pathname.endsWith('/paypal/create-order')) { await new Promise(resolve => setTimeout(resolve, 150)); data = { order_id: 'ORDER12345' }; }
          if (url.pathname.endsWith('/paypal/capture')) { data = { status: 'paid' }; if (scenario === 'failure') { status = 502; success = false; } }
          return route.fulfill({ status, json: { success, data, ...(success ? {} : { message: 'Payment could not be confirmed.' }) } });
        }
        if (url.origin === base) return route.continue();
        return route.abort();
      });
      await page.goto(base + '/dashboard/');
      const button = page.getByRole('button', { name: 'Synthetic PayPal', exact: true });
      await expect(button).toBeVisible();
      await expect(page.getByText('Pay securely with Stripe', { exact: true })).toHaveCount(0);
      await button.click();
      if (scenario === 'success') await expect(page.getByText('Payment received. Helper payout is handled separately.')).toBeVisible();
      if (scenario === 'cancel') await expect(page.getByText('Payment cancelled. You can try again.')).toBeVisible();
      if (scenario === 'failure') {
        await expect(page.getByText('Payment could not be confirmed.', { exact: true })).toBeVisible();
        await expect(page.getByText('Payment received.', { exact: false })).toHaveCount(0);
      }
      const captures = requests.filter(x => x.path.endsWith('/paypal/capture'));
      assert.equal(captures.length, scenario === 'cancel' ? 0 : 1);
      if (captures.length) assert.deepEqual(captures[0].body, { order_id: 'ORDER12345' });
      assert.equal(requests.filter(x => x.path.endsWith('/paypal/create-order')).length, 1);
      assert.equal(requests.filter(x => x.path.endsWith('/checkout')).length, 0);
      assert.ok(!requests.some(x => /secret|webhook_id/.test(JSON.stringify(x))));
      assert.deepEqual(errors, []);
      console.log(`PASS: PayPal ${scenario}, viewport ${width}`);
      await context.close();
    }
  }
  for (const role of ['helper', 'admin']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const user = { id: role === 'helper' ? 2 : 3, name: 'Test ' + role, email: role + '@example.test', role, status: 'active' };
    await context.addInitScript(user => { localStorage.setItem('urbanhelphub_token', 'synthetic-token'); localStorage.setItem('urbanhelphub_user', JSON.stringify(user)); }, user);
    const page = await context.newPage();
    const paths = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname.startsWith('/__backend/api/')) {
        paths.push(url.pathname);
        let data = [];
        if (url.pathname.endsWith('/user')) data = { user };
        if (url.pathname.endsWith('/notifications')) data = { notifications: [], unread_count: 0 };
        if (url.pathname.endsWith('/helper/onboarding')) data = { user, profile: { verification_status: 'verified', city: 'Toronto' }, services: [{ id: 1, name: 'Cleaning', slug: 'cleaning', approval_status: 'approved', is_active: 1 }], availability: [], documents: [] };
        if (url.pathname.endsWith('/admin/review/summary')) data = { admin: user, stats: { pending_helpers: 0, pending_services: 0, verified_helpers: 1, active_helpers: 1, total_customers: 1, total_helpers: 1, completed_tasks: 3, pending_payments: 1, pending_payouts: 2, gross_volume: 300, platform_revenue: 90, pending_tasks: 0 } };
        if (url.pathname.endsWith('/admin/payments')) data = [
          { id: 4, status: 'pending', task_title: 'Pending job', provider: 'paypal' },
          { id: 5, status: 'paid', task_title: 'Paid job', provider: 'paypal', payout_id: 10, payout_status: 'pending' },
          { id: 6, status: 'paid', task_title: 'Disputed job', provider: 'paypal', payout_id: 11, payout_status: 'pending', paypal_dispute_status: 'OPEN' },
        ].map(item => ({ task_id: item.id, title: item.task_title, customer_name: 'Test Customer', helper_name: 'Test Helper', currency: 'CAD', total_amount: 100, platform_fee: 30, settlement_total_amount: 100, settlement_helper_net: 70, ...item }));
        return route.fulfill({ json: { success: true, data } });
      }
      if (url.origin === base) return route.continue();
      return route.abort();
    });
    await page.goto(base + (role === 'helper' ? '/helper/dashboard/' : '/admin/'));
    if (role === 'helper') {
      await expect(page.getByRole('heading', { name: 'Helper payouts', exact: true })).toBeVisible();
      await expect(page.getByText('Customer checkout uses PayPal. Helper payouts are arranged separately; contact support for setup and timing.')).toBeVisible();
      await expect(page.getByRole('button', { name: /Connect Stripe|Open Stripe Dashboard|Continue Stripe setup/ })).toHaveCount(0);
      assert.ok(!paths.some(path => path.includes('/stripe/')));
    } else {
      await expect(page.getByText('Managed by PayPal', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Mark payment paid', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Record completed Helper payout', exact: true })).toHaveCount(1);
      await expect(page.getByText(/Payment disputed: reconcile before payout/)).toBeVisible();
    }
    assert.deepEqual(errors, []);
    console.log(`PASS: ${role} PayPal collection and separate payout controls`);
    await context.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
