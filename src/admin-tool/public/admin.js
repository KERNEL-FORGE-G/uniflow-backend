const API_BASE = '/api/v1';
let token = localStorage.getItem('uniflow_admin_token') || null;

async function login() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Échec de connexion');
    token = json.data ? json.data.accessToken : json.accessToken;
    localStorage.setItem('uniflow_admin_token', token);
    boot();
  } catch (e) {
    document.getElementById('login-msg').innerHTML = `<div class="msg err">${e.message}</div>`;
  }
}

function logout() {
  localStorage.removeItem('uniflow_admin_token');
  location.reload();
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(options.headers || {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || JSON.stringify(json.error) || 'Erreur');
  return json.data ?? json;
}

async function boot() {
  document.getElementById('login-box').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  try {
    const tables = await api('/admin-tool/tables');
    renderSidebar(tables);
  } catch (e) {
    alert('Accès refusé : ' + e.message + ' (rôle ADMIN/SUPER_ADMIN requis)');
    logout();
  }
}

function renderSidebar(tables) {
  const groups = {};
  tables.forEach(t => { (groups[t.group] ||= []).push(t); });
  const container = document.getElementById('table-list');
  container.innerHTML = '';
  Object.entries(groups).forEach(([group, items]) => {
    const h = document.createElement('h2');
    h.textContent = group;
    container.appendChild(h);
    items.forEach(t => {
      const btn = document.createElement('button');
      btn.textContent = t.label;
      btn.addEventListener('click', () => selectTable(t.key, t.label, btn)); // <-- addEventListener, pas onclick
      container.appendChild(btn);
    });
  });
}

async function selectTable(key, label, btnEl) {
  document.querySelectorAll('#sidebar button').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
  document.getElementById('form-title').textContent = label;
  document.getElementById('result-msg').innerHTML = '';

  const schema = await api(`/admin-tool/tables/${key}/schema`);
  const form = document.getElementById('dynamic-form');
  form.style.display = 'block';
  form.innerHTML = '';
  form.dataset.table = key;

  schema.fields.forEach(f => {
    const label = document.createElement('label');
    label.textContent = f.label + (f.required ? ' *' : '');
    form.appendChild(label);

    let input;
    if (f.type === 'foreignKey') {
      input = document.createElement('select');
      input.name = f.name;
      const empty = document.createElement('option');
      empty.value = ''; empty.textContent = '— choisir —';
      input.appendChild(empty);
      (f.options || []).forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.value; opt.textContent = o.label;
        input.appendChild(opt);
      });
      if (!f.options || f.options.length === 0) {
        input.disabled = true;
        empty.textContent = 'Aucune donnée disponible — crée d\'abord la table liée';
      }
    } else if (f.type === 'enum') {
      input = document.createElement('select');
      input.name = f.name;
      f.enumValues.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v;
        if (v === f.defaultValue) opt.selected = true;
        input.appendChild(opt);
      });
    } else if (f.type === 'text') {
      input = document.createElement('textarea');
      input.name = f.name; input.rows = 3;
    } else if (f.type === 'boolean') {
      input = document.createElement('select');
      input.name = f.name;
      ['true', 'false'].forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.textContent = v === 'true' ? 'Oui' : 'Non';
        if ((v === 'true') === f.defaultValue) opt.selected = true;
        input.appendChild(opt);
      });
    } else {
      input = document.createElement('input');
      input.name = f.name;
      input.type = f.type === 'password' || f.type === 'secret' ? 'password'
        : f.type === 'int' ? 'number'
        : f.type === 'date' ? 'date'
        : f.type === 'datetime' ? 'datetime-local'
        : f.type === 'time' ? 'time'
        : 'text';
      if (f.defaultValue !== undefined) input.value = f.defaultValue;
    }
    if (f.required) input.required = true;
    form.appendChild(input);
  });

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Insérer';
  form.appendChild(submitBtn);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('logout').addEventListener('click', logout);
  document.getElementById('dynamic-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const table = form.dataset.table;
    const data = Object.fromEntries(new FormData(form).entries());
    const resultBox = document.getElementById('result-msg');
    try {
      await api(`/admin-tool/tables/${table}`, { method: 'POST', body: JSON.stringify(data) });
      resultBox.innerHTML = `<div class="msg ok">Enregistrement créé avec succès ✅</div>`;
      form.reset();
    } catch (err) {
      resultBox.innerHTML = `<div class="msg err">${err.message}</div>`;
    }
  });

  if (token) boot();
});