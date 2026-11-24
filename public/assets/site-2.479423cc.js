
(function(){ // the menu, the slim bar on the home page, Good to know on phones, rooms almost gone
  var ov = document.getElementById('fp-menu'); if (!ov) return;
  var root = document.documentElement, last = null;
  var view = document.querySelector('.view[data-shown]') || document;
  var on = ov.querySelector('.ov-on'), src = view.querySelectorAll('.onpage a');
  if (src.length) { on.hidden = false; Array.prototype.forEach.call(src, function(a){ var c = a.cloneNode(true); c.removeAttribute('data-ev'); c.setAttribute('data-umami-event', 'menu-onpage'); on.appendChild(c); }); }
  var p = location.pathname;
  Array.prototype.forEach.call(ov.querySelectorAll('.ov-nav a'), function(a){ var h = a.getAttribute('href');
    if (h === '/') { if (p === '/' || p === '/index.html') a.parentNode.removeChild(a); return; }
    if (p.indexOf(h) === 0) a.setAttribute('aria-current', 'page'); });
  function open(){ last = document.activeElement; ov.hidden = false; root.classList.add('menu-open'); requestAnimationFrame(function(){ ov.classList.add('open'); }); ov.querySelector('.x').focus(); }
  function close(){ ov.classList.remove('open'); root.classList.remove('menu-open'); setTimeout(function(){ ov.hidden = true; }, 260); if (last && last.focus) try { last.focus({preventScroll: true}); } catch (e) {} }
  document.addEventListener('click', function(e){
    var t = e.target; if (!t.closest) return;
    if (t.closest('.mb')) { e.preventDefault(); open(); return; }
    if (t.closest('#fp-menu .x')) { close(); return; }
    if (t.closest('#fp-menu a')) close();
  }, true);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !ov.hidden) close(); });
  var bar = document.querySelector('.sbar'), hero = document.querySelector('.hub-hero');
  if (bar && hero) {
    var tick = function(){ var up = scrollY > hero.offsetHeight - 60; bar.classList.toggle('on', up); bar.setAttribute('aria-hidden', up ? 'false' : 'true');
      Array.prototype.forEach.call(bar.querySelectorAll('a,button'), function(x){ x.tabIndex = up ? 0 : -1; }); };
    addEventListener('scroll', tick, {passive: true}); tick();
  }
  if (matchMedia('(max-width:719px)').matches) Array.prototype.forEach.call(document.querySelectorAll('details.gk'), function(d){ d.open = false; });
  // A look around: tap a photo to see it full screen; swipe or use the arrows
  var shots = Array.prototype.slice.call(document.querySelectorAll('.gal-pin .shot-card img'));
  if (shots.length) {
    var ar = function(d){ return '<svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="' + d + '" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'; };
    var lb = document.createElement('div'); lb.className = 'fp-lb'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Photo');
    lb.innerHTML = '<img alt=""><button class="fp-lb-x" type="button" aria-label="Close">' + ar('M4 4l10 10M14 4L4 14') + '</button><button class="fp-lb-p" type="button" aria-label="Previous photo">' + ar('M11 4L6 9l5 5') + '</button><button class="fp-lb-n" type="button" aria-label="Next photo">' + ar('M7 4l5 5-5 5') + '</button><div class="fp-lb-c" aria-live="polite"></div>';
    document.body.appendChild(lb);
    var im = lb.querySelector('img'), cnt = lb.querySelector('.fp-lb-c'), k = 0, back = null;
    var show = function(n){ k = (n + shots.length) % shots.length; im.src = shots[k].currentSrc || shots[k].src; im.alt = shots[k].alt; cnt.textContent = (k + 1) + ' / ' + shots.length; };
    var shut = function(){ lb.classList.remove('open'); root.classList.remove('lb-open'); setTimeout(function(){ lb.hidden = true; }, 220); if (back) try { back.focus({preventScroll: true}); } catch (e) {} };
    shots.forEach(function(s, n){ var f = s.closest('.shot-card'); f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Open photo: ' + s.alt);
      var go = function(){ back = f; show(n); lb.hidden = false; root.classList.add('lb-open'); requestAnimationFrame(function(){ lb.classList.add('open'); }); lb.querySelector('.fp-lb-x').focus(); };
      f.addEventListener('click', go); f.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
    lb.querySelector('.fp-lb-x').onclick = shut;
    lb.querySelector('.fp-lb-p').onclick = function(){ show(k - 1); };
    lb.querySelector('.fp-lb-n').onclick = function(){ show(k + 1); };
    lb.addEventListener('click', function(e){ if (e.target === lb) shut(); });
    document.addEventListener('keydown', function(e){ if (lb.hidden) return; if (e.key === 'Escape') shut(); if (e.key === 'ArrowLeft') show(k - 1); if (e.key === 'ArrowRight') show(k + 1); });
    var x0 = null; lb.addEventListener('touchstart', function(e){ x0 = e.touches[0].clientX; }, {passive: true});
    lb.addEventListener('touchend', function(e){ if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(k + (dx < 0 ? 1 : -1)); x0 = null; });
  }
  var few = document.querySelector('.rooms-pill .few');
  if (few && window.FP_live) {
    var d = new Date(Date.now() - 5 * 3600e3), a = d.toISOString().slice(0, 10), b = new Date(d.getTime() + 864e5).toISOString().slice(0, 10);
    window.FP_live(a, b).then(function(j){
      if (!j || !j.types) return;
      var n = ['HSK', 'HSD', 'OVQ', 'OVK', 'OVD'].reduce(function(s, c){ return s + (j.types[c] || 0); }, 0);
      if (n >= 1 && n <= 5) { few.textContent = 'Only ' + n + (n === 1 ? ' room' : ' rooms') + ' left tonight'; few.hidden = false; }
    });
  }
})();
