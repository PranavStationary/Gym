/* ============================================================
   LifeOS — script.js
   All logic: state, persistence, views, charts, modals, toasts
   ============================================================ */

/* ---------- State ---------- */
const STORAGE_KEY = 'lifeos.v1';

const defaultState = {
  theme: 'dark',
  userName: 'You',
  goals: [],
  habits: [],
  journal: [],
  lastVisit: null,
};

let state = loadState();
let currentMood = null;
let editingJournalId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return { ...structuredClone(defaultState), ...parsed };
  } catch (e) {
    console.warn('Failed to load state, starting fresh:', e);
    return structuredClone(defaultState);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('Storage full — try removing old entries.', 'error');
  }
}

/* ---------- Utils ---------- */
const $ = (sel, parent = document) => parent.querySelector(sel);
const $$ = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const todayKey = () => new Date().toISOString().slice(0, 10);
const dateKey = (d) => new Date(d).toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtRelative = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return fmtDate(d);
};
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

/* ---------- Theme ---------- */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  saveState();
}

function toggleTheme() {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  toast(`Switched to ${next} theme`);
}

/* ---------- Navigation ---------- */
function switchView(name) {
  $$('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
  $$('.view.active').forEach(v => v.classList.remove('stagger'));
  // Force reflow then add stagger for entrance animation
  requestAnimationFrame(() => {
    $$('.view.active').forEach(v => v.classList.add('stagger'));
  });
  // Close mobile sidebar
  $('#sidebar').classList.remove('open');
  // Render the view's content
  renderView(name);
  // Update greeting
  updateGreeting();
  // Scroll to top
  $('.main').scrollTo?.({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderView(name) {
  switch (name) {
    case 'dashboard': renderDashboard(); break;
    case 'goals': renderGoals(); break;
    case 'habits': renderHabits(); break;
    case 'journal': renderJournalList(); break;
    case 'stats': renderStats(); break;
  }
}

/* ---------- Greeting ---------- */
function updateGreeting() {
  const hr = new Date().getHours();
  let greet = 'Good evening';
  if (hr < 5) greet = 'Late night, eh?';
  else if (hr < 12) greet = 'Good morning';
  else if (hr < 17) greet = 'Good afternoon';
  else if (hr < 21) greet = 'Good evening';
  else greet = 'Winding down?';
  $('#greetingTitle').textContent = `${greet}`;
  const subOptions = [
    "Let's make today count.",
    'Small steps. Big trajectory.',
    'What matters most right now?',
    'Your future self is watching.',
    'Consistency compounds.',
  ];
  $('#greetingSub').textContent = subOptions[Math.floor(Date.now() / 86400000) % subOptions.length];
}

/* ---------- Dashboard ---------- */
function renderDashboard() {
  // Stats
  const activeGoals = state.goals.filter(g => !g.completed).length;
  const totalHabits = state.habits.length;
  const doneToday = state.habits.filter(h => h.log?.[todayKey()]).length;
  const streak = calcStreak();

  $('#statGoals').textContent = activeGoals;
  $('#statGoalsTrend').textContent = activeGoals ? `${state.goals.length} total · ${state.goals.filter(g => g.completed).length} done` : 'Add your first goal →';

  $('#statHabits').textContent = `${doneToday}/${totalHabits}`;
  $('#statHabitsTrend').textContent = totalHabits ? `${Math.round(doneToday / totalHabits * 100)}% complete today` : 'No habits yet';

  $('#statJournal').textContent = state.journal.length;
  $('#statJournalTrend').textContent = state.journal.length ? `Last: ${fmtRelative(state.journal[0].date)}` : 'Write your story →';

  $('#statStreak').textContent = streak;
  $('#statStreakTrend').textContent = streak ? 'days strong — keep going!' : 'Mark a habit today';

  $('#userStreak').textContent = `${streak} day streak`;

  // Focus goals (top 3 by progress)
  const focus = [...state.goals].sort((a, b) => b.progress - a.progress).slice(0, 3);
  const focusEl = $('#focusGoals');
  if (focus.length === 0) {
    focusEl.innerHTML = '<div class="empty">No goals yet — head to the Goals tab to create one.</div>';
  } else {
    focusEl.innerHTML = focus.map(g => `
      <div class="focus-goal" data-id="${g.id}">
        <div class="focus-goal-head">
          <span class="focus-goal-name">${escapeHtml(g.name)}</span>
          <span class="focus-goal-pct">${g.progress}%</span>
        </div>
        <div class="progress-bar"><div class="progress-fill" style="width:${g.progress}%"></div></div>
      </div>
    `).join('');
    $$('.focus-goal', focusEl).forEach(el => {
      el.addEventListener('click', () => switchView('goals'));
    });
  }

  // Today's habits
  const todayEl = $('#todayHabits');
  if (state.habits.length === 0) {
    todayEl.innerHTML = '<div class="empty">No habits tracked yet.</div>';
  } else {
    todayEl.innerHTML = state.habits.map(h => {
      const done = h.log?.[todayKey()];
      return `
        <div class="habit-today-row" data-id="${h.id}">
          <button class="habit-check ${done ? 'done' : ''}" data-id="${h.id}">
            ${done ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
          </button>
          <span class="habit-today-name ${done ? 'done' : ''}">${escapeHtml(h.name)}</span>
        </div>
      `;
    }).join('');
    $$('.habit-check', todayEl).forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        toggleHabit(btn.dataset.id);
      });
    });
  }

  // Recent journal
  const recent = state.journal.slice(0, 3);
  const recentEl = $('#recentJournal');
  if (recent.length === 0) {
    recentEl.innerHTML = '<div class="empty">Your latest thoughts will appear here.</div>';
  } else {
    recentEl.innerHTML = recent.map(j => `
      <div class="recent-entry" data-id="${j.id}">
        <div class="recent-entry-title">${escapeHtml(j.title || 'Untitled')} ${j.mood ? moodEmoji(j.mood) : ''}</div>
        <div class="recent-entry-snippet">${escapeHtml(j.body.slice(0, 120))}</div>
        <div class="recent-entry-date">${fmtRelative(j.date)}</div>
      </div>
    `).join('');
    $$('.recent-entry', recentEl).forEach(el => {
      el.addEventListener('click', () => {
        switchView('journal');
        loadJournalEntry(el.dataset.id);
      });
    });
  }
}

