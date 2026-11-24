
window.FP_FULL = [];   // fully booked nights
window.FP_BOOK = "https://negrilfooteprints.com/search-results/";
window.FP_kids = function(v){
  if (!v || v === 'none') return '';
  var k = String(v).split('+').map(function(x){ return x.replace('-', '–'); });
  return k.length === 1 ? ', 1 child (age ' + k[0] + ')' : ', 2 children (ages ' + k[0] + ' and ' + k[1] + ')';
};
(function(){
  var html = document.documentElement;
  function track(n, p){ if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track(n, p); } catch(x){} } }
  function openD(d){ html.classList.add('sheet-open'); try { d.showModal(); } catch(x){ d.setAttribute('open', ''); } d.scrollTop = 0; }
  function closeD(d){ try { d.close(); } catch(x){ d.removeAttribute('open'); } if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); }
  function jtoday(){ return new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); }
  function add(sd, n){ var t = new Date(sd + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
  function nice(v){ return new Date(v + 'T12:00:00').toLocaleDateString('en-US', {weekday: 'short', month: 'short', day: 'numeric'}); }
  function fullIn(a, b){ var out = []; if (!a || !b || b <= a) return out; for (var d = a; d < b; d = add(d, 1)) if (window.FP_FULL.indexOf(d) > -1) out.push(d); return out; }
  function fullText(list){ return 'We’re fully booked on the night' + (list.length > 1 ? 's of ' : ' of ') + (list.length > 1 ? list.slice(0, -1).map(nice).join('; ') + ' and ' + nice(list[list.length - 1]) : nice(list[0])) +
    '. Please choose other dates, or send a request and we’ll tell you if a room opens up.'; }

  // live availability from the hotel's booking engine (via /api/availability on this site)
  var ONLINE = ['HSK', 'HSD', 'OVQ', 'OVK', 'OVD'];      // room types the booking engine sells
  var memo = {};
  function live(a, b){
    if (!a || !b || b <= a) return Promise.resolve(null);
    var k = a + '_' + b; if (memo[k]) return memo[k];
    memo[k] = Promise.race([fetch('/api/availability?in=' + a + '&out=' + b).then(function(r){ return r.ok ? r.json() : null; }),
        new Promise(function(ok){ setTimeout(function(){ ok(null); }, 10000); })])
      .then(function(j){ return j && j.ok ? j : null; }).catch(function(){ return null; });
    return memo[k];
  }
  window.FP_live = live;
  function tname(c){ return (window.FP_ROOMS && window.FP_ROOMS.types[c]) ? window.FP_ROOMS.types[c].n : c; }
  function rooms(n){ return n + (n === 1 ? ' room' : ' rooms'); }

  // spa treatments sheet; "Book a treatment" inside it hands over to the request form
  (function(){
    var d = document.getElementById('spamenu-sheet'); if (!d) return;
    document.addEventListener('click', function(e){
      if (e.target.closest && e.target.closest('[data-spamenu-open]')) { e.preventDefault(); openD(d); track('lite-spa-menu-open'); } });
    d.addEventListener('click', function(e){ if (e.target === d || (e.target.closest && e.target.closest('[data-close]'))) closeD(d); });
    d.querySelector('.sm-book').addEventListener('click', function(){ try { d.close(); } catch(x){} }, true);
    d.addEventListener('close', function(){ if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); });
  })();

  // Check dates: dates + guests here, then the booking engine with them filled in
  (function(){
    var d = document.getElementById('dates-sheet'); if (!d) return;
    var f = document.getElementById('dates-form'), err = document.getElementById('dates-err'), note = f.querySelector('.full-note');
    function sync(){
      var t = jtoday(); f.checkin.min = t; if (f.checkin.value && (!f.checkout.value || f.checkout.value <= f.checkin.value)) f.checkout.value = add(f.checkin.value, 1);
      f.checkout.min = f.checkin.value ? add(f.checkin.value, 1) : add(t, 1);
      var l = fullIn(f.checkin.value, f.checkout.value); note.hidden = !l.length; if (l.length) note.textContent = fullText(l);
      showLive(); }
    var box = document.getElementById('dates-live'), seq = 0;
    function showLive(){
      var a = f.checkin.value, b = f.checkout.value, my = ++seq;
      if (!a || !b || b <= a) { box.hidden = true; return; }
      box.hidden = false; box.className = 'live-box is-wait'; box.innerHTML = '<span class="on-dot"></span>Checking rooms for your dates…';
      live(a, b).then(function(j){
        if (my !== seq) return;
        if (!j) { box.hidden = true; return; }
        var list = ONLINE.filter(function(c){ return j.types[c] > 0; });
        if (!j.total || !list.length) {
          box.className = 'live-box is-full';
          box.innerHTML = '<span class="on-dot"></span><span><b>No rooms left online for these dates.</b> Pool Walk-out, Oceanfront and Deluxe rooms are only bookable with us: send a request and we’ll check for you.</span>';
          track('lite-avail', {result: 'full'}); return;
        }
        box.className = 'live-box is-ok';
        box.innerHTML = '<span class="on-dot"></span><span><b>' + rooms(j.total) + ' free to book online</b> for your dates:<span class="lv-l">' +
          list.map(function(c){ var n = j.types[c]; return '<span>' + tname(c) + ' · ' + (n === 1 ? '<em>last room</em>' : n + ' free') + '</span>'; }).join('') + '</span></span>';
        track('lite-avail', {result: 'ok', total: j.total});
      });
    }
    ['checkin', 'checkout'].forEach(function(k){ f[k].addEventListener('change', sync); f[k].addEventListener('input', sync); });
    document.addEventListener('click', function(e){
      var t = e.target.closest && e.target.closest('[data-dates-open]'); if (!t) return;
      e.preventDefault(); Array.prototype.forEach.call(document.querySelectorAll('dialog[open]'), closeD);
      err.hidden = true; sync(); openD(d); track('lite-dates-open'); }, true);
    d.addEventListener('click', function(e){ if (e.target === d || (e.target.closest && e.target.closest('[data-close]'))) closeD(d); });
    d.addEventListener('close', function(){ if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); });
    document.getElementById('dates-go').addEventListener('click', function(){
      if (!f.checkin.value || !f.checkout.value) { err.textContent = 'Please choose your check-in and check-out dates.'; err.hidden = false; return; }
      err.hidden = true;
      var ad = parseInt(f.adults.value, 10) || 2, ch = parseInt(f.children.value, 10) || 0;
      if (ch > 1) { ad += ch; ch = 0; }   // the engine lists the two-double rooms as 4 guests, no children
      var u = window.FP_BOOK + '?mphb_check_in_date=' + f.checkin.value + '&mphb_check_out_date=' + f.checkout.value +
              '&mphb_adults=' + ad + '&mphb_children=' + ch;
      track('lite-dates-go', {nights: Math.round((new Date(f.checkout.value) - new Date(f.checkin.value)) / 864e5), children: f.children.value});
      if (typeof window.fbq === 'function') { try { window.fbq('track', 'InitiateCheckout', {content_category: 'room'}); } catch(x){} }
      window.open(u, '_blank', 'noopener');
    });
  })();

  // room request: two children only in rooms with two double beds; fully booked nights; "Thank you, name!"
  (function(){
    var f = document.getElementById('room-form'); if (!f || !window.FP_ROOMS) return;
    var T = window.FP_ROOMS.types;
    function syncKids(){
      var c = f.room.value, dbl = !!(T[c] && /two double/i.test(T[c].b));
      Array.prototype.forEach.call(f.child.querySelectorAll('[data-two]'), function(o){ o.hidden = !dbl; o.disabled = !dbl; });
      if (!dbl && f.child.value.indexOf('+') > -1) { f.child.value = 'none'; f.child.dispatchEvent(new Event('change')); }
    }
    f.room.addEventListener('change', syncKids);
    document.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('[data-room-req],[data-pick]')) setTimeout(syncKids, 0); });
    var row = f.checkin.closest('.two-col'); row.insertAdjacentHTML('afterend', '<p class="form-err full-note" hidden></p>');
    var note = f.querySelector('.full-note');
    note.insertAdjacentHTML('afterend', '<p class="live-box" id="rq-live" hidden></p>');
    var box = document.getElementById('rq-live'), seq = 0;
    function full(){ var l = fullIn(f.checkin.value, f.checkout.value); note.hidden = !l.length; if (l.length) note.textContent = fullText(l); liveRoom(); }
    function liveRoom(){
      var a = f.checkin.value, b = f.checkout.value, c = f.room.value, my = ++seq;
      if (!a || !b || b <= a || !c) { box.hidden = true; return; }
      if (ONLINE.indexOf(c) < 0) { box.hidden = false; box.className = 'live-box is-req'; box.innerHTML = '<span class="on-dot"></span><span>This room is booked by request: our team checks your dates and replies within 24–48 hours.</span>'; return; }
      box.hidden = false; box.className = 'live-box is-wait'; box.innerHTML = '<span class="on-dot"></span>Checking this room for your dates…';
      live(a, b).then(function(j){
        if (my !== seq) return;
        if (!j) {
          var td = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
          box.className = 'live-box is-req';
          box.innerHTML = '<span class="on-dot"></span><span>' + (a === td ?
            '<b>We can’t check tonight online at this hour.</b> Try tomorrow’s date, or send your request and our team will confirm your room.' :
            '<b>We couldn’t check these dates online just now.</b> Send your request and our team will confirm your room within 24–48 hours.') + '</span>';
          return;
        }
        var n = j.types[c] || 0;
        if (n > 0) { box.className = 'live-box is-ok'; box.innerHTML = '<span class="on-dot"></span><span>' + (n === 1 ? '<b>Last room</b> of this type free for your dates.' : '<b>' + rooms(n) + ' of this type free</b> for your dates.') + '</span>'; }
        else if (j.total > 0) { box.className = 'live-box is-full'; box.innerHTML = '<span class="on-dot"></span><span><b>This room is booked for your dates.</b> Other rooms are still free: switch the room above, or tap Compare every room.</span>'; }
        else { box.className = 'live-box is-full'; box.innerHTML = '<span class="on-dot"></span><span><b>We’re fully booked online for these dates.</b> Send your request anyway and we’ll tell you if a room opens up.</span>'; }
      });
    }
    f.room.addEventListener('change', liveRoom);
    document.addEventListener('click', function(e){ if (e.target.closest && e.target.closest('[data-room-req],[data-pick]')) setTimeout(full, 0); });
    ['checkin', 'checkout'].forEach(function(k){ f[k].addEventListener('change', full); f[k].addEventListener('input', full); });
  })();

  // compare sheet: how many are free, next to each online room
  window.FP_cmpLive = function(a, b){
    live(a, b).then(function(j){
      if (!j) return;
      Array.prototype.forEach.call(document.querySelectorAll('#cmp-list .cmp-row'), function(r){
        var btn = r.querySelector('[data-pick]'); if (!btn) return; var c = btn.getAttribute('data-pick'); if (ONLINE.indexOf(c) < 0) return;
        var n = j.types[c] || 0, s = r.querySelector('.cmp-live') || r.querySelector('.cmp-n').appendChild(document.createElement('em'));
        s.className = 'cmp-live' + (n ? '' : ' is-full'); s.textContent = n ? (n === 1 ? 'Last room free' : n + ' free for your dates') : 'Booked for your dates';
      });
    });
  };
  (function(){   // rooms section: tonight, live
    var el = document.getElementById('rooms-live'); if (!el) return;
    var a = jtoday(), b = add(a, 1), t = el.querySelector('.on-t');
    function show(j, when){
      var n = ONLINE.reduce(function(s, c){ return s + (j.types[c] || 0); }, 0);
      el.hidden = false;
      if (n > 0) t.textContent = when + ': ' + rooms(n) + ' free to book online' + (n <= 3 ? ', almost full' : '');
      else { el.classList.add('is-closed'); t.textContent = when + ' we’re fully booked online · check other dates'; }
    }
    // late in the evening the booking engine has already moved to tomorrow: then show tomorrow night
    live(a, b).then(function(j){
      if (j) return show(j, 'Tonight');
      return live(b, add(b, 1)).then(function(k){
        if (k) return show(k, 'Tomorrow');
        t.textContent = 'See which rooms are free for your dates';
      });
    });
  })();

  // every form: "Thank you, <first name>!" when the thank-you panel appears
  (function(){
    var names = {};
    document.addEventListener('submit', function(e){ var f = e.target; if (f && f.name && f.name.value !== undefined && f.id) names[f.id] = String(f.name.value).trim().split(/\s+/)[0]; }, true);
    Array.prototype.forEach.call(document.querySelectorAll('dialog .sheet-done'), function(p){
      var f = p.parentNode.querySelector('form'); if (!f) return;
      new MutationObserver(function(){ if (p.hidden) return; var n = names[f.id]; var h = p.querySelector('h2'); if (n && h) h.textContent = 'Thank you, ' + n + '!'; })
        .observe(p, {attributes: true, attributeFilter: ['hidden']});
    });
  })();

  // celebrations: note when "The whole hotel" is chosen
  (function(){
    var f = document.getElementById('cel-form'); if (!f) return;
    var n = f.querySelector('.whole-note'), b = f.querySelector('input[name="where"][value="The whole hotel"]'); if (!n || !b) return;
    b.addEventListener('change', function(){ n.hidden = !b.checked; });
  })();
})();
