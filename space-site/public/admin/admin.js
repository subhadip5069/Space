const $ = id => document.getElementById(id);
let T = sessionStorage.getItem('t') || '';
let C = {};

const H = (extra = {}) => ({ ...(T ? { Authorization: `Bearer ${T}` } : {}), ...extra });
const endpoint = path => `/api/${path}`;

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(endpoint(path), {
      cache: 'no-store',
      ...options,
      headers: H({ ...(options.headers || {}) })
    });
  } catch {
    throw new Error('Cannot reach the API. Confirm the Vercel project Root Directory is set to space-site, then redeploy.');
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== 'login' && path !== 'signup') {
    out();
    throw new Error('Your session expired. Please log in again.');
  }
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status}). Check /api/health and Vercel function logs.`);
  return data;
}

function out() {
  T = '';
  sessionStorage.removeItem('t');
  $('app').classList.add('hide');
  $('login').classList.remove('hide');
  $('pw').value = '';
}

$('out').onclick = out;
$('view').onclick = () => window.open('/', '_blank', 'noopener');

// Add one-time signup UI without touching the portfolio or admin page styling.
const card = document.querySelector('.login-card');
const loginSwitch = document.createElement('button');
loginSwitch.type = 'button';
loginSwitch.className = 'btn';
loginSwitch.textContent = 'Create the first admin account';
loginSwitch.style.cssText = 'display:block;width:100%;margin-top:8px;border-radius:11px';
$('go').after(loginSwitch);

const signup = document.createElement('form');
signup.className = 'hide';
signup.noValidate = true;
signup.innerHTML = `
  <p class="login-copy">First-time setup · registration closes after one account</p>
  <label class="login-label" for="setup-key">Vercel ADMIN_PASSWORD setup key</label>
  <input id="setup-key" type="password" autocomplete="current-password" placeholder="Current ADMIN_PASSWORD">
  <label class="login-label" for="new-admin-password">New admin password</label>
  <input id="new-admin-password" type="password" autocomplete="new-password" minlength="12" placeholder="At least 12 characters">
  <label class="login-label" for="confirm-admin-password">Confirm new password</label>
  <input id="confirm-admin-password" type="password" autocomplete="new-password" minlength="12" placeholder="Enter it again">
  <button class="btn p login-submit" type="submit">Create admin account</button>
  <p class="err" id="signup-error" role="alert" aria-live="polite"></p>
  <button class="btn" id="cancel-signup" type="button" style="display:block;width:100%;margin-top:8px;border-radius:11px">Back to login</button>