function moodEmoji(m) {
  return ['', '⛈️', '🌧️', '😐', '😊', '🌅'][m] || '';
}

/* ---------- Goals ---------- */
function renderGoals() {
  const grid = $('#goalGrid');
  if (state.goals.length === 0) {
    grid.innerHTML = `
      <div class="empty-state glass">
        <div class="empty-icon">🎯</div>
        <h3>No goals yet</h3>
        <p>What's the one thing that, if achieved, would make this year transformative?</p>
        <button class="btn-primary" data-action="add-goal">Create your first goal</button>
      </div>
    `;
    $$('[data-action="add-goal"]', grid).forEach(b => b.addEventListener('click', openGoalModal));
    return;
  }

  grid.innerHTML = state.goals.map(g => {
    const r = 28;
    const circ = 2 * Math.PI * r;
    const offset = circ - (g.progress / 100) * circ;
    const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
    return `
      <div class="goal-card glass" data-id="${g.id}">
        <div class="goal-card-head">
          <div>
            <div class="goal-card-title">${escapeHtml(g.name)}</div>
          </div>
          <span class="goal-category">${escapeHtml(g.category || 'General')}</span>
        </div>
        ${g.description ? `<div class="goal-card-desc">${escapeHtml(g.description)}</div>` : ''}
        <div class="goal-progress-ring">
          <div class="ring">
            <svg viewBox="0 0 70 70">
              <circle class="ring-bg" cx="35" cy="35" r="${r}"/>
              <circle class="ring-fg" cx="35" cy="35" r="${r}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="ring-text">${g.progress}%</div>
          </div>
          <div class="goal-meta">
            ${g.deadline ? `<div class="goal-meta-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
            </div>` : ''}
            <div class="goal-meta-row">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              ${g.completed ? 'Completed 🎉' : 'In progress'}
            </div>
          </div>
        </div>
        <div class="goal-actions">
          <button class="goal-action" data-action="progress" data-id="${g.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            Update
          </button>
          <button class="goal-action" data-action="edit" data-id="${g.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="goal-action danger" data-action="delete" data-id="${g.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  $$('.goal-action', grid).forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      if (action === 'progress') updateProgress(id);
      else if (action === 'edit') openGoalModal(id);
      else if (action === 'delete') deleteGoal(id);
    });
  });
}

function openGoalModal(id = null) {
  const goal = id ? state.goals.find(g => g.id === id) : null;
  $('#modalTitle').textContent = goal ? 'Edit Goal' : 'New Goal';
  $('#modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">Goal Name</label>
      <input type="text" class="form-input" id="goalName" placeholder="e.g. Run a half marathon" value="${goal ? escapeHtml(goal.name) : ''}" />
    </div>
    <div class="form-group">
      <label class="form-label">Description (optional)</label>
      <textarea class="form-textarea" id="goalDesc" placeholder="Why does this matter to you?">${goal ? escapeHtml(goal.description || '') : ''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="goalCategory">
          ${['Health', 'Career', 'Learning', 'Relationships', 'Finance', 'Creativity', 'Mindfulness', 'General'].map(c =>
            `<option value="${c}" ${goal?.category === c ? 'selected' : ''}>${c}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Target Date</label>
        <input type="date" class="form-input" id="goalDeadline" value="${goal?.deadline || daysFromNow(90)}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Starting Progress: <span id="progressVal">${goal?.progress || 0}%</span></label>
      <input type="range" min="0" max="100" step="5" value="${goal?.progress || 0}" id="goalProgress" style="width:100%; accent-color: var(--accent);" />
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" id="cancelGoal">Cancel</button>
      <button class="btn-primary" id="saveGoal">${goal ? 'Save Changes' : 'Create Goal'}</button>
    </div>
  `;
  openModal();

  const slider = $('#goalProgress');
  slider.addEventListener('input', () => { $('#progressVal').textContent = slider.value + '%'; });
  $('#cancelGoal').addEventListener('click', closeModal);
  $('#saveGoal').addEventListener('click', () => {
    const name = $('#goalName').value.trim();
    if (!name) { toast('Give your goal a name first.', 'error'); return; }
    const data = {
      id: goal?.id || uid(),
      name,
      description: $('#goalDesc').value.trim(),
      category: $('#goalCategory').value,
      deadline: $('#goalDeadline').value,
      progress: parseInt(slider.value),
      completed: parseInt(slider.value) >= 100,
      createdAt: goal?.createdAt || new Date().toISOString(),
    };
    if (goal) {
      const idx = state.goals.findIndex(g => g.id === goal.id);
      state.goals[idx] = data;
      toast('Goal updated ✨');
    } else {
      state.goals.unshift(data);
      toast('Goal created 🎯');
    }
    saveState();
    closeModal();
    renderGoals();
  });
}

function updateProgress(id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;
  $('#modalTitle').textContent = 'Update Progress';
  $('#modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">${escapeHtml(goal.name)}</label>
      <div style="font-size: 14px; color: var(--text-dim); margin-bottom: 16px;">Current: ${goal.progress}%</div>
      <input type="range" min="0" max="100" step="5" value="${goal.progress}" id="newProgress" style="width:100%; accent-color: var(--accent);" />
      <div style="text-align: center; font-size: 32px; font-weight: 700; color: var(--accent); margin-top: 12px;" id="bigProgress">${goal.progress}%</div>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" id="cancelProgress">Cancel</button>
      <button class="btn-primary" id="saveProgress">Save</button>
    </div>
  `;
  openModal();
  $('#newProgress').addEventListener('input', e => { $('#bigProgress').textContent = e.target.value + '%'; });
  $('#cancelProgress').addEventListener('click', closeModal);
  $('#saveProgress').addEventListener('click', () => {
    const val = parseInt($('#newProgress').value);
    goal.progress = val;
    goal.completed = val >= 100;
    if (goal.completed) toast('Goal completed! 🎉 Time to celebrate.');
    else toast(`Progress updated to ${val}%`);
    saveState();
    closeModal();
    renderGoals();
  });
}

function deleteGoal(id) {
  const goal = state.goals.find(g => g.id === id);
  if (!goal) return;
  $('#modalTitle').textContent = 'Delete Goal?';
  $('#modalBody').innerHTML = `
    <p style="color: var(--text-dim); margin-bottom: 8px;">Are you sure you want to delete:</p>
    <p style="font-weight: 600; font-size: 16px; margin-bottom: 24px;">${escapeHtml(goal.name)}</p>
    <p style="color: var(--text-faint); font-size: 13px; margin-bottom: 24px;">This action cannot be undone.</p>
    <div class="modal-actions">
      <button class="btn-ghost" id="cancelDelete">Cancel</button>
      <button class="btn-primary" id="confirmDelete" style="background: var(--danger); box-shadow: 0 4px 14px rgba(248,113,113,0.4);">Delete</button>
    </div>
  `;
  openModal();
  $('#cancelDelete').addEventListener('click', closeModal);
  $('#confirmDelete').addEventListener('click', () => {
    state.goals = state.goals.filter(g => g.id !== id);
    saveState();
    closeModal();
    renderGoals();
    toast('Goal deleted');
  });
}

/* ---------- Habits ---------- */
const HABIT_COLORS = ['#8b7cff', '#ff6b9d', '#4fd1c5', '#fbbf24', '#4ade80', '#f87171', '#60a5fa'];

function renderHabits() {
  const list = $('#habitList');
  if (state.habits.length === 0) {
    list.innerHTML = `
      <div class="empty-state glass">
        <div class="empty-icon">🌱</div>
        <h3>Plant your first habit</h3>
        <p>Atomic habits compound. Start small — 5 minutes a day beats nothing.</p>
        <button class="btn-primary" data-action="add-habit">Add a habit</button>
      </div>
    `;
    $$('[data-action="add-habit"]', list).forEach(b => b.addEventListener('click', openHabitModal));
    return;
  }

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  list.innerHTML = state.habits.map(h => {
    const today = todayKey();
    const streak = calcHabitStreak(h);
    // Last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = dateKey(d);
      const dayIdx = (d.getDay() + 6) % 7; // Mon=0
      const done = h.log?.[key];
      const isToday = key === today;
      days.push(`
        <div class="habit-day ${done ? 'done' : ''} ${isToday ? 'today' : ''}" data-habit="${h.id}" data-date="${key}" title="${fmtDate(d)}">
          <span class="habit-day-label">${weekDays[dayIdx]}</span>
        </div>
      `);
    }
    return `
      <div class="habit-card glass" data-id="${h.id}">
        <div class="habit-card-head">
          <span class="habit-color-dot" style="background:${h.color}; color:${h.color};"></span>
          <span class="habit-name">${escapeHtml(h.name)}</span>
          <span class="habit-streak">🔥 ${streak}d streak</span>
          <button class="habit-delete" data-id="${h.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="habit-week">${days.join('')}</div>
      </div>
    `;
  }).join('');

  $$('.habit-day', list).forEach(d => {
    d.addEventListener('click', () => toggleHabitDay(d.dataset.habit, d.dataset.date));
  });
  $$('.habit-delete', list).forEach(b => {
    b.addEventListener('click', () => deleteHabit(b.dataset.id));
  });
}

function openHabitModal() {
  $('#modalTitle').textContent = 'New Habit';
  $('#modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">Habit Name</label>
      <input type="text" class="form-input" id="habitName" placeholder="e.g. Meditate 10 min" />
    </div>
    <div class="form-group">
      <label class="form-label">Color</label>
      <div class="color-options" id="colorOptions">
        ${HABIT_COLORS.map((c, i) => `<div class="color-option ${i === 0 ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`).join('')}
      </div>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" id="cancelHabit">Cancel</button>
      <button class="btn-primary" id="saveHabit">Create Habit</button>
    </div>
  `;
  openModal();
  let selectedColor = HABIT_COLORS[0];
  $$('.color-option').forEach(opt => {
    opt.addEventListener('click', () => {
      $$('.color-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedColor = opt.dataset.color;
    });
  });
  $('#cancelHabit').addEventListener('click', closeModal);
  $('#saveHabit').addEventListener('click', () => {
    const name = $('#habitName').value.trim();
    if (!name) { toast('Give your habit a name.', 'error'); return; }
    state.habits.push({
      id: uid(),
      name,
      color: selectedColor,
      log: {},
      createdAt: new Date().toISOString(),
    });
    saveState();
    closeModal();
    renderHabits();
    toast('Habit added 🌱');
  });
}

function toggleHabit(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  if (!h.log) h.log = {};
  const key = todayKey();
  if (h.log[key]) {
    delete h.log[key];
    toast('Unchecked for today');
  } else {
    h.log[key] = true;
    toast(`${h.name} ✓ Nice!`);
  }
  saveState();
  renderHabits();
  renderDashboard();
}

function toggleHabitDay(habitId, dateKey) {
  const h = state.habits.find(x => x.id === habitId);
  if (!h) return;
  if (!h.log) h.log = {};
  if (h.log[dateKey]) delete h.log[dateKey];
  else h.log[dateKey] = true;
  saveState();
  renderHabits();
  renderDashboard();
}

function deleteHabit(id) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  $('#modalTitle').textContent = 'Delete Habit?';
  $('#modalBody').innerHTML = `
    <p style="color: var(--text-dim); margin-bottom: 8px;">Delete habit:</p>
    <p style="font-weight: 600; font-size: 16px; margin-bottom: 24px;">${escapeHtml(h.name)}</p>
    <p style="color: var(--text-faint); font-size: 13px; margin-bottom: 24px;">All history will be lost.</p>
    <div class="modal-actions">
      <button class="btn-ghost" id="cancelDelete">Cancel</button>
      <button class="btn-primary" id="confirmDelete" style="background: var(--danger); box-shadow: 0 4px 14px rgba(248,113,113,0.4);">Delete</button>
    </div>
  `;
  openModal();
  $('#cancelDelete').addEventListener('click', closeModal);
  $('#confirmDelete').addEventListener('click', () => {
    state.habits = state.habits.filter(x => x.id !== id);
    saveState();
    closeModal();
    renderHabits();
    toast('Habit deleted');
  });
}

function calcHabitStreak(h) {
  if (!h.log) return 0;
  let streak = 0;
  let d = new Date();
  // If today not done, start from yesterday
  if (!h.log[dateKey(d)]) d.setDate(d.getDate() - 1);
  while (h.log[dateKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function calcStreak() {
  // Overall streak — days where at least one habit was completed
  if (state.habits.length === 0) return 0;
  let streak = 0;
  let d = new Date();
  // Check today: if nothing done yet today, start from yesterday
  const todayHasActivity = state.habits.some(h => h.log?.[dateKey(d)]);
  if (!todayHasActivity) d.setDate(d.getDate() - 1);
  while (state.habits.some(h => h.log?.[dateKey(d)])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/* ---------- Journal ---------- */
function renderJournalList() {
  const list = $('#journalList');
  $('#entryCount').textContent = state.journal.length;
  if (state.journal.length === 0) {
    list.innerHTML = '<div class="empty">No entries yet. Write your first one →</div>';
    return;
  }
  list.innerHTML = state.journal.map(j => `
    <div class="journal-entry" data-id="${j.id}">
      <div class="journal-entry-head">
        <span class="journal-entry-title">${escapeHtml(j.title || 'Untitled')}</span>
        ${j.mood ? `<span class="journal-entry-mood">${moodEmoji(j.mood)}</span>` : ''}
      </div>
      <div class="journal-entry-date">${fmtDate(j.date)} · ${fmtRelative(j.date)}</div>
      <div class="journal-entry-snippet">${escapeHtml(j.body.slice(0, 200))}${j.body.length > 200 ? '…' : ''}</div>
      <div class="journal-entry-actions">
        <button class="entry-action" data-action="load" data-id="${j.id}">Load</button>
        <button class="entry-action danger" data-action="delete" data-id="${j.id}">Delete</button>
      </div>
    </div>
  `).join('');

  $$('.entry-action', list).forEach(b => {
    b.addEventListener('click', e => {
      e.stopPropagation();
      const action = b.dataset.action;
      const id = b.dataset.id;
      if (action === 'load') loadJournalEntry(id);
      else if (action === 'delete') deleteJournal(id);
    });
  });
}

function loadJournalEntry(id) {
  const j = state.journal.find(x => x.id === id);
  if (!j) return;
  editingJournalId = id;
  $('#journalTitle').value = j.title || '';
  $('#journalBody').value = j.body || '';
  currentMood = j.mood || null;
  updateMoodUI();
  updateWordCount();
  $('#journalBody').focus();
  toast('Entry loaded — edit and save to update');
}

function deleteJournal(id) {
  state.journal = state.journal.filter(j => j.id !== id);
  saveState();
  renderJournalList();
  renderDashboard();
  toast('Entry deleted');
}

function saveJournal() {
  const title = $('#journalTitle').value.trim();
  const body = $('#journalBody').value.trim();
  if (!title && !body) { toast('Write something first ✍️', 'error'); return; }

  if (editingJournalId) {
    const idx = state.journal.findIndex(j => j.id === editingJournalId);
    if (idx >= 0) {
      state.journal[idx] = { ...state.journal[idx], title, body, mood: currentMood, date: new Date().toISOString() };
      editingJournalId = null;
    }
  } else {
    state.journal.unshift({
      id: uid(),
      title,
      body,
      mood: currentMood,
      date: new Date().toISOString(),
    });
  }

  saveState();
  $('#journalTitle').value = '';
  $('#journalBody').value = '';
  currentMood = null;
  updateMoodUI();
  updateWordCount();
  renderJournalList();
  renderDashboard();
  toast('Entry saved 📝');
}

function updateWordCount() {
  const text = $('#journalBody').value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  $('#wordCount').textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
}

function updateMoodUI() {
  $$('.mood-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.mood) === currentMood);
  });
}

/* ---------- Insights / Stats ---------- */
function renderStats() {
  renderGoalProgressChart();
  renderMoodChart();
  renderHeatmap();
  renderWeeklySummary();
}

function renderGoalProgressChart() {
  const wrap = $('#goalProgressChart');
  const goals = state.goals.slice(0, 6);
  if (goals.length === 0) {
    wrap.innerHTML = '<div class="empty">No goals to chart yet.</div>';
    return;
  }
  const max = 100;
  const barH = 28;
  const gap = 12;
  const labelW = 120;
  const totalH = goals.length * (barH + gap) + 20;
  const w = 380;
  let svg = `<svg viewBox="0 0 ${w} ${totalH}" preserveAspectRatio="xMidYMid meet">`;
  goals.forEach((g, i) => {
    const y = i * (barH + gap) + 10;
    const barW = (w - labelW - 50) * (g.progress / max);
    svg += `<text x="0" y="${y + barH/2 + 4}" fill="var(--text-dim)" font-size="11" font-family="Inter">${escapeHtml(g.name.slice(0, 16))}${g.name.length > 16 ? '…' : ''}</text>`;
    svg += `<rect x="${labelW}" y="${y}" width="${w - labelW - 50}" height="${barH}" rx="6" fill="var(--surface-strong)" />`;
    svg += `<rect x="${labelW}" y="${y}" width="${barW}" height="${barH}" rx="6" fill="url(#gradBar)" style="transition: width 0.8s var(--ease-out-quint);"/>`;
    svg += `<text x="${labelW + barW + 6}" y="${y + barH/2 + 4}" fill="var(--accent)" font-size="11" font-weight="600">${g.progress}%</text>`;
  });
  svg += `<defs><linearGradient id="gradBar" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="var(--accent)"/><stop offset="100%" stop-color="var(--accent-2)"/></linearGradient></defs>`;
  svg += '</svg>';
  wrap.innerHTML = svg;
}

function renderMoodChart() {
  const wrap = $('#moodChart');
  // Last 30 days of journal entries with mood
  const entries = state.journal.filter(j => j.mood).slice(0, 30).reverse();
  if (entries.length === 0) {
    wrap.innerHTML = '<div class="empty">Log moods in your journal to see trends.</div>';
    return;
  }
  const w = 380, h = 220;
  const pad = { l: 30, r: 20, t: 20, b: 30 };
  const cw = w - pad.l - pad.r;
  const ch = h - pad.t - pad.b;
  const maxMood = 5;
  const stepX = entries.length > 1 ? cw / (entries.length - 1) : 0;

  let points = entries.map((e, i) => {
    const x = pad.l + i * stepX;
    const y = pad.t + ch - (e.mood / maxMood) * ch;
    return { x, y, mood: e.mood, date: e.date };
  });

  let pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  let areaD = `${pathD} L ${points[points.length-1].x} ${pad.t + ch} L ${points[0].x} ${pad.t + ch} Z`;

  let svg = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;
  svg += `<defs><linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--accent)" stop-opacity="0.4"/><stop offset="100%" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>`;
  // Grid lines
  for (let i = 1; i <= 5; i++) {
    const y = pad.t + ch - (i / 5) * ch;
    svg += `<line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}" stroke="var(--border)" stroke-dasharray="2 4"/>`;
    svg += `<text x="${pad.l - 8}" y="${y + 3}" fill="var(--text-faint)" font-size="9" text-anchor="end">${i}</text>`;
  }
  svg += `<path d="${areaD}" fill="url(#moodGrad)" />`;
  svg += `<path d="${pathD}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 0 6px var(--accent-glow));"/>`;
  points.forEach(p => {
    svg += `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="var(--accent)" stroke="var(--bg)" stroke-width="2"/>`;
  });
  svg += '</svg>';
  wrap.innerHTML = svg;
}

function renderHeatmap() {
  const wrap = $('#habitHeatmap');
  if (state.habits.length === 0) {
    wrap.innerHTML = '<div class="empty">Add habits to see your consistency map.</div>';
    return;
  }
  // 12 weeks × 7 days, GitHub-style
  const weeks = 12;
  const days = 7;
  const today = new Date();
  const cells = [];
  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = 0; d < days; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (w * 7 + (today.getDay() - d + 7) % 7));
      if (date > today) continue;
      const key = dateKey(date);
      const count = state.habits.filter(h => h.log?.[key]).length;
      let level = 0;
      if (count > 0) level = Math.min(4, Math.ceil(count / Math.max(1, state.habits.length / 2)));
      cells.push({ key, date, count, level });
    }
  }

  let html = '<div class="heatmap-grid">';
  // Sort cells chronologically left-to-right
  cells.sort((a, b) => new Date(a.date) - new Date(b.date));
  cells.forEach(c => {
    html += `<div class="heatmap-cell" data-level="${c.level}" title="${fmtDate(c.date)}: ${c.count} habit${c.count !== 1 ? 's' : ''}"></div>`;
  });
  html += '</div>';
  html += `<div class="heatmap-legend">Less <div class="heatmap-cell" data-level="0"></div><div class="heatmap-cell" data-level="1"></div><div class="heatmap-cell" data-level="2"></div><div class="heatmap-cell" data-level="3"></div><div class="heatmap-cell" data-level="4"></div> More</div>`;
  wrap.innerHTML = html;
}

