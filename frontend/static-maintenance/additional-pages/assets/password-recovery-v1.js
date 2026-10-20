(() => {
  'use strict';
  const api = 'https://api.urbanhelphub.com/api/auth/password/';
  const form = document.querySelector('form');
  const status = document.getElementById('status');
  const button = form.querySelector('button');
  const reset = document.body.dataset.page === 'reset';
  const params = new URLSearchParams(location.hash.slice(1));
  let token = params.get('token') || '';
  let email = params.get('email') || '';
  if (reset) {
    history.replaceState(null, '', location.pathname);
    if (!token || !email) {
      form.hidden = true;
      status.textContent = 'Open the complete reset link from your email, or request a new link below.';
    }
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    if (!form.reportValidity()) return;
    const fields = new FormData(form);
    const body = reset ? {email, token, password: fields.get('password'), password_confirmation: fields.get('password_confirmation')} : {email: fields.get('email').trim()};
    if (reset && body.password !== body.password_confirmation) {
      status.textContent = 'The passwords do not match.'; return;
    }
    button.disabled = true;
    status.textContent = reset ? 'Updating your password…' : 'Requesting your reset link…';
    try {
      const response = await fetch(api + (reset ? 'reset' : 'email'), {method: 'POST', headers: {Accept: 'application/json', 'Content-Type': 'application/json'}, body: JSON.stringify(body), credentials: 'omit'});
      const result = await response.json();
      if (!response.ok || !result.success) {
        const error = result.errors ? Object.values(result.errors).flat()[0] : null;
        throw new Error(response.status === 429 ? 'Too many attempts. Please wait a minute and try again.' : error || result.message || 'Unable to complete your request. Please try again.');
      }
      status.textContent = result.message;
      if (reset) {
        token = ''; email = ''; form.reset(); form.hidden = true;
        // Do not keep a prior account's local API session after password recovery.
        for (const storage of [localStorage, sessionStorage]) {
          storage.removeItem('urbanhelphub_token'); storage.removeItem('urbanhelphub_user');
        }
        document.getElementById('login').focus();
      }
    } catch (error) {
      status.textContent = error instanceof SyntaxError || error instanceof TypeError ? 'Unable to connect. Please try again shortly.' : error.message;
    } finally { button.disabled = false; }
  });
})();
