// FootePrints link in bio: the site's files, plus one small live service.
// GET /api/availability?in=YYYY-MM-DD&out=YYYY-MM-DD
//   -> how many rooms of each type the hotel's booking engine has free for those dates.
// The booking engine (negrilfooteprints.com/search-results) is read as a normal visitor would,
// answers are cached for 5 minutes, and nothing about the guest is sent or stored.

const ENGINE_DEFAULT = 'https://negrilfooteprints.com/search-results/';
const HOME = 'https://visit.negrilfooteprints.com';
const CODES = {
  'hotel suite king': 'HSK', 'hotel suite double': 'HSD',
  'ocean view queen': 'OVQ', 'ocean view king': 'OVK', 'ocean view double': 'OVD',
  'deluxe junior suite': 'DJS', 'deluxe hotel suite': 'DHS',
  'pool walkout king': 'PWK', 'pool walk-out king': 'PWK', 'pool walkout double': 'PWD', 'pool walk-out double': 'PWD',
  'ocean front queen': 'OFQ', 'oceanfront queen': 'OFQ', 'ocean front king': 'OFK', 'oceanfront king': 'OFK',
};
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// Short tracked links: visit.negrilfooteprints.com/<code> -> the page with UTM tags.
// 302 on purpose, so a link can be changed later without browsers remembering the old target.
// Extra query on the short link is passed on (e.g. /dm?utm_content=wedding).
const SHORT = {
  ig:    '?utm_source=instagram&utm_medium=bio&utm_campaign=hotel',
  igd:   '?utm_source=instagram&utm_medium=bio&utm_campaign=dining#dining',
  dm:    '?utm_source=instagram&utm_medium=dm&utm_campaign=hotel',
  mc:    '?utm_source=instagram&utm_medium=manychat&utm_campaign=hotel',
  story: '?utm_source=instagram&utm_medium=story&utm_campaign=hotel',
  tt:    '?utm_source=tiktok&utm_medium=bio&utm_campaign=hotel',
  ttdm:  '?utm_source=tiktok&utm_medium=dm&utm_campaign=hotel',
  yt:    '?utm_source=youtube&utm_medium=channel&utm_campaign=hotel',
  ytv:   '?utm_source=youtube&utm_medium=video&utm_campaign=hotel',
  fb:    '?utm_source=facebook&utm_medium=bio&utm_campaign=hotel',
  g:     '?utm_source=google&utm_medium=gbp&utm_campaign=hotel',
  gb:    '?utm_source=google&utm_medium=gbp&utm_campaign=blushys#dining',
  gg:    '?utm_source=google&utm_medium=gbp&utm_campaign=gatsbys#dining',
  wa:    '?utm_source=whatsapp&utm_medium=chat&utm_campaign=hotel',
  mail:  '?utm_source=email&utm_medium=signature&utm_campaign=hotel',
  qr:    '?utm_source=qr&utm_medium=print&utm_campaign=hotel',
  team:  '?notrack',
};

function shortLink(url) {
  const code = url.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!code || !Object.prototype.hasOwnProperty.call(SHORT, code)) return null;
  let target = SHORT[code], hash = '';
  const h = target.indexOf('#');
  if (h >= 0) { hash = target.slice(h); target = target.slice(0, h); }
  const q = new URLSearchParams(target.slice(1));
  url.searchParams.forEach((v, k) => q.set(k, v));
  const qs = q.toString().replace(/=(&|$)/g, '$1');
  return new Response(null, { status: 302, headers: { location: HOME + '/' + (qs ? '?' + qs : '') + hash, 'cache-control': 'no-store' } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/availability') return availability(url, env, ctx);
    const sl = shortLink(url); if (sl) return sl;
    // Old addresses -> the hotel's own address. Email images (/img/) stay served here.
    if ((url.hostname.endsWith('.workers.dev') || url.hostname === 'footeprints.pages.dev') && !url.pathname.startsWith('/img/')) {
      return Response.redirect(HOME + url.pathname + url.search + url.hash, 301);
    }
    return env.ASSETS.fetch(request);
  },
};

function reply(body, status = 200, maxAge = 300) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${maxAge}` },
  });
}

async function availability(url, env, ctx) {
  const a = url.searchParams.get('in') || '', b = url.searchParams.get('out') || '';
  if (!DAY.test(a) || !DAY.test(b) || b <= a) return reply({ ok: false, error: 'dates' }, 400, 0);
  const nights = Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
  if (nights > 30) return reply({ ok: false, error: 'too long' }, 400, 0);
  const today = new Date(Date.now() - 5 * 3600e3).toISOString().slice(0, 10);   // Jamaica date
  if (a < today) return reply({ ok: false, error: 'past' }, 400, 0);

  const cache = caches.default;
  const key = new Request(`https://cache.footeprints.internal/availability/${a}/${b}`);
  const hit = await cache.match(key);
  if (hit) return hit;

  const engine = (env.ENGINE || ENGINE_DEFAULT);
  // 1 adult, no children: every room type is listed, whatever its size
  const src = `${engine}?mphb_check_in_date=${a}&mphb_check_out_date=${b}&mphb_adults=1&mphb_children=0`;
  let res;
  try {
    res = await fetch(src, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; FootePrints-availability/1.0)', accept: 'text/html' } });
  } catch (e) {
    return reply({ ok: false, error: 'engine unreachable' }, 502, 0);
  }
  if (!res.ok) return reply({ ok: false, error: 'engine ' + res.status }, 502, 0);

  const found = []; let cur = null, info = '';
  const rw = new HTMLRewriter()
    .on('.mphb_sc_search_results-info', { text(t) { info += t.text; } })
    .on('.mphb-reserve-room-section', {
      element(el) { cur = { title: (el.getAttribute('data-room-type-title') || '').trim(), n: 1, t: '' }; found.push(cur); },
    })
    .on('.mphb-available-rooms-count', {
      text(t) { if (!cur) return; cur.t += t.text; const m = cur.t.match(/of\s+(\d+)/i); if (m) cur.n = parseInt(m[1], 10); },
    });
  await rw.transform(res).arrayBuffer();
  if (!info.trim()) return reply({ ok: false, error: 'unexpected page' }, 502, 0);

  const out = { ok: true, in: a, out: b, nights, checked: new Date().toISOString(), total: 0, types: {} };
  for (const f of found) {
    if (!f.title) continue;
    const code = CODES[f.title.toLowerCase()] || f.title;
    out.types[code] = (out.types[code] || 0) + f.n;
    out.total += f.n;
  }
  const r = reply(out, 200, 300);
  ctx.waitUntil(cache.put(key, r.clone()));
  return r;
}