function renderWeeklySummary() {
  const wrap = $('#weeklySummary');
  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  const goalsCompleted = state.goals.filter(g => g.completed && new Date(g.createdAt) >= weekAgo).length;
  const habitsDone7d = state.habits.reduce((sum, h) => {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (h.log?.[dateKey(d)]) count++;
    }
    return sum + count;
  }, 0);
  const journal7d = state.journal.filter(j => new Date(j.date) >= weekAgo).length;
  const bestStreak = Math.max(0, ...state.habits.map(h => calcHabitStreak(h)));

  wrap.innerHTML = `
    <div class="summary-row"><span class="summary-label">Habits completed (7d)</span><span class="summary-value">${habitsDone7d}</span></div>
    <div class="summary-row"><span class="summary-label">Journal entries (7d)</span><span class="summary-value">${journal7d}</span></div>
    <div class="summary-row"><span class="summary-label">Goals completed</span><span class="summary-value">${goalsCompleted}</span></div>
    <div class="summary-row"><span class="summary-label">Best habit streak</span><span class="summary-value">${bestStreak}d</span></div>
    <div class="summary-row"><span class="summary-label">Total active goals</span><span class="summary-value">${state.goals.filter(g => !g.completed).length}</span></div>
  `;
}

/* ---------- Modal ---------- */
function openModal() {
  $('#modalBackdrop').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  $('#modalBackdrop').classList.remove('active');
  document.body.style.overflow = '';
}

