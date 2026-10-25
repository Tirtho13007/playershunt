(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const STORAGE_KEYS = { wishlist: 'playershunt-wishlist-v1', waitlist: 'playershunt-waitlist-preview-v1' };
  const launchTime = new Date('2027-01-01T00:00:00+06:00').getTime();
  let activeFilter = 'all';
  let reverseSort = false;
  let toastTimer;
  let lastFocusedElement = null;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function getWishlist() {
    const items = readJSON(STORAGE_KEYS.wishlist, []);
    return Array.isArray(items) ? items.filter(item => item && typeof item.name === 'string') : [];
  }

  function updateCountdown() {
    const remaining = Math.max(0, launchTime - Date.now());
    const day = Math.floor(remaining / 86400000);
    const hour = Math.floor((remaining % 86400000) / 3600000);
    const minute = Math.floor((remaining % 3600000) / 60000);
    const second = Math.floor((remaining % 60000) / 1000);
    const set = (id, value) => { const node = document.getElementById(id); if (node) node.textContent = String(value).padStart(2, '0'); };
    set('days', day); set('hours', hour); set('minutes', minute); set('seconds', second);
    const wrapper = $('#countdown');
    if (wrapper && remaining === 0) wrapper.setAttribute('aria-label', 'PlayersHunt has launched');
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2800);
  }

  function updateWishlistUI() {
    const wishlist = getWishlist();
    const count = wishlist.length;
    ['wishlistCount', 'drawerCount', 'footerWishlistCount'].forEach(id => {
      const element = document.getElementById(id);
      if (!element) return;
      element.textContent = id === 'footerWishlistCount' ? `(${count})` : id === 'drawerCount' ? `(${count})` : String(count);
    });

    $$('.save-button').forEach(button => {
      const saved = wishlist.some(item => item.name === button.dataset.player);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', `${saved ? 'Remove' : 'Save'} ${button.dataset.player} ${saved ? 'from' : 'to'} wishlist`);
    });

    const list = $('#savedList');
    if (!list) return;
    if (!count) {
      list.innerHTML = '<div class="saved-empty"><span>♡</span><strong>Your shortlist starts here.</strong><p>Tap the heart on a player card to save a profile.</p><a href="#talent" id="browseTalent">Browse sample talent ↗</a></div>';
      return;
    }
    list.innerHTML = wishlist.map(item => `
      <div class="saved-item">
        <div class="saved-item-avatar" aria-hidden="true">${escapeHTML(item.initials || getInitials(item.name))}</div>
        <div class="saved-item-info"><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.role || 'Player')} · ${escapeHTML(item.region || 'Global')}</span></div>
        <button class="saved-item-remove" type="button" data-remove-saved="${escapeHTML(item.name)}" aria-label="Remove ${escapeHTML(item.name)} from wishlist">×</button>
      </div>`).join('');
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function getInitials(name) {
    return String(name).trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
  }

  function toggleWishlist(button) {
    const player = {
      name: button.dataset.player || 'Player',
      role: button.dataset.role || 'Player',
      region: button.dataset.region || 'Global',
      initials: getInitials(button.dataset.player || 'Player')
    };
    const items = getWishlist();
    const index = items.findIndex(item => item.name === player.name);
    if (index >= 0) {
      items.splice(index, 1);
      showToast(`${player.name} removed from your shortlist.`);
    } else {
      items.push(player);
      showToast(`${player.name} saved to your shortlist.`);
    }
    writeJSON(STORAGE_KEYS.wishlist, items);
    updateWishlistUI();
  }

  function openWishlist() {
    const drawer = $('#wishlistDrawer');
    const backdrop = $('#drawerBackdrop');
    if (!drawer || !backdrop) return;
    lastFocusedElement = document.activeElement;
    updateWishlistUI();
    backdrop.hidden = false;
    document.body.classList.add('no-scroll');
    drawer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => { drawer.classList.add('open'); $('#closeWishlist')?.focus(); });
  }

  function closeWishlist() {
    const drawer = $('#wishlistDrawer');
    const backdrop = $('#drawerBackdrop');
    if (!drawer || !backdrop) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    window.setTimeout(() => { backdrop.hidden = true; }, 300);
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }

  function filterPlayers() {
    const query = ($('#playerSearch')?.value || '').trim().toLowerCase();
    const cards = $$('.talent-card');
    let visible = 0;
    cards.forEach(card => {
      const fitsFilter = activeFilter === 'all' || card.dataset.position === activeFilter;
      const searchable = `${card.dataset.search || ''} ${card.textContent || ''}`.toLowerCase();
      const fitsQuery = !query || searchable.includes(query);
      const show = fitsFilter && fitsQuery;
      card.hidden = !show;
      if (show) visible++;
    });
    const empty = $('#emptyState');
    if (empty) empty.hidden = visible !== 0;
    const count = $(`.filter-button[data-filter="all"] span`);
    if (count) count.textContent = String(cards.filter(card => !card.hidden).length).padStart(2, '0');
  }

  function openProfile(name) {
    const modal = $('#profileModal');
    if (!modal) return;
    lastFocusedElement = document.activeElement;
    $('#profileModalTitle').textContent = `${name} — Preview`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    $('[data-close-modal]', modal)?.focus();
  }

  function closeProfile() {
    const modal = $('#profileModal');
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') lastFocusedElement.focus();
  }

  function setupNavigation() {
    const toggle = $('#menuToggle');
    const nav = $('#mainNav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      toggle.setAttribute('aria-label', expanded ? 'Open navigation menu' : 'Close navigation menu');
      nav.classList.toggle('open', !expanded);
    });
    $$('a', nav).forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation menu');
    }));

    const sectionLinks = $$('.main-nav a');
    if ('IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          sectionLinks.forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
        });
      }, { rootMargin: '-35% 0px -55% 0px' });
      sectionLinks.forEach(link => {
        const section = $(link.hash);
        if (section) sectionObserver.observe(section);
      });
    }
  }

  function setupReveal() {
    const nodes = $$('.reveal');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      nodes.forEach(node => node.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
    nodes.forEach(node => observer.observe(node));
  }

  function setupWaitlist() {
    const form = $('#waitlistForm');
    const input = $('#emailAddress');
    const error = $('#formError');
    const success = $('#formSuccess');
    if (!form || !input || !error || !success) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      error.textContent = '';
      success.hidden = true;
      const email = input.value.trim();
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!valid) {
        error.textContent = 'Enter a valid email address to continue.';
        input.setAttribute('aria-invalid', 'true');
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      const existing = readJSON(STORAGE_KEYS.waitlist, []);
      const list = Array.isArray(existing) ? existing : [];
      if (list.some(item => item.email === email)) {
        error.textContent = 'This email is already saved in this browser preview.';
        return;
      }
      list.push({ email, savedAt: new Date().toISOString() });
      const saved = writeJSON(STORAGE_KEYS.waitlist, list);
      if (!saved) {
        error.textContent = 'Your browser blocked local saving. Please check storage settings and try again.';
        return;
      }
      input.value = '';
      success.hidden = false;
      showToast('Saved in this browser preview.');
    });
    input.addEventListener('input', () => { error.textContent = ''; input.removeAttribute('aria-invalid'); });
  }

  function setupEvents() {
    $('#openWishlist')?.addEventListener('click', openWishlist);
    $('#closeWishlist')?.addEventListener('click', closeWishlist);
    $('#drawerBackdrop')?.addEventListener('click', closeWishlist);
    $('#footerWishlist')?.addEventListener('click', openWishlist);
    $('#clearWishlist')?.addEventListener('click', () => {
      writeJSON(STORAGE_KEYS.wishlist, []);
      updateWishlistUI();
      showToast('Your shortlist has been cleared.');
    });
    $('#savedList')?.addEventListener('click', event => {
      const removeButton = event.target.closest('[data-remove-saved]');
      if (removeButton) {
        const name = removeButton.dataset.removeSaved;
        writeJSON(STORAGE_KEYS.wishlist, getWishlist().filter(item => item.name !== name));
        updateWishlistUI();
        showToast(`${name} removed from your shortlist.`);
        return;
      }
      const browse = event.target.closest('#browseTalent');
      if (browse) closeWishlist();
    });
    $('#talentGrid')?.addEventListener('click', event => {
      const saveButton = event.target.closest('.save-button');
      if (saveButton) toggleWishlist(saveButton);
      const profileButton = event.target.closest('[data-profile]');
      if (profileButton) openProfile(profileButton.dataset.profile || 'Player');
    });
    $$('.filter-button').forEach(button => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter || 'all';
      $$('.filter-button').forEach(item => item.classList.toggle('active', item === button));
      filterPlayers();
    }));
    $('#playerSearch')?.addEventListener('input', filterPlayers);
    $('#clearSearch')?.addEventListener('click', () => {
      activeFilter = 'all';
      if ($('#playerSearch')) $('#playerSearch').value = '';
      $$('.filter-button').forEach(button => button.classList.toggle('active', button.dataset.filter === 'all'));
      filterPlayers();
    });
    $('#sortPlayers')?.addEventListener('click', () => {
      reverseSort = !reverseSort;
      const grid = $('#talentGrid');
      const cards = $$('.talent-card', grid);
      cards.reverse().forEach(card => grid.appendChild(card));
      $('#sortPlayers').firstChild.textContent = reverseSort ? 'Recent' : 'Featured';
      filterPlayers();
    });
    $('#profileModal')?.addEventListener('click', event => {
      if (event.target.closest('[data-close-modal]')) closeProfile();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if ($('#wishlistDrawer')?.classList.contains('open')) closeWishlist();
        if ($('#profileModal')?.classList.contains('open')) closeProfile();
        const nav = $('#mainNav');
        if (nav?.classList.contains('open')) {
          nav.classList.remove('open');
          $('#menuToggle')?.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  function setupImageFallbacks() {
    $$('img').forEach(img => {
      img.addEventListener('error', () => {
        img.style.display = 'none';
        const parent = img.parentElement;
        if (parent) parent.style.backgroundImage = 'linear-gradient(135deg,#182520,#101719 55%,#243b32)';
      }, { once: true });
    });
  }

  function init() {
    updateCountdown();
    window.setInterval(updateCountdown, 1000);
    setupNavigation();
    setupReveal();
    setupWaitlist();
    setupEvents();
    setupImageFallbacks();
    updateWishlistUI();
    filterPlayers();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
