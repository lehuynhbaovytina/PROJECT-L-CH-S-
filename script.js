/* =====================================================
   KÝ ỨC SÀI GÒN — script.js
   1. CONFIG & NỘI DUNG  (sửa ở đây)
   2. Ảnh (có ảnh dự phòng nếu thiếu)
   3. Sách StPageFlip
   4. Chuyển động & điều hướng
   ===================================================== */

/* ---------- 1A. ĐƯỜNG DẪN ẢNH (thay ảnh ở đây) ---------- */
const IMAGES = {
  hero:       'assets/images/hero-placeholder.jpg',
  history:    'assets/images/saigon-history.jpg',
  past:       'assets/images/saigon-past.jpg',
  present:    'assets/images/saigon-present.jpg',
  culture:    'assets/images/saigon-culture.jpg',
  culture2:   'assets/images/saigon-culture-2.jpg',
  technology: 'assets/images/saigon-technology.jpg',
  techPast:   'assets/images/saigon-tech-past.jpg',
  closing:    'assets/images/saigon-closing.jpg',
  bookScience:'assets/images/saigon-technology.jpg'
};

/* ---------- 1B. CÀI ĐẶT CHUYỂN ĐỘNG ---------- */
const MOTION = {
  flipTime: 900,      // thời gian lật trang (ms) — do StPageFlip điều khiển
  ease: 0.1,          // độ mượt theo con trỏ (0.05 = rất chậm, 0.3 = nhanh)
  ringEase: 0.2,      // vòng tròn con trỏ
  scrollEase: 0.12,   // độ mượt parallax khi cuộn
  stagger: 90,        // khoảng trễ giữa các phần tử hiện ra (ms)
  tilt: 5,            // độ nghiêng tối đa (độ), 0 = tắt
  imgShift: 10,       // ảnh dịch theo con trỏ (px), 0 = tắt
  magnet: 6,          // nút hút theo con trỏ (px), 0 = tắt
  coverTilt: 9        // độ nghiêng tối đa của bìa sách (độ), 0 = tắt
};

/* ---------- 1C. NỘI DUNG SÁCH (thêm / bớt chương ở đây) ---------- */
const BOOK = {
  coverTitle: 'Ký ức<br>Sài Gòn',
  coverSub: 'Lịch sử hình thành',
  epigraph: '[ĐIỀN NỘI DUNG TẠI ĐÂY — lời đề từ hoặc lời mở đầu]',
  chapters: [
    { no: '1', name: 'Sài Gòn xưa', period: '[THỜI KỲ LỊCH SỬ]', title: '[TIÊU ĐỀ LỊCH SỬ]',
      text: '[ĐIỀN NỘI DUNG TẠI ĐÂY]', img: 'past', alt: '[Mô tả ảnh Sài Gòn xưa]', cap: '[CHÚ THÍCH] — [NGUỒN TƯ LIỆU]' },
    { no: '2', name: 'Sài Gòn nay', period: '[THỜI KỲ LỊCH SỬ]', title: '[TIÊU ĐỀ LỊCH SỬ]',
      text: '[ĐIỀN NỘI DUNG TẠI ĐÂY]', img: 'present', alt: '[Mô tả ảnh Sài Gòn hiện nay]', cap: '[CHÚ THÍCH] — [NGUỒN TƯ LIỆU]' },
    { no: '3', name: 'Đời sống văn hóa, xã hội', period: '[THỜI KỲ LỊCH SỬ]', title: '[TIÊU ĐỀ MỤC]',
      text: '[ĐIỀN NỘI DUNG TẠI ĐÂY]', img: 'culture', alt: '[Mô tả ảnh văn hóa – xã hội]', cap: '[CHÚ THÍCH] — [NGUỒN TƯ LIỆU]' },
    { no: '4', name: 'Khoa học, kỹ thuật', period: '[THỜI KỲ LỊCH SỬ]', title: '[TIÊU ĐỀ MỤC]',
      text: '[ĐIỀN NỘI DUNG TẠI ĐÂY]', img: 'bookScience', alt: '[Mô tả ảnh khoa học – kỹ thuật]', cap: '[CHÚ THÍCH] — [NGUỒN TƯ LIỆU]' }
  ],
  closingTitle: 'Lời kết',
  closingText: '[ĐIỀN NỘI DUNG TẠI ĐÂY — lời kết của cuốn sách]',
  sources: '[NGUỒN TƯ LIỆU — danh mục tài liệu tham khảo]'
};