/* ---------- Toast ---------- */
function toast(msg, type = 'success') {
  const container = $('#toastContainer');
  const t = document.createElement('div');
  t.className = 'toast';
  const iconSvg = type === 'success'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  t.innerHTML = `<div class="toast-icon" style="background:${type === 'success' ? 'var(--success)' : 'var(--danger)'}">${iconSvg}</div><div class="toast-message">${escapeHtml(msg)}</div>`;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('removing');
    setTimeout(() => t.remove(), 320);
  }, 2800);
}

/* ---------- HTML escape ---------- */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Quick add ---------- */
function openQuickAdd() {
  $('#modalTitle').textContent = 'Quick Add';
  $('#modalBody').innerHTML = `
    <p style="color: var(--text-dim); margin-bottom: 20px;">What would you like to add?</p>
    <div style="display: grid; gap: 12px;">
      <button class="btn-ghost" data-qa="goal" style="justify-content: flex-start; padding: 16px;">
        🎯 <span>New Goal</span>
      </button>
      <button class="btn-ghost" data-qa="habit" style="justify-content: flex-start; padding: 16px;">
        🌱 <span>New Habit</span>
      </button>
      <button class="btn-ghost" data-qa="journal" style="justify-content: flex-start; padding: 16px;">
        📝 <span>Journal Entry</span>
      </button>
    </div>
  `;
  openModal();
  $$('[data-qa="goal"]').forEach(b => b.addEventListener('click', () => { closeModal(); switchView('goals'); openGoalModal(); }));
  $$('[data-qa="habit"]').forEach(b => b.addEventListener('click', () => { closeModal(); switchView('habits'); openHabitModal(); }));
  $$('[data-qa="journal"]').forEach(b => b.addEventListener('click', () => { closeModal(); switchView('journal'); $('#journalTitle').focus(); }));
}

