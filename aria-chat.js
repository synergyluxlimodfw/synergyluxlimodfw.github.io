/* ─────────────────────────────────────────────────────────
   Aria Chat Widget — Prestige by Synergy Lux
   Calls the Next.js API at the tablet app origin for streaming.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────
  var API_URL = 'https://app.synergyluxlimodfw.com/api/aria';

  // ── State ────────────────────────────────────────────────
  var messages        = [];   // { role: 'user'|'assistant', content: string }[]
  var isStreaming     = false;
  var isOpen          = false;
  var pendingBooking  = null;  // BookingPayload waiting for user confirmation
  var confirmCardEl   = null;  // DOM node for the active confirm card

  // ── DOM refs (set after inject) ──────────────────────────
  var launcher, chatWindow, messagesEl, inputEl, sendBtn;

  // ── Build HTML ───────────────────────────────────────────
  function buildWidget() {
    // Launcher
    launcher = document.createElement('button');
    launcher.id = 'aria-launcher';
    launcher.setAttribute('aria-label', 'Open Amirah concierge chat');
    launcher.innerHTML =
      '<span class="aria-launcher-dot"></span>' +
      '<span class="aria-launcher-label">Ask Amirah</span>';

    // Window
    chatWindow = document.createElement('div');
    chatWindow.id = 'aria-window';
    chatWindow.setAttribute('role', 'dialog');
    chatWindow.setAttribute('aria-label', 'Amirah concierge chat');
    chatWindow.innerHTML =
      '<div id="aria-header">' +
        '<div class="aria-header-left">' +
          '<div class="aria-avatar">✦</div>' +
          '<div>' +
            '<div class="aria-header-name">Amirah</div>' +
            '<div class="aria-header-sub">Prestige Concierge</div>' +
          '</div>' +
        '</div>' +
        '<button id="aria-close" aria-label="Close chat">✕</button>' +
      '</div>' +
      '<div id="aria-messages"></div>' +
      '<div id="aria-input-area">' +
        '<textarea id="aria-input" rows="1" placeholder="Message Amirah…" aria-label="Message"></textarea>' +
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

  // ── Show booking confirmation card (with real Confirm button) ───
  function showConfirmCard(booking) {
    // Remove any pre-existing card
    if (confirmCardEl) { confirmCardEl.remove(); confirmCardEl = null; }

    var card = document.createElement('div');
    card.className = 'aria-confirm-card';
    card.innerHTML =
      '<h4>✦ Your Ride Details</h4>' +
      '<p><strong>Name:</strong> '        + esc(booking.name             || '—') + '</p>' +
      '<p><strong>Pickup:</strong> '      + esc(booking.pickup_location  || '—') + '</p>' +
      '<p><strong>Destination:</strong> ' + esc(booking.destination      || '—') + '</p>' +
      '<p><strong>Date:</strong> '        + esc(booking.date             || '—') + '</p>' +
      '<p><strong>Time:</strong> '        + esc(booking.time             || '—') + '</p>' +
      (booking.service ? '<p><strong>Service:</strong> ' + esc(booking.service) + '</p>' : '') +
      '<div class="aria-confirm-actions">' +
        '<button class="aria-btn-confirm">Confirm &amp; Reserve</button>' +
        '<button class="aria-btn-edit">Edit Details</button>' +
      '</div>';

    card.querySelector('.aria-btn-confirm').addEventListener('click', function () {
      handleConfirmBooking(card);
    });
    card.querySelector('.aria-btn-edit').addEventListener('click', function () {
      handleEditBooking(card);
    });

    messagesEl.appendChild(card);
    confirmCardEl = card;
    scrollBottom();
  }

  // ── Confirm booking — POST confirm:true to the API ────────
  function handleConfirmBooking(card) {
    if (!pendingBooking) return;

    var confirmBtn = card.querySelector('.aria-btn-confirm');
    var editBtn    = card.querySelector('.aria-btn-edit');
    confirmBtn.disabled = true;
    editBtn.disabled    = true;
    confirmBtn.textContent = 'Reserving…';

    fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ confirm: true, bookingData: pendingBooking }),
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      // Replace the action buttons with a success line
      var actionsEl = card.querySelector('.aria-confirm-actions');
      actionsEl.innerHTML =
        '<p style="color:#4ADE80;font-size:12px;margin:8px 0 0;">✓ You\'re all set. Mr. Rodriguez will take care of everything.</p>';

      pendingBooking = null;
      confirmCardEl  = null;

      // Add Amirah's confirmation message to the chat
      var reply = (data && data.response) || "You're all set. Mr. Rodriguez will take care of everything.";
      pushAssistantMessage(reply);
      setInputLocked(false);
      inputEl.focus();
      scrollBottom();
    })
    .catch(function (err) {
      console.error('[Aria] Confirm error:', err);
      confirmBtn.disabled    = false;
      editBtn.disabled       = false;
      confirmBtn.textContent = 'Confirm & Reserve';
      pushAssistantMessage('Something went wrong saving your booking. Please call us at (646) 879-1391.');
      setInputLocked(false);
      scrollBottom();
    });
  }

  // ── Edit — dismiss card and let user correct details ──────
  function handleEditBooking(card) {
    card.remove();
    confirmCardEl  = null;
    pendingBooking = null;
    pushAssistantMessage('Of course — what would you like to change?');
    setInputLocked(false);
    inputEl.focus();
    scrollBottom();
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
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
        // Amirah has collected ride details — show her message + interactive confirm card
        var confirmText = data.message || 'Here are your ride details — shall I reserve this?';
        pushAssistantMessage(confirmText);
        if (data.booking) {
          pendingBooking = data.booking;
          showConfirmCard(data.booking);
          // Keep input locked until user confirms or edits
        } else {
          setInputLocked(false);
          inputEl.focus();
        }
      } else {
        // type: 'message', 'booking_confirmed', error fallback, or validation error
        var replyText = data.response || data.message || 'I apologize — something went wrong. Please try again.';
        pushAssistantMessage(replyText);
        setInputLocked(false);
        inputEl.focus();
      }

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
