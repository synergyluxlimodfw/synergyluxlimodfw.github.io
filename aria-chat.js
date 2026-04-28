/* ─────────────────────────────────────────────────────────
   Aria Chat Widget — Prestige by Synergy Lux
   Calls the Next.js API at the tablet app origin for streaming.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────
  var API_URL      = 'https://app.synergyluxlimodfw.com/api/aria';
  var SUPABASE_URL = 'https://axnzxbltlwgspptqcbhy.supabase.co';

  // ── State ────────────────────────────────────────────────
  var messages     = [];   // { role: 'user'|'assistant', content: string }[]
  var isStreaming  = false;
  var isOpen       = false;

  // ── DOM refs (set after inject) ──────────────────────────
  var launcher, chatWindow, messagesEl, inputEl, sendBtn;

  // ── Build HTML ───────────────────────────────────────────
  function buildWidget() {
    // Launcher
    launcher = document.createElement('button');
    launcher.id = 'aria-launcher';
    launcher.setAttribute('aria-label', 'Open Aria concierge chat');
    launcher.innerHTML =
      '<span class="aria-launcher-dot"></span>' +
      '<span class="aria-launcher-label">Ask Aria</span>';

    // Window
    chatWindow = document.createElement('div');
    chatWindow.id = 'aria-window';
    chatWindow.setAttribute('role', 'dialog');
    chatWindow.setAttribute('aria-label', 'Aria concierge chat');
    chatWindow.innerHTML =
      '<div id="aria-header">' +
        '<div class="aria-header-left">' +
          '<div class="aria-avatar">✦</div>' +
          '<div>' +
            '<div class="aria-header-name">Aria</div>' +
            '<div class="aria-header-sub">Prestige Concierge</div>' +
          '</div>' +
        '</div>' +
        '<button id="aria-close" aria-label="Close chat">✕</button>' +
      '</div>' +
      '<div id="aria-messages"></div>' +
      '<div id="aria-input-area">' +
        '<textarea id="aria-input" rows="1" placeholder="Message Aria…" aria-label="Message"></textarea>' +
        '<button id="aria-send" aria-label="Send">↑</button>' +
      '</div>';

    document.body.appendChild(launcher);
    document.body.appendChild(chatWindow);

    messagesEl = chatWindow.querySelector('#aria-messages');
    inputEl    = chatWindow.querySelector('#aria-input');
    sendBtn    = chatWindow.querySelector('#aria-send');

    // Events
    launcher.addEventListener('click', openChat);
    chatWindow.querySelector('#aria-close').addEventListener('click', closeChat);
    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    });
    // Auto-resize textarea
    inputEl.addEventListener('input', function () {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });
  }

  // ── Open / Close ─────────────────────────────────────────
  function openChat() {
    isOpen = true;
    launcher.classList.add('aria-open');
    chatWindow.classList.add('aria-open');
    inputEl.focus();

    // Send opening message exactly once
    if (messages.length === 0) {
      pushAssistantMessage(
        'Good day. I\'m Amirah, your Synergy Lux concierge.\nGet an instant quote — where are you heading and when?'
      );
    }
  }

  function closeChat() {
    isOpen = false;
    chatWindow.classList.remove('aria-open');
    launcher.classList.remove('aria-open');
  }

  // ── Render helpers ────────────────────────────────────────
  function pushAssistantMessage(text) {
    messages.push({ role: 'assistant', content: text });
    var el = document.createElement('div');
    el.className = 'aria-msg aria-assistant';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollBottom();
    return el;
  }

  function pushUserMessage(text) {
    messages.push({ role: 'user', content: text });
    var el = document.createElement('div');
    el.className = 'aria-msg aria-user';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollBottom();
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'aria-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    el.id = 'aria-typing-indicator';
    messagesEl.appendChild(el);
    scrollBottom();
    return el;
  }

  function removeTyping() {
    var el = document.getElementById('aria-typing-indicator');
    if (el) el.remove();
  }

  function scrollBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setInputLocked(locked) {
    isStreaming = locked;
    inputEl.disabled = locked;
    sendBtn.disabled = locked;
  }

  // ── Show booking confirmation card ────────────────────────
  function showConfirmCard(booking) {
    var card = document.createElement('div');
    card.className = 'aria-confirm-card';
    card.innerHTML =
      '<h4>✦ Reservation Confirmed</h4>' +
      '<p><strong>Name:</strong> ' + esc(booking.name || '—') + '</p>' +
      '<p><strong>Pickup:</strong> ' + esc(booking.pickup || '—') + '</p>' +
      '<p><strong>Destination:</strong> ' + esc(booking.destination || '—') + '</p>' +
      '<p><strong>Date:</strong> ' + esc(booking.date || '—') + '</p>' +
      '<p><strong>Time:</strong> ' + esc(booking.time || '—') + '</p>' +
      (booking.service ? '<p><strong>Service:</strong> ' + esc(booking.service) + '</p>' : '') +
      '<p style="margin-top:10px;font-size:11px;color:rgba(201,168,76,0.6);">A payment link will be sent to confirm your reservation.</p>';
    messagesEl.appendChild(card);
    scrollBottom();
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Save booking to Supabase ──────────────────────────────
  function saveBookingToSupabase(booking) {
    // Read the anon key from the page's meta tag or fall back to env baked in at build.
    // For GitHub Pages we embed it directly here (public anon key — safe to expose).
    var anonKey = (window.__SUPABASE_ANON_KEY) ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bnp4Ymx0bHdnc3BwdHFjYmh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2MTc3ODUsImV4cCI6MjA1OTE5Mzc4NX0.6J7-HrWL4rHSVdT6kGADIUFpZ0Yw9HmFW2fmRf1Ol40';

    fetch(SUPABASE_URL + '/rest/v1/bookings_calendar', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Prefer':        'return=minimal',
      },
      body: JSON.stringify({
        guest_name:  booking.name        || null,
        pickup:      booking.pickup      || null,
        destination: booking.destination || null,
        date:        booking.date        || null,
        time:        booking.time        || null,
        service:     booking.service     || null,
        phone:       booking.phone       || null,
        source:      'aria_chat',
      }),
    }).catch(function (err) {
      console.warn('[Aria] Supabase save failed:', err);
    });
  }

  // ── Send message ─────────────────────────────────────────
  function handleSend() {
    var text = inputEl.value.trim();
    if (!text || isStreaming) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    pushUserMessage(text);
    setInputLocked(true);
    showTyping();

    fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: messages }),
    })
    .then(function (res) {
      if (!res.ok) throw new Error('API error ' + res.status);
      return res.json();
    })
    .then(function (data) {
      removeTyping();

      if (data.type === 'booking_confirmation') {
        // Amirah has collected ride details — show her message + a summary card
        var confirmText = data.message || 'Here are your ride details — shall I reserve this?';
        pushAssistantMessage(confirmText);
        if (data.booking) { showConfirmCard(data.booking); }
      } else {
        // type: 'message', 'booking_confirmed', error fallback, or validation error
        var replyText = data.response || data.message || 'I apologize — something went wrong. Please try again.';
        pushAssistantMessage(replyText);
      }

      setInputLocked(false);
      inputEl.focus();
      scrollBottom();
    })
    .catch(function (err) {
      removeTyping();
      console.error('[Aria] Fetch error:', err);
      pushAssistantMessage('I apologize — something went wrong. Please try again.');
      setInputLocked(false);
      scrollBottom();
    });
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildWidget);
    } else {
      buildWidget();
    }
  }

  init();
})();