/* ---------- Seed data (first run) ---------- */
function maybeSeed() {
  if (state.goals.length === 0 && state.habits.length === 0 && state.journal.length === 0) {
    state.goals = [
      { id: uid(), name: 'Read 12 books this year', description: 'Fiction + non-fiction mix. 1 book per month.', category: 'Learning', deadline: daysFromNow(180), progress: 25, completed: false, createdAt: new Date().toISOString() },
      { id: uid(), name: 'Run 5K under 30 min', description: 'Build endurance with 3 runs/week.', category: 'Health', deadline: daysFromNow(60), progress: 40, completed: false, createdAt: new Date().toISOString() },
    ];
    state.habits = [
      { id: uid(), name: 'Drink 2L water', color: HABIT_COLORS[2], log: { [todayKey()]: true, [daysFromNow(-1)]: true, [daysFromNow(-2)]: true }, createdAt: new Date().toISOString() },
      { id: uid(), name: 'Meditate 10 min', color: HABIT_COLORS[0], log: { [todayKey()]: true, [daysFromNow(-1)]: true }, createdAt: new Date().toISOString() },
      { id: uid(), name: 'Read 20 pages', color: HABIT_COLORS[4], log: {}, createdAt: new Date().toISOString() },
    ];
    state.journal = [
      { id: uid(), title: 'Started LifeOS', body: 'Setting up my personal dashboard today. Excited to track my goals and build better habits. The journey of a thousand miles begins with a single step.', mood: 4, date: new Date().toISOString() },
    ];
    saveState();
  }
}

