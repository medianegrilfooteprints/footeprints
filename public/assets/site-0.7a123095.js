
(function(){
  var views = Array.prototype.slice.call(document.querySelectorAll('.view'));
  function show(){
    var h = (location.hash || '').slice(1);
    if (h && FP.slug[h]) {                       // an old #stay style link: go to the real page
      if (document.getElementById('view-' + h)) history.replaceState(null, '', FP.slug[h]);
      else { location.replace(FP.slug[h]); return; }
      h = '';
    }
    var key = fpKey();
    var target = document.getElementById('view-' + key) || views[0], anchor = h ? document.getElementById(h) : null;
    var changed = !target.hasAttribute('data-shown');
    views.forEach(function(v){ v.hidden = (v !== target); if (v !== target) v.removeAttribute('data-shown'); });
    target.setAttribute('data-shown', '');
    var cur = key.indexOf('menu-') === 0 ? 'dining' : key;
    Array.prototype.forEach.call(document.querySelectorAll('.nav-i'), function(n){
      var on = fpPath(n.pathname) === FP.slug[cur]; n.classList.toggle('is-cur', on);
      if (on) n.setAttribute('aria-current', 'page'); else n.removeAttribute('aria-current');
    });
    if (window.FP_client) document.title = FP.title[key] || document.title;
    if (anchor) { requestAnimationFrame(function(){ anchor.scrollIntoView({block:'start'}); }); }
    else if (changed && window.FP_client) { window.scrollTo(0, 0); }
    Array.prototype.forEach.call(target.querySelectorAll('.navstrip .is-cur'), function(n){ n.scrollIntoView({block:'nearest', inline:'center'}); });
    // page views: Umami counts real page loads and history changes by itself
    window.FP_client = false;
  }
  window.addEventListener('hashchange', show);
  window.addEventListener('hashchange', function(){  // v37: a route change never leaves a sheet open or the page locked
    Array.prototype.forEach.call(document.querySelectorAll('dialog[open]'), function(d){ try { d.close(); } catch(x){ d.removeAttribute('open'); } });
    document.documentElement.classList.remove('sheet-open'); });
  Array.prototype.forEach.call(document.querySelectorAll('.wk-tabs'), function(t){  // v37: creator / model tabs on phones
    var box = t.closest('section') || t.nextElementSibling;
    t.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-tab]'); if (!b) return;
      Array.prototype.forEach.call(t.querySelectorAll('[data-tab]'), function(x){ x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      Array.prototype.forEach.call(box.querySelectorAll('[data-pane]'), function(p){ p.classList.toggle('is-on', p.getAttribute('data-pane') === b.getAttribute('data-tab')); });
      if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track('work-tab-' + b.getAttribute('data-tab')); } catch(x){} } }); });
  // Meta Pixel: section views and key clicks
  function fbt(){ if (typeof window.fbq === 'function') { try { window.fbq.apply(null, arguments); } catch(e){} } }
  var lastKey = null;
  function pixView(){
    var key = fpKey();
    if (key === lastKey) return; lastKey = key;
    if (key !== 'home') fbt('track', 'ViewContent', {content_name: key, content_category: key.indexOf('menu-') === 0 ? 'dining' : key});
  }
  window.addEventListener('hashchange', pixView); pixView();
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '', name = a.getAttribute('data-umami-event') || '';
    var sec = fpKey();
    if (h.indexOf('https://wa.me') === 0) fbt('track', 'Contact', {method: 'whatsapp', button: name, section: sec});
    else if (h.indexOf('tel:') === 0) fbt('track', 'Contact', {method: 'phone', button: name, section: sec});
    else if (h.indexOf('mailto:') === 0) fbt('track', 'Contact', {method: 'email', button: name, section: sec});
    else if (h.indexOf('negrilfooteprints.com/search-results') > -1) fbt('track', 'InitiateCheckout', {content_category: 'room', button: name, section: sec});
    else if (h.indexOf('tickettailor.com/events/negrilfooteprintshotel') > -1) fbt('track', 'InitiateCheckout', {content_category: 'daypass', button: name, section: sec});
    if (name.indexOf('soundscape-notify') === 0) fbt('trackCustom', 'SoundscapeNotify', {button: name});
  }, true);
  // cookie notice
  (function(){
    var box = document.getElementById('cookie'); if (!box) return;
    var v = null; try { v = localStorage.getItem('fp-consent'); } catch(e){}
    if (!v) box.hidden = false;
    box.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('[data-ck]'); if (!b) return;
      var ok = b.getAttribute('data-ck') === 'ok';
      try { localStorage.setItem('fp-consent', ok ? 'ok' : 'no'); } catch(err){}
      if (!ok) fbt('consent', 'revoke');
      box.hidden = true;
    });
  })();

  document.addEventListener('click', function(e){
    var n = e.target.closest && e.target.closest('a.nav-i');
    if (n && fpPath(n.pathname) === fpPath(location.pathname) && !location.hash) { e.preventDefault(); window.scrollTo(0, 0); return; }
    var c = e.target.closest && e.target.closest('[data-jump]');
    if (!c) return;
    e.preventDefault();
    var el = document.getElementById(c.getAttribute('data-jump'));
    if (el) el.scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
    var ev = c.getAttribute('data-ev');
    if (ev && window.umami && typeof window.umami.track === 'function') { try { window.umami.track(ev); } catch(err){} }
  });
  show();
  function bars(){
    var on = window.scrollY > 380;
    Array.prototype.forEach.call(document.querySelectorAll('.bar'), function(b){ b.classList.toggle('is-up', on); });
  }
  window.addEventListener('scroll', bars, {passive:true}); bars();
  (function(){  // v38: on Work with us the bar shows the action of the chapter in view
    var bar = document.getElementById('wk-bar'); if (!bar || !('IntersectionObserver' in window)) return;
    var map = {'wk-creators': 'cr', 'wk-press': 'pr', 'wk-careers': 'jb'}, seen = {};
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ seen[e.target.id] = e.isIntersecting; });
      var ctx = ''; ['wk-creators', 'wk-press', 'wk-careers'].forEach(function(id){ if (!ctx && seen[id]) ctx = map[id]; });
      if (ctx) bar.setAttribute('data-ctx', ctx); else bar.removeAttribute('data-ctx'); }, {rootMargin: '-45% 0px -45% 0px'});
    Object.keys(map).forEach(function(id){ var el = document.getElementById(id); if (el) io.observe(el); });
  })();
  // v36: Formspark helpers shared by the three request forms
  window.fpPost = function(id, data){
    var opt = {method: 'POST', headers: {'Content-Type': 'application/json', 'Accept': 'application/json'}, body: JSON.stringify(data)};
    var url = 'https://submit-form.com/' + id;
    return fetch(url, opt).catch(function(){ return new Promise(function(ok){ setTimeout(ok, 1500); }).then(function(){ return fetch(url, opt); }); });
  };
  window.fpCode = function(e){ var m = /HTTP (\d+)/.exec(String(e && e.message || '')); return m ? ' (error ' + m[1] + ')' : ' (no connection)'; };
  window.fpFail = function(form, e){ if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track(form + '-request-fail', {why: String(e && e.message || e).slice(0, 60)}); } catch(x){} } };

  // room rates by season and tier, from the hotel's rate sheet (Jamaica date)
  (function(){
    var T = (window.FP_ROOMS || {}).tiers || {1:[259,279,309,279,259,279,309]};
    var S = ['2026-11-01','2026-12-01','2027-05-01','2027-08-01','2027-10-01','2027-11-01'];
    var d = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10), p = 0;
    S.forEach(function(x){ if (d >= x) p++; });
    Array.prototype.forEach.call(document.querySelectorAll('.rate'), function(e){
      var v = T[e.getAttribute('data-t') || 1][p], n = e.nextElementSibling;
      e.textContent = v ? '$' + v : 'On request'; e.classList.toggle('req', !v);
      if (n && n.tagName === 'I') n.hidden = !v;
    });
  })();

  // room photo dots
  Array.prototype.forEach.call(document.querySelectorAll('.pics[data-dots]'), function(p){
    var dots = p.parentNode.querySelectorAll('.dots i');
    function upd(){ var i = Math.round(p.scrollLeft / Math.max(1, p.clientWidth)); for (var k=0;k<dots.length;k++) dots[k].className = k===i ? 'is-on' : ''; }
    p.addEventListener('scroll', upd, {passive:true}); upd();
  });
  // v29: room sheets, request form with a price calculator, compare sheet
  (function(){
    var D = window.FP_ROOMS; if (!D) return;
    var html = document.documentElement;
    function openD(d){ if (!d) return; html.classList.add('sheet-open');
      if (d.showModal) { try { d.showModal(); } catch(e){ d.setAttribute('open',''); } } else d.setAttribute('open',''); d.scrollTop = 0; }
    function closeD(d){ if (!d) return; if (d.close && d.open) d.close(); else d.removeAttribute('open');
      if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); }
    function closeAll(){ Array.prototype.forEach.call(document.querySelectorAll('dialog.room-sheet[open], #room-req[open], #room-cmp[open]'), closeD); }
    Array.prototype.forEach.call(document.querySelectorAll('.room-sheet, #room-req, #room-cmp, #ai-sheet'), function(d){
      d.addEventListener('close', function(){ if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); });
      d.addEventListener('click', function(e){ if (e.target === d || (e.target.closest && e.target.closest('[data-close]'))) closeD(d); });
    });
    var dlg = document.getElementById('room-req'), f = document.getElementById('room-form'), done = document.getElementById('rq-done'),
        err = document.getElementById('rq-err'), sum = document.getElementById('rq-sum'), trNote = document.getElementById('rq-tr-note'),
        cmp = document.getElementById('room-cmp'), cf = document.getElementById('cmp-form'), cl = document.getElementById('cmp-list');
    function jdate(){ return new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10); }
    function add(sd, n){ var t = new Date(sd + 'T12:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); }
    function pidx(d){ var p = 0; D.starts.forEach(function(x){ if (d >= x) p++; }); return p; }
    function rate(code, d){ return D.tiers[D.types[code].t][pidx(d)]; }
    // Promo code (Oct 2026): direct requests only. The code is stored as a SHA-256 hash, never as text.
    // Nights from..to (inclusive) get the promo price of the room's tier; other nights keep the normal price.
    var PROMO = {hash: 'b0604f9f522053010f52fbd93e86a4cab5e2c2718cda6338485619ef505e5581', from: '2026-11-02', to: '2026-11-14', until: '2026-11-01',
                 rooms: ['HSK', 'OVQ'], price: 209, withLocal: false};   // nights 2–14 Nov (check-out by 15 Nov); requests until Sun 1 Nov
    var promoOn = false, promoCode = '';
    function inPromo(d){ return d >= PROMO.from && d <= PROMO.to; }
    function prate(code, d, promo){ return (promo && inPromo(d) && PROMO.rooms.indexOf(code) > -1) ? Math.min(PROMO.price, rate(code, d)) : rate(code, d); }
    function usd(c){ return (c < 0 ? '−' : '') + '$' + (Math.abs(c) / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
    function nice(v){ return v ? new Date(v + 'T12:00:00').toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric', year:'numeric'}) : ''; }
    function shortd(v){ return new Date(v + 'T12:00:00').toLocaleDateString('en-US', {month:'short', day:'numeric'}); }
    var today = jdate();
    [f, cf].forEach(function(x){ x.checkin.min = today; x.checkin.max = D.last; x.checkout.min = add(today, 1); x.checkout.max = add(D.last, 1); });
    // dates: returns an error text, or null when the stay can be priced
    function datesProblem(a, b){
      if (!a || !b) return 'Choose your dates to see the price for your stay.';
      if (a < today) return 'Please choose a check-in date from today.';
      var n = 0; for (var d = a; d < b; d = add(d, 1)) { n++; if (n > 30) return 'For stays longer than 30 nights, send your request and we’ll quote you.'; }
      if (add(b, -1) > D.last) return 'We can show prices for stays up to 30 November 2027. Send your request and we’ll quote you.';
      return null;
    }
    function fixOut(x){ var a = x.checkin.value; if (a && (!x.checkout.value || x.checkout.value <= a)) x.checkout.value = add(a, 1); x.checkout.min = a ? add(a, 1) : add(today, 1); }
    // the estimate: each night at its own season's price, + plan / child breakfast, then 10% + 15%, + US$1 per night, + transfer, + late check-out
    function estimate(o){
      var nights = []; for (var d = o.a; d < o.b; d = add(d, 1)) nights.push(d);
      var n = nights.length, groups = [], room = 0;
      var pn = 0, localBase = 0;
      nights.forEach(function(d){ var r0 = rate(o.code, d) * 100, r = prate(o.code, d, o.promo) * 100; room += r;
        var pr = r < r0; if (pr) pn++;
        if (!pr || PROMO.withLocal) localBase += r;
        var g = groups[groups.length - 1]; if (g && g.r === r && g.r0 === r0) g.n++; else groups.push({r: r, r0: r0, n: 1}); });
      var aiC = o.ai ? n * (o.adults * 16500 + (String(o.child).split('+').filter(function(x){ return x === '4-12'; }).length * 10000)) : 0;
      var bf = 0;
      var disc = o.local ? Math.round(localBase * 0.10) : 0, net = room - disc;
      var base = net + aiC + bf, gct = Math.round(base * 0.10), svc = Math.round(base * 0.15), acc = n * 100;
      var tr = (o.tr || 0) * 100, late = (o.late || 0) * 100, total = base + gct + svc + acc + tr + late;
      var L = [];
      groups.forEach(function(g){
        if (g.r < g.r0) L.push(['Room, promo price · ' + g.n + (g.n === 1 ? ' night' : ' nights') + ' × ' + usd(g.r) + ' (was ' + usd(g.r0) + ')', g.n * g.r, g.n * g.r0]);
        else L.push(['Room · ' + g.n + (g.n === 1 ? ' night' : ' nights') + ' × ' + usd(g.r), g.n * g.r]); });
      if (disc) L.push(['Local rate, 10% off the room' + (pn && !PROMO.withLocal && pn < n ? ' (nights without the promo)' : ''), -disc]);
      if (aiC) L.push(['All-Inclusive Plan · ' + n + (n === 1 ? ' night' : ' nights') + ' × ' + usd(aiC / n), aiC]);
      if (bf) L.push(['Breakfast, child 4–12 · ' + n + ' × $20.00', bf]);
      L.push(['Government tax, 10%', gct]); L.push(['Service charge, 15%', svc]);
      L.push(['Jamaica hospitality tax · ' + n + ' × $1.00', acc]);
      if (tr) L.push(['Airport transfer, ' + (tr === 25000 ? 'round trip' : 'one way') + ' (taxes included)', tr]);
      if (late) L.push(['Late check-out until ' + (o.late >= 100 ? '6 PM' : '3 PM') + ', if a room is free', late]);
      return {n: n, pn: pn, lines: L, total: total, room: net, disc: disc, base: base, acc: acc, stayOnly: base + gct + svc + acc};
    }
    function opts(x){ return {code: x.room ? x.room.value : null, a: x.checkin.value, b: x.checkout.value, adults: parseInt(x.adults.value, 10) || 2, child: x.child.value, local: !!(x.local && x.local.checked)}; }
    // transfer (GM, 3 Oct): private car for up to 4 people, $125 one way or $250 round trip
    function trRule(){
      var g = (parseInt(f.adults.value, 10) || 2) + (f.child.value === 'none' ? 0 : f.child.value.split('+').length), cur = f.transfer.value;
      var o = [['0', 'No transfer'], ['125', 'One way · $125'], ['250', 'Round trip · $250']];
      f.transfer.innerHTML = o.map(function(x){ return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('');
      f.transfer.value = o.some(function(x){ return x[0] === cur; }) ? cur : '0';
      trNote.textContent = 'Private car for up to 4 people, taxes included: $125 one way, or $250 round trip.';
    }
    function calc(){
      fixOut(f); var o = opts(f), p = datesProblem(o.a, o.b); promoNote(o);
      if (p) { sum.innerHTML = '<p class="sum-empty">' + p + '</p>'; return null; }
      o.ai = f.ai.checked; o.tr = parseInt(f.transfer.value, 10) || 0; o.late = parseInt(f.late.value, 10) || 0;
      o.promo = promoOn; var e = estimate(o), was = null;
      if (e.pn) { var o2 = {}; for (var k in o) o2[k] = o[k]; o2.promo = false; was = estimate(o2).total; e.was = was; }
      promoNote(o);
      sum.innerHTML = '<p class="sum-h">' + D.types[o.code].n + ' · ' + e.n + (e.n === 1 ? ' night' : ' nights') + ', ' + shortd(o.a) + ' – ' + shortd(o.b) + '</p><ul>' +
        e.lines.map(function(l){ return '<li' + (l[2] ? ' class="promo-l"' : '') + '><span>' + l[0].replace(/ \(was [^)]*\)$/, '') + '</span><b>' + (l[2] ? '<s>' + usd(l[2]) + '</s>' : '') + usd(l[1]) + '</b></li>'; }).join('') +
        '<li class="tot"><span>Estimated total</span><b>' + (was ? '<s>' + usd(was) + '</s>' : '') + usd(e.total) + '</b></li></ul>' +
        '<p class="fine">In US dollars. The room is ' + usd(Math.round((e.room + Math.round(e.room * 0.25) + e.acc) / e.n)) + ' per night with taxes. Our team confirms the final price when they confirm your room.</p>';
      return e;
    }
    function renderCmp(){
      fixOut(cf); var o = opts(cf), p = datesProblem(o.a, o.b), rows = [];
      Object.keys(D.types).forEach(function(c){
        var t = D.types[c], tot = null, per = null;
        if (String(o.child).indexOf('+') > -1 && !/two double/i.test(t.b)) { rows.push({c: c, t: t, tot: null, per: null, from: 1e9, no: 1}); return; }
        if (!p) { var e = estimate({code: c, a: o.a, b: o.b, adults: o.adults, child: o.child, local: o.local, promo: promoOn}); tot = e.stayOnly; per = Math.round((e.room + Math.round(e.room * 0.25) + e.acc) / e.n); }
        rows.push({c: c, t: t, tot: tot, per: per, from: D.tiers[t.t][pidx(o.a && !p ? o.a : today)]});
      });
      rows.sort(function(x, y){ return (x.tot || x.from) - (y.tot || y.from); }); if (!p && window.FP_cmpLive) setTimeout(function(){ window.FP_cmpLive(o.a, o.b); }, 0);
      cl.innerHTML = (p ? '<p class="sum-empty">' + p + ' Until then, here are tonight’s prices.</p>' : '') + rows.map(function(r){
        return '<div class="cmp-row"><div class="cmp-n"><b>' + r.t.n + '</b><span>' + r.t.b + ' · ' + r.t.r + (r.t.r === 1 ? ' room' : ' rooms') + '</span>' +
          (r.t.d ? '<em>Only bookable with us</em>' : '') + '</div>' +
          '<div class="cmp-p">' + (r.no ? '<span>Fits 2 adults + 1 child</span>' : r.tot !== null ? '<b>' + usd(r.tot) + '</b><span>' + usd(r.per) + ' per night, taxes in</span>' : '<b>$' + r.from + '</b><span>per night, plus taxes</span>') + '</div>' +
          (r.no ? '' : '<button type="button" class="btn btn-line cmp-go" data-pick="' + r.c + '">Choose</button>') + '</div>';
      }).join('');
    }
    function setFam(fam, code){
      var codes = D.fam[fam] || []; f.room.innerHTML = '';
      codes.forEach(function(c){ var o = document.createElement('option'); o.value = c; o.textContent = D.types[c].n; f.room.appendChild(o); });
      var others = Object.keys(D.types).filter(function(c){ return codes.indexOf(c) < 0; });
      if (others.length) { var g = document.createElement('optgroup'); g.label = codes.length ? 'Other rooms' : 'Rooms';
        others.forEach(function(c){ var o = document.createElement('option'); o.value = c; o.textContent = D.types[c].n; g.appendChild(o); });
        f.room.appendChild(g); }
      if (code) f.room.value = code;
    }
    function copyStay(from, to){ ['checkin', 'checkout', 'adults', 'child'].forEach(function(k){ if (from[k].value) to[k].value = from[k].value; }); to.local.checked = from.local.checked; }
    function openReq(fam, code){ closeAll(); setFam(fam, code); f.hidden = false; done.hidden = true; err.hidden = true; trRule(); calc(); openD(dlg); }
    document.addEventListener('click', function(e){
      var t = e.target.closest && e.target.closest('[data-room-open],[data-room-req],[data-cmp],[data-pick],[data-ai-info]'); if (!t) return;
      e.preventDefault();
      if (t.hasAttribute('data-ai-info')) { openD(document.getElementById('ai-sheet')); return; }
      if (t.hasAttribute('data-room-open')) { closeAll(); openD(document.getElementById('rd-' + t.getAttribute('data-room-open'))); return; }
      if (t.hasAttribute('data-room-req')) { openReq(t.getAttribute('data-room-req'), t.getAttribute('data-room-type')); return; }
      if (t.hasAttribute('data-cmp')) { copyStay(f, cf); closeAll(); renderCmp(); openD(cmp);
        if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track('room-compare-open'); } catch(x){} } return; }
      if (t.hasAttribute('data-pick')) { var c = t.getAttribute('data-pick'); copyStay(cf, f); openReq(D.types[c].f, c); }
    });
    var pIn = document.getElementById('rq-promo-in'), pSt = document.getElementById('rq-promo-st'), pBox = document.getElementById('rq-promo'), pTracked = '';
    if (today > PROMO.until) pBox.hidden = true;
    function promoNote(o){
      if (!pSt) return;
      var v = (pIn.value || '').trim();
      if (!v) { pSt.textContent = ''; pSt.className = 'promo-st'; return; }
      if (!promoOn) { pSt.textContent = 'This code isn’t valid. Check the spelling, or message us on Instagram.'; pSt.className = 'promo-st'; return; }
      var ok = o && PROMO.rooms.indexOf(o.code) > -1, any = false;
      if (o && o.a && o.b) for (var d = o.a; d < o.b; d = add(d, 1)) if (inPromo(d)) { any = true; break; }
      var win = 'nights from 2\u00a0to\u00a014\u00a0November (check-out by 15\u00a0November)';
      if (!ok) { pSt.className = 'promo-st'; pSt.textContent = promoCode + ' works for the Hotel Suite King and the Ocean View Queen only. Switch the room above to use it.'; return; }
      if (o.a && o.b && !any) { pSt.className = 'promo-st'; pSt.textContent = 'Code accepted. It applies to ' + win + '. Choose dates in that window to see the special rate.'; return; }
      pSt.className = 'promo-st ok';
      pSt.textContent = 'Code applied: $209 per night for ' + win + '. Hotel Suite King and Ocean View Queen only. ' +
        (o.local ? 'The local rate doesn’t apply to promo nights.' : 'Not combined with the local rate or other offers.');
    }
    function checkPromo(){
      var v = (pIn.value || '').toUpperCase().replace(/\s+/g, '');
      if (!v || today > PROMO.until || !(window.crypto && crypto.subtle && window.TextEncoder)) { promoOn = false; promoCode = ''; calc(); return; }
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(v)).then(function(b){
        var hx = Array.prototype.map.call(new Uint8Array(b), function(x){ return ('0' + x.toString(16)).slice(-2); }).join('');
        if ((pIn.value || '').toUpperCase().replace(/\s+/g, '') !== v) return;
        promoOn = hx === PROMO.hash; promoCode = promoOn ? v : '';
        if (promoOn && pTracked !== v && window.umami && typeof window.umami.track === 'function') { pTracked = v; try { window.umami.track('room-promo-applied'); } catch(x){} }
        calc();
      }).catch(function(){ promoOn = false; calc(); });
    }
    pIn.addEventListener('input', checkPromo); pIn.addEventListener('change', checkPromo);
    // Deep link from the ManyChat code message: #promo-CODE opens the request form with the code filled in
    (function(){
      var m = (location.hash || '').match(/^#promo-([A-Za-z0-9]{3,20})$/); if (!m) return;
      if (today > PROMO.until) { var rm = document.getElementById('rooms'); if (rm) setTimeout(function(){ rm.scrollIntoView(); }, 300); return; }
      D.fam.promo = PROMO.rooms.slice();
      setTimeout(function(){ openReq('promo', PROMO.rooms[0]); pIn.value = m[1].toUpperCase(); checkPromo(); }, 300);
    })();
    // Deep link for a single room: #request-OFK opens the request form with that room chosen
    (function(){
      var m = (location.hash || '').match(/^#request-([A-Za-z]{3})$/); if (!m) return;
      var c = m[1].toUpperCase(); if (!D.types[c]) return;
      setTimeout(function(){ openReq(D.types[c].f, c); }, 300);
    })();
    ['room', 'checkin', 'checkout', 'adults', 'child', 'local', 'ai', 'transfer', 'late'].forEach(function(k){
      f[k].addEventListener('change', function(){ if (k === 'adults' || k === 'child') trRule(); calc(); });
      f[k].addEventListener('input', function(){ calc(); });
    });
    ['checkin', 'checkout', 'adults', 'child', 'local'].forEach(function(k){ cf[k].addEventListener('change', renderCmp); cf[k].addEventListener('input', renderCmp); });
    f.addEventListener('submit', function(e){
      e.preventDefault(); if (f.botcheck.checked) return;
      var est = calc(), miss = [];
      if (!f.checkin.value || !f.checkout.value) miss.push('your dates');
      if (!f.name.value.trim()) miss.push('your name');
      if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) miss.push('your email');
      if (f.phone.value.replace(/\D/g, '').length < 7) miss.push('your phone number');
      if (miss.length) { err.textContent = 'Please add ' + miss.join(', ') + '.'; err.hidden = false; return; }
      err.hidden = true;
      var rn = D.types[f.room.value].n, ch = window.FP_kids(f.child.value);
      var also = []; if (f.late.value !== '0') also.push('late check-out until ' + (parseInt(f.late.value, 10) >= 100 ? '6 PM' : '3 PM') + ' ($' + f.late.value + ', if a room is free)'); if (f.crib.checked) also.push('a baby crib');
      var tr = f.transfer.value === '250' ? 'Round trip from Montego Bay' : f.transfer.value === '125' ? 'One way from Montego Bay' : 'No';
      var msg = 'Hello FootePrints! I would like to request a room.\n\n' +
        'Room: ' + rn + '\nDates: ' + nice(f.checkin.value) + ' to ' + nice(f.checkout.value) + (est ? ' (' + est.n + (est.n === 1 ? ' night)' : ' nights)') : '') +
        '\nGuests: ' + f.adults.value + (f.adults.value === '1' ? ' adult' : ' adults') + ch +
        (promoOn && est && est.pn ? '\nPromo code: ' + promoCode + ' (promo price on ' + est.pn + (est.pn === 1 ? ' night)' : ' nights)') : '') +
        '\nLocal rate: ' + (f.local.checked ? 'Yes, I live in Jamaica (10% off the room; I will bring ID to check-in)' : 'No') +
        '\nAll-Inclusive Plan: ' + (f.ai.checked ? 'Yes' : 'No') + '\nAirport transfer: ' + tr +
        (also.length ? '\nPlease also arrange: ' + also.join(', ') : '') +
        (f.notes.value.trim() ? '\nNotes: ' + f.notes.value.trim() : '') +
        (est ? '\n\nEstimate shown on the website:\n' + est.lines.map(function(l){ return l[0] + ': ' + usd(l[1]); }).join('\n') + '\nEstimated total: ' + usd(est.total) : '') +
        '\n\nIs this room available? Please reply to confirm.\n\n' + f.name.value.trim() + '\n' + f.email.value.trim() + '\n' + f.phone.value.trim();
      var usedPromo = !!(promoOn && est && est.pn);
      var subj = (usedPromo ? '[PROMO ' + promoCode + '] ' : '') + (f.local.checked ? '[Local rate] ' : '') + 'Room request: ' + rn + ', ' + shortd(f.checkin.value) + ' – ' + shortd(f.checkout.value);
      var data = {
        'Promo code': usedPromo ? promoCode + ' (promo price on ' + est.pn + (est.pn === 1 ? ' night)' : ' nights)') : '-',
        'Room': rn, 'Check-in': nice(f.checkin.value), 'Check-out': nice(f.checkout.value) + (est ? ' (' + est.n + (est.n === 1 ? ' night)' : ' nights)') : ''),
        'Guests': f.adults.value + (f.adults.value === '1' ? ' adult' : ' adults') + ch,
        'Local rate': f.local.checked ? 'Yes, lives in Jamaica (10% off the room; brings ID to check-in)' : 'No',
        'All-Inclusive Plan': f.ai.checked ? 'Yes' : 'No', 'Airport transfer': tr, 'Please also arrange': also.join(', ') || '-',
        'Estimated total': est ? usd(est.total) + (est.was ? ' (without the promo: ' + usd(est.was) + ')' : '') : '-',
        'Price breakdown': est ? est.lines.map(function(l){ return l[0] + ': ' + usd(l[1]); }).join(' | ') : '-',
        'Notes': f.notes.value.trim() || '-',
        'Name': f.name.value.trim(), 'email': f.email.value.trim(), 'Phone / WhatsApp': f.phone.value.trim(),
        '_email': {subject: subj, from: 'FootePrints website'}
      };
      var sent = function(){
        document.getElementById('rq-done-msg').innerHTML = 'Your request is with our reservations team. <b>We’ll reply by email within 24–48 hours</b> to confirm your room and the price.';
        f.hidden = true; done.hidden = false; dlg.scrollTop = 0;
        if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track('room-request-done', {room: rn, promo: usedPromo ? promoCode : 'none'}); } catch(x){} }
        if (typeof window.fbq === 'function') { try { window.fbq('track', 'Lead', {content_category: 'room', content_name: rn}); } catch(x){} }
      };
      var mail = 'mailto:reservations@negrilfooteprints.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(msg);
      var fs = (f.getAttribute('data-fs') || '').trim();
      if (!fs) { window.location.href = mail; return; }
      var btn = document.getElementById('rq-send'); btn.disabled = true; btn.textContent = 'Sending…';
      window.fpPost(fs, data)
        .then(function(r){ btn.disabled = false; btn.textContent = 'Send my request'; if (!r.ok) throw new Error('HTTP ' + r.status); try { sent(); } catch(x){} })
        .catch(function(e){ btn.disabled = false; btn.textContent = 'Send my request'; window.fpFail('room', e);
          err.innerHTML = 'Sorry, that didn’t go through' + window.fpCode(e) + '. <a href="' + mail + '">Send it from your email app instead</a>, or WhatsApp us on +1 855 822-3591.'; err.hidden = false; });
    });
    window.FP_calc = calc; window.FP_estimate = estimate;  // for testing
  })();

  // Spa request sheet (v25): Web3Forms -> frontdesk@ when a key is set; otherwise WhatsApp with the same message
  (function(){
    var dlg = document.getElementById('spa-sheet'); if (!dlg) return;
    var f = document.getElementById('spa-form'), done = document.getElementById('spa-done'), err = document.getElementById('spa-err');
    var today = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
    f.date.min = today; f.date2.min = today;
    dlg.addEventListener('close', function(){ document.documentElement.classList.remove('sheet-open'); });
    function open(){ f.hidden = false; done.hidden = true; err.hidden = true; document.documentElement.classList.add('sheet-open'); dlg.scrollTop = 0;
      if (dlg.showModal) { try { dlg.showModal(); } catch(e){ dlg.setAttribute('open',''); } } else dlg.setAttribute('open',''); }
    function close(){ document.documentElement.classList.remove('sheet-open'); if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    Array.prototype.forEach.call(document.querySelectorAll('[data-spa-book]'), function(b){ b.addEventListener('click', open); });
    dlg.addEventListener('click', function(e){ if (e.target === dlg || (e.target.closest && e.target.closest('[data-close]'))) close(); });
    function h(v){ var n = parseInt(v, 10); return (n > 12 ? n - 12 : n) + (n >= 12 ? ' PM' : ' AM'); }
    function nice(v){ if (!v) return ''; return new Date(v + 'T12:00:00').toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric', year:'numeric'}); }
    function shortd(v){ return new Date(v + 'T12:00:00').toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'}); }
    // treatments: up to 3 rows, each for 1 or 2 people (Couples Massage is priced for two)
    var sum = document.getElementById('spa-sum'), addBtn = f.querySelector('.tr-add');
    function rowEl(i){ return f.querySelector('.tr-row[data-i="' + i + '"]'); }
    function usd(c){ return '$' + (c / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
    function visible(){ var n = 0; for (var i = 1; i <= 3; i++) if (!rowEl(i).hidden) n++; return n; }
    function syncAdd(){ addBtn.hidden = visible() >= 3; }
    function coupleRule(i){ var s = f['t' + i], o = s.options[s.selectedIndex], c = o && o.hasAttribute('data-c');
      f['p' + i].disabled = !!c; if (c) f['p' + i].value = '2'; }
    function picks(){
      var out = [];
      for (var i = 1; i <= 3; i++) {
        if (rowEl(i).hidden) continue;
        var s = f['t' + i]; if (!s.value) continue;
        var o = s.options[s.selectedIndex], c = o.hasAttribute('data-c');
        var n = c ? 1 : (parseInt(f['p' + i].value, 10) || 1);
        out.push({t: s.value, p: parseInt(o.getAttribute('data-p'), 10) || 0, n: n, people: c ? 2 : n, c: c, a: o.hasAttribute('data-a')});
      }
      return out;
    }
    function calc(){
      var P = picks();
      if (!P.length) { sum.innerHTML = '<p class="sum-empty">Choose a treatment to see your total.</p>'; return null; }
      var sub = 0, L = [], tbc = false;
      P.forEach(function(x){ var line = x.p * x.n * 100; sub += line; if (!x.p) tbc = true;
        L.push([x.t.replace(/ · \$\d+$/, '') + (x.c ? ' · for two' : (x.n === 2 ? ' × 2 people' : '')), line]); });
      var gct = Math.round(sub * 0.10), svc = Math.round(sub * 0.15), total = sub + gct + svc;
      L.push(['Government tax, 10%', gct]); L.push(['Service charge, 15%', svc]);
      sum.innerHTML = '<p class="sum-h">Your treatments</p><ul>' +
        L.map(function(l){ return '<li><span>' + l[0] + '</span><b>' + (l[0].indexOf('Not sure') === 0 ? 'To be advised' : usd(l[1])) + '</b></li>'; }).join('') +
        '<li class="tot"><span>Estimated total</span><b>' + usd(total) + '</b></li></ul>' +
        '<p class="fine">' + (tbc ? 'Our team will suggest a treatment and confirm the price. ' : '') + 'In US dollars. Our front desk confirms the final price with your time.</p>';
      return {lines: L, total: total, picks: P, tbc: tbc};
    }
    addBtn.addEventListener('click', function(){ for (var i = 2; i <= 3; i++) { if (rowEl(i).hidden) { rowEl(i).hidden = false; f['t' + i].focus(); break; } } syncAdd(); calc(); });
    f.addEventListener('click', function(e){ var b = e.target.closest && e.target.closest('[data-tr-rm]'); if (!b) return;
      var i = b.getAttribute('data-tr-rm'); rowEl(i).hidden = true; f['t' + i].value = ''; f['p' + i].value = '1'; f['p' + i].disabled = false; syncAdd(); calc(); });
    [1, 2, 3].forEach(function(i){ f['t' + i].addEventListener('change', function(){ coupleRule(i); calc(); }); f['p' + i].addEventListener('change', calc); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-spa-book]'), function(b){ b.addEventListener('click', function(){ syncAdd(); calc(); }); });
    syncAdd(); calc();
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (f.botcheck.checked) return;
      var est = calc(), P = est ? est.picks : [], miss = [];
      if (!P.length) miss.push('a treatment');
      if (!f.date.value) miss.push('a date');
      if (!f.name.value.trim()) miss.push('your name');
      if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) miss.push('your email');
      if (f.phone.value.replace(/\D/g, '').length < 7) miss.push('your phone number');
      if (parseInt(f.to.value, 10) <= parseInt(f.from.value, 10)) miss.push('a time window that ends after it starts');
      if (miss.length) { err.textContent = 'Please add ' + miss.join(', ') + '.'; err.hidden = false; return; }
      if (P.every(function(x){ return x.a; })) { err.textContent = 'Add-ons go with a treatment: please choose a massage, facial or body treatment too.'; err.hidden = false; return; }
      err.hidden = true;
      var list = P.map(function(x){ return x.t + (x.c ? ' (for two)' : ' (for ' + x.n + (x.n === 1 ? ' person)' : ' people)')); });
      var first = P[0].t.replace(/ · .*$/, ''), win = 'any time between ' + h(f.from.value) + ' and ' + h(f.to.value);
      var msg = 'Hello FootePrints! I would like to book at Audrey’s Spa:\n' + list.map(function(x){ return '• ' + x; }).join('\n') + '\n\n' +
        'Preferred date: ' + nice(f.date.value) + ', ' + win + '.\n' +
        (f.date2.value ? 'Or: ' + nice(f.date2.value) + ', ' + win + '.\n' : '') +
        'Guest: ' + f.guest.value + '.\n' +
        (f.notes.value.trim() ? 'Notes: ' + f.notes.value.trim() + '\n' : '') +
        '\nEstimated total: ' + usd(est.total) + ' (with 10% tax and 15% service charge)\n' +
        '\nIs this available? Please reply to confirm a time.\n\n' +
        f.name.value.trim() + '\n' + f.email.value.trim() + '\n' + f.phone.value.trim();
      var sent = function(){
        f.hidden = true; done.hidden = false;
        if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track('spa-request-done', {treatment: first, count: P.length}); } catch(x){} }
        if (typeof window.fbq === 'function') { try { window.fbq('track', 'Lead', {content_category: 'spa', content_name: first}); } catch(x){} }
      };
      var fs = (f.getAttribute('data-fs') || '').trim();
      if (!fs) { window.open('https://wa.me/18558223591?text=' + encodeURIComponent(msg), '_blank', 'noopener'); sent(); return; }
      var btn = document.getElementById('spa-send'); btn.disabled = true; btn.textContent = 'Sending…';
      var data = {'Treatments': list.join(' | '), 'Estimated total': usd(est.total),
        'Price breakdown': est.lines.map(function(l){ return l[0] + ': ' + (l[0].indexOf('Not sure') === 0 ? 'to be advised' : usd(l[1])); }).join(' | ') + (est.tbc ? ' | (one treatment to be advised)' : ''),
        'Preferred date': nice(f.date.value), 'Other date': nice(f.date2.value) || '-',
        'Time window': h(f.from.value) + ' – ' + h(f.to.value), 'Guest': f.guest.value, 'Notes': f.notes.value.trim() || '-',
        'Name': f.name.value.trim(), 'email': f.email.value.trim(), 'Phone / WhatsApp': f.phone.value.trim(),
        '_email': {subject: 'Spa request: ' + first + (P.length > 1 ? ' + ' + (P.length - 1) + ' more' : '') + ' — ' + shortd(f.date.value) + ', ' + h(f.from.value) + '–' + h(f.to.value), from: 'FootePrints website'}};
      window.fpPost(fs, data)
        .then(function(r){ btn.disabled = false; btn.textContent = 'Send my request'; if (!r.ok) throw new Error('HTTP ' + r.status); try { sent(); } catch(x){} })
        .catch(function(e){ btn.disabled = false; btn.textContent = 'Send my request'; window.fpFail('spa', e);
          err.innerHTML = 'Sorry, that didn’t go through' + window.fpCode(e) + '. <a href="https://wa.me/18558223591?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener">Send it on WhatsApp instead</a>.'; err.hidden = false; });
    });
    window.FP_spa = calc;  // for testing
  })();

  // Job application sheet (v35): Formspark when FS_JOBS is set, otherwise the email app with the same text
  (function(){
    var dlg = document.getElementById('job-sheet'); if (!dlg) return;
    var f = document.getElementById('job-form'), done = document.getElementById('job-done'), err = document.getElementById('job-err');
    var html = document.documentElement;
    function open(){ f.hidden = false; done.hidden = true; err.hidden = true; html.classList.add('sheet-open'); dlg.scrollTop = 0;
      if (dlg.showModal) { try { dlg.showModal(); } catch(e){ dlg.setAttribute('open',''); } } else dlg.setAttribute('open','');
      if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track('job-apply-open'); } catch(x){} } }
    function close(){ html.classList.remove('sheet-open'); if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    dlg.addEventListener('close', function(){ html.classList.remove('sheet-open'); });
    document.addEventListener('click', function(e){
      var t = e.target.closest && e.target.closest('[data-job-open]'); if (!t) return;
      e.preventDefault(); e.stopPropagation(); open(); }, true);
    dlg.addEventListener('click', function(e){ if (e.target === dlg || (e.target.closest && e.target.closest('[data-close]'))) close(); });
    var boxes = f.querySelectorAll('input[name="area"]');
    function areas(){ return Array.prototype.filter.call(boxes, function(b){ return b.checked; }).map(function(b){ return b.value; }); }
    function limit(){ var n = areas().length; Array.prototype.forEach.call(boxes, function(b){ b.disabled = !b.checked && n >= 3; }); }
    Array.prototype.forEach.call(boxes, function(b){ b.addEventListener('change', limit); });
    function val(n){ return (f[n].value || '').trim(); }
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (f.botcheck.checked) return;
      var A = areas(), miss = [];
      if (!A.length) miss.push('at least one area');
      if (!val('type')) miss.push('the type of work');
      if (!val('start')) miss.push('when you can start');
      if (!val('shifts')) miss.push('weekends and holidays');
      if (!val('exp')) miss.push('your experience');
      if (!val('parish')) miss.push('where you live');
      if (!val('permit')) miss.push('the Food Handler’s Permit');
      if (val('about').length < 20) miss.push('a few lines about yourself');
      if (!val('name')) miss.push('your name');
      if (!/^\S+@\S+\.\S+$/.test(val('email'))) miss.push('your email');
      if (val('phone').replace(/\D/g, '').length < 7) miss.push('your phone number');
      if (miss.length) { err.textContent = 'Please add ' + miss.join(', ') + '.'; err.hidden = false; err.scrollIntoView({block: 'center'}); return; }
      if (!f.consent.checked) { err.textContent = 'Please tick the box so we can keep your application.'; err.hidden = false; return; }
      err.hidden = true;
      var cv = val('cv');
      var data = {'Areas': A.join(', '), 'Role in mind': val('role') || '-', 'Type of work': val('type'), 'Available from': val('start'),
        'Weekends, evenings, holidays': val('shifts'), 'Experience': val('exp'), 'Most recent job': val('last') || '-',
        'Lives in': val('parish'), 'Food Handler’s Permit': val('permit'), 'About': val('about'), 'CV / LinkedIn': cv || '-',
        'Name': val('name'), 'email': val('email'), 'Phone / WhatsApp': val('phone'), 'Consent to keep application': 'Yes',
        '_email': {subject: 'Job application: ' + A.join(', ') + ' — ' + val('name') + ' (' + val('parish') + ')', from: 'FootePrints website'}};
      var first = val('name').split(/\s+/)[0];
      var sent = function(){
        f.hidden = true; done.hidden = false; document.getElementById('job-done-h').textContent = 'Thank you, ' + first + '!'; dlg.scrollTop = 0;
        if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track('job-apply-done', {areas: A.join(', ')}); } catch(x){} }
      };
      var text = Object.keys(data).filter(function(k){ return k !== '_email'; }).map(function(k){ return k + ': ' + data[k]; }).join('\n');
      var mail = 'mailto:' + f.getAttribute('data-mail') + '?subject=' + encodeURIComponent(data._email.subject) + '&body=' + encodeURIComponent(text);
      var fs = (f.getAttribute('data-fs') || '').trim();
      if (!fs) { window.location.href = mail; sent(); return; }
      var btn = document.getElementById('job-send'); btn.disabled = true; btn.textContent = 'Sending…';
      window.fpPost(fs, data)
        .then(function(r){ btn.disabled = false; btn.textContent = 'Send my application'; if (!r.ok) throw new Error('HTTP ' + r.status); try { sent(); } catch(x){} })
        .catch(function(e){ btn.disabled = false; btn.textContent = 'Send my application'; window.fpFail('job', e);
          err.innerHTML = 'Sorry, that didn’t go through' + window.fpCode(e) + '. <a href="' + mail + '">Send it from your email app instead</a>.'; err.hidden = false; });
    });
    window.FP_job = {open: open, areas: areas};  // for testing
  })();

  // v45: dining open-now line (Jamaica time)
  (function(){
    var el = document.getElementById('dn-open'); if (!el) return;
    function upd(){
      var d = new Date(Date.now() - 5 * 3600e3), m = d.getUTCHours() * 60 + d.getUTCMinutes(), t, on = true;
      if (m >= 450 && m < 660) t = 'Open now · breakfast at Blushy’s until 11 AM';
      else if (m >= 660 && m < 960) t = 'Open now · lunch at Blushy’s until 6 PM';
      else if (m >= 960 && m < 1080) t = 'Open now · lunch until 6 PM, and happy hour 4 – 6 PM';
      else if (m >= 1080 && m < 1260) t = 'Open now · dinner at Gatsby’s, last seating 9 PM';
      else if (m >= 1260 && m < 1320) t = 'Gatsby’s is open until 10 PM · last guests seated at 9 PM';
      else { on = false; t = 'Closed now · breakfast from 7:30 AM at Blushy’s'; }
      el.querySelector('.on-t').textContent = t; el.classList.toggle('is-closed', !on);
    }
    upd(); setInterval(upd, 60000);
  })();

  // v46: My order — one meal per order (drinks join any meal); kept in this browser only, never sent anywhere
  (function(){
    var KEY = 'fp-order', order = [];
    var MEALS = {Breakfast: {from: 450, to: 660, when: '7:30 – 11 AM', where: 'Blushy’s Bar & Grill'},
                 Lunch: {from: 660, to: 1080, when: '11 AM – 6 PM', where: 'Blushy’s Bar & Grill'},
                 Dinner: {from: 1080, to: 1320, when: '6 – 10 PM, last seating 9 PM', where: 'Gatsby’s Restaurant'}};
    try { order = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch(x){ order = []; }
    if (!Array.isArray(order)) order = [];
    order = order.filter(function(o){ return o && o.name && o.q > 0; }).map(function(o){ if (!o.k) o.k = (o.m === 'Drinks' ? 'drink' : 'food'); return o; });
    (function(){ var m = meal(); if (m !== 'Drinks') order = order.filter(function(o){ return o.k === 'drink' || o.m === m; }); })();
    var dlg = document.getElementById('ord-sheet'); if (!dlg) return;
    var swap = document.getElementById('ord-swap'), pending = null;
    var html = document.documentElement;
    function meal(){ var f = order.filter(function(o){ return o.k === 'food'; })[0]; return f ? f.m : (order.length ? 'Drinks' : ''); }
    function save(){ try { localStorage.setItem(KEY, JSON.stringify(order)); } catch(x){} }
    function cents(p){ return Math.round(parseFloat(p) * 100) || 0; }
    function usd(c){ return '$' + (c / 100).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}); }
    function totals(){ var sub = 0, n = 0; order.forEach(function(o){ sub += cents(o.p) * o.q; n += o.q; });
      var tax = Math.round(sub * 0.10), svc = Math.round(sub * 0.15); return {n: n, sub: sub, tax: tax, svc: svc, total: sub + tax + svc}; }
    function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    function find(name, m){ return order.filter(function(x){ return x.name === name && x.m === m; })[0]; }
    function track(ev, d){ if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track(ev, d); } catch(x){} } }
    function label(m){ return m === 'Drinks' ? 'Drinks order' : m ? m + ' order' : 'My order'; }
    function nowMin(){ var d = new Date(Date.now() - 5 * 3600e3); return d.getUTCHours() * 60 + d.getUTCMinutes(); }
    function drawQty(el){
      var o = find(el.getAttribute('data-add'), el.getAttribute('data-m')), nm = esc(el.getAttribute('data-add'));
      var want = o ? 'n' + o.q : 'z';
      if (el.getAttribute('data-s') === want) return;
      el.setAttribute('data-s', want); el.classList.toggle('in', !!o);
      el.innerHTML = o ? '<button type="button" class="q-btn" data-d="-1" aria-label="One less ' + nm + '">−</button><b aria-live="polite">' + o.q + '</b><button type="button" class="q-btn" data-d="1" aria-label="One more ' + nm + '">+</button>'
                       : '<button type="button" class="q-btn q-plus" data-d="1" aria-label="Add ' + nm + '">+</button>';
    }
    function rows(list){
      return '<ul class="ord-ul">' + list.map(function(o){ var i = order.indexOf(o);
        return '<li><span class="o-n"><b>' + esc(o.name) + '</b><i>' + usd(cents(o.p)) + ' each</i></span>'
          + '<span class="o-q"><button type="button" data-q="-1" data-i="' + i + '" aria-label="One less">−</button><b>' + o.q + '</b><button type="button" data-q="1" data-i="' + i + '" aria-label="One more">+</button></span>'
          + '<span class="o-t">' + usd(cents(o.p) * o.q) + '</span></li>'; }).join('') + '</ul>';
    }
    function split(){ return {food: order.filter(function(o){ return o.k === 'food'; }), drink: order.filter(function(o){ return o.k === 'drink'; })}; }
    function render(){
      var t = totals(), m = meal(), sp = split();
      Array.prototype.forEach.call(document.querySelectorAll('.ord-open'), function(b){
        b.querySelector('.ord-n').textContent = t.n; b.classList.toggle('has', t.n > 0);
        b.querySelector('.ord-lbl').textContent = t.n ? label(m) : 'My order';
        b.querySelector('.ord-hint').textContent = t.n ? usd(t.total) + ' with tax and service' : 'Nothing added yet'; });
      Array.prototype.forEach.call(document.querySelectorAll('.qty'), drawQty);
      document.getElementById('ord-h').textContent = t.n ? label(m) : 'My order';
      var L = document.getElementById('ord-list');
      if (!order.length) { L.innerHTML = '<p class="ord-empty">Your order is empty. Open a menu and tap <b>+</b> next to a dish.</p>'; }
      else {
        var info = MEALS[m], now = nowMin(), note = '';
        if (info) note = '<p class="ord-meal">' + esc(m) + ' · ' + esc(info.where) + ' · ' + esc(info.when)
          + ((now < info.from || now >= info.to) ? '<br><span>' + esc(m) + ' isn’t being served right now. Keep this list for later.</span>' : '') + '</p>';
        L.innerHTML = note
          + (sp.food.length && sp.drink.length ? '<h3 class="ord-sub">Food</h3>' : '') + (sp.food.length ? rows(sp.food) : '')
          + (sp.drink.length && sp.food.length ? '<h3 class="ord-sub">Drinks</h3>' : '') + (sp.drink.length ? rows(sp.drink) : '')
          + '<ul class="ord-sum"><li><span>Subtotal</span><b>' + usd(t.sub) + '</b></li><li><span>Government tax, 10%</span><b>' + usd(t.tax) + '</b></li>'
          + '<li><span>Service charge, 15%</span><b>' + usd(t.svc) + '</b></li><li class="tot"><span>Estimated total</span><b>' + usd(t.total) + '</b></li></ul>'
          + '<p class="fine">Prices in US dollars. Extras, seasonal dishes and your final bill are confirmed by your server.</p>';
      }
      document.getElementById('ord-show').disabled = !order.length; document.getElementById('ord-clear').disabled = !order.length;
    }
    function showDlg(d){ html.classList.add('sheet-open'); if (d.showModal) { try { d.showModal(); } catch(x){ d.setAttribute('open',''); } } else d.setAttribute('open',''); }
    function hideDlg(d){ if (d.close) { try { d.close(); } catch(x){} } d.removeAttribute('open');
      if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); }
    function open(){ document.getElementById('ord-big').hidden = true; dlg.querySelector('.sheet-in').hidden = false; dlg.scrollTop = 0; showDlg(dlg); track('order-open', {items: totals().n}); }
    function doAdd(it){
      var o = find(it.name, it.m);
      if (o) o.q += 1; else order.push({name: it.name, p: it.p, m: it.m, k: it.k, q: 1});
      save(); render(); track('order-add', {dish: it.name, meal: it.m});
    }
    function add(el){
      var it = {name: el.getAttribute('data-add'), p: el.getAttribute('data-p'), m: el.getAttribute('data-m'), k: el.getAttribute('data-k') || 'food'};
      var m = meal();
      if (it.k === 'food' && m && m !== 'Drinks' && m !== it.m) {   // another meal: ask before replacing
        pending = it;
        document.getElementById('swap-t').innerHTML = 'Your order is for <b>' + esc(m.toLowerCase()) + '</b>. One order holds one meal, so your server sees exactly what to bring. '
          + 'Start a new <b>' + esc(it.m.toLowerCase()) + '</b> order? Your ' + esc(m.toLowerCase()) + ' dishes will be removed; drinks stay.';
        document.getElementById('swap-yes').textContent = 'Start a ' + it.m.toLowerCase() + ' order';
        document.getElementById('swap-no').textContent = 'Keep my ' + m.toLowerCase() + ' order';
        showDlg(swap); return;
      }
      doAdd(it);
    }
    function less(name, m){ var o = find(name, m); if (!o) return; o.q -= 1; if (o.q <= 0) order.splice(order.indexOf(o), 1); save(); render(); }
    document.getElementById('swap-yes').addEventListener('click', function(){
      order = order.filter(function(o){ return o.k === 'drink'; }); var it = pending; pending = null; hideDlg(swap); if (it) doAdd(it); track('order-new-meal', {meal: it && it.m}); });
    document.getElementById('swap-no').addEventListener('click', function(){ pending = null; hideDlg(swap); });
    swap.addEventListener('click', function(e){ if (e.target === swap || (e.target.closest && e.target.closest('[data-close]'))) { pending = null; hideDlg(swap); } });
    swap.addEventListener('close', function(){ if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); });
    dlg.addEventListener('close', function(){ if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); });
    dlg.addEventListener('click', function(e){
      if (e.target === dlg || (e.target.closest && e.target.closest('[data-close]'))) { hideDlg(dlg); return; }
      var q = e.target.closest && e.target.closest('[data-q]');
      if (q) { var i = +q.getAttribute('data-i'); order[i].q += +q.getAttribute('data-q'); if (order[i].q <= 0) order.splice(i, 1); save(); render(); }
    });
    document.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('.qty [data-d]');
      if (b) { var el = b.closest('.qty'); if (b.getAttribute('data-d') === '1') add(el); else less(el.getAttribute('data-add'), el.getAttribute('data-m'));
        var nb = el.querySelector(b.getAttribute('data-d') === '1' ? '[data-d="1"]' : '[data-d="-1"]') || el.querySelector('[data-d]'); if (nb) nb.focus({preventScroll: true});
        return; }
      if (e.target.closest && e.target.closest('.ord-open')) { e.preventDefault(); open(); return; }
      var z = e.target.closest && e.target.closest('[data-zoom]');
      if (z) { var zd = document.getElementById('zoom-dlg'); zd.querySelector('img').src = z.getAttribute('data-zoom'); showDlg(zd); }
    });
    var zd = document.getElementById('zoom-dlg');
    zd.addEventListener('click', function(){ hideDlg(zd); });
    document.addEventListener('keydown', function(e){ var t = e.target; if ((e.key === 'Enter' || e.key === ' ') && t.classList && t.classList.contains('mt-ph')) { e.preventDefault(); t.click(); } });
    document.getElementById('ord-clear').addEventListener('click', function(){ order = []; save(); render(); track('order-clear'); });
    document.getElementById('ord-show').addEventListener('click', function(){
      var t = totals(), m = meal(), sp = split(), info = MEALS[m];
      function big(list){ return '<ul class="big-ul">' + list.map(function(o){ return '<li><b>' + o.q + ' ×</b> ' + esc(o.name) + '</li>'; }).join('') + '</ul>'; }
      document.getElementById('ord-big-list').innerHTML = '<p class="big-meal">' + esc(m) + (info ? ' · ' + esc(info.where) : '') + '</p>'
        + (sp.food.length ? (sp.drink.length ? '<h3 class="ord-sub">Food</h3>' : '') + big(sp.food) : '')
        + (sp.drink.length ? (sp.food.length ? '<h3 class="ord-sub">Drinks</h3>' : '') + big(sp.drink) : '')
        + '<p class="big-tot">Estimated total ' + usd(t.total) + '</p><p class="fine">Including 10% tax and 15% service. Thank you!</p>';
      dlg.querySelector('.sheet-in').hidden = true; document.getElementById('ord-big').hidden = false; dlg.scrollTop = 0;
      track('order-show', {items: t.n, meal: m});
    });
    document.getElementById('ord-back').addEventListener('click', function(){ document.getElementById('ord-big').hidden = true; dlg.querySelector('.sheet-in').hidden = false; });
    render();
    window.addEventListener('storage', function(e){ if (e.key === KEY) { try { order = JSON.parse(e.newValue || '[]') || []; } catch(x){ order = []; } render(); } });
    window.FP_order = {get: function(){ return order; }, totals: totals, meal: meal};
  })();


  // v48: Doctor Bird — a conversation. Scripted, no AI: it answers only from the site's own answers,
  // sends "book / apply / collaborate" questions to the right place, and says so when it doesn't know.
  (function(){
    var dlg = document.getElementById('bird'), raw = document.getElementById('bird-data') || (window.FP_BIRD ? {textContent: JSON.stringify(window.FP_BIRD)} : null); if (!dlg || !raw) return;
    var D; try { D = JSON.parse(raw.textContent); } catch(x){ return; }
    var html = document.documentElement, log = document.getElementById('bird-log'), form = document.getElementById('bird-ask'), q = document.getElementById('bird-q');
    var fab = document.getElementById('bird-fab'), started = false, lastTopic = '';
    var TOP = {}; D.topics.forEach(function(t){ TOP[t.k] = t; });
    var VIEW = {stay: 'stay', daypass: 'daypass', dining: 'dining', 'menu-breakfast': 'dining', 'menu-lunch': 'dining', 'menu-dinner': 'dining', 'menu-drinks': 'dining',
                spa: 'spa', events: 'events', retreats: 'retreats', soundscape: 'soundscape', work: 'work'};
    var WA = 'https://wa.me/18558223591', MAIL = 'frontdesk@negrilfooteprints.com';
    var BIRD = fab.querySelector('svg').outerHTML;
    var STOP = ('a an the i we you u do does did is are am was can could my our your to for of in on at and or it its what whats how there have has with me be will would '
      + 'if any this that please pls hi hello hey tell know about want like need wondering question ask im just also so does doe yall').split(' ');
    var SYN = [['price','prices','cost','costs','rate','rates','much','fee','fees','charge','expensive','cheap'], ['child','children','kid','kids','baby','babies','toddler','toddlers','family','infant'],
      ['food','eat','eating','restaurant','meal','meals','dining'], ['wedding','weddings','marry','married','marriage','bride','vow','vows','elope'],
      ['spa','massage','massages','treatment','treatments','facial'], ['airport','transfer','transfers','drive','taxi','shuttle','pickup','mbj','montego'],
      ['pay','paying','payment','card','cards','cash','cashless'], ['party','parties','birthday','birthdays','celebration','celebrate','anniversary','shower'],
      ['drink','drinks','bar','cocktail','cocktails','alcohol'], ['retreat','retreats','corporate','company','team','conference','meeting','offsite'],
      ['checkin','arrive','arrival','checkout'], ['beach','pool','lounger','loungers','swim','swimming'], ['vegan','vegetarian','gluten','allergy','allergies','allergic'],
      ['hour','hours','open','opening','close','closing','closes','opens','time','times'], ['contact','phone','call','email','whatsapp','number','reach'],
      ['allinclusive','inclusive','included','include','includes'], ['rain','raining','rains','weather']];
    function norm(t){ return String(t).toLowerCase().replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/[’']/g, '')
      .replace(/wi[- ]?fi\b/g, 'wifi').replace(/check[- ]?in\b/g, 'checkin').replace(/check[- ]?out\b/g, 'checkout').replace(/day[- ]?pass(es)?\b/g, 'daypass').replace(/all[- ]?inclusive/g, 'allinclusive')
      .replace(/[^a-z0-9$&]+/g, ' ').trim(); }
    function words(t){ return norm(t).split(' ').filter(function(w){ return w && STOP.indexOf(w) < 0; }); }
    D.items.forEach(function(it){ it.wq = words(it.q + ' ' + it.s + ' ' + TOP[it.t].n + ' ' + (it.k || '')); it.wa = words(it.a + ' ' + (it.h || '')); it.wqq = words(it.q); });
    function syn(w){ for (var i = 0; i < SYN.length; i++) if (SYN[i].indexOf(w) >= 0) return SYN[i]; return [w]; }
    function hit(list, w){ for (var i = 0; i < list.length; i++) { var x = list[i]; if (x === w) return 2; if (w.length >= 4 && x.indexOf(w) === 0) return 1; } return 0; }
    function rank(text, prefer){
      var ws = words(text); if (!ws.length) return {ws: ws, list: []};
      var list = D.items.map(function(it, i){
        var sc = 0, inQ = 0, any = 0;
        ws.forEach(function(w){ var bq = 0, ba = 0;
          syn(w).forEach(function(v){ var f = v === w ? 1 : .7; bq = Math.max(bq, f * hit(it.wq, v)); ba = Math.max(ba, f * (hit(it.wa, v) ? 1 : 0)); });
          if (bq) inQ++; if (bq || ba) any++; sc += bq * 3 + ba + (syn(w).some(function(v){ return hit(it.wqq, v); }) ? 1.5 : 0); });
        if (prefer && it.t === prefer && sc) sc += 1.5;
        return {i: i, sc: sc, inQ: inQ, cov: any / ws.length};
      }).filter(function(r){ return r.sc > 0; }).sort(function(a, b){ return b.sc - a.sc; });
      return {ws: ws, list: list};
    }
    function back(i, ws){  // how much of the matched question is in the message (1 = they asked exactly this)
      var qw = words(D.items[i].q); if (!qw.length) return 0;
      return qw.filter(function(x){ return ws.some(function(w){ return syn(w).some(function(v){ return v === x || (v.length >= 4 && x.indexOf(v) === 0) || (x.length >= 4 && v.indexOf(x) === 0); }); }); }).length / qw.length;
    }
    function route(text){
      var ws = norm(text).split(' ');
      for (var i = 0; i < D.routes.length; i++) { var r = D.routes[i];
        if ((r.not || []).some(function(w){ return ws.indexOf(w) >= 0; })) continue;
        if (r.need.every(function(g){ return g.some(function(w){ return ws.indexOf(w) >= 0; }); })) return r; }
      return null;
    }
    function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    function track(ev, d){ if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track(ev, d); } catch(x){} } }
    function paras(a){ return a.split('\n\n').map(function(p){ return '<p>' + p + '</p>'; }).join(''); }
    function btns(ls){ return ls.length ? '<div class="bm-acts">' + ls.map(function(l){ var ext = !/^#/.test(l[1]);
      return '<a class="bm-a" href="' + esc(l[1]) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + l[0] + ' →</a>'; }).join('') + '</div>' : ''; }
    function chips(list){ return list.length ? '<div class="bm-chips">' + list.map(function(c){
      return '<button type="button" class="bm-c"' + (c.i != null ? ' data-ask-i="' + c.i + '"' : '') + (c.t ? ' data-topic="' + c.t + '"' : '') + (c.all ? ' data-topics' : '') + '>' + esc(c.n) + '</button>'; }).join('') + '</div>' : ''; }
    function team(text){
      var msg = 'Hello FootePrints! I have a question' + (text ? ': ' + text : '.');
      return '<div class="bm-acts"><a class="bm-a main" href="' + WA + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener" data-bird-ev="bird-whatsapp">WhatsApp the team →</a>'
        + '<a class="bm-a" href="mailto:' + MAIL + '?subject=' + encodeURIComponent('A question') + '&body=' + encodeURIComponent(msg) + '" data-bird-ev="bird-email">Email →</a></div>';
    }
    function scroll(){ log.scrollTop = log.scrollHeight; }
    function me(text){ log.insertAdjacentHTML('beforeend', '<div class="bm me"><p>' + esc(text) + '</p></div>'); scroll(); }
    function bird(inner, fast){
      var el = document.createElement('div'); el.className = 'bm bot';
      el.innerHTML = '<span class="bm-av">' + BIRD + '</span><div class="bm-b"><span class="typing" aria-label="Doctor Bird is typing"><i></i><i></i><i></i></span></div>';
      log.appendChild(el); scroll();
      var go = function(){ el.querySelector('.bm-b').innerHTML = inner; var top = el.offsetTop - 12; log.scrollTop = Math.max(0, Math.min(top, log.scrollHeight)); };
      if (fast || matchMedia('(prefers-reduced-motion: reduce)').matches) go(); else setTimeout(go, 450);
    }
    function pageLink(it){ var tp = TOP[it.t]; return (tp.h && !it.l.some(function(l){ return l[1] === tp.h; })) ? [[ 'More on ' + tp.n, tp.h ]] : []; }
    function answerItem(i, related){
      var it = D.items[i];
      bird('<p class="bm-q">' + it.q + '</p>' + (it.h || paras(it.a))
        + (it.n && it.n.length ? '<div class="bm-note"><b>Good to know</b><ul>' + it.n.map(function(x){ return '<li>' + x + '</li>'; }).join('') + '</ul></div>' : '')
        + btns(it.l.concat(pageLink(it)))
        + (related && related.length ? '<p class="bm-k">People also ask</p>' + chips(related.map(function(j){ return {i: j, n: D.items[j].q}; })) : ''));
      lastTopic = it.t; track('bird-answer', {q: it.q.slice(0, 80)});
    }
    function greet(){
      bird('<p>Hi, I’m <strong>Doctor Bird</strong>, named after Jamaica’s national bird. Ask me anything about FootePrints: rooms, the Day Pass, dinner, the spa, weddings, retreats, working with us.</p>'
        + '<p>Type your question below, or tap one of these:</p>'
        + chips(D.start.map(function(i){ return {i: i, n: D.items[i].q}; }).concat([{all: 1, n: 'See all topics'}])), true);
    }
    function topics(){ bird('<p>Pick a topic and I’ll show you what guests usually ask.</p>' + chips(D.topics.map(function(t){ return {t: t.k, n: t.n}; }))); }
    function topic(k){
      var t = TOP[k]; if (!t) return topics(); lastTopic = k;
      var list = []; D.items.forEach(function(it, i){ if (it.t === k) list.push({i: i, n: (it.s ? it.s + ': ' : '') + it.q}); });
      bird('<p>Here’s what guests ask about <strong>' + esc(t.n) + '</strong>. Tap a question, or type your own.</p>' + chips(list) + (t.h ? btns([['Open the ' + t.n + ' page', t.h]]) : ''));
      track('bird-topic', {topic: k});
    }
    function small(text){
      var n = norm(text);
      if (/^(hi|hello|hey|good (morning|afternoon|evening)|yo|wah gwaan|wha gwan)( there)?$/.test(n)) return 'Hello! What would you like to know? You can ask about rooms, the Day Pass, dinner, the spa, weddings and more.';
      if (/^(thanks|thank you|thank u|ty|great|ok|okay|perfect|cool|nice)( so much| very much)?$/.test(n)) return 'You’re welcome! Anything else, just ask. We hope to see you on Seven Mile Beach soon.';
      if (/(human|person|someone|somebody|agent|staff|speak to|talk to|reception)/.test(n)) return 'HUMAN';
      return '';
    }
    function reply(text){
      var sm = small(text);
      if (sm === 'HUMAN') { bird('<p>Of course. Our team is happy to help: message them on WhatsApp or send an email.</p>' + team(text)); track('bird-human'); return; }
      if (sm) { bird('<p>' + sm + '</p>'); return; }
      var r = route(text), R = rank(text, lastTopic || VIEW[fpKey()]);
      var top = R.list[0];
      var strong = top && top.inQ >= 1 && top.cov >= .6 && (R.ws.length < 3 || top.inQ >= 2 || top.cov >= .8);
      if (r && !(strong && back(top.i, R.ws) >= .75)) {
        bird(paras(r.a) + btns(r.l) + (top ? '<p class="bm-k">You might also want</p>' + chips(R.list.slice(0, 2).map(function(x){ return {i: x.i, n: D.items[x.i].q}; })) : ''));
        track('bird-route', {to: (r.l[0] || [''])[1].slice(0, 60)}); return;
      }
      if (strong) {
        var rel = R.list.slice(1, 6).filter(function(x){ return x.sc >= top.sc * .45; }).slice(0, 3).map(function(x){ return x.i; });
        answerItem(top.i, rel); return;
      }
      if (top && top.sc >= 3) {
        bird('<p>I’m not completely sure I understood. Did you mean one of these?</p>' + chips(R.list.slice(0, 4).map(function(x){ return {i: x.i, n: D.items[x.i].q}; }))
          + '<p class="bm-k">Or ask our team</p>' + team(text));
        track('bird-unsure', {q: text.slice(0, 60)}); return;
      }
      bird('<p>I don’t know that one yet, sorry. Our team will: send them your question and they’ll get back to you.</p>' + team(text)
        + '<p class="bm-k">Or browse what I do know</p>' + chips([{all: 1, n: 'See all topics'}]));
      var t = text.slice(0, 60); if (!/@|\d{5}/.test(t)) track('bird-nomatch', {q: t});
    }
    function ask(text){ text = String(text || '').trim(); if (!text) return; me(text); reply(text); }
    form.addEventListener('submit', function(e){ e.preventDefault(); var v = q.value; q.value = ''; ask(v); });
    function open(k){
      html.classList.add('sheet-open'); try { dlg.showModal(); } catch(x){ dlg.setAttribute('open', ''); }
      if (!started) { started = true; greet(); }
      if (k && TOP[k] && k !== lastTopic) topic(k);
      setTimeout(scroll, 30);
      if (matchMedia('(hover:hover) and (pointer:fine)').matches) q.focus(); else dlg.querySelector('.bird-top .x').focus({preventScroll: true});
      track('bird-open', {from: fpKey(), topic: k || ''});
    }
    function close(){ try { dlg.close(); } catch(x){} dlg.removeAttribute('open'); if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); }
    dlg.addEventListener('close', function(){ if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); });
    document.addEventListener('click', function(e){
      var o = e.target.closest && e.target.closest('[data-bird-open]');
      if (o) { e.preventDefault(); var k = o.getAttribute('data-bird-open') || (o.id === 'bird-fab' ? '' : VIEW[fpKey()]); open(k); }
    });
    dlg.addEventListener('click', function(e){
      if (e.target === dlg || (e.target.closest && e.target.closest('[data-bird-close]'))) { close(); return; }
      var c = e.target.closest && e.target.closest('.bm-c');
      if (c) { if (c.hasAttribute('data-topics')) { me('See all topics'); topics(); }
               else if (c.hasAttribute('data-topic')) { me(c.textContent); topic(c.getAttribute('data-topic')); }
               else { var i = +c.getAttribute('data-ask-i'); me(D.items[i].q); answerItem(i, []); }
               return; }
      var ev = e.target.closest && e.target.closest('[data-bird-ev]'); if (ev) track(ev.getAttribute('data-bird-ev'));
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (a) { var h = a.getAttribute('href'); track('bird-go', {to: h.slice(1)}); close(); if (h === location.hash) { e.preventDefault(); window.scrollTo(0, 0); } }
      else if (e.target.closest && e.target.closest('a.bm-a')) track('bird-go', {to: (e.target.closest('a').getAttribute('href') || '').slice(0, 60)});
    });
    function fabState(){ var k = fpKey(); fab.classList.toggle('mini', !!k && k !== 'home'); }
    window.addEventListener('hashchange', fabState); fabState();
    window.FP_bird = {ask: ask, rank: rank, route: route, back: back, open: open, data: D};
  })();


  // v56: staff reels play silently only while on screen (not with reduced motion)
  (function(){
    var vids = document.querySelectorAll('.tm video'); if (!vids.length || !('IntersectionObserver' in window)) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var io = new IntersectionObserver(function(es){ es.forEach(function(en){ var v = en.target;
      if (en.isIntersecting) { if (!v.src) v.src = v.getAttribute('data-src'); var p = v.play(); if (p && p.catch) p.catch(function(){}); }
      else v.pause(); }); }, {threshold: .5});
    Array.prototype.forEach.call(vids, function(v){ io.observe(v); });
  })();


  // v57: tap a staff card -> the reel plays here, in Instagram's own embedded player
  (function(){
    var dlg = document.getElementById('reel-dlg'); if (!dlg) return;
    var box = dlg.querySelector('.reel-frame'), ig = dlg.querySelector('.reel-ig'), html = document.documentElement;
    function embed(u){ var m = String(u).match(/instagram\.com\/(?:[^\/]+\/)?(reel|reels|p)\/([A-Za-z0-9_-]+)/); return m ? 'https://www.instagram.com/' + (m[1] === 'p' ? 'p' : 'reel') + '/' + m[2] + '/embed/' : ''; }
    function close(){ box.innerHTML = ''; try { dlg.close(); } catch(x){} dlg.removeAttribute('open'); if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); }
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('.tm[data-reel]'); if (!a) return;
      var src = embed(a.getAttribute('data-reel')); if (!src) return;
      e.preventDefault();
      box.innerHTML = '<iframe src="' + src + '" title="' + (a.getAttribute('data-name') || 'Video') + ' on Instagram" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe>';
      ig.href = a.getAttribute('data-reel');
      html.classList.add('sheet-open'); try { dlg.showModal(); } catch(x){ dlg.setAttribute('open', ''); }
      if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track('team-reel-play', {who: a.getAttribute('data-name')}); } catch(x){} }
    });
    dlg.addEventListener('click', function(e){ if (e.target === dlg || (e.target.closest && e.target.closest('[data-close]'))) close(); });
    dlg.addEventListener('close', function(){ box.innerHTML = ''; if (!document.querySelector('dialog[open]')) html.classList.remove('sheet-open'); });
  })();

  // v46: the active section chip follows the scroll on the menus
  (function(){
    if (!('IntersectionObserver' in window)) return;
    Array.prototype.forEach.call(document.querySelectorAll('.menu-view'), function(v){
      var chips = v.querySelectorAll('.chips .chip'), sc = v.querySelector('.chips .scroller');
      var io = new IntersectionObserver(function(es){
        es.forEach(function(en){ if (!en.isIntersecting) return;
          Array.prototype.forEach.call(chips, function(c){
            var on = c.getAttribute('data-jump') === en.target.id; c.classList.toggle('is-on', on);
            if (on && sc) sc.scrollTo({left: c.offsetLeft - 18, behavior: 'smooth'}); }); });
      }, {rootMargin: '-120px 0px -60% 0px'});
      Array.prototype.forEach.call(v.querySelectorAll('.menu-group'), function(g){ io.observe(g); });
    });
  })();

  // v41: confirm email — runs before every form's own submit handler
  document.addEventListener('submit', function(e){
    var f = e.target; if (!f || !f.email2 || !f.email) return;
    var a = (f.email.value || '').trim().toLowerCase(), b = (f.email2.value || '').trim().toLowerCase();
    if (a && a === b) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var err = f.querySelector('.form-err');
    if (err) { err.textContent = b ? 'The two email addresses don’t match. Please check them.' : 'Please type your email a second time to confirm it.'; err.hidden = false; err.scrollIntoView({block: 'center'}); }
    f.email2.focus();
  }, true);
  Array.prototype.forEach.call(document.querySelectorAll('input[name="email2"]'), function(i){
    i.addEventListener('blur', function(){ var f = i.form, ok = !i.value || i.value.trim().toLowerCase() === (f.email.value || '').trim().toLowerCase(); i.classList.toggle('bad', !ok); });
  });

  // v41: request sheets (corporate retreats, retreat partners) -> Formspark, email fallback
  Array.prototype.forEach.call(document.querySelectorAll('.rq-sheet'), function(dlg){
    var f = dlg.querySelector('form'), done = dlg.querySelector('.sheet-done'), err = f.querySelector('.form-err'), key = f.getAttribute('data-key'), html = document.documentElement;
    function open(){ f.hidden = false; done.hidden = true; err.hidden = true; html.classList.add('sheet-open'); dlg.scrollTop = 0;
      if (dlg.showModal) { try { dlg.showModal(); } catch(x){ dlg.setAttribute('open',''); } } else dlg.setAttribute('open','');
      if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track(key + '-open'); } catch(x){} } }
    function close(){ html.classList.remove('sheet-open'); if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    dlg.addEventListener('close', function(){ html.classList.remove('sheet-open'); });
    document.addEventListener('click', function(e){ var t = e.target.closest && e.target.closest('[data-' + key + '-open]'); if (!t) return; e.preventDefault();
      var pre = t.getAttribute('data-' + key + '-open'); if (pre && f.type) { var r = f.querySelector('input[name="type"][value="' + pre + '"]'); if (r) { r.checked = true; r.dispatchEvent(new Event('change', {bubbles: true})); } }
      open(); }, true);
    var wed = f.querySelector('.if-wed'); if (wed) { var syncW = function(){ var v = (f.querySelector('input[name="type"]:checked') || {}).value; wed.hidden = v !== 'Wedding'; };
      f.addEventListener('change', function(e){ if (e.target.name === 'type') syncW(); }); syncW(); }
    dlg.addEventListener('click', function(e){ if (e.target === dlg || (e.target.closest && e.target.closest('[data-close]'))) close(); });
    var today = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);
    Array.prototype.forEach.call(f.querySelectorAll('input[type="date"]'), function(d){ d.min = today; });
    function nice(v){ return v ? new Date(v + 'T12:00:00').toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric', year:'numeric'}) : ''; }
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (f.botcheck.checked) return;
      var miss = [];
      Array.prototype.forEach.call(f.querySelectorAll('[required]'), function(x){
        if (x.name === 'email' || x.name === 'email2') return;
        if (!(x.value || '').trim()) { var l = x.closest('label'); miss.push(((l && (l.querySelector('span') || l).firstChild.textContent) || x.name).trim().replace(/\?$/, '').toLowerCase()); } });
      if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) miss.push('your email');
      if (f.phone && f.phone.value.replace(/\D/g, '').length < 7) miss.push('your phone number');
      if (miss.length) { err.textContent = 'Please add: ' + miss.join(', ') + '.'; err.hidden = false; err.scrollIntoView({block: 'center'}); return; }
      err.hidden = true;
      var data = {}, subj;
      var checked = function(n){ return Array.prototype.filter.call(f.querySelectorAll('input[name="' + n + '"]:checked'), function(b){ return true; }).map(function(b){ return b.value; }).join(', '); };
      if (key === 'cel') {
        var type = (f.querySelector('input[name="type"]:checked') || {}).value || 'Celebration';
        var when = f.date.value ? nice(f.date.value) : 'Not set';
        data = {'Celebrating': type, 'Wedding package': type === 'Wedding' ? (f.pkg.value || 'Not chosen') : '-', 'Date': when + (f.flex.checked ? ' (flexible)' : ''),
                'Guests': f.guests.value, 'Where': checked('where') || '-', 'Rooms for guests': f.rooms.value, 'Notes': f.notes.value.trim() || '-'};
        subj = type + ': ' + f.guests.value + ' guests, ' + when + ' — ' + f.name.value.trim();
      } else if (key === 'corp') {
        var dates = f.from.value ? nice(f.from.value) + (f.to.value ? ' – ' + nice(f.to.value) : '') : 'Not set';
        data = {'Company': f.company.value.trim(), 'Trip': f.kind.value, 'Dates': dates + (f.flex.checked ? ' (flexible)' : ''), 'Group size': f.guests.value,
                'Would like': checked('needs') || '-', 'Notes': f.notes.value.trim() || '-'};
        subj = 'Corporate retreat: ' + f.company.value.trim() + ' — ' + f.guests.value + ' people, ' + dates;
      } else if (key === 'grp') {
        var occ = (f.querySelector('input[name="type"]:checked') || {}).value || 'Dinner';
        var day = f.date.value ? nice(f.date.value) : 'Not set';
        data = {'Date': day, 'Time': f.time.value, 'Guests': f.guests.value, 'Occasion': occ, 'We are': f.who.value, 'Notes': f.notes.value.trim() || '-'};
        subj = 'Group dinner at Gatsby’s: ' + f.guests.value + ' guests, ' + day + ', ' + f.time.value + ' — ' + f.name.value.trim();
      } else {
        data = {'Brand / community': f.org.value.trim(), 'Link': f.link.value.trim() || '-', 'Event': f.kind.value, 'When': f.when.value.trim(),
                'Guests': f.guests.value, 'Staying at the hotel': f.stay.value, 'Idea': f.idea.value.trim(), 'Run before': f.before.value.trim() || '-'};
        subj = 'Retreat partnership: ' + f.kind.value + ' — ' + f.org.value.trim() + ' (' + f.when.value.trim() + ')';
      }
      data['Name'] = f.name.value.trim(); data['email'] = f.email.value.trim(); data['Phone / WhatsApp'] = f.phone.value.trim();
      data._email = {subject: subj, from: 'FootePrints website'};
      var first = f.name.value.trim().split(/\s+/)[0];
      var sent = function(){ f.hidden = true; done.hidden = false; dlg.querySelector('.done-h').textContent = 'Thank you, ' + first + '!'; dlg.scrollTop = 0;
        if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track(key + '-request-done'); } catch(x){} }
        if (typeof window.fbq === 'function') { try { window.fbq('track', 'Lead', {content_category: key === 'corp' ? 'corporate retreat' : (key === 'cel' ? 'celebration' : (key === 'grp' ? 'group dinner' : 'retreat partnership'))}); } catch(x){} } };
      var text = Object.keys(data).filter(function(k){ return k !== '_email'; }).map(function(k){ return k + ': ' + data[k]; }).join('\n');
      var mail = 'mailto:' + f.getAttribute('data-mail') + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(text);
      var fs = (f.getAttribute('data-fs') || '').trim();
      if (!fs) { window.location.href = mail; sent(); return; }
      var btn = f.querySelector('.rq-send'), label = btn.textContent; btn.disabled = true; btn.textContent = 'Sending…';
      window.fpPost(fs, data)
        .then(function(r){ btn.disabled = false; btn.textContent = label; if (!r.ok) throw new Error('HTTP ' + r.status); try { sent(); } catch(x){} })
        .catch(function(e){ btn.disabled = false; btn.textContent = label; window.fpFail(key, e);
          err.innerHTML = 'Sorry, that didn’t go through' + window.fpCode(e) + '. <a href="' + mail + '">Send it from your email app instead</a>.'; err.hidden = false; });
    });
  });
  (function(){  // celebrations bar follows the chapter in view
    var bar = document.getElementById('ev-bar'); if (!bar || !('IntersectionObserver' in window)) return;
    var map = {'ev-wed': 'wed', 'ev-party': 'party', 'ev-dinner': 'dinner'}, seen = {};
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ seen[e.target.id] = e.isIntersecting; });
      var ctx = ''; ['ev-wed', 'ev-party', 'ev-dinner'].forEach(function(id){ if (!ctx && seen[id]) ctx = map[id]; });
      if (ctx) bar.setAttribute('data-ctx', ctx); else bar.removeAttribute('data-ctx'); }, {rootMargin: '-45% 0px -45% 0px'});
    Object.keys(map).forEach(function(id){ var el = document.getElementById(id); if (el) io.observe(el); });
  })();
  (function(){  // retreats bar follows the chapter in view
    var bar = document.getElementById('rt-bar'); if (!bar || !('IntersectionObserver' in window)) return;
    var map = {'rt-corp': 'corp', 'rt-host': 'host'}, seen = {};
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ seen[e.target.id] = e.isIntersecting; });
      var ctx = ''; ['rt-corp', 'rt-host'].forEach(function(id){ if (!ctx && seen[id]) ctx = map[id]; });
      if (ctx) bar.setAttribute('data-ctx', ctx); else bar.removeAttribute('data-ctx'); }, {rootMargin: '-45% 0px -45% 0px'});
    Object.keys(map).forEach(function(id){ var el = document.getElementById(id); if (el) io.observe(el); });
  })();

  // Soundscape early list (v39): Formspark when FS_SS is set, otherwise the email app
  (function(){
    var dlg = document.getElementById('ss-sheet'); if (!dlg) return;
    var f = document.getElementById('ss-form'), done = document.getElementById('ss-done'), err = document.getElementById('ss-err'), html = document.documentElement;
    function open(){ f.hidden = false; done.hidden = true; err.hidden = true; html.classList.add('sheet-open'); dlg.scrollTop = 0;
      if (dlg.showModal) { try { dlg.showModal(); } catch(e){ dlg.setAttribute('open',''); } } else dlg.setAttribute('open',''); }
    function close(){ html.classList.remove('sheet-open'); if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    dlg.addEventListener('close', function(){ html.classList.remove('sheet-open'); });
    document.addEventListener('click', function(e){ var t = e.target.closest && e.target.closest('[data-ss-open]'); if (!t) return; e.preventDefault(); open(); }, true);
    dlg.addEventListener('click', function(e){ if (e.target === dlg || (e.target.closest && e.target.closest('[data-close]'))) close(); });
    function val(n){ return (f[n].value || '').trim(); }
    f.addEventListener('submit', function(e){
      e.preventDefault();
      if (f.botcheck.checked) return;
      var miss = [];
      if (!val('name')) miss.push('your name');
      if (!/^\S+@\S+\.\S+$/.test(val('email'))) miss.push('your email');
      if (miss.length) { err.textContent = 'Please add ' + miss.join(' and ') + '.'; err.hidden = false; return; }
      if (!f.consent.checked) { err.textContent = 'Please tick the box so we can email you when tickets open.'; err.hidden = false; return; }
      err.hidden = true;
      var interest = (f.querySelector('input[name="interest"]:checked') || {}).value || 'Not sure yet';
      var data = {'Interested in': interest, 'Group size': val('size'), 'Name': val('name'), 'email': val('email'), 'WhatsApp': val('phone') || '-', 'Consent to email': 'Yes',
        '_email': {subject: 'Soundscape early list: ' + interest + ' — ' + val('name'), from: 'FootePrints website'}};
      var first = val('name').split(/\s+/)[0];
      var sent = function(){
        f.hidden = true; done.hidden = false; document.getElementById('ss-done-h').textContent = 'You’re on the list, ' + first + '!'; dlg.scrollTop = 0;
        if (window.umami && typeof window.umami.track === 'function') { try { window.umami.track('soundscape-list-done', {interest: interest}); } catch(x){} }
        if (typeof window.fbq === 'function') { try { window.fbq('track', 'Lead', {content_category: 'soundscape', content_name: interest}); } catch(x){} }
      };
      var text = Object.keys(data).filter(function(k){ return k !== '_email'; }).map(function(k){ return k + ': ' + data[k]; }).join('\n');
      var mail = 'mailto:' + f.getAttribute('data-mail') + '?subject=' + encodeURIComponent(data._email.subject) + '&body=' + encodeURIComponent(text);
      var fs = (f.getAttribute('data-fs') || '').trim();
      if (!fs) { window.location.href = mail; sent(); return; }
      var btn = document.getElementById('ss-send'); btn.disabled = true; btn.textContent = 'Sending…';
      window.fpPost(fs, data)
        .then(function(r){ btn.disabled = false; btn.textContent = 'Join the early list'; if (!r.ok) throw new Error('HTTP ' + r.status); try { sent(); } catch(x){} })
        .catch(function(e){ btn.disabled = false; btn.textContent = 'Join the early list'; window.fpFail('soundscape', e);
          err.innerHTML = 'Sorry, that didn’t go through' + window.fpCode(e) + '. <a href="' + mail + '">Send it from your email app instead</a>.'; err.hidden = false; });
    });
  })();
  Array.prototype.forEach.call(document.querySelectorAll('.swipe[data-count]'), function(row){
    var out = row.parentNode.querySelector('.count'); var n = row.children.length;
    function upd(){
      if (!out || !n) return;
      var r = row.getBoundingClientRect(), last = 1;
      if (r.width === 0) return;
      Array.prototype.forEach.call(row.children, function(c, k){
        var b = c.getBoundingClientRect();
        var seen = Math.min(b.right, r.right) - Math.max(b.left, r.left);
        if (seen > b.width / 2) last = k + 1;
      });
      if (row.scrollLeft + row.clientWidth >= row.scrollWidth - 2) last = n;
      out.textContent = last + ' / ' + n;
    }
    row.addEventListener('scroll', upd, {passive:true});
    window.addEventListener('resize', upd);
    window.addEventListener('hashchange', function(){ setTimeout(upd, 60); });
    setTimeout(upd, 60);
  });
})();
