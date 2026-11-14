// Readable source. Uses only UrbanHelpHub's API and PayPal approval links.
export const API = 'https://api.urbanhelphub.com/api';

export function nextStage(payment) {
  if (payment.provider !== 'paypal' || ['paid', 'blocked', 'failed', 'refunded'].includes(payment.status)) return null;
  const commitment = payment.installments?.find(item => item.stage === 'commitment');
  const balance = payment.installments?.find(item => item.stage === 'balance');
  if (commitment?.status === 'pending') return commitment;
  if (commitment?.status === 'completed' && payment.customer_confirmed_at && balance?.status === 'pending') return balance;
  return null;
}

export function approvalUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['paypal.com', 'www.paypal.com', 'sandbox.paypal.com', 'www.sandbox.paypal.com'].includes(url.hostname)) {
    throw new Error('The server did not return a valid PayPal approval address.');
  }
  return url.href;
}

export function returnPayment(href) {
  const url = new URL(href);
  const id = url.searchParams.get('paypal_payment');
  const order = url.searchParams.get('token');
  if (!id && !order) return null;
  if (!id || !/^\d+$/.test(id) || !order || !/^[A-Za-z0-9-]{1,100}$/.test(order)) throw new Error('Invalid PayPal return address.');
  return {id, order};
}

export function money(amount, currency) {
  return new Intl.NumberFormat('en-CA', {style: 'currency', currency}).format(Number(amount));
}

export async function request(path, options = {}) {
  const token = sessionStorage.getItem('urbanhelphub_token') || localStorage.getItem('urbanhelphub_token');
  if (!token) throw new Error('Please sign in on UrbanHelpHub, then return to this payments page.');
  const response = await fetch(API + path, {
    ...options, cache: 'no-store',
    headers: {Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + token},
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'The request could not be confirmed. Refresh before retrying.');
  return result.data;
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = String(text);
  if (className) element.className = className;
  return element;
}

function status(text, error = false) {
  const element = document.getElementById('status');
  element.textContent = text;
  element.className = error ? 'error' : '';
}

let busy = false;
function button(text, action) {
  const element = node('button', text);
  element.type = 'button';
  element.addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    document.querySelectorAll('button').forEach(button => { button.disabled = true; });
    try { await action(); }
    catch (error) { status(error.message || 'Request failed. Refresh to check its status.', true); }
    finally {
      busy = false;
      document.querySelectorAll('button').forEach(button => { button.disabled = false; });
    }
  });
  return element;
}

async function checkout(paymentId, stage) {
  const data = await request('/customer/payments/' + paymentId + '/checkout', {
    method: 'POST', body: JSON.stringify({stage}),
  });
  if (data.confirmed) { await load(); status('PayPal payment verified.'); return; }
  window.location.assign(approvalUrl(data.url));
}

function customerCards(tasks, content) {
  for (const task of tasks) {
    const payment = task.payment;
    if (!payment) continue;
    const card = node('article');
    card.append(node('h2', task.title || 'Task #' + task.id));
    card.append(node('p', 'Task: ' + task.status + ' · Payment: ' + payment.status));
    card.append(node('p', 'Agreed total: ' + money(payment.total_amount, payment.currency)));
    if (payment.provider !== 'paypal') {
      card.append(node('p', 'This is a historical payment. Contact support before making another payment.'));
      content.append(card); continue;
    }
    for (const installment of payment.installments || []) {
      card.append(node('p', (installment.stage === 'commitment' ? 'Commitment: ' : 'Final balance: ') + money(installment.amount_minor / 100, payment.currency) + ' · ' + installment.status));
    }
    const stage = nextStage(payment);
    if (stage) card.append(button('Pay ' + money(stage.amount_minor / 100, payment.currency) + ' with PayPal', () => checkout(payment.id, stage.stage)));
    if (task.status === 'awaiting_completion' && payment.status === 'partially_paid') {
      card.append(button('Confirm satisfactory completion', async () => {
        if (!window.confirm('Confirm that the helper finished the work satisfactorily? The remaining balance becomes payable.')) return;
        await request('/customer/tasks/' + task.id + '/confirm-completion', {method: 'PUT', body: '{}'});
        await load();
      }));
    }
    card.append(node('small', 'Helper earnings stay held until customer confirmation, both verified payments and admin release.', 'muted'));
    content.append(card);
  }
  if (!content.children.length) content.append(node('p', 'No matched task payments yet. Confirm a helper on your customer dashboard first.'));
}

async function helperCard(content) {
  const settings = await request('/helper/paypal');
  const card = node('article');
  card.append(node('h2', 'Your PayPal payout account'));
  const label = node('label', 'PayPal account email');
  const input = node('input'); input.type = 'email'; input.required = true; input.maxLength = 254;
  input.value = settings.paypal_email || ''; label.append(input); card.append(label);
  card.append(button('Save payout email', async () => {
    if (!input.reportValidity()) return;
    await request('/helper/paypal', {method: 'PUT', body: JSON.stringify({paypal_email: input.value.trim()})});
    status('Payout email saved. Check it carefully before admin releases your earnings.');
  }));
  content.append(card);
}

function adminCards(payments, content) {
  for (const payment of payments.filter(payment => payment.provider === 'paypal')) {
    const card = node('article');
    card.append(node('h2', payment.task_title || 'Task #' + payment.task_id));
    card.append(node('p', payment.customer_name + ' → ' + payment.helper_name));
    card.append(node('p', 'Customer payment: ' + payment.status + ' · Helper payout: ' + (payment.payout_status || 'pending')));
    card.append(node('p', 'Helper receives: ' + money(payment.helper_net, payment.currency)));
    const net = Number(payment.platform_fee) - Number(payment.provider_fees || 0) - Number(payment.payout_fee || 0) - Number(payment.tax_amount || 0);
    card.append(node('p', 'Platform share after recorded fees and tax: ' + money(net, payment.currency)));
    if (payment.payout_id && payment.payout_status === 'pending') {
      const taxLabel = node('label', 'Applicable tax absorbed by the platform (' + payment.currency + ')');
      const tax = node('input'); tax.type = 'number'; tax.min = '0'; tax.step = '0.01'; tax.required = true;
      taxLabel.append(tax); card.append(taxLabel);
      const verifiedLabel = node('label');
      const verified = node('input'); verified.type = 'checkbox';
      verifiedLabel.append(verified, document.createTextNode('I confirmed completion with the customer and reviewed the tax liability.'));
      card.append(verifiedLabel);
      const eligible = payment.status === 'paid' && !!payment.customer_confirmed_at;
      if (eligible) card.append(button('Authorize and send full helper payout', async () => {
        if (!verified.checked) throw new Error('Confirm customer verification and tax review first.');
        if (!tax.reportValidity()) return;
        if (!window.confirm('Release the entire helper payment through PayPal?')) return;
        await request('/admin/payouts/' + payment.payout_id + '/release', {
          method: 'POST', body: JSON.stringify({customer_verified: true, tax_amount: tax.value}),
        });
        await request('/admin/payouts/' + payment.payout_id + '/submit', {method: 'POST', body: '{}'});
        await load(); status('Payout submitted. Await PayPal success confirmation.');
      }));
      else card.append(node('p', 'Release is locked until customer confirmation and both payments.'));
    } else if (payment.payout_id && payment.payout_status === 'processing' && !payment.payout_submitted_at) {
      card.append(button('Submit authorized payout', async () => {
        if (!window.confirm('Submit the already authorized full helper payout?')) return;
        await request('/admin/payouts/' + payment.payout_id + '/submit', {method: 'POST', body: '{}'});
        await load();
      }));
    } else if (payment.payout_id) {
      card.append(button('Refresh PayPal payout status', async () => {
        await request('/admin/payouts/' + payment.payout_id + '/refresh', {method: 'POST', body: '{}'});
        await load();
      }));
    }
    content.append(card);
  }
  if (!content.children.length) content.append(node('p', 'No PayPal task payments yet.'));
}

async function load() {
  status('Loading verified account and payment details…');
  const {user} = await request('/user');
  const content = document.getElementById('content'); content.replaceChildren();
  const back = document.getElementById('back');
  if (user.role === 'customer') {
    back.href = '/dashboard/';
    customerCards(await request('/customer/tasks'), content);
  } else if (user.role === 'helper') {
    back.href = '/helper/dashboard/';
    await helperCard(content);
  } else if (user.role === 'admin') {
    back.href = '/admin/';
    adminCards(await request('/admin/payments'), content);
  } else throw new Error('This account cannot access payments.');
  status('Signed in as ' + user.name + '.');
}

export async function captureReturn() {
  const returned = returnPayment(window.location.href);
  if (!returned) return false;
  status('Verifying the payment with PayPal…');
  await request('/customer/payments/' + returned.id + '/capture', {
    method: 'POST', body: JSON.stringify({order_id: returned.order}),
  });
  const url = new URL(window.location.href);
  ['paypal_payment', 'token', 'PayerID'].forEach(key => url.searchParams.delete(key));
  window.history.replaceState(null, '', url.href);
  return true;
}

if (typeof document !== 'undefined') {
  document.getElementById('refresh').addEventListener('click', () => {
    if (!busy) load().catch(error => status(error.message, true));
  });
  (async () => {
    const captured = await captureReturn();
    await load();
    if (captured) status('PayPal payment verified. Helper earnings remain held for administrator release.');
  })().catch(error => status(error.message || 'Unable to load payment details.', true));
}