/* ---------- Event bindings ---------- */
function bindEvents() {
  // Nav
  $$('.nav-item').forEach(b => b.addEventListener('click', () => switchView(b.dataset.view)));
  $$('[data-jump]').forEach(b => b.addEventListener('click', () => switchView(b.dataset.jump)));

  // Theme
  $('#themeToggle').addEventListener('click', toggleTheme);

  // Top bar
  $('#quickAddBtn').addEventListener('click', openQuickAdd);
  $('#menuToggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  // Goals
  $('#addGoalBtn').addEventListener('click', () => openGoalModal());

  // Habits
  $('#addHabitBtn').addEventListener('click', openHabitModal);

  // Journal
  $('#saveJournalBtn').addEventListener('click', saveJournal);
  $('#journalBody').addEventListener('input', updateWordCount);
  $$('.mood-btn').forEach(b => {
    b.addEventListener('click', () => {
      const m = parseInt(b.dataset.mood);
      currentMood = currentMood === m ? null : m;
      updateMoodUI();
    });
  });
  // Keyboard shortcut: Cmd/Ctrl+S to save journal
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's' && document.activeElement === $('#journalBody')) {
      e.preventDefault();
      saveJournal();
    }
    if (e.key === 'Escape') closeModal();
  });

  // Modal
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', e => {
    if (e.target === $('#modalBackdrop')) closeModal();
  });

  // Quick add from empty states
  document.addEventListener('click', e => {
    const target = e.target.closest('[data-action="add-goal"]');
    if (target) openGoalModal();
    const target2 = e.target.closest('[data-action="add-habit"]');
    if (target2) openHabitModal();
  });
}

/* ---------- Init ---------- */
function init() {
  applyTheme(state.theme || 'dark');
  maybeSeed();
  bindEvents();
  updateGreeting();
  renderDashboard();
  // Initial view animation
  requestAnimationFrame(() => {
    $('.view.active')?.classList.add('stagger');
  });
  // Mark last visit
  state.lastVisit = new Date().toISOString();
  saveState();
}

document.addEventListener('DOMContentLoaded', init);