/* ---------- 2. ẢNH ---------- */
function bindImages(root) {
  root.querySelectorAll('img[data-key]').forEach(img => {
    const holder = img.closest('.ph');
    img.addEventListener('error', () => holder && holder.classList.add('is-missing'), { once: true });
    img.src = IMAGES[img.dataset.key] || '';
  });
}

/* ---------- 3. SÁCH ----------
   Trạng thái: closed → opening → open → closing → closed. Mọi thao tác ngoài trạng thái hợp lệ đều bị bỏ qua,
   nên click nhanh liên tục không làm kẹt. StPageFlip chỉ được tạo MỘT lần, chuyển động lật trang do thư viện lo. */
const $ = id => document.getElementById(id);
const wrap = $('bookWrap'), stageEl = $('bookStage'), ctrlEl = $('bookCtrl'), coverArt = $('coverArt');
const noMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const OPEN_MS = noMotion ? 50 : 1050, CLOSE_MS = noMotion ? 50 : 1000;   // khớp thời gian CSS (mục 10)
const FIRST_PAGE = 1;      // chỉ số trang Mục lục (bìa = 0)
let book = null, bookState = 'closed', stateTimer = 0;
const onState = [];        // nơi các module khác (chuyển động con trỏ) đăng ký nghe đổi trạng thái

function setState(s) {
  bookState = s; wrap.dataset.state = s;
  const open = s === 'open';
  ctrlEl.inert = !open; stageEl.inert = !open;
  stageEl.setAttribute('aria-hidden', String(!open));
  coverArt.tabIndex = s === 'closed' ? 0 : -1;
  coverArt.setAttribute('aria-hidden', String(s !== 'closed'));
  onState.forEach(fn => fn(s));
}

function buildPages() {
  const el = $('flipbook');
  const pages = [];
  const page = (cls, html, hard) => {
    const d = document.createElement('div');
    d.className = 'page ' + cls;
    if (hard) d.dataset.density = 'hard';
    d.innerHTML = `<div class="page-in">${html}</div>`;
    pages.push(d);
  };
  // Trang bìa
  page('cover', `<em>Digital Heritage Archive</em><h4>${BOOK.coverTitle}</h4><em>${BOOK.coverSub}</em>`, true);
  // Trang 2-3: Mục lục (trang nội dung đầu tiên) + Lời đề từ
  page('', `<h4>Mục lục</h4><ol>${BOOK.chapters.map(c => `<li>${c.name}</li>`).join('')}</ol>`);
  page('right', `<p class="cap">Lời đề từ</p><h4>${BOOK.epigraph}</h4>`);
  // Mỗi chương = 2 trang
  BOOK.chapters.forEach(c => {
    page('', `<span class="ch">${c.no}</span><h4>${c.name}</h4><p class="cap">${c.period}</p>`);
    page('right', `<div class="ph" data-label="${c.alt}"><img data-key="${c.img}" alt="${c.alt}"></div>
      <p class="cap">${c.cap}</p><h4 style="font-size:1.3em">${c.title}</h4><p>${c.text}</p>`);
  });
  // 2 trang kết
  page('', `<h4>${BOOK.closingTitle}</h4><p>${BOOK.closingText}</p>`);
  page('right', `<p class="cap">Nguồn tư liệu</p><p>${BOOK.sources}</p>`);
  // Bìa sau
  page('cover', `<em>Hòn Ngọc Viễn Đông</em>`, true);

  // đánh số trang
  pages.forEach((p, i) => {
    if (!p.classList.contains('cover')) p.firstChild.insertAdjacentHTML('beforeend', `<span class="num">${i + 1}</span>`);
    el.appendChild(p);
  });
  bindImages(el);
  return pages;
}

