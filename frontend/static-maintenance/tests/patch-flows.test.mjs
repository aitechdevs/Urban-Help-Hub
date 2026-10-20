import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const bellSource = readFileSync(new URL('../editable-static-modules/notification-bell-module.js', import.meta.url), 'utf8');
const recoverySource = readFileSync(new URL('../additional-pages/assets/password-recovery-v1.js', import.meta.url), 'utf8');

function notification(role, item, rejectRead = false) {
  const states = [true, [item], 1, false];
  const requests = [];
  let Bell;
  const storage = { getItem: key => key.endsWith('_user') ? JSON.stringify({ role }) : 'test-token' };
  const react = {
    createElement: (tag, props, ...children) => ({ tag, props, children: children.flat(Infinity) }),
    useState: () => [states.shift(), () => {}], useEffect: () => {}, useRef: () => ({ current: null }),
  };
  const context = { URL, Date, sessionStorage: storage, localStorage: storage,
    location: { pathname: role === 'helper' ? '/helper/dashboard/' : role === 'admin' ? '/admin/' : '/dashboard/', origin: 'https://urbanhelphub.com' },
    fetch: async (...args) => { requests.push(args); if (rejectRead) throw new Error('offline'); return { ok: true }; },
  };
  vm.runInNewContext('(' + bellSource + ')', context)({
    i: id => id === 71645 ? react : { API_URL: 'https://api.example.test/api' },
    s: exports => { Bell = exports[2]; },
  });
  function links(node) {
    if (!node || typeof node !== 'object') return [];
    return [...(node.tag === 'a' ? [node] : []), ...node.children.flatMap(links)];
  }
  return { link: links(Bell())[0], requests };
}

test('helper notification links preserve jobs, earnings and message context', () => {
  for (const [type, url] of [['helper_selected', '/helper/jobs/?task=42'], ['payout_paid', '/helper/earnings/'], ['new_message', '/helper/messages/?task=42']]) {
    assert.equal(notification('helper', { type, data: { task_id: 42 } }).link.props.href, url);
  }
});

test('customer notification links open task review and historical message data', () => {
  assert.equal(notification('customer', { type: 'completion_requested', data: { task_id: 42 } }).link.props.href, '/dashboard/?task=42#uhh-tasks');
  assert.equal(notification('customer', { type: 'new_message', data: '{"task_id":42}' }).link.props.href, '/messages/?task=42');
});

test('unsafe action URLs and invalid task references cannot redirect off site', () => {
  for (const action_url of ['https://evil.test/', '//evil.test/', '/\\evil.test/', 'javascript:alert(1)']) {
    assert.equal(notification('admin', { action_url }).link.props.href, '/admin/');
  }
  assert.equal(notification('customer', { type: 'new_message', data: { task_id: '../private' } }).link.props.href, '/messages/');
  assert.equal(notification('helper', { action_url: '/helper/earnings/?tab=paid#history' }).link.props.href, '/helper/earnings/?tab=paid#history');
});

test('notification remains a native link when marking it read fails', async () => {
  const { link, requests } = notification('helper', { id: 7, type: 'payout_paid', title: 'Paid' }, true);
  assert.equal(link.tag, 'a');
  assert.match(link.props['aria-label'], /View earnings/);
  assert.equal(link.props.onClick(), undefined);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(link.props.href, '/helper/earnings/');
  assert.equal(requests[0][1].method, 'PUT');
});

function recovery({ reset = true, hash = '#token=test-token&email=person%40example.test', confirmation = 'NewPassword123!', response = { ok: true, result: { success: true, message: 'Changed' } } } = {}) {
  const requests = [], removed = [], replaced = [];
  let submit;
  const button = { disabled: false }, status = {}, login = { focus() { this.focused = true; } };
  const form = { querySelector: () => button, reportValidity: () => true, reset() { this.didReset = true; }, addEventListener: (_, callback) => { submit = callback; } };
  const fields = { email: ' person@example.test ', password: 'NewPassword123!', password_confirmation: confirmation };
  vm.runInNewContext(recoverySource, {
    URLSearchParams, SyntaxError, TypeError,
    document: { querySelector: () => form, getElementById: id => id === 'status' ? status : login, body: { dataset: { page: reset ? 'reset' : 'forgot' } } },
    location: { hash, pathname: '/reset-password/' }, history: { replaceState: (...args) => replaced.push(args) },
    FormData: class { get(key) { return fields[key]; } },
    localStorage: { removeItem: key => removed.push(key) }, sessionStorage: { removeItem: key => removed.push(key) },
    fetch: async (...args) => { requests.push(args); return { ok: response.ok, status: response.status, json: async () => response.result }; },
  });
  return { form, button, status, login, requests, removed, replaced, submit: () => submit({ preventDefault() {} }) };
}

test('reset consumes fragment, posts token and clears previous local sessions on success', async () => {
  const page = recovery();
  assert.equal(page.replaced[0][2], '/reset-password/');
  await page.submit();
  assert.equal(page.requests[0][0], 'https://api.urbanhelphub.com/api/auth/password/reset');
  assert.equal(JSON.parse(page.requests[0][1].body).token, 'test-token');
  assert.equal(page.requests[0][1].credentials, 'omit');
  assert.equal(page.form.hidden, true);
  assert.equal(page.removed.length, 4);
  assert.equal(page.login.focused, true);
});

test('reset without a fragment hides the form and mismatched confirmation never sends a request', async () => {
  assert.equal(recovery({ hash: '' }).form.hidden, true);
  const page = recovery({ confirmation: 'different' });
  await page.submit();
  assert.equal(page.requests.length, 0);
  assert.match(page.status.textContent, /do not match/);
});

test('forgot password trims the email and rate limits leave the form usable', async () => {
  const page = recovery({ reset: false, response: { ok: false, status: 429, result: {} } });
  await page.submit();
  assert.equal(JSON.parse(page.requests[0][1].body).email, 'person@example.test');
  assert.match(page.status.textContent, /Too many attempts/);
  assert.equal(page.button.disabled, false);
  assert.equal(page.removed.length, 0);
});
