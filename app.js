(function() {
  'use strict';

  /* ============================================================
     UTILITY FUNCTIONS
     ============================================================ */

  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
  }

  function formatDate(date) {
    if (!date) date = new Date();
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDateShort(date) {
    if (!date) date = new Date();
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getWeekDates(offset) {
    if (offset === undefined) offset = 0;
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset + (offset * 7));
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    }
    return dates;
  }

  function calculateStreak(completions) {
    if (!completions || Object.keys(completions).length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    const todayStr = getToday();
    if (!completions[todayStr]) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    let streak = 0;
    while (true) {
      const ds = checkDate.getFullYear() + '-' + String(checkDate.getMonth() + 1).padStart(2, '0') + '-' + String(checkDate.getDate()).padStart(2, '0');
      if (completions[ds]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 5) return 'Good night';
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function debounce(fn, ms) {
    let timer;
    return function() {
      const ctx = this, args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, ms);
    };
  }

  function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /* ============================================================
     QUOTES
     ============================================================ */

  const QUOTES = [
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
    { text: 'It is during our darkest moments that we must focus to see the light.', author: 'Aristotle' },
    { text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
    { text: 'Believe you can and you are halfway there.', author: 'Theodore Roosevelt' },
    { text: 'The best time to plant a tree was 20 years ago. The second best time is now.', author: 'Chinese Proverb' },
    { text: 'Your time is limited, so do not waste it living someone else\'s life.', author: 'Steve Jobs' },
    { text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins' },
    { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
    { text: 'What you get by achieving your goals is not as important as what you become by achieving your goals.', author: 'Zig Ziglar' },
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'Do not watch the clock. Do what it does. Keep going.', author: 'Sam Levenson' },
    { text: 'Everything you\'ve ever wanted is on the other side of fear.', author: 'George Addair' },
    { text: 'Hardships often prepare ordinary people for an extraordinary destiny.', author: 'C.S. Lewis' },
    { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
    { text: 'If you want to achieve greatness stop asking for permission.', author: 'Unknown' },
    { text: 'Things work out best for those who make the best of how things work out.', author: 'John Wooden' },
    { text: 'To live a creative life, we must lose our fear of being wrong.', author: 'Joseph Chilton Pearce' },
    { text: 'If you are not willing to risk the usual, you will have to settle for the ordinary.', author: 'Jim Rohn' },
    { text: 'All our dreams can come true if we have the courage to pursue them.', author: 'Walt Disney' },
    { text: 'Good things come to people who wait, but better things come to those who go out and get them.', author: 'Unknown' },
    { text: 'Don\'t be afraid to give up the good to go for the great.', author: 'John D. Rockefeller' },
    { text: 'I find that the harder I work, the more luck I seem to have.', author: 'Thomas Jefferson' },
    { text: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau' },
    { text: 'Never let the fear of striking out keep you from playing the game.', author: 'Babe Ruth' },
    { text: 'The only limit to our realization of tomorrow is our doubts of today.', author: 'Franklin D. Roosevelt' },
    { text: 'In the end, it is not the years in your life that count. It is the life in your years.', author: 'Abraham Lincoln' },
    { text: 'Life is what happens when you are busy making other plans.', author: 'John Lennon' },
    { text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama' },
    { text: 'You miss 100% of the shots you don\'t take.', author: 'Wayne Gretzky' },
    { text: 'Whether you think you can or you think you can\'t, you\'re right.', author: 'Henry Ford' },
    { text: 'The mind is everything. What you think you become.', author: 'Buddha' },
    { text: 'Strive not to be a success, but rather to be of value.', author: 'Albert Einstein' },
    { text: 'The best revenge is massive success.', author: 'Frank Sinatra' }
  ];

  function getRandomQuote() {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }

  /* ============================================================
     STORE CLASS
     ============================================================ */

  class Store {
    constructor(prefix) {
      this.prefix = prefix;
    }

    _key(key) {
      return this.prefix + key;
    }

    get(key, defaultVal) {
      try {
        const raw = localStorage.getItem(this._key(key));
        if (raw === null) return defaultVal !== undefined ? defaultVal : null;
        return JSON.parse(raw);
      } catch (e) {
        return defaultVal !== undefined ? defaultVal : null;
      }
    }

    set(key, value) {
      try {
        localStorage.setItem(this._key(key), JSON.stringify(value));
      } catch (e) {
        console.error('Store.set error:', e);
      }
    }

    delete(key) {
      localStorage.removeItem(this._key(key));
    }

    getAll() {
      const data = {};
      const keys = ['goals', 'habits', 'journal', 'moodLog', 'focusSessions', 'settings'];
      keys.forEach(function(k) { data[k] = store.get(k); });
      return data;
    }

    clearAll() {
      const keys = ['goals', 'habits', 'journal', 'moodLog', 'focusSessions', 'settings'];
      keys.forEach(function(k) { store.delete(k); });
    }

    exportAll() {
      return JSON.stringify(this.getAll(), null, 2);
    }

    importAll(jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        const keys = ['goals', 'habits', 'journal', 'moodLog', 'focusSessions', 'settings'];
        keys.forEach(function(k) {
          if (data[k] !== undefined) {
            store.set(k, data[k]);
          }
        });
        return true;
      } catch (e) {
        console.error('Import error:', e);
        return false;
      }
    }
  }

  /* ============================================================
     THEME MANAGER
     ============================================================ */

  class ThemeManager {
    constructor(store) {
      this.store = store;
      this.settings = store.get('settings', { name: 'User', theme: 'dark', accentColor: '#6366f1' });
    }

    init() {
      this.applyTheme(this.settings.theme);
      this.applyAccent(this.settings.accentColor);
    }

    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      this.settings.theme = theme;
      this.store.set('settings', this.settings);
      this.updateThemeColor();
    }

    toggleTheme() {
      const newTheme = this.settings.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme(newTheme);
    }

    applyAccent(color) {
      this.settings.accentColor = color;
      document.documentElement.style.setProperty('--accent', color);
      // Calculate hover and glow from the color
      const hover = this.lightenColor(color, 20);
      const glow = color + '4d'; // ~30% opacity hex
      const bg = color + '1a'; // ~10% opacity hex
      document.documentElement.style.setProperty('--accent-hover', hover);
      document.documentElement.style.setProperty('--accent-glow', glow);
      document.documentElement.style.setProperty('--accent-bg', bg);
      this.store.set('settings', this.settings);
      this.updateThemeColor();
      // Update active swatch
      document.querySelectorAll('.color-swatch').forEach(function(sw) {
        sw.classList.toggle('active', sw.dataset.color === color);
      });
    }

    lightenColor(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
      const B = Math.min(255, (num & 0x0000FF) + amt);
      return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    updateThemeColor() {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', this.settings.accentColor);
      }
    }

    getSettings() {
      return this.settings;
    }

    updateName(name) {
      this.settings.name = name || 'User';
      this.store.set('settings', this.settings);
    }
  }

  /* ============================================================
     MODAL MANAGER
     ============================================================ */

  class ModalManager {
    constructor() {
      this.overlay = document.getElementById('modal-overlay');
      this.container = document.getElementById('modal-container');
      this.titleEl = document.getElementById('modal-title');
      this.bodyEl = document.getElementById('modal-body');
      this.footerEl = document.getElementById('modal-footer');
      this.confirmBtn = document.getElementById('modal-confirm');
      this.cancelBtn = document.getElementById('modal-cancel');
      this.closeBtn = document.getElementById('modal-close');
      this._onConfirm = null;

      this.cancelBtn.addEventListener('click', () => this.closeModal());
      this.closeBtn.addEventListener('click', () => this.closeModal());
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.closeModal();
      });
    }

    openModal(title, bodyHTML, onConfirm) {
      this.titleEl.textContent = title;
      this.bodyEl.innerHTML = bodyHTML;
      this.footerEl.style.display = 'flex';
      this._onConfirm = onConfirm || null;
      this.overlay.classList.add('active');

      // Unbind previous
      const newConfirm = this.confirmBtn.cloneNode(true);
      this.confirmBtn.parentNode.replaceChild(newConfirm, this.confirmBtn);
      this.confirmBtn = newConfirm;
      this.confirmBtn.addEventListener('click', () => {
        if (this._onConfirm) this._onConfirm();
        this.closeModal();
      });
    }

    closeModal() {
      this.overlay.classList.remove('active');
      this._onConfirm = null;
    }
  }

  /* ============================================================
     FOCUS TIMER
     ============================================================ */

  class FocusTimer {
    constructor(store) {
      this.store = store;
      this.state = 'idle'; // idle, running, paused
      this.type = 'work'; // work, break
      this.workDuration = 25 * 60;
      this.breakDuration = 5 * 60;
      this.remaining = this.workDuration;
      this.total = this.workDuration;
      this.interval = null;
      this.ringProgress = document.getElementById('timer-ring-progress');
      this.display = document.getElementById('timer-display');
      this.startBtn = document.getElementById('btn-timer-start');
      this.pauseBtn = document.getElementById('btn-timer-pause');
      this.resetBtn = document.getElementById('btn-timer-reset');
      this.typeLabel = document.getElementById('session-type-label');
      this.circumference = 2 * Math.PI * 120; // r=120
    }

    init() {
      this.updateDisplay();
      this.updateRing();
    }

    start() {
      if (this.state === 'idle' || this.state === 'paused') {
        this.state = 'running';
        this.startBtn.style.display = 'none';
        this.pauseBtn.style.display = 'inline-flex';
        this.interval = setInterval(() => this.tick(), 1000);
      }
    }

    pause() {
      if (this.state === 'running') {
        this.state = 'paused';
        clearInterval(this.interval);
        this.startBtn.style.display = 'inline-flex';
        this.pauseBtn.style.display = 'none';
      }
    }

    reset() {
      clearInterval(this.interval);
      this.state = 'idle';
      this.type = 'work';
      this.remaining = this.workDuration;
      this.total = this.workDuration;
      this.startBtn.style.display = 'inline-flex';
      this.pauseBtn.style.display = 'none';
      this.typeLabel.textContent = 'Focus Session';
      this.updateDisplay();
      this.updateRing();
    }

    tick() {
      this.remaining--;
      if (this.remaining <= 0) {
        this.complete();
        return;
      }
      this.updateDisplay();
      this.updateRing();
    }

    complete() {
      clearInterval(this.interval);
      this.playNotification();
      this.logSession();

      if (this.type === 'work') {
        this.type = 'break';
        this.remaining = this.breakDuration;
        this.total = this.breakDuration;
        this.typeLabel.textContent = 'Break Time';
      } else {
        this.type = 'work';
        this.remaining = this.workDuration;
        this.total = this.workDuration;
        this.typeLabel.textContent = 'Focus Session';
      }

      this.state = 'idle';
      this.startBtn.style.display = 'inline-flex';
      this.pauseBtn.style.display = 'none';
      this.updateDisplay();
      this.updateRing();
      app.renderFocusHistory();
    }

    playNotification() {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        // Audio not available
      }
    }

    logSession() {
      const sessions = this.store.get('focusSessions', []);
      sessions.push({
        id: generateId(),
        type: this.type,
        duration: this.total,
        completedAt: new Date().toISOString()
      });
      this.store.set('focusSessions', sessions);
    }

    updateDisplay() {
      const min = Math.floor(this.remaining / 60);
      const sec = this.remaining % 60;
      this.display.textContent = String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }

    updateRing() {
      const progress = this.remaining / this.total;
      const offset = this.circumference * (1 - progress);
      this.ringProgress.style.strokeDashoffset = offset;
    }
  }

  /* ============================================================
     MAIN APP CLASS
     ============================================================ */

  let store, themeManager, modalManager, focusTimer;
  let analyticsCharts = {};
  let moodChart = null;
  let currentGoalsFilter = 'all';
  let habitsWeekOffset = 0;
  let currentAnalyticsPeriod = 'week';
  let editingJournalId = null;
  let quickAddOpen = false;

  const app = {

    /* ---------- INIT ---------- */

    init() {
      store = new Store('lifeos_');
      themeManager = new ThemeManager(store);
      themeManager.init();
      modalManager = new ModalManager();
      focusTimer = new FocusTimer(store);
      focusTimer.init();

      this.initRouter();
      this.bindEvents();
      this.renderDashboard();
      this.initScrollAnimations();
    },

    /* ---------- ROUTER ---------- */

    initRouter() {
      window.addEventListener('hashchange', () => this.handleRoute());
      // Set default route
      if (!window.location.hash || window.location.hash === '#') {
        window.location.hash = '#dashboard';
      } else {
        this.handleRoute();
      }
    },

    handleRoute() {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      const validPages = ['dashboard', 'goals', 'habits', 'journal', 'analytics', 'focus', 'settings'];
      const page = validPages.includes(hash) ? hash : 'dashboard';

      // Hide all pages
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

      // Show target page
      const targetPage = document.getElementById('page-' + page);
      if (targetPage) targetPage.classList.add('active');

      // Update nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === page);
      });

      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebar-overlay').classList.remove('active');
      document.getElementById('menu-toggle').classList.remove('active');

      // Page-specific render
      switch (page) {
        case 'dashboard': this.renderDashboard(); break;
        case 'goals': this.renderGoals(); break;
        case 'habits': this.renderHabits(); break;
        case 'journal': this.renderJournalEntries(); break;
        case 'analytics': this.renderAnalytics(); break;
        case 'focus': this.renderFocusHistory(); break;
        case 'settings': this.renderSettings(); break;
      }
    },

    /* ---------- EVENT BINDING ---------- */

    bindEvents() {
      const self = this;

      // Navigation (event delegation)
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const page = this.dataset.page;
          if (page) window.location.hash = '#' + page;
        });
      });

      // Mobile menu toggle
      document.getElementById('menu-toggle').addEventListener('click', function() {
        this.classList.toggle('active');
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebar-overlay').classList.toggle('active');
      });

      document.getElementById('sidebar-overlay').addEventListener('click', function() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebar-overlay').classList.remove('active');
        document.getElementById('menu-toggle').classList.remove('active');
      });

      // Theme toggles
      document.getElementById('sidebar-theme-toggle').addEventListener('click', () => themeManager.toggleTheme());
      document.getElementById('mobile-theme-toggle').addEventListener('click', () => themeManager.toggleTheme());
      document.getElementById('btn-theme-toggle').addEventListener('click', () => themeManager.toggleTheme());

      // Quick Add
      document.getElementById('btn-quick-add').addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleQuickAdd();
      });

      document.addEventListener('click', (e) => {
        if (quickAddOpen && !e.target.closest('.quick-add-dropdown') && !e.target.closest('#btn-quick-add')) {
          this.closeQuickAdd();
        }
      });

      // Mood selector on dashboard
      document.getElementById('dashboard-mood-selector').addEventListener('click', (e) => {
        const btn = e.target.closest('.mood-btn');
        if (!btn) return;
        const mood = parseInt(btn.dataset.mood);
        this.logMood(mood);
        document.querySelectorAll('#dashboard-mood-selector .mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      // Journal editor mood selector
      document.getElementById('journal-editor-mood').addEventListener('click', (e) => {
        const btn = e.target.closest('.mood-btn');
        if (!btn) return;
        document.querySelectorAll('#journal-editor-mood .mood-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });

      // Quote refresh
      document.getElementById('btn-refresh-quote').addEventListener('click', () => this.renderQuote());

      // Goals filter tabs
      document.getElementById('goals-filter-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;
        document.querySelectorAll('#goals-filter-tabs .filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentGoalsFilter = tab.dataset.filter;
        self.renderGoals();
      });

      // Add goal button
      document.getElementById('btn-add-goal').addEventListener('click', () => this.openGoalModal());

      // Goals list delegation (edit/delete/update progress)
      document.getElementById('goals-list').addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const card = btn.closest('.goal-card');
        if (!card) return;
        const id = card.dataset.id;
        if (btn.classList.contains('btn-goal-edit')) {
          self.editGoal(id);
        } else if (btn.classList.contains('btn-goal-delete')) {
          self.deleteGoal(id);
        } else if (btn.classList.contains('btn-goal-increment')) {
          self.incrementGoalProgress(id);
        }
      });

      // Add habit button
      document.getElementById('btn-add-habit').addEventListener('click', () => this.openHabitModal());

      // Week navigation
      document.getElementById('btn-prev-week').addEventListener('click', () => {
        habitsWeekOffset--;
        self.renderHabits();
      });
      document.getElementById('btn-next-week').addEventListener('click', () => {
        habitsWeekOffset++;
        self.renderHabits();
      });

      // Habits grid delegation
      document.getElementById('habits-grid').addEventListener('click', (e) => {
        const dayBtn = e.target.closest('.habit-day');
        if (dayBtn) {
          const row = dayBtn.closest('.habit-row');
          if (row) {
            self.toggleHabitDay(row.dataset.id, dayBtn.dataset.date);
          }
          return;
        }
        const delBtn = e.target.closest('.btn-habit-delete');
        if (delBtn) {
          const row = delBtn.closest('.habit-row');
          if (row) self.deleteHabit(row.dataset.id);
        }
      });

      // Dashboard habits list delegation
      document.getElementById('habits-today-list').addEventListener('click', (e) => {
        const toggleBtn = e.target.closest('.habit-toggle-btn');
        if (toggleBtn) {
          const id = toggleBtn.dataset.id;
          self.toggleHabitDay(id, getToday());
          self.renderDashboardHabits();
        }
      });

      // Journal
      document.getElementById('btn-new-entry').addEventListener('click', () => this.openJournalEditor());
      document.getElementById('btn-save-entry').addEventListener('click', () => this.saveJournalEntry());
      document.getElementById('btn-cancel-entry').addEventListener('click', () => this.closeJournalEditor());
      document.getElementById('journal-editor-content').addEventListener('input', debounce(function() {
        const text = document.getElementById('journal-editor-content').value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        document.getElementById('journal-word-count').textContent = words;
      }, 200));

      // Journal entries list delegation
      document.getElementById('journal-entries-list').addEventListener('click', (e) => {
        const card = e.target.closest('.journal-entry-card');
        if (!card) return;
        const delBtn = e.target.closest('.btn-journal-delete');
        if (delBtn) {
          e.stopPropagation();
          self.deleteJournalEntry(card.dataset.id);
          return;
        }
        self.openJournalEditor(card.dataset.id);
      });

      // Analytics range tabs
      document.getElementById('analytics-range-tabs').addEventListener('click', (e) => {
        const tab = e.target.closest('.filter-tab');
        if (!tab) return;
        document.querySelectorAll('#analytics-range-tabs .filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentAnalyticsPeriod = tab.dataset.range;
        self.renderAnalytics();
      });

      // Focus timer
      document.getElementById('btn-timer-start').addEventListener('click', () => focusTimer.start());
      document.getElementById('btn-timer-pause').addEventListener('click', () => focusTimer.pause());
      document.getElementById('btn-timer-reset').addEventListener('click', () => focusTimer.reset());

      // Settings
      document.getElementById('settings-name').addEventListener('change', debounce(function() {
        const name = document.getElementById('settings-name').value.trim();
        themeManager.updateName(name);
      }, 300));

      document.getElementById('settings-name').addEventListener('input', debounce(function() {
        const name = document.getElementById('settings-name').value.trim();
        themeManager.updateName(name);
      }, 500));

      // Accent color picker
      document.getElementById('accent-color-picker').addEventListener('click', (e) => {
        const swatch = e.target.closest('.color-swatch');
        if (!swatch) return;
        themeManager.applyAccent(swatch.dataset.color);
      });

      // Export data
      document.getElementById('btn-export-data').addEventListener('click', () => this.exportData());

      // Import data
      document.getElementById('btn-import-data').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
      });
      document.getElementById('import-file-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
          const success = store.importAll(ev.target.result);
          if (success) {
            modalManager.openModal('Import Successful', '<p>Your data has been imported successfully. The page will reload.</p>', () => {
              window.location.reload();
            });
          } else {
            modalManager.openModal('Import Failed', '<p>Could not parse the file. Please ensure it is a valid LifeOS JSON export.</p>');
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });

      // Clear data
      document.getElementById('btn-clear-data').addEventListener('click', () => {
        modalManager.openModal(
          'Clear All Data',
          '<p>Are you sure you want to delete all your data? This action cannot be undone.</p>',
          () => {
            store.clearAll();
            window.location.reload();
          }
        );
      });

      // Keyboard shortcut - Escape closes modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (document.getElementById('modal-overlay').classList.contains('active')) {
            modalManager.closeModal();
          }
          if (quickAddOpen) {
            self.closeQuickAdd();
          }
        }
      });
    },

    /* ---------- QUICK ADD ---------- */

    toggleQuickAdd() {
      let dd = document.querySelector('.quick-add-dropdown');
      if (dd) {
        dd.classList.toggle('active');
        quickAddOpen = dd.classList.contains('active');
        return;
      }
      this.createQuickAddDropdown();
    },

    createQuickAddDropdown() {
      const btn = document.getElementById('btn-quick-add');
      btn.style.position = 'relative';
      const dd = document.createElement('div');
      dd.className = 'quick-add-dropdown active';
      dd.innerHTML = `
        <button class="quick-add-item" data-action="goal">\n          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          New Goal
        </button>
        <button class="quick-add-item" data-action="habit">\n          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
          New Habit
        </button>
        <button class="quick-add-item" data-action="journal">\n          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
          New Journal Entry
        </button>
        <button class="quick-add-item" data-action="focus">\n          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          Start Focus Session
        </button>
      `;
      btn.appendChild(dd);
      quickAddOpen = true;

      dd.addEventListener('click', (e) => {
        const item = e.target.closest('.quick-add-item');
        if (!item) return;
        const action = item.dataset.action;
        this.closeQuickAdd();
        switch (action) {
          case 'goal': window.location.hash = '#goals'; setTimeout(() => this.openGoalModal(), 100); break;
          case 'habit': window.location.hash = '#habits'; setTimeout(() => this.openHabitModal(), 100); break;
          case 'journal': window.location.hash = '#journal'; setTimeout(() => this.openJournalEditor(), 100); break;
          case 'focus': window.location.hash = '#focus'; break;
        }
      });
    },

    closeQuickAdd() {
      const dd = document.querySelector('.quick-add-dropdown');
      if (dd) dd.classList.remove('active');
      quickAddOpen = false;
    },

    /* ---------- MOOD ---------- */

    logMood(mood) {
      const moodLog = store.get('moodLog', []);
      const today = getToday();
      const existing = moodLog.findIndex(m => m.date === today);
      if (existing >= 0) {
        moodLog[existing].mood = mood;
      } else {
        moodLog.push({ date: today, mood: mood });
      }
      store.set('moodLog', moodLog);
      this.initMoodChart();
    },

    /* ---------- DASHBOARD ---------- */

    renderDashboard() {
      this.updateGreeting();
      this.updateDateDisplay();
      this.updateStats();
      this.renderDashboardHabits();
      this.renderDashboardGoals();
      this.renderQuote();
      this.initMoodChart();
      this.renderRecentJournal();
      this.updateDashboardMoodSelector();
    },

    updateGreeting() {
      const settings = themeManager.getSettings();
      const greeting = getGreeting();
      document.getElementById('dashboard-greeting').textContent = greeting + ', ' + settings.name;
    },

    updateDateDisplay() {
      const now = new Date();
      const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      document.getElementById('dashboard-date').textContent = now.toLocaleDateString('en-US', options);
    },

    updateDashboardMoodSelector() {
      const moodLog = store.get('moodLog', []);
      const today = getToday();
      const todayEntry = moodLog.find(m => m.date === today);
      document.querySelectorAll('#dashboard-mood-selector .mood-btn').forEach(btn => {
        btn.classList.toggle('active', todayEntry && parseInt(btn.dataset.mood) === todayEntry.mood);
      });
    },

    updateStats() {
      const goals = store.get('goals', []);
      const habits = store.get('habits', []);
      const journal = store.get('journal', []);
      const today = getToday();

      // Active goals (not completed)
      const activeGoals = goals.filter(g => !g.completedAt).length;
      this.animateValue('stat-active-goals-value', activeGoals);

      // Today's habit %
      let habitPercent = 0;
      if (habits.length > 0) {
        const completedToday = habits.filter(h => h.completions && h.completions[today]).length;
        habitPercent = Math.round((completedToday / habits.length) * 100);
      }
      this.animateValue('stat-habits-today-value', habitPercent + '%');

      // Best streak
      let bestStreak = 0;
      habits.forEach(h => {
        const s = calculateStreak(h.completions);
        if (s > bestStreak) bestStreak = s;
      });
      this.animateValue('stat-best-streak-value', bestStreak + ' day' + (bestStreak !== 1 ? 's' : ''));

      // Journal entries
      this.animateValue('stat-journal-entries-value', journal.length);

      // Stagger animation
      const cards = document.querySelectorAll('.stat-card');
      cards.forEach((card, i) => {
        card.classList.add('animate-in', 'stagger-' + (i + 1));
      });
    },

    animateValue(elementId, endVal) {
      const el = document.getElementById(elementId);
      if (!el) return;
      el.textContent = endVal;
    },

    renderDashboardHabits() {
      const habits = store.get('habits', []);
      const list = document.getElementById('habits-today-list');
      const today = getToday();

      if (habits.length === 0) {
        list.innerHTML = '<li class="empty-state">No habits for today. Add some in the Habits page!</li>';
        return;
      }

      let html = '';
      habits.forEach((habit, i) => {
        const done = habit.completions && habit.completions[today];
        html += `
          <li class="habit-item" style="animation-delay: ${i * 0.05}s">
            <button class="habit-toggle-btn" data-id="${habit.id}" style="display:flex;align-items:center;gap:12px;width:100%;padding:10px 0;border:none;background:none;cursor:pointer;color:var(--text-primary);font-family:inherit;text-align:left;">
              <span style="width:24px;height:24px;border-radius:6px;border:2px solid ${done ? 'var(--accent)' : 'var(--border-color)'};background:${done ? 'var(--accent)' : 'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s ease;">
                ${done ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
              </span>
              <span style="flex:1;font-size:14px;font-weight:500;${done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${this.escapeHtml(habit.name)}</span>
              ${done ? '<span style="font-size:11px;color:var(--accent);font-weight:600;">Done</span>' : ''}
            </button>
          </li>`;
      });
      list.innerHTML = html;
    },

    renderDashboardGoals() {
      const goals = store.get('goals', []);
      const list = document.getElementById('dashboard-active-goals-list');
      const activeGoals = goals.filter(g => !g.completedAt).slice(0, 3);

      if (activeGoals.length === 0) {
        list.innerHTML = '<li class="empty-state">No active goals. Set a new goal to get started!</li>';
        return;
      }

      let html = '';
      activeGoals.forEach((goal, i) => {
        const percent = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
        html += `
          <li class="goal-mini-card" style="animation-delay: ${i * 0.05}s; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:14px;font-weight:600;">${this.escapeHtml(goal.title)}</span>
              <span class="goal-category category-${goal.category}" style="font-size:10px;padding:2px 8px;">${this.capitalize(goal.category)}</span>
            </div>
            <div class="goal-progress-bar">
              <div class="goal-progress-fill" style="width: ${percent}%;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
              <span style="font-size:12px;color:var(--text-tertiary);">${goal.currentValue} / ${goal.targetValue} ${this.escapeHtml(goal.unit || '')}</span>
              <span class="goal-percent" style="font-size:12px;">${percent}%</span>
            </div>
          </li>`;
      });
      list.innerHTML = html;
    },

    renderQuote() {
      const quote = getRandomQuote();
      document.getElementById('dashboard-quote').textContent = '\u201C' + quote.text + '\u201D';
      document.getElementById('dashboard-quote-author').textContent = '- ' + quote.author;
    },

    initMoodChart() {
      const canvas = document.getElementById('dashboard-mood-chart');
      if (!canvas) return;
      if (moodChart) { moodChart.destroy(); moodChart = null; }

      const moodLog = store.get('moodLog', []);
      const labels = [];
      const data = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        labels.push(dayNames[d.getDay()]);
        const entry = moodLog.find(m => m.date === ds);
        data.push(entry ? entry.mood : null);
      }

      const accentColor = getCSSVar('--accent') || '#6366f1';
      const textColor = getCSSVar('--text-tertiary') || '#6b6b80';

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 200);
      gradient.addColorStop(0, accentColor + '40');
      gradient.addColorStop(1, accentColor + '05');

      moodChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            borderColor: accentColor,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointBackgroundColor: accentColor,
            pointBorderColor: accentColor,
            pointRadius: 4,
            pointHoverRadius: 6,
            spanGaps: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 11, family: 'Inter' } },
              border: { display: false }
            },
            y: {
              min: 0, max: 5,
              grid: { display: false },
              ticks: { color: textColor, font: { size: 11, family: 'Inter' }, stepSize: 1,
                callback: function(v) { return ['', '😞', '😐', '🙂', '😊', '🤩'][v] || ''; }
              },
              border: { display: false }
            }
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    },

    renderRecentJournal() {
      const journal = store.get('journal', []);
      const list = document.getElementById('dashboard-recent-journal');
      const recent = journal.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 3);

      if (recent.length === 0) {
        list.innerHTML = '<li class="empty-state">No journal entries yet. Start writing!</li>';
        return;
      }

      const moodEmojis = ['', '😞', '😐', '🙂', '😊', '🤩'];
      let html = '';
      recent.forEach(entry => {
        const preview = (entry.content || '').substring(0, 100) + ((entry.content || '').length > 100 ? '...' : '');
        html += `
          <li style="padding:10px 0;border-bottom:1px solid var(--border-color);cursor:pointer;" data-entry-id="${entry.id}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <span style="font-size:14px;font-weight:600;">${this.escapeHtml(entry.title)}</span>
              <span style="font-size:16px;">${entry.mood ? moodEmojis[entry.mood] : ''}</span>
            </div>
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(preview)}</p>
            <span style="font-size:11px;color:var(--text-tertiary);">${formatDateShort(entry.createdAt)}</span>
          </li>`;
      });
      list.innerHTML = html;

      // Click to open
      list.querySelectorAll('li[data-entry-id]').forEach(li => {
        li.addEventListener('click', () => {
          window.location.hash = '#journal';
          setTimeout(() => app.openJournalEditor(li.dataset.entryId), 100);
        });
      });
    },

    /* ---------- GOALS ---------- */

    renderGoals(filter) {
      const goals = store.get('goals', []);
      const list = document.getElementById('goals-list');
      const f = filter || currentGoalsFilter;

      const filtered = f === 'all' ? goals : goals.filter(g => g.category === f);
      const sorted = filtered.sort((a, b) => {
        if (a.completedAt && !b.completedAt) return 1;
        if (!a.completedAt && b.completedAt) return -1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      if (sorted.length === 0) {
        list.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
            <p>No goals yet. Create your first goal to start tracking progress!</p>
          </div>`;
        return;
      }

      let html = '';
      sorted.forEach((goal, i) => {
        const percent = goal.targetValue > 0 ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100)) : 0;
        const isCompleted = !!goal.completedAt;
        html += `
          <div class="goal-card animate-in" data-id="${goal.id}" style="animation-delay: ${i * 0.05}s;${isCompleted ? 'opacity:0.6;' : ''}">
            <div class="goal-card-top">
              <span class="goal-category category-${goal.category}">${this.capitalize(goal.category)}</span>
              <div class="goal-actions">
                <button class="btn-goal-edit" title="Edit goal" style="background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;color:var(--text-secondary);transition:all 0.15s ease;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-goal-delete" title="Delete goal" style="background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;color:var(--text-secondary);transition:all 0.15s ease;">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <div class="goal-title">${this.escapeHtml(goal.title)}</div>
            ${goal.deadline ? '<div class="goal-deadline">Deadline: ' + formatDate(goal.deadline) + '</div>' : ''}
            <div class="goal-progress-bar">
              <div class="goal-progress-fill" style="width: 0%;" data-target-width="${percent}%"></div>
            </div>
            <div class="goal-progress-info">
              <span class="goal-progress-text">${goal.currentValue} / ${goal.targetValue} ${this.escapeHtml(goal.unit || '')}</span>
              <span class="goal-percent">${percent}%</span>
            </div>
            ${!isCompleted ? '<button class="btn-goal-increment" style="margin-top:8px;background:var(--accent-bg);border:1px solid var(--accent);color:var(--accent);padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.15s ease;">+ Increment Progress</button>' : '<div style="margin-top:8px;font-size:12px;color:#10b981;font-weight:600;">✓ Completed</div>'}
          </div>`;
      });
      list.innerHTML = html;

      // Animate progress bars
      requestAnimationFrame(() => {
        list.querySelectorAll('.goal-progress-fill[data-target-width]').forEach(el => {
          el.style.width = el.dataset.targetWidth;
        });
      });
    },

    openGoalModal(editGoal) {
      const isEdit = !!editGoal;
      const title = isEdit ? 'Edit Goal' : 'New Goal';
      const g = editGoal || { title: '', description: '', category: 'personal', targetValue: '', currentValue: 0, unit: '', deadline: '' };

      const body = `
        <form id="goal-form">
          <div class="form-group">
            <label for="goal-title-input">Title</label>
            <input type="text" id="goal-title-input" placeholder="e.g. Run a marathon" value="${this.escapeHtml(g.title)}" required>
          </div>
          <div class="form-group">
            <label for="goal-desc-input">Description</label>
            <textarea id="goal-desc-input" placeholder="Describe your goal...">${this.escapeHtml(g.description || '')}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="goal-category-input">Category</label>
              <select id="goal-category-input">
                <option value="health" ${g.category === 'health' ? 'selected' : ''}>Health</option>
                <option value="career" ${g.category === 'career' ? 'selected' : ''}>Career</option>
                <option value="finance" ${g.category === 'finance' ? 'selected' : ''}>Finance</option>
                <option value="education" ${g.category === 'education' ? 'selected' : ''}>Education</option>
                <option value="relationships" ${g.category === 'relationships' ? 'selected' : ''}>Relationships</option>
                <option value="personal" ${g.category === 'personal' ? 'selected' : ''}>Personal</option>
              </select>
            </div>
            <div class="form-group">
              <label for="goal-unit-input">Unit</label>
              <input type="text" id="goal-unit-input" placeholder="e.g. km, books, $" value="${this.escapeHtml(g.unit || '')}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="goal-target-input">Target Value</label>
              <input type="number" id="goal-target-input" placeholder="100" value="${g.targetValue || ''}" min="1" required>
            </div>
            <div class="form-group">
              <label for="goal-current-input">Current Value</label>
              <input type="number" id="goal-current-input" placeholder="0" value="${g.currentValue || 0}" min="0">
            </div>
          </div>
          <div class="form-group">
            <label for="goal-deadline-input">Deadline (optional)</label>
            <input type="date" id="goal-deadline-input" value="${g.deadline || ''}">
          </div>
        </form>
      `;

      modalManager.openModal(title, body, () => {
        const titleVal = document.getElementById('goal-title-input').value.trim();
        if (!titleVal) return;
        const targetVal = parseFloat(document.getElementById('goal-target-input').value);
        if (!targetVal || targetVal <= 0) return;

        const goalData = {
          title: titleVal,
          description: document.getElementById('goal-desc-input').value.trim(),
          category: document.getElementById('goal-category-input').value,
          targetValue: targetVal,
          currentValue: parseFloat(document.getElementById('goal-current-input').value) || 0,
          unit: document.getElementById('goal-unit-input').value.trim(),
          deadline: document.getElementById('goal-deadline-input').value || null
        };

        if (isEdit) {
          goalData.id = editGoal.id;
          goalData.createdAt = editGoal.createdAt;
          goalData.completedAt = editGoal.completedAt;
          goalData.milestones = editGoal.milestones || [];
          goalData.color = editGoal.color || null;
          this.updateGoal(goalData);
        } else {
          this.addGoal(goalData);
        }
      });
    },

    addGoal(data) {
      const goals = store.get('goals', []);
      const goal = {
        id: generateId(),
        title: data.title,
        description: data.description,
        category: data.category,
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        unit: data.unit,
        deadline: data.deadline,
        milestones: [],
        color: null,
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      goals.push(goal);
      store.set('goals', goals);
      this.renderGoals();
    },

    updateGoal(goalData) {
      const goals = store.get('goals', []);
      const idx = goals.findIndex(g => g.id === goalData.id);
      if (idx >= 0) {
        goals[idx] = goalData;
        store.set('goals', goals);
        this.renderGoals();
      }
    },

    editGoal(id) {
      const goals = store.get('goals', []);
      const goal = goals.find(g => g.id === id);
      if (goal) this.openGoalModal(goal);
    },

    deleteGoal(id) {
      modalManager.openModal('Delete Goal', '<p>Are you sure you want to delete this goal? This cannot be undone.</p>', () => {
        const goals = store.get('goals', []).filter(g => g.id !== id);
        store.set('goals', goals);
        this.renderGoals();
      });
    },

    incrementGoalProgress(id) {
      const goals = store.get('goals', []);
      const goal = goals.find(g => g.id === id);
      if (!goal) return;
      const step = goal.targetValue >= 100 ? Math.max(1, Math.ceil(goal.targetValue / 100)) : 1;
      goal.currentValue = Math.min(goal.targetValue, goal.currentValue + step);
      if (goal.currentValue >= goal.targetValue && !goal.completedAt) {
        goal.completedAt = new Date().toISOString();
      }
      store.set('goals', goals);
      this.renderGoals();
    },

    /* ---------- HABITS ---------- */

    renderHabits() {
      const habits = store.get('habits', []);
      const grid = document.getElementById('habits-grid');
      const weekDates = getWeekDates(habitsWeekOffset);
      const today = getToday();
      const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      // Update week label
      const weekStart = new Date(weekDates[0] + 'T12:00:00');
      const weekEnd = new Date(weekDates[6] + 'T12:00:00');
      const label = habitsWeekOffset === 0 ? 'This Week' :
        formatDateShort(weekStart) + ' - ' + formatDateShort(weekEnd);
      document.getElementById('week-label').textContent = label;

      if (habits.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            <p>No habits tracked yet. Build consistency by adding your first habit!</p>
          </div>`;
        return;
      }

      let html = '';

      // Day headers
      html += '<div class="habit-row" style="padding:8px 20px;border-bottom:1px solid var(--border-color);">';
      html += '<div style="flex:1;min-width:0;"></div>';
      html += '<div class="habit-days">';
      weekDates.forEach((d, i) => {
        const isToday = d === today;
        html += `<div class="habit-day" style="cursor:default;border:none;font-weight:${isToday ? '700' : '500'};color:${isToday ? 'var(--accent)' : 'var(--text-tertiary)'};">${dayLabels[i]}</div>`;
      });
      html += '</div></div>';

      habits.forEach((habit, i) => {
        const streak = calculateStreak(habit.completions);
        html += `<div class="habit-row animate-in" data-id="${habit.id}" style="animation-delay: ${i * 0.05}s;">`;
        html += '<div class="habit-info">';
        html += `<div class="habit-name">${this.escapeHtml(habit.name)}</div>`;
        html += `<div class="habit-streak">🔥 <span>${streak} day${streak !== 1 ? 's' : ''}</span></div>`;
        html += '</div>';
        html += '<div class="habit-days">';
        weekDates.forEach(d => {
          const isToday = d === today;
          const done = habit.completions && habit.completions[d];
          const classes = ['habit-day'];
          if (done) classes.push('completed');
          if (isToday) classes.push('today');
          const dayNum = d.split('-')[2];
          html += `<button class="${classes.join(' ')}" data-date="${d}">${parseInt(dayNum)}</button>`;
        });
        html += '</div>';
        html += `<button class="btn-habit-delete" title="Delete habit" style="background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;color:var(--text-tertiary);transition:all 0.15s ease;flex-shrink:0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>`;
        html += '</div>';
      });

      grid.innerHTML = html;
    },

    openHabitModal() {
      const body = `
        <form id="habit-form">
          <div class="form-group">
            <label for="habit-name-input">Habit Name</label>
            <input type="text" id="habit-name-input" placeholder="e.g. Meditate" required>
          </div>
          <div class="form-group">
            <label for="habit-desc-input">Description (optional)</label>
            <input type="text" id="habit-desc-input" placeholder="A short description...">
          </div>
          <div class="form-group">
            <label for="habit-icon-input">Icon/Emoji (optional)</label>
            <input type="text" id="habit-icon-input" placeholder="e.g. 🧘" maxlength="4">
          </div>
        </form>
      `;

      modalManager.openModal('New Habit', body, () => {
        const name = document.getElementById('habit-name-input').value.trim();
        if (!name) return;
        this.addHabit({
          name: name,
          description: document.getElementById('habit-desc-input').value.trim(),
          icon: document.getElementById('habit-icon-input').value.trim() || '✓'
        });
      });
    },

    addHabit(data) {
      const habits = store.get('habits', []);
      habits.push({
        id: generateId(),
        name: data.name,
        description: data.description || '',
        icon: data.icon || '✓',
        frequency: 'daily',
        completions: {},
        color: null,
        createdAt: new Date().toISOString()
      });
      store.set('habits', habits);
      this.renderHabits();
    },

    deleteHabit(id) {
      modalManager.openModal('Delete Habit', '<p>Are you sure you want to delete this habit? All tracking data will be lost.</p>', () => {
        const habits = store.get('habits', []).filter(h => h.id !== id);
        store.set('habits', habits);
        this.renderHabits();
      });
    },

    toggleHabitDay(habitId, dateStr) {
      const habits = store.get('habits', []);
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;
      if (!habit.completions) habit.completions = {};
      if (habit.completions[dateStr]) {
        delete habit.completions[dateStr];
      } else {
        habit.completions[dateStr] = true;
      }
      store.set('habits', habits);
      this.renderHabits();
    },

    /* ---------- JOURNAL ---------- */

    renderJournalEntries() {
      const journal = store.get('journal', []);
      const list = document.getElementById('journal-entries-list');
      const sorted = journal.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));

      if (sorted.length === 0) {
        list.innerHTML = `
          <div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
            <p>Your journal is empty. Start writing to capture your thoughts!</p>
          </div>`;
        return;
      }

      const moodEmojis = ['', '😞', '😐', '🙂', '😊', '🤩'];
      let html = '';
      sorted.forEach((entry, i) => {
        const preview = (entry.content || '').substring(0, 100) + ((entry.content || '').length > 100 ? '...' : '');
        const wordCount = (entry.content || '').trim() ? entry.content.trim().split(/\s+/).length : 0;
        const tags = (entry.tags || []).map(t => '<span class="tag">' + this.escapeHtml(t) + '</span>').join('');
        html += `
          <div class="journal-entry-card animate-in" data-id="${entry.id}" style="animation-delay: ${i * 0.05}s;">
            <div class="journal-entry-title">${this.escapeHtml(entry.title || 'Untitled')}</div>
            <div class="journal-entry-preview">${this.escapeHtml(preview)}</div>
            <div class="journal-entry-meta">
              <span>${formatDateShort(entry.createdAt)} · ${wordCount} words${entry.mood ? ' · ' + moodEmojis[entry.mood] : ''}</span>
              <button class="btn-journal-delete" style="background:none;border:none;cursor:pointer;color:var(--text-tertiary);padding:2px 4px;border-radius:4px;transition:color 0.15s ease;" title="Delete entry">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              </button>
            </div>
            ${tags ? '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">' + tags + '</div>' : ''}
          </div>`;
      });
      list.innerHTML = html;
    },

    openJournalEditor(entryId) {
      const editor = document.getElementById('journal-editor');
      const list = document.getElementById('journal-entries-list');
      editor.style.display = 'flex';
      list.style.display = 'none';
      editingJournalId = entryId || null;

      // Reset fields
      document.getElementById('journal-editor-title').value = '';
      document.getElementById('journal-editor-content').value = '';
      document.getElementById('journal-editor-tags').value = '';
      document.getElementById('journal-word-count').textContent = '0';
      document.querySelectorAll('#journal-editor-mood .mood-btn').forEach(b => b.classList.remove('active'));

      if (entryId) {
        const journal = store.get('journal', []);
        const entry = journal.find(e => e.id === entryId);
        if (entry) {
          document.getElementById('journal-editor-title').value = entry.title || '';
          document.getElementById('journal-editor-content').value = entry.content || '';
          document.getElementById('journal-editor-tags').value = (entry.tags || []).join(', ');
          if (entry.mood) {
            const moodBtn = document.querySelector(`#journal-editor-mood .mood-btn[data-mood="${entry.mood}"]`);
            if (moodBtn) moodBtn.classList.add('active');
          }
          const wordCount = (entry.content || '').trim() ? entry.content.trim().split(/\s+/).length : 0;
          document.getElementById('journal-word-count').textContent = wordCount;
        }
      }
    },

    closeJournalEditor() {
      const editor = document.getElementById('journal-editor');
      const list = document.getElementById('journal-entries-list');
      editor.style.display = 'none';
      list.style.display = 'flex';
      editingJournalId = null;
    },

    saveJournalEntry() {
      const title = document.getElementById('journal-editor-title').value.trim();
      if (!title) {
        document.getElementById('journal-editor-title').focus();
        return;
      }

      const content = document.getElementById('journal-editor-content').value;
      const tagsRaw = document.getElementById('journal-editor-tags').value;
      const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t.length > 0);
      const activeMoodBtn = document.querySelector('#journal-editor-mood .mood-btn.active');
      const mood = activeMoodBtn ? parseInt(activeMoodBtn.dataset.mood) : null;

      const journal = store.get('journal', []);

      if (editingJournalId) {
        const idx = journal.findIndex(e => e.id === editingJournalId);
        if (idx >= 0) {
          journal[idx].title = title;
          journal[idx].content = content;
          journal[idx].tags = tags;
          journal[idx].mood = mood;
          journal[idx].updatedAt = new Date().toISOString();
        }
      } else {
        journal.push({
          id: generateId(),
          title: title,
          content: content,
          mood: mood,
          tags: tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      store.set('journal', journal);
      this.closeJournalEditor();
      this.renderJournalEntries();
    },

    deleteJournalEntry(id) {
      modalManager.openModal('Delete Entry', '<p>Are you sure you want to delete this journal entry?</p>', () => {
        const journal = store.get('journal', []).filter(e => e.id !== id);
        store.set('journal', journal);
        this.renderJournalEntries();
      });
    },

    /* ---------- ANALYTICS ---------- */

    renderAnalytics(period) {
      const p = period || currentAnalyticsPeriod;
      this.renderGoalsChart(p);
      this.renderHabitConsistencyChart(p);
      this.renderMoodTrendChart(p);
      this.renderCategoryChart();
    },

    getPeriodDates(period) {
      const dates = [];
      const today = new Date();
      let days;
      switch (period) {
        case 'week': days = 7; break;
        case 'month': days = 30; break;
        case 'year': days = 365; break;
        default: days = 7;
      }
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        dates.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
      }
      return dates;
    },

    renderGoalsChart(period) {
      const canvas = document.getElementById('chart-goals-progress');
      if (!canvas) return;
      if (analyticsCharts.goals) { analyticsCharts.goals.destroy(); analyticsCharts.goals = null; }

      const goals = store.get('goals', []);
      const accentColor = getCSSVar('--accent') || '#6366f1';
      const textColor = getCSSVar('--text-tertiary') || '#6b6b80';
      const cardBg = getCSSVar('--bg-card') || '#161620';

      const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7', '#14b8a6'];

      if (goals.length === 0) {
        analyticsCharts.goals = new Chart(canvas.getContext('2d'), {
          type: 'bar',
          data: { labels: ['No goals'], datasets: [{ data: [0], backgroundColor: accentColor + '40' }] },
          options: this._chartOptions(textColor)
        });
        return;
      }

      const labels = goals.map(g => g.title.length > 20 ? g.title.substring(0, 20) + '...' : g.title);
      const data = goals.map(g => g.targetValue > 0 ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0);
      const bgColors = goals.map((_, i) => colors[i % colors.length] + '80');
      const borderColors = goals.map((_, i) => colors[i % colors.length]);

      analyticsCharts.goals = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Progress %',
            data: data,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: this._chartOptions(textColor, true)
      });
    },

    renderHabitConsistencyChart(period) {
      const canvas = document.getElementById('chart-habit-consistency');
      if (!canvas) return;
      if (analyticsCharts.habits) { analyticsCharts.habits.destroy(); analyticsCharts.habits = null; }

      const habits = store.get('habits', []);
      const dates = this.getPeriodDates(period);
      const accentColor = getCSSVar('--accent') || '#6366f1';
      const textColor = getCSSVar('--text-tertiary') || '#6b6b80';

      const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#0ea5e9', '#ef4444', '#a855f7', '#14b8a6'];

      if (habits.length === 0) {
        analyticsCharts.habits = new Chart(canvas.getContext('2d'), {
          type: 'bar',
          data: { labels: ['No habits'], datasets: [{ data: [0], backgroundColor: accentColor + '40' }] },
          options: this._chartOptions(textColor)
        });
        return;
      }

      const labels = habits.map(h => h.name.length > 15 ? h.name.substring(0, 15) + '...' : h.name);
      const data = habits.map(h => {
        const completed = dates.filter(d => h.completions && h.completions[d]).length;
        return Math.round((completed / dates.length) * 100);
      });
      const bgColors = habits.map((_, i) => colors[i % colors.length] + '80');
      const borderColors = habits.map((_, i) => colors[i % colors.length]);

      analyticsCharts.habits = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Consistency %',
            data: data,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: this._chartOptions(textColor, true)
      });
    },

    renderMoodTrendChart(period) {
      const canvas = document.getElementById('chart-mood-trend');
      if (!canvas) return;
      if (analyticsCharts.mood) { analyticsCharts.mood.destroy(); analyticsCharts.mood = null; }

      const moodLog = store.get('moodLog', []);
      const dates = this.getPeriodDates(period);
      const accentColor = getCSSVar('--accent') || '#6366f1';
      const textColor = getCSSVar('--text-tertiary') || '#6b6b80';

      const labels = [];
      const data = [];

      // For readability, limit label density
      const step = period === 'year' ? 7 : period === 'month' ? 3 : 1;

      dates.forEach((d, i) => {
        const dateObj = new Date(d + 'T12:00:00');
        if (i % step === 0) {
          labels.push(period === 'year'
            ? dateObj.toLocaleDateString('en-US', { month: 'short' })
            : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        } else {
          labels.push('');
        }
        const entry = moodLog.find(m => m.date === d);
        data.push(entry ? entry.mood : null);
      });

      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 220);
      gradient.addColorStop(0, accentColor + '40');
      gradient.addColorStop(1, accentColor + '05');

      analyticsCharts.mood = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Mood',
            data: data,
            borderColor: accentColor,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2.5,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: accentColor,
            spanGaps: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 10, family: 'Inter' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 10 },
              border: { display: false }
            },
            y: {
              min: 0, max: 5,
              grid: { display: false },
              ticks: { color: textColor, font: { size: 10, family: 'Inter' }, stepSize: 1 },
              border: { display: false }
            }
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    },

    renderCategoryChart() {
      const canvas = document.getElementById('chart-category-breakdown');
      if (!canvas) return;
      if (analyticsCharts.category) { analyticsCharts.category.destroy(); analyticsCharts.category = null; }

      const goals = store.get('goals', []);
      const textColor = getCSSVar('--text-tertiary') || '#6b6b80';

      const catColors = {
        health: '#10b981',
        career: '#6366f1',
        finance: '#f59e0b',
        education: '#0ea5e9',
        relationships: '#ec4899',
        personal: '#a855f7'
      };

      const catCounts = {};
      goals.forEach(g => {
        catCounts[g.category] = (catCounts[g.category] || 0) + 1;
      });

      const labels = Object.keys(catCounts).map(k => this.capitalize(k));
      const data = Object.values(catCounts);
      const bgColors = Object.keys(catCounts).map(k => catColors[k] || '#6366f1');

      if (labels.length === 0) {
        analyticsCharts.category = new Chart(canvas.getContext('2d'), {
          type: 'doughnut',
          data: { labels: ['No data'], datasets: [{ data: [1], backgroundColor: ['#333'] }] },
          options: this._chartOptions(textColor)
        });
        return;
      }

      analyticsCharts.category = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: bgColors,
            borderWidth: 0,
            hoverOffset: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor,
                font: { size: 12, family: 'Inter' },
                padding: 16,
                usePointStyle: true,
                pointStyleWidth: 10
              }
            }
          }
        }
      });
    },

    _chartOptions(textColor, showLegend) {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: !!showLegend, labels: { color: textColor, font: { size: 11, family: 'Inter' } } } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10, family: 'Inter' } },
            border: { display: false }
          },
          y: {
            grid: { display: false },
            ticks: { color: textColor, font: { size: 10, family: 'Inter' } },
            border: { display: false }
          }
        }
      };
    },

    /* ---------- FOCUS ---------- */

    renderFocusHistory() {
      const sessions = store.get('focusSessions', []);
      const historyList = document.getElementById('focus-session-history');
      const countEl = document.getElementById('completed-sessions-count');

      const today = getToday();
      const todaySessions = sessions.filter(s => {
        return s.completedAt && s.completedAt.startsWith(today);
      });
      const workSessions = todaySessions.filter(s => s.type === 'work');
      countEl.textContent = workSessions.length + ' session' + (workSessions.length !== 1 ? 's' : '') + ' completed today';

      const recent = sessions.slice(-10).reverse();

      if (recent.length === 0) {
        historyList.innerHTML = '<li class="empty-state">No focus sessions recorded yet.</li>';
        return;
      }

      let html = '';
      recent.forEach(s => {
        const date = new Date(s.completedAt);
        const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const dateStr = formatDateShort(s.completedAt);
        const mins = Math.round(s.duration / 60);
        const typeClass = s.type === 'work' ? 'work' : 'break';
        const typeLabel = s.type === 'work' ? 'Focus' : 'Break';
        html += `
          <li class="focus-session-item">
            <span><span class="focus-session-type ${typeClass}">${typeLabel}</span> ${mins} min</span>
            <span style="color:var(--text-tertiary);font-size:12px;">${dateStr}, ${timeStr}</span>
          </li>`;
      });
      historyList.innerHTML = html;
    },

    /* ---------- SETTINGS ---------- */

    renderSettings() {
      const settings = themeManager.getSettings();
      document.getElementById('settings-name').value = settings.name || '';
      // Update active color swatch
      document.querySelectorAll('.color-swatch').forEach(sw => {
        sw.classList.toggle('active', sw.dataset.color === settings.accentColor);
      });
    },

    exportData() {
      const json = store.exportAll();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lifeos-backup-' + getToday() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /* ---------- SCROLL ANIMATIONS ---------- */

    initScrollAnimations() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      document.querySelectorAll('.section-card').forEach(el => {
        observer.observe(el);
      });
    },

    /* ---------- HELPERS ---------- */

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    },

    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  };

  /* ============================================================
     BOOTSTRAP
     ============================================================ */

  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });

  /* ============================================================
     SERVICE WORKER
     ============================================================ */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }

})();