function updateIndicator() {
  if (!book) return;
  const i = book.getCurrentPageIndex(), n = book.getPageCount();
  $('pageNum').textContent = `${i + 1} / ${n}`;
  $('prevPage').disabled = i <= FIRST_PAGE;     // lùi về bìa = đóng sách (xem bên dưới)
  $('nextPage').disabled = i >= n - 1;
}

function initBook() {
  if (book) return true;                         // tránh tạo trùng
  if (!window.St || !St.PageFlip) { $('bookFail').hidden = false; return false; }
  const pages = buildPages();
  book = new St.PageFlip($('flipbook'), {
    width: 460, height: 640,                     // tỉ lệ 1 trang
    size: 'stretch',
    minWidth: 260, maxWidth: 560, minHeight: 360, maxHeight: 780,
    showCover: true,
    startPage: FIRST_PAGE,                       // mở ra là thấy Mục lục
    usePortrait: true,                           // 1 trang trên màn hình hẹp
    mobileScrollSupport: true,
    maxShadowOpacity: 0.45,
    flippingTime: MOTION.flipTime,
    swipeDistance: 30
  });
  book.loadFromHTML(pages);
  book.on('flip', e => {
    updateIndicator();
    if (e.data === 0 && bookState === 'open') closeBook();   // kéo lùi qua Mục lục = gập sách lại
  });
  updateIndicator();
  return true;
}

function openBook() {
  if (bookState !== 'closed') return;
  if (!initBook()) return;                       // thiếu thư viện → hiện thông báo, bìa vẫn còn
  clearTimeout(stateTimer);
  setState('opening');
  stateTimer = setTimeout(() => {
    setState('open'); updateIndicator();
    $('nextPage').focus({ preventScroll: true });
  }, OPEN_MS);
}

function closeBook() {
  if (bookState !== 'open') return;
  clearTimeout(stateTimer);
  setState('closing');
  stateTimer = setTimeout(() => {
    if (book) { book.turnToPage(FIRST_PAGE); updateIndicator(); }   // reset khi sách đã ẩn
    setState('closed');
    coverArt.focus({ preventScroll: true });
  }, CLOSE_MS);
}

// Mỗi listener chỉ gắn một lần
coverArt.addEventListener('click', openBook);                       // chuột + chạm
coverArt.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openBook(); }
});
$('closeBook').addEventListener('click', closeBook);
$('prevPage').addEventListener('click', () => book && book.flipPrev());
$('nextPage').addEventListener('click', () => book && book.flipNext());
wrap.addEventListener('keydown', e => {
  if (bookState !== 'open' || !book) return;
  if (e.key === 'ArrowRight') book.flipNext();
  else if (e.key === 'ArrowLeft') book.flipPrev();
  else if (e.key === 'Escape') closeBook();
});
if (!window.St) $('bookFail').hidden = false;    // thư viện không tải được
setState('closed');

/* ---------- 4. HỆ THỐNG CHUYỂN ĐỘNG ----------
   Một vòng requestAnimationFrame duy nhất, chỉ chạy khi còn gì đang chuyển động.
   Dùng thuộc tính CSS riêng lẻ (translate / rotate / scale) nên không đè lên `transform` của hiệu ứng hiện ra.
   Không dùng GSAP: nội suy + IntersectionObserver là đủ, trang giữ được nhẹ. */
bindImages(document);
const root = document.documentElement, body = document.body;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced;
root.style.setProperty('--stagger', MOTION.stagger + 'ms');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* 4A. Hiện dần theo thứ bậc: tiêu đề → chữ phụ → ảnh. Phần tử vào cùng lúc được trễ lần lượt. */
const revealIO = new IntersectionObserver(es => {
  let k = 0;
  es.filter(e => e.isIntersecting).forEach(e => {
    e.target.style.setProperty('--rd', (k++ * MOTION.stagger) + 'ms');
    e.target.classList.add('in');
    if (e.target === wrap) initBook();            // tái dùng observer: chuẩn bị sách khi sắp tới
    revealIO.unobserve(e.target);
  });
}, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });

