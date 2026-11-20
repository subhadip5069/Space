// Admin event management. Keep the existing content editor and its Save changes bar
// visible on startup; only hide it while the Events view is actually open.
(() => {
  const $ = id => document.getElementById(id);
  const app = $('app');
  const main = app && app.querySelector('main');
  const sidebar = $('admin-sidebar');
  if (!app || !main || !sidebar) return;

  const style = document.createElement('style');
  style.textContent = `
    #app.admin-shell>main{padding-bottom:120px}
    .event-head{margin-bottom:20px}
    .event-head h1{margin:0;font-size:clamp(25px,4vw,36px)}
    .event-head p{margin:5px 0;color:var(--muted)}
    .event-form,.event-card{margin:0 0 15px;padding:20px;border:1px solid var(--line);border-radius:16px;background:rgba(11,14,25,.94)}
    .event-form h2{margin:0 0 16px;font-size:16px}
    .event-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 14px}
    .event-grid .wide{grid-column:1/-1}
    .event-actions{display:flex;gap:9px;flex-wrap:wrap}
    .event-card{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
    .event-card h3{margin:5px 0;font-size:17px}
    .event-card p{margin:5px 0;color:var(--muted);white-space:pre-wrap}
    .event-date{color:var(--mint);font-size:12px}
    .event-empty{padding:22px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);text-align:center}
    @media(max-width:620px){.event-form,.event-card{padding:14px}.event-grid{grid-template-columns:1fr}.event-grid .wide{grid-column:auto}}
  `;
  document.head.appendChild(style);

  const eventSection = document.createElement('section');
  eventSection.id = 'admin-events';
  eventSection.className = 'hide';
  eventSection.innerHTML = `
    <div class="event-head"><h1>Events</h1><p>Create and manage scheduled events.</p></div>
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
    <div id="event-list" aria-live="polite">Events load when you open this page.</div>`;
  main.appendChild(eventSection);

  const eventLink = document.createElement('button');
  eventLink.type = 'button';
  eventLink.className = 'side-link';
  eventLink.dataset.view = 'events';
  eventLink.innerHTML = '<span class="side-icon">✦</span><span class="side-text">Events</span>';
  const contentLink = sidebar.querySelector('[data-view="content"]');
  if (contentLink) contentLink.insertAdjacentElement('afterend', eventLink);

  const saveBar = app.querySelector('.save');
  const oldNav = app.querySelector('header nav');
  let editingId = '';
  let events = [];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

  async function api(path, options = {}) {
    const response = await fetch(`/api/${path}`, {
      cache: 'no-store',
      ...options,
      headers: { Authorization: `Bearer ${sessionStorage.getItem('t') || ''}`, ...(options.headers || {}) }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }

  function openEvents() {
    eventSection.classList.remove('hide');
    ['dashboard', 'content', 'messages', 'comments'].forEach(id => $(id)?.classList.add('hide'));
    saveBar?.classList.add('hide');
    oldNav?.querySelectorAll('[data-t]').forEach(button => button.classList.remove('on'));
    sidebar.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button === eventLink));
    loadEvents();
  }
  eventLink.addEventListener('click', openEvents);

  // Other navigation restores the normal view and Save changes bar, controlled by admin.js.
  sidebar.querySelectorAll('[data-view]:not([data-view="events"])').forEach(button => {
    button.addEventListener('click', () => eventSection.classList.add('hide'));
  });
  oldNav?.querySelectorAll('[data-t]').forEach(button => {
    button.addEventListener('click', () => eventSection.classList.add('hide'));
  });

  function resetForm() {
    editingId = '';
    $('event-form').reset();
    $('event-form-title').textContent = 'Add an event';
    $('event-submit').textContent = 'Save event';
    $('event-cancel').classList.add('hide');
  }
  $('event-cancel').addEventListener('click', resetForm);

  function renderEvents() {
    const list = $('event-list');
    if (!events.length) {
      list.innerHTML = '<div class="event-empty">No events yet. Add an event above.</div>';
      return;
    }
    list.innerHTML = events.map(event => {
      const date = new Date(event.date);
      const label = date < new Date() ? 'PAST EVENT' : 'UPCOMING';
      return `<article class="event-card"><div><div class="event-date">${label} · ${escapeHtml(date.toLocaleString())}</div><h3>${escapeHtml(event.title)}</h3>${event.location ? `<p>${escapeHtml(event.location)}</p>` : ''}${event.description ? `<p>${escapeHtml(event.description)}</p>` : ''}</div><div class="event-actions"><button class="btn" type="button" data-edit="${escapeHtml(event._id)}">Edit</button><button class="btn" type="button" data-delete="${escapeHtml(event._id)}">Delete</button></div></article>`;
    }).join('');

    list.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => {
      const event = events.find(item => item._id === button.dataset.edit);
      if (!event) return;
      editingId = event._id;
      $('event-title').value = event.title;
      const date = new Date(event.date);
      date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
      $('event-date').value = date.toISOString().slice(0, 16);
      $('event-location').value = event.location || '';
      $('event-description').value = event.description || '';
      $('event-form-title').textContent = 'Edit event';
      $('event-submit').textContent = 'Update event';
      $('event-cancel').classList.remove('hide');
      $('event-title').focus();
    }));
    list.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => {
      if (!confirm('Delete this event?')) return;
      button.disabled = true;
      try {
        await api(`events?id=${encodeURIComponent(button.dataset.delete)}`, { method: 'DELETE' });
        await loadEvents();
      } catch (error) {
        alert(error.message);
        button.disabled = false;
      }
    }));
  }

  async function loadEvents() {
    $('event-list').textContent = 'Loading events…';
    try {
      const result = await api('events');
      events = Array.isArray(result.items) ? result.items : [];
      renderEvents();
    } catch (error) {
      $('event-list').textContent = error.message;
    }
  }

  $('event-form').addEventListener('submit', async event => {
    event.preventDefault();
    $('event-error').textContent = '';
    const submit = $('event-submit');
    submit.disabled = true;
    try {
      const localDate = new Date($('event-date').value);
      if (Number.isNaN(localDate.getTime())) throw new Error('Choose a valid event date and time.');
      const payload = {
        title: $('event-title').value,
        date: localDate.toISOString(),
        location: $('event-location').value,
        description: $('event-description').value
      };
      await api('events', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload)
      });
      resetForm();
      await loadEvents();
    } catch (error) {
      $('event-error').textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
})();