`;
card.appendChild(signup);

function showSignup(show) {
  $('pw').classList.toggle('hide', show);
  document.querySelector('label[for="pw"]').classList.toggle('hide', show);
  $('go').classList.toggle('hide', show);
  loginSwitch.classList.toggle('hide', show);
  signup.classList.toggle('hide', !show);
  $('le').textContent = '';
  if (show) $('setup-key').focus();
  else $('pw').focus();
}
loginSwitch.onclick = async () => {
  try {
    const status = await request('health');
    if (status.accountExists) {
      $('le').textContent = 'An admin account already exists. Please log in.';
      loginSwitch.classList.add('hide');
      return;
    }
    showSignup(true);
  } catch (error) {
    $('le').textContent = error.message;
  }
};
$('cancel-signup').onclick = () => showSignup(false);

$('go').onclick = async () => {
  $('le').textContent = '';
  $('go').disabled = true;
  try {
    const result = await request('login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: $('pw').value })
    });
    T = result.token;
    sessionStorage.setItem('t', T);
    await start();
  } catch (error) {
    $('le').textContent = error.message;
  } finally {
    $('go').disabled = false;
  }
};
$('pw').onkeydown = event => { if (event.key === 'Enter') $('go').click(); };

signup.onsubmit = async event => {
  event.preventDefault();
  const errorEl = $('signup-error');
  errorEl.textContent = '';
  const submit = signup.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const result = await request('signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        setupKey: $('setup-key').value,
        password: $('new-admin-password').value,
        confirmPassword: $('confirm-admin-password').value
      })
    });
    showSignup(false);
    $('pw').value = $('new-admin-password').value;
    $('new-admin-password').value = '';
    $('confirm-admin-password').value = '';
    $('le').textContent = result.message || 'Account created. Log in using your new password.';
    $('le').style.color = 'var(--mint)';
    $('pw').focus();
  } catch (error) {
    errorEl.textContent = error.message;
  } finally {
    submit.disabled = false;
  }
};

const blank = value => Array.isArray(value)
  ? value.map(blank)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blank(item)]))
    : typeof value === 'string' ? '' : value;
const clone = value => JSON.parse(JSON.stringify(value));
const nice = key => key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');

function makeLabel(text) {
  const label = document.createElement('label');
  label.textContent = text;
  return label;
}

function field(object, key) {
  const value = object[key];
  const wrap = document.createElement('div');

  if (key === 'photo' && typeof value === 'string') {
    wrap.appendChild(makeLabel('Photo'));
    const image = document.createElement('img');
    image.className = 'pv';
    image.alt = 'Photo preview';
    image.src = value || '';
    image.style.display = value ? 'block' : 'none';
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('aria-label', 'Upload photo');
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('Please choose an image file.'); input.value = ''; return; }
      if (file.size > 12 * 1024 * 1024) { alert('Choose an image smaller than 12 MB.'); input.value = ''; return; }
      const reader = new FileReader();
      reader.onerror = () => alert('Could not read that image.');
      reader.onload = () => {
        const source = new Image();
        source.onerror = () => alert('That image could not be opened.');
        source.onload = () => {
          const scale = Math.min(1, 1200 / Math.max(source.width, source.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(source.width * scale));
          canvas.height = Math.max(1, Math.round(source.height * scale));
          canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
          object[key] = canvas.toDataURL('image/jpeg', .82);
          image.src = object[key];
          image.style.display = 'block';
        };
        source.src = reader.result;
      };
      reader.readAsDataURL(file);
    };
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn';
    remove.textContent = 'Remove photo';
    remove.onclick = () => { object[key] = ''; image.removeAttribute('src'); image.style.display = 'none'; input.value = ''; };
    wrap.append(image, input, remove);
    return wrap;
  }

  if (Array.isArray(value) && (!value.length || typeof value[0] === 'string')) {
    wrap.appendChild(makeLabel(`${nice(key)} (one per line)`));
    const textarea = document.createElement('textarea');
    textarea.rows = Math.max(3, value.length + 1);
    textarea.value = value.join('\n');
    textarea.oninput = () => { object[key] = textarea.value.split('\n').map(item => item.trim()).filter(Boolean); };
    wrap.appendChild(textarea);
    return wrap;
  }

  if (Array.isArray(value)) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = nice(key);
    fieldset.appendChild(legend);
    const template = value.length ? blank(value[0]) : {};
    const draw = () => {
      fieldset.querySelectorAll('.item').forEach(item => item.remove());
      value.forEach((entry, index) => {
        const item = document.createElement('div');
        item.className = 'item';
        Object.keys(entry || {}).forEach(child => item.appendChild(field(entry, child)));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'btn';
        remove.textContent = 'Remove';
        remove.onclick = () => { value.splice(index, 1); draw(); };
        item.appendChild(remove);
        fieldset.insertBefore(item, add);
      });
    };
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'btn p';
    add.textContent = '+ Add';
    add.onclick = () => { value.push(clone(template)); draw(); };
    fieldset.appendChild(add);
    draw();
    return fieldset;
  }

  if (value && typeof value === 'object') {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = nice(key);
    fieldset.appendChild(legend);
    Object.keys(value).forEach(child => fieldset.appendChild(field(value, child)));
    return fieldset;
  }

  wrap.appendChild(makeLabel(nice(key)));
  const long = String(value ?? '').length > 70 || /text|sub|intro|^p\d?$/i.test(key);
  const input = document.createElement(long ? 'textarea' : 'input');
  input.value = value == null ? '' : String(value);
  if (long) input.rows = 4;
  input.oninput = () => {
    object[key] = typeof value === 'number' ? Number(input.value) : input.value;
  };
  wrap.appendChild(input);
  return wrap;
}

function build() {
  const content = $('content');
  content.replaceChildren();
  Object.keys(C).forEach(key => content.appendChild(field(C, key)));
}

async function start() {
  $('login').classList.add('hide');
  $('app').classList.remove('hide');
  $('st').textContent = 'Loading site content…';
  try {
    const [remote, defaults] = await Promise.all([
      request('content'),
      fetch('/content.default.json', { cache: 'no-store' }).then(response => {
        if (!response.ok) throw new Error('Could not load the default content file from Vercel.');
        return response.json();
      })
    ]);
    C = Object.assign(clone(defaults), remote && !remote.error ? remote : {});
    build();
    $('st').textContent = 'Content loaded';
  } catch (error) {
    $('st').textContent = error.message;
    $('content').replaceChildren();
  }
}

$('save').onclick = async () => {
  $('st').textContent = 'Saving…';
  $('save').disabled = true;
  try {
    await request('content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: C })
    });
    $('st').textContent = 'Saved — changes are live.';
  } catch (error) {
    $('st').textContent = error.message;
  } finally {
    $('save').disabled = false;
  }
};

const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

async function listItems(type) {
  const element = $(type);
  element.textContent = 'Loading…';
  try {
    const result = await request(type === 'comments' ? 'comments?all=1' : 'contact');
    const items = result.items || [];
    if (!items.length) { element.textContent = type === 'comments' ? 'No comments yet.' : 'No messages yet.'; return; }
    element.innerHTML = items.map(item => `
      <article class="msg">
        <div class="row"><b>${esc(item.name)}</b><small>${item.at ? new Date(item.at).toLocaleString() : ''}</small></div>
        ${type === 'messages' ? `<small><a href="mailto:${encodeURIComponent(item.email || '')}">${esc(item.email)}</a></small>` : ''}
        <p>${esc(type === 'comments' ? item.text : item.message)}</p>
        ${type === 'comments' ? `<small>Project: ${esc(item.project)}</small>` : ''}
        <div style="margin-top:12px"><button class="btn" type="button" data-id="${esc(item._id)}">Delete</button></div>
      </article>`).join('');
    element.querySelectorAll('button[data-id]').forEach(button => {
      button.onclick = async () => {
        if (!window.confirm('Delete this item?')) return;
        button.disabled = true;
        try {
          const route = type === 'comments' ? 'comments' : 'contact';
          await request(`${route}?id=${encodeURIComponent(button.dataset.id)}`, { method: 'DELETE' });
          await listItems(type);
        } catch (error) {
          button.disabled = false;
          window.alert(error.message);
        }
      };
    });
  } catch (error) {
    element.textContent = error.message;
  }
}

document.querySelectorAll('nav button[data-t]').forEach(button => {
  button.onclick = () => {
    document.querySelectorAll('nav button[data-t]').forEach(tab => tab.classList.toggle('on', tab === button));
    ['content', 'messages', 'comments'].forEach(id => $(id).classList.toggle('hide', id !== button.dataset.t));
    if (button.dataset.t !== 'content') listItems(button.dataset.t);
  };
});

if (T) start();
