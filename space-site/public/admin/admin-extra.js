// Admin-only presentation and event-management enhancements.
(() => {
  const $ = id => document.getElementById(id);
  const app = $('app');
  const main = app && app.querySelector('main');
  const sidebar = $('admin-sidebar');
  if (!app || !main || !sidebar) return;

  const style = document.createElement('style');
  style.textContent = `
    html,body{min-height:100%;background:#02030a!important}
    body:before{content:"";position:fixed;z-index:-1;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(28,38,70,.12),transparent 58%),#02030a}
    #admin-stars{position:fixed;z-index:-1;inset:0;width:100%;height:100%;pointer-events:none;opacity:.72}
    #app.admin-shell{position:relative;min-height:100vh;background:transparent}
    #admin-sidebar{background:rgba(3,5,12,.96)!important}
    #app.admin-shell>header{background:rgba(3,5,12,.94)!important}
    #app.admin-shell>main{width:calc(100% - 248px);max-width:none;margin:0 0 0 248px;padding:34px clamp(18px,4vw,56px) 112px}
    #app.admin-shell>main>section:not(.hide){width:min(100%,1120px);margin-inline:auto}
    #app.admin-shell>main>#dashboard:not(.hide){width:min(100%,1120px);margin-inline:auto}
    #app.admin-shell>.save{background:rgba(3,5,12,.96)!important}
    .event-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:22px}
    .event-head h1{margin:0;font-size:clamp(25px,4vw,36px);letter-spacing:-.04em}
    .event-head p{margin:5px 0 0;color:var(--muted)}
    .event-form,.event-card{padding:20px;margin:0 0 15px;border:1px solid var(--line);border-radius:16px;background:rgba(11,14,25,.94);box-shadow:0 12px 35px rgba(0,0,0,.2)}
    .event-form h2{margin:0 0 16px;font-size:16px}
    .event-form .event-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}
    .event-form .wide{grid-column:1/-1}
    .event-actions{display:flex;gap:9px;flex-wrap:wrap}
    .event-card{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .event-card h3{margin:0 0 5px;font-size:17px}
    .event-card p{margin:5px 0;color:var(--muted);white-space:pre-wrap}
    .event-date{color:var(--mint);font-size:12px}
    .event-empty{padding:22px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center}
    @media(max-width:850px){#app.admin-shell>main{width:calc(100% - 205px);margin-left:205px;padding-inline:22px}}
    @media(max-width:620px){#app.admin-shell>main{width:calc(100% - 64px);margin-left:64px;padding:22px 12px 105px}.event-form,.event-card{padding:14px}.event-form .event-grid{grid-template-columns:1fr}.event-form .wide{grid-column:auto}.event-head{align-items:flex-start;flex-direction:column}.event-card{flex-direction:column}}
    @media(prefers-reduced-motion:no-preference){#admin-stars{animation:admin-stars-breathe 12s ease-in-out infinite alternate}@keyframes admin-stars-breathe{from{opacity:.52}to{opacity:.86}}}
  `;
  document.head.appendChild(style);

  // Fixed, dark starfield inspired by the public site's space backdrop; it does not follow page scroll.
  const canvas = document.createElement('canvas');
  canvas.id = 'admin-stars';
  document.body.prepend(canvas);
  const context = canvas.getContext('2d');
  let stars = [];
  function seedStars() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.min(180, Math.round(innerWidth * innerHeight / 8000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() * 1.15 + .25, phase: Math.random() * 6.28,
      speed: Math.random() * .0007 + .0002
    }));
  }
  let frame = 0;
  function paint(now) {
    context.clearRect(0, 0, innerWidth, innerHeight);
    for (const star of stars) {
      const alpha = .22 + (Math.sin(now * star.speed + star.phase) + 1) * .22;
      context.fillStyle = `rgba(190,213,255,${alpha})`;
      context.beginPath(); context.arc(star.x, star.y, star.r, 0, Math.PI * 2); context.fill();
    }
    frame = requestAnimationFrame(paint);
  }
  seedStars();
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) frame = requestAnimationFrame(paint);
  else paint(0);
  addEventListener('resize', seedStars, { passive: true });

  const eventSection = document.createElement('section');
  eventSection.id = 'admin-events';
  eventSection.className = 'hide';
  eventSection.innerHTML = `
    <div class="event-head"><div><h1>Events</h1><p>Create and manage scheduled events.</p></div></div>
    <form class="event-form" id="event-form">
      <h2 id="event-form-title">Add an event</h2>
      <div class="event-grid">
        <div><label for="event-title">Event name</label><input id="event-title" maxlength="120" required placeholder="e.g. Portfolio launch"></div>
        <div><label for="event-date">Date and time (your local timezone)</label><input id="event-date" type="datetime-local" required></div>
        <div class="wide"><label for="event-location">Location (optional)</label><input id="event-location" maxlength="200" placeholder="Online, city, venue…"></div>
        <div class="wide"><label for="event-description">Description (optional)</label><textarea id="event-description" maxlength="2000" rows="3" placeholder="Add details about the event"></textarea></div>
      </div>
      <div class="event-actions"><button class="btn p" type="submit" id="event-submit">Save event</button><button class="btn hide" type="button" id="event-cancel">Cancel edit</button></div>
      <p class="err" id="event-error" role="alert" aria-live="polite"></p>
    </form>
    <div id="event-list" aria-live="polite">Loading events…</div>`;
  main.appendChild(eventSection);

  const eventLink = document.createElement('button');
  eventLink.type = 'button'; eventLink.className = 'side-link'; eventLink.dataset.view = 'events';
  eventLink.innerHTML = '<span class="side-icon">✦</span><span class="side-text">Events</span>';
  const pagesLink = sidebar.querySelector('[data-view="content"]');
  pagesLink.insertAdjacentElement('afterend', eventLink);

  const oldNav = app.querySelector('header nav');
  const saveBar = app.querySelector('.save');
  let editingId = '';
  let events = [];
  const tokenHeaders = () => ({ Authorization: `Bearer ${sessionStorage.getItem('t') || ''}` });
  async function api(path, options = {}) {
    const response = await fetch(`/api/${path}`, { cache: 'no-store', ...options, headers: { ...tokenHeaders(), ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  function showEvents(show) {
    eventSection.classList.toggle('hide', !show);
    $('dashboard').classList.add('hide');
    ['content', 'messages', 'comments'].forEach(id => $(id).classList.add('hide'));
    saveBar.classList.add('hide');
    oldNav.querySelectorAll('[data-t]').forEach(button => button.classList.remove('on'));
    sidebar.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === 'events'));
    if (show) loadEvents();
  }
  eventLink.onclick = () => showEvents(true);
  sidebar.querySelectorAll('[data-view]:not([data-view="events"])').forEach(button => button.addEventListener('click', () => eventSection.classList.add('hide')));
  function resetForm() { editingId = ''; $('event-form').reset(); $('event-form-title').textContent = 'Add an event'; $('event-submit').textContent = 'Save event'; $('event-cancel').classList.add('hide'); $('event-error').textContent = ''; }
  $('event-cancel').onclick = resetForm;
  function renderEvents() {
    const list = $('event-list');
    if (!events.length) { list.innerHTML = '<div class="event-empty">No events yet. Add an event above.</div>'; return; }
    list.innerHTML = events.map(event => {
      const date = new Date(event.date);
      const isPast = date < new Date();
      return `<article class="event-card"><div><div class="event-date">${isPast ? 'PAST EVENT' : 'UPCOMING'} · ${escapeHtml(date.toLocaleString())}</div><h3>${escapeHtml(event.title)}</h3>${event.location ? `<div>${escapeHtml(event.location)}</div>` : ''}${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}</div><div class="event-actions"><button type="button" class="btn" data-edit="${escapeHtml(event._id)}">Edit</button><button type="button" class="btn" data-delete="${escapeHtml(event._id)}">Delete</button></div></article>`;
    }).join('');
    list.querySelectorAll('[data-edit]').forEach(button => button.onclick = () => {
      const event = events.find(item => item._id === button.dataset.edit); if (!event) return;
      editingId = event._id; $('event-title').value = event.title;
      const date = new Date(event.date); date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      $('event-date').value = date.toISOString().slice(0, 16); $('event-location').value = event.location || ''; $('event-description').value = event.description || '';
      $('event-form-title').textContent = 'Edit event'; $('event-submit').textContent = 'Update event'; $('event-cancel').classList.remove('hide'); $('event-title').focus();
    });
    list.querySelectorAll('[data-delete]').forEach(button => button.onclick = async () => {
      if (!confirm('Delete this event?')) return;
      button.disabled = true;
      try { await api(`events?id=${encodeURIComponent(button.dataset.delete)}`, { method: 'DELETE' }); await loadEvents(); }
      catch (error) { alert(error.message); button.disabled = false; }
    });
  }
  async function loadEvents() {
    $('event-list').textContent = 'Loading events…';
    try { const result = await api('events'); events = result.items || []; renderEvents(); }
    catch (error) { $('event-list').innerHTML = `<div class="dash-error">${escapeHtml(error.message)}</div>`; }
  }
  $('event-form').onsubmit = async event => {
    event.preventDefault(); $('event-error').textContent = '';
    const submit = $('event-submit'); submit.disabled = true;
    try {
      const localDate = new Date($('event-date').value);
      if (Number.isNaN(localDate.getTime())) throw new Error('Choose a valid event date and time.');
      const payload = { title: $('event-title').value, date: localDate.toISOString(), location: $('event-location').value, description: $('event-description').value };
      await api('events', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload) });
      resetForm(); await loadEvents();
    } catch (error) { $('event-error').textContent = error.message; }
    finally { submit.disabled = false; }
  };
  if (sessionStorage.getItem('t')) showEvents(false);
})();
