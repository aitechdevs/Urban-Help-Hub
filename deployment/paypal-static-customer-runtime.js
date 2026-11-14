;(function () {
  function auth() {
    const token = sessionStorage.getItem('urbanhelphub_token') || localStorage.getItem('urbanhelphub_token');
    if (!token) throw new Error('Please sign in again before paying.');
    return {Accept:'application/json','Content-Type':'application/json',Authorization:'Bearer '+token};
  }
  async function request(url, options) {
    const response = await fetch(url, {...options, headers:auth()});
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Unable to verify PayPal payment.');
    return result;
  }
  globalThis.urbanPayPalCheckout = async function (api, paymentId) {
    const tasks = await request(api+'/customer/tasks', {cache:'no-store'});
    const task = tasks.data.find(task => String(task.payment?.id) === String(paymentId));
    const payment = task?.payment;
    if (!payment || payment.provider !== 'paypal') throw new Error('This payment is not a PayPal installment. Contact support before paying.');
    if (['paid','blocked','refunded','failed'].includes(payment.status)) throw new Error('This payment is already paid or requires administrator review.');
    const installments = payment.installments || [];
    const commitment = installments.find(item => item.stage === 'commitment');
    const balance = installments.find(item => item.stage === 'balance');
    if (!commitment || !balance) throw new Error('Payment installments are missing. Contact support.');
    const stage = commitment.status === 'completed' ? 'balance' : 'commitment';
    if (stage === 'balance' && (!payment.customer_confirmed_at || balance.status === 'completed')) throw new Error('Confirm satisfactory completion before paying the remaining balance.');
    const result = await request(api+'/customer/payments/'+encodeURIComponent(paymentId)+'/checkout', {method:'POST',body:JSON.stringify({stage})});
    if (result.data.confirmed) { window.location.reload(); return; }
    const url = new URL(result.data.url);
    if (url.protocol !== 'https:' || !['paypal.com','www.paypal.com','sandbox.paypal.com','www.sandbox.paypal.com'].includes(url.hostname)) throw new Error('Invalid PayPal approval address.');
    window.location.assign(url.href);
  };
  globalThis.urbanPayPalCaptureReturn = async function (api) {
    const url = new URL(window.location.href);
    const paymentId = url.searchParams.get('paypal_payment');
    const orderId = url.searchParams.get('token');
    if (!paymentId || !orderId) return;
    if (!/^\d+$/.test(paymentId)) throw new Error('Invalid payment return address.');
    await request(api+'/customer/payments/'+paymentId+'/capture', {method:'POST',body:JSON.stringify({order_id:orderId})});
    ['paypal_payment','token','PayerID'].forEach(key=>url.searchParams.delete(key));
    window.location.replace(url.href);
  };
})();