// Tiêu đề lớn: tách theo dòng (mặt nạ trượt lên). Văn bản vẫn nguyên vẹn, bôi chọn được.
document.querySelectorAll('.big').forEach(h => {
  h.innerHTML = h.innerHTML.split(/<br\s*\/?>/i)
    .map((t, i) => `<span class="ln"><span style="--i:${i}">${t.trim()}</span></span>`).join('');
  h.classList.remove('reveal'); h.classList.add('split'); revealIO.observe(h);
});
// Câu kết: tách theo từ
const st = document.querySelector('.statement');
if (st) {
  st.innerHTML = st.textContent.trim().split(/\s+/)
    .map((w, i) => `<span class="w" style="--i:${Math.min(i, 24)}">${w}</span>`).join(' ');
  st.classList.remove('reveal'); st.classList.add('words'); revealIO.observe(st);
}
wrap.classList.add('reveal', 'reveal-book');   // sách hiện vào nhẹ nhàng
document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

// Các khối sáng ambient (trang trí, nằm sau nội dung)
[['.history', -.1, 'top:-6%;right:-12%'], ['.book-sec', .08, 'top:20%;left:-14%'],
 ['.culture', -.08, 'bottom:-10%;right:-10%'], ['.tech', .1, 'top:10%;left:-12%']].forEach(([sel, sp, pos]) => {
  const b = document.createElement('i');
  b.className = 'blob'; b.dataset.parallax = sp; b.style.cssText = pos; b.setAttribute('aria-hidden', 'true');
  document.querySelector(sel).prepend(b);
});

/* 4B. Lõi nội suy (spring đơn giản): mỗi spring có đích (tx,ty) và giá trị hiện tại (x,y). */
const springs = [];
function makeSpring(apply, ease) { const s = { apply, ease, x: 0, y: 0, tx: 0, ty: 0 }; springs.push(s); return s; }
const cache = {};
function getSpring(kind, el, make) {
  const m = cache[kind] || (cache[kind] = new WeakMap());
  let s = m.get(el); if (!s) m.set(el, s = make(el)); return s;
}
let raf = 0, last = 0;
const P = { x: 0, y: 0, nx: 0, ny: 0, target: null, dirty: false, seen: false, out: true };
const S = { dirty: true };
function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
function frame(now) {
  raf = 0;
  const dt = Math.min(now - last, 48) || 16; last = now;
  if (P.dirty) { P.dirty = false; process(); }      // đọc layout trước…
  if (S.dirty) { S.dirty = false; scrollTargets(); }
  let busy = false;
  for (const s of springs) {                        // …rồi mới ghi
    const dx = s.tx - s.x, dy = s.ty - s.y;
    if (Math.abs(dx) < .0008 && Math.abs(dy) < .0008) { if (dx || dy) { s.x = s.tx; s.y = s.ty; s.apply(s); } continue; }
    const k = 1 - Math.pow(1 - s.ease, dt / 16.67);
    s.x += dx * k; s.y += dy * k; s.apply(s); busy = true;
  }
  if (busy) raf = requestAnimationFrame(frame);
}

