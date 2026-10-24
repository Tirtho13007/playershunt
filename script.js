(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const countdownNodes = {
    days: $('#days'), hours: $('#hours'), minutes: $('#minutes'), seconds: $('#seconds')
  };
  // Midnight in Bangladesh (UTC+06:00), January 1, 2027.
  const launchAt = new Date('2027-01-01T00:00:00+06:00').getTime();

  function updateCountdown() {
    const remaining = launchAt - Date.now();
    if (remaining <= 0) {
      Object.values(countdownNodes).forEach(node => { if (node) node.textContent = '00'; });
      const status = $('.countdown-status');
      if (status) status.innerHTML = '<i></i> WE ARE LIVE';
      const heading = $('.countdown-copy h2');
      if (heading) heading.innerHTML = 'The game is on.<br /><em>Welcome to PlayersHunt.</em>';
      return;
    }
    const totalSeconds = Math.floor(remaining / 1000);
    const values = {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
    Object.entries(values).forEach(([key, value]) => {
      if (countdownNodes[key]) countdownNodes[key].textContent = key === 'days' ? String(value).padStart(3, '0') : String(value).padStart(2, '0');
    });
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  // Animate sections as they enter the viewport; reveal content if IO is unavailable.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
    revealItems.forEach(el => observer.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('in-view'));
  }
  // Hero content is visible immediately to avoid a blank first paint.
  document.querySelectorAll('.hero .reveal').forEach((el, index) => {
    window.setTimeout(() => el.classList.add('in-view'), 80 + index * 110);
  });

  // Mobile navigation.
  const menuToggle = $('.menu-toggle');
  const nav = $('.nav-links');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
    }));
  }

  const form = $('#waitlist-form');
  const message = $('#form-message');
  const submitButton = form ? form.querySelector('button[type="submit"]') : null;
  function showMessage(text, type = 'success') {
    if (!message) return;
    message.textContent = text;
    message.classList.toggle('error', type === 'error');
  }
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      showMessage('');
      const emailInput = $('#email');
      const roleInput = $('#role');
      const honeypot = $('#website');
      const email = (emailInput?.value || '').trim().toLowerCase();
      const role = roleInput?.value || 'player';
      if (honeypot && honeypot.value.trim()) return; // Basic honeypot; not a complete anti-spam system.
      if (!emailInput || !emailInput.checkValidity() || email.length > 254) {
        showMessage('Please enter a valid email address.', 'error');
        emailInput?.focus();
        return;
      }

      const config = window.PLAYERSHUNT_CONFIG || {};
      const supabaseUrl = (config.supabaseUrl || '').trim().replace(/\/$/, '');
      const supabaseAnonKey = (config.supabaseAnonKey || '').trim();
      if (!supabaseUrl || !supabaseAnonKey) {
        showMessage('The waitlist form is ready, but signup is not connected yet. Add your Supabase URL and publishable key in config.js, then create the waitlist table using the included SQL.', 'error');
        return;
      }
      if (!/^https:\/\//i.test(supabaseUrl) || !supabaseUrl.includes('.supabase.co')) {
        showMessage('Please check the Supabase Project URL in config.js.', 'error');
        return;
      }

      const originalText = submitButton ? submitButton.innerHTML : '';
      if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Joining…'; }
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/launch_waitlist?on_conflict=email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Prefer': 'resolution=ignore-duplicates,return=minimal'
          },
          body: JSON.stringify({ email, role })
        });
        if (!response.ok) {
          const detail = await response.text().catch(() => '');
          console.error('Waitlist submit failed:', response.status, detail);
          if (response.status === 401 || response.status === 403) {
            throw new Error('Supabase rejected the request. Check the public key and waitlist table permissions.');
          }
          throw new Error('We could not save your signup right now. Please try again later.');
        }
        showMessage('You’re on the list. Thanks for being part of the PlayersHunt launch!');
        form.reset();
      } catch (error) {
        showMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.', 'error');
      } finally {
        if (submitButton) { submitButton.disabled = false; submitButton.innerHTML = originalText; }
      }
    });
  }
  const yearNode = $('#year');
  if (yearNode) yearNode.textContent = String(new Date().getFullYear());
})();
