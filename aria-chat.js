/* ─────────────────────────────────────────────────────────
   Aria Chat Widget — Prestige by Synergy Lux
   Calls the Next.js API at the tablet app origin for streaming.
   ───────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────
  var API_URL      = 'https://synergy-lux-tablet.vercel.app/api/aria';
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
        'Welcome to Prestige by Synergy Lux. What\'s the occasion for your ride?'
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

  // ── Send message + stream response ───────────────────────
  function handleSend() {
    var text = inputEl.value.trim();
    if (!text || isStreaming) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    pushUserMessage(text);
    setInputLocked(true);

    var typingEl = showTyping();
    var assistantText = '';
    var assistantEl   = null;
    var bookingHandled = false;

    fetch(API_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages: messages }),
    })
    .then(function (res) {
      if (!res.ok) throw new Error('API error ' + res.status);
      if (!res.body) throw new Error('No stream');

      removeTyping();

      // Create the assistant bubble for streaming text
      assistantEl = document.createElement('div');
      assistantEl.className = 'aria-msg aria-assistant';
      messagesEl.appendChild(assistantEl);

      var reader  = res.body.getReader();
      var decoder = new TextDecoder();

      function read() {
        return reader.read().then(function (chunk) {
          if (chunk.done) {
            // Finalize: push full message to history (excluding BOOKING_READY line)
            var displayText = assistantText
              .replace(/\nBOOKING_READY:\{.*\}/s, '')
              .replace(/BOOKING_READY:\{.*\}/s, '')
              .trim();

            messages.push({ role: 'assistant', content: displayText });
            assistantEl.textContent = displayText;

            // Parse BOOKING_READY if present and not already handled
            if (!bookingHandled) {
              var match = assistantText.match(/BOOKING_READY:(\{[\s\S]*?\})/);
              if (match) {
                bookingHandled = true;
                try {
                  var booking = JSON.parse(match[1]);
                  saveBookingToSupabase(booking);
                  showConfirmCard(booking);
                } catch (e) {
                  console.warn('[Aria] Failed to parse BOOKING_READY JSON:', e);
                }
              }
            }

            setInputLocked(false);
            inputEl.focus();
            scrollBottom();
            return;
          }

          var raw = decoder.decode(chunk.value, { stream: true });

          // SSE format: lines starting with "data: "
          raw.split('\n').forEach(function (line) {
            if (!line.startsWith('data: ')) return;
            var payload = line.slice(6).trim();
            if (payload === '[DONE]') return;
            try {
              var parsed = JSON.parse(payload);
              var delta  = (parsed.delta && parsed.delta.text) ||
                           (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) ||
                           '';
              if (delta) {
                assistantText += delta;

                // Stream visible text (hide BOOKING_READY tag from user)
                var visible = assistantText
                  .replace(/\nBOOKING_READY:\{[\s\S]*$/, '')
                  .replace(/BOOKING_READY:\{[\s\S]*$/, '')
                  .trim();

                assistantEl.textContent = visible;
                scrollBottom();
              }
            } catch (_) { /* non-JSON SSE line */ }
          });

          return read();
        });
      }

      return read();
    })
    .catch(function (err) {
      removeTyping();
      console.error('[Aria] Stream error:', err);
      var errEl = document.createElement('div');
      errEl.className = 'aria-msg aria-assistant';
      errEl.textContent = 'I apologize — something went wrong. Please try again.';
      messagesEl.appendChild(errEl);
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