/* 4C. Cuộn: tiến trình, parallax, mục đang xem, thanh trượt nav */
const bar = $('progress'), links = [...document.querySelectorAll('#menu a')];
const sections = links.map(a => document.querySelector(a.getAttribute('href')));
const menuEl = $('menu'), pill = document.createElement('i');
pill.className = 'pill'; pill.setAttribute('aria-hidden', 'true'); menuEl.appendChild(pill);
let activeIdx = -1;
function movePill() {
  const a = links[activeIdx];
  if (!a || innerWidth <= 900) { pill.style.opacity = 0; return; }
  pill.style.opacity = 1;
  pill.style.setProperty('--x', a.offsetLeft + 'px'); pill.style.setProperty('--w', a.offsetWidth + 'px');
}
const prog = makeSpring(s => { bar.style.transform = `scaleX(${s.x.toFixed(4)})`; }, 0.2);
const par = reduced ? [] : [...document.querySelectorAll('[data-parallax]')].map(el => {
  const s = makeSpring(s => { el.style.translate = `0 ${s.y.toFixed(1)}px`; }, MOTION.scrollEase);
  s.el = el; s.sp = Number(el.dataset.parallax); return s;
});
function scrollTargets() {
  const vh = innerHeight, h = root.scrollHeight - vh;
  prog.tx = h > 0 ? clamp(scrollY / h, 0, 1) : 0;
  par.forEach(s => {
    const r = s.el.getBoundingClientRect();
    if (r.bottom < -400 || r.top > vh + 400) return;
    s.ty = (r.top + r.height / 2 - s.y - vh / 2) * -s.sp;   // trừ phần đã dịch để không tự phản hồi
  });
  let idx = -1;
  sections.forEach((sec, i) => { const r = sec.getBoundingClientRect(); if (r.top < vh * .4 && r.bottom > vh * .4) idx = i; });
  if (idx !== activeIdx) {
    activeIdx = idx;
    links.forEach((a, i) => { a.classList.toggle('active', i === idx); i === idx ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current'); });
    movePill();
  }
}
addEventListener('scroll', () => { S.dirty = true; kick(); }, { passive: true });
addEventListener('resize', () => { S.dirty = true; movePill(); kick(); }, { passive: true });
scrollTargets(); S.dirty = false;
[prog, ...par].forEach(s => { s.x = s.tx; s.y = s.ty; s.apply(s); });
if (document.fonts) document.fonts.ready.then(movePill);

/* 4D. Con trỏ: chiều sâu, nghiêng, ánh sáng trên kính, dịch ảnh, nút hút, vòng con trỏ (chỉ khi có chuột) */
const TILT = '.card,.note', GLOW = '.glass,.cover-art';
const layers = [...document.querySelectorAll('[data-depth]')].map(el => {
  const s = makeSpring(s => { el.style.translate = `${s.x.toFixed(2)}px ${s.y.toFixed(2)}px`; }, MOTION.ease);
  s.d = Number(el.dataset.depth); return s;
});
let ring, dot;
const cur = {};
function track(kind, next, make, set, reset = true) {
  const prev = cur[kind];
  if (prev && prev !== next && reset) { const s = getSpring(kind, prev, make); s.tx = s.ty = 0; }
  cur[kind] = next;
  if (next) { const s = getSpring(kind, next, make); set(s, next.getBoundingClientRect()); if (!s.init) { s.x = s.tx; s.y = s.ty; s.init = 1; } }
}
const mkTilt = el => makeSpring(s => {
  const m = Math.hypot(s.x, s.y);
  el.style.rotate = m < .002 ? 'none' : `${-s.y} ${s.x} 0 ${(m * 2 * MOTION.tilt).toFixed(2)}deg`;
}, MOTION.ease);
const mkGlow = el => makeSpring(s => { el.style.setProperty('--lx', s.x.toFixed(1) + '%'); el.style.setProperty('--ly', s.y.toFixed(1) + '%'); }, .14);
const mkImg = el => { const img = el.querySelector('img'); return makeSpring(s => { img.style.setProperty('--ix', s.x.toFixed(2) + 'px'); img.style.setProperty('--iy', s.y.toFixed(2) + 'px'); }, MOTION.ease * .8); };
const mkBtn = el => makeSpring(s => { el.style.setProperty('--bx', s.x.toFixed(2) + 'px'); el.style.setProperty('--by', s.y.toFixed(2) + 'px'); }, MOTION.ease + .05);

// Bìa sách phản hồi khi con trỏ TIẾN GẦN (không cần chạm vào), nghiêng nhẹ có giới hạn, trả về mềm mại khi rời đi
const coverS = makeSpring(s => {
  const m = Math.hypot(s.x, s.y);
  coverArt.style.rotate = m < .002 ? 'none' : `${-s.y} ${s.x} 0 ${(m * 2 * MOTION.coverTilt).toFixed(2)}deg`;
  coverArt.style.setProperty('--sx', (-s.x * 28).toFixed(1)); coverArt.style.setProperty('--sy', (-s.y * 28).toFixed(1));
}, MOTION.ease * .8);
function coverTrack() {
  if (bookState !== 'closed' || P.out || !MOTION.coverTilt) { coverS.tx = coverS.ty = 0; return; }
  const r = coverArt.getBoundingClientRect(), dx = P.x - (r.left + r.width / 2), dy = P.y - (r.top + r.height / 2);
  const edge = Math.hypot(Math.max(Math.abs(dx) - r.width / 2, 0), Math.max(Math.abs(dy) - r.height / 2, 0));
  let w = clamp(1 - edge / (r.height * .7), 0, 1); w = w * w * (3 - 2 * w);        // vùng ảnh hưởng mềm
  coverS.tx = clamp(dx / r.width, -.5, .5) * w; coverS.ty = clamp(dy / r.height, -.5, .5) * w;
}
onState.push(st => { if (st !== 'closed') { coverS.tx = coverS.ty = 0; kick(); } });

function process() {
  const t = P.target instanceof Element ? P.target : null;
  layers.forEach(s => { s.tx = P.nx * s.d; s.ty = P.ny * s.d; });
  body.classList.toggle('c-out', P.out);
  coverTrack();
  if (!P.out && ring) {
    ring.tx = dot.tx = P.x; ring.ty = dot.ty = P.y;
    if (!P.seen) { P.seen = true; ring.x = dot.x = P.x; ring.y = dot.y = P.y; body.classList.add('c-on'); }
  }
  const stage = t && t.closest('.book-stage');       // trong vùng sách: không can thiệp gì cả
  body.classList.toggle('c-link', !!(t && t.closest('a,button,[role="button"]')));
  body.classList.toggle('c-stage', !!stage);
  const q = sel => (t && !stage ? t.closest(sel) : null);
  const btn = q('.btn');
  track('tilt', MOTION.tilt ? q(TILT) : null, mkTilt, (s, r) => { s.tx = (P.x - r.left) / r.width - .5; s.ty = (P.y - r.top) / r.height - .5; });
  track('glow', q(GLOW), mkGlow, (s, r) => { s.tx = (P.x - r.left) / r.width * 100; s.ty = (P.y - r.top) / r.height * 100; }, false);
  track('img', MOTION.imgShift ? q('figure.ph') : null, mkImg, (s, r) => {
    s.tx = -((P.x - r.left) / r.width - .5) * MOTION.imgShift * 2; s.ty = -((P.y - r.top) / r.height - .5) * MOTION.imgShift * 2;
  });
  track('btn', MOTION.magnet && btn && !btn.disabled ? btn : null, mkBtn, (s, r) => {
    s.tx = clamp((P.x - r.left - r.width / 2) * .22, -MOTION.magnet, MOTION.magnet);
    s.ty = clamp((P.y - r.top - r.height / 2) * .22, -MOTION.magnet, MOTION.magnet);
  });
}
if (fine) {
  ring = makeSpring(s => { ringEl.style.translate = `${s.x.toFixed(1)}px ${s.y.toFixed(1)}px`; }, MOTION.ringEase);
  dot = makeSpring(s => { dotEl.style.translate = `${s.x.toFixed(1)}px ${s.y.toFixed(1)}px`; }, .6);
  var ringEl = Object.assign(document.createElement('div'), { className: 'cursor' });
  var dotEl = Object.assign(document.createElement('div'), { className: 'cursor-dot' });
  ringEl.setAttribute('aria-hidden', 'true'); dotEl.setAttribute('aria-hidden', 'true');
  body.append(ringEl, dotEl);
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    P.x = e.clientX; P.y = e.clientY; P.nx = P.x / innerWidth - .5; P.ny = P.y / innerHeight - .5;
    P.target = e.target; P.out = false; P.dirty = true; kick();
  }, { passive: true });
  root.addEventListener('mouseleave', () => { P.out = true; P.target = null; P.nx = P.ny = 0; P.dirty = true; kick(); });
}

// Menu di động
const toggle = $('navToggle'), menu = $('menu');
toggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => { if (e.target.tagName === 'A') { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); } });
kick();
