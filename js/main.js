import { drawFlower, bloomSteps } from './flower.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Pixel flowers ---------- */

// Draw at one canvas pixel per flower cell; CSS scales it up with image-rendering: pixelated.
function paint(canvas, res, opts) {
  canvas.width = res;
  canvas.height = res;
  drawFlower(canvas.getContext('2d'), res, 1, opts);
}

function bloom(canvas, from, to, onStep) {
  const seq = bloomSteps(from, to);
  if (reduced) {
    paint(canvas, to);
    onStep?.(to);
    return;
  }
  seq.forEach((res, i) =>
    setTimeout(() => {
      paint(canvas, res);
      onStep?.(res);
    }, i * 55),
  );
}

$$('canvas[data-flower]').forEach((c) => paint(c, Number(c.dataset.flower)));

/* ---------- Pixel icons ---------- */

const ICON_COLORS = { k: '#2D3128', r: '#EE8378', s: '#9CAA77', d: '#46522F', b: '#F4A39B', p: '#FCDDDA' };
const ICONS = {
  eye: [
    '............',
    '............',
    '...kkkkkk...',
    '..k......k..',
    '.k..pppp..k.',
    'k..prrrrp..k',
    'k..prkkrp..k',
    '.k..prrp..k.',
    '..k......k..',
    '...kkkkkk...',
    '............',
    '............',
  ],
  ideas: [
    '....r.......',
    '....r.......',
    '..rrrrr.....',
    '....r.......',
    '....r....s..',
    '.........s..',
    '.......sssss',
    '.d.......s..',
    '.d.......s..',
    'ddddd.......',
    '.d..........',
    '.d..........',
  ],
  answer: [
    '............',
    '.kkkkkkkkkk.',
    '.k........k.',
    '.k.rrrrrr.k.',
    '.k........k.',
    '.k.sssss..k.',
    '.k........k.',
    '.kkkkkkkkkk.',
    '...kk.......',
    '...k........',
    '............',
    '............',
  ],
  select: [
    'kkk......kkk',
    'k..........k',
    'k..........k',
    '...pppppp...',
    '...pbbbbp...',
    '...pbrrbp...',
    '...pbrrbp...',
    '...pbbbbp...',
    '...pppppp...',
    'k..........k',
    'k..........k',
    'kkk......kkk',
  ],
  page: [
    '.kkkkkkk....',
    '.k.....kk...',
    '.k......kk..',
    '.k.sssss.k..',
    '.k.......k..',
    '.k.rrrrr.k.r',
    '.k.rrrrr.k..',
    '.k.......k..',
    '.k.ssss..k..',
    '.k.......k..',
    '.kkkkkkkkk..',
    '............',
  ],
  download: [
    '.....ss.....',
    '.....ss.....',
    '.....ss.....',
    '.....ss.....',
    '..ssssssss..',
    '...ssssss...',
    '....ssss....',
    '.....ss.....',
    '............',
    '.k........k.',
    '.kkkkkkkkkk.',
    '............',
  ],
};
$$('svg[data-icon]').forEach((svg) => {
  const map = ICONS[svg.dataset.icon];
  let out = '';
  map.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ICON_COLORS[ch]) out += `<rect x="${x}" y="${y}" width="1" height="1" fill="${ICON_COLORS[ch]}"/>`;
    }),
  );
  svg.innerHTML = out;
});

/* ---------- Nav border on scroll ---------- */

const nav = $('#nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Copy buttons ---------- */

$$('.copy').forEach((btn) => {
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.textContent = 'Copied';
      btn.classList.add('done');
    } catch {
      btn.textContent = 'Press ⌘C';
    }
    setTimeout(() => {
      btn.textContent = 'Copy';
      btn.classList.remove('done');
    }, 1600);
  });
});

/* ---------- Reveal on scroll ---------- */

const io = new IntersectionObserver(
  (entries) =>
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }),
  { rootMargin: '0px 0px -8% 0px' },
);
$$('.rv').forEach((el) => io.observe(el));

/* ---------- Install guide: remembers finished steps and opens the next one ---------- */

const steps = $$('.istep');
const needed = steps.filter((s) => !('optional' in s.dataset));
const railLinks = $$('.rail li a');
const railFlower = $('#railFlower');
const railStatus = $('#railStatus');
const DONE_KEY = 'klair-install-done';
let done = new Set();
try {
  done = new Set(JSON.parse(localStorage.getItem(DONE_KEY)));
} catch {}
let railRes = 0;

// Paints the steps, rail and flower from `done`; returns the first needed step still to do.
function renderGuide() {
  const current = needed.find((s) => !done.has(s.id));
  steps.forEach((s, i) => {
    const isDone = done.has(s.id);
    const link = railLinks[i];
    const btn = $('.done-btn', s);
    s.classList.toggle('done', isDone);
    link.classList.toggle('done', isDone);
    link.setAttribute('aria-label', `Step ${i + 1}, ${$('span', link).textContent}${isDone ? ', done' : ''}`);
    if (s === current) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
    btn.textContent = isDone ? 'Mark as not done' : 'Done, next step';
    btn.classList.toggle('dark', !isDone);
  });
  const n = needed.filter((s) => done.has(s.id)).length;
  railStatus.innerHTML = current
    ? `${n} of ${needed.length} needed steps done`
    : 'All set. <a href="#first-session">Start your first session</a>';
  // The flower resolves as steps get done, the way it does in Klair when it has something for you.
  const to = 11 + Math.round((19 * n) / needed.length);
  if (to !== railRes) railRes ? bloom(railFlower, railRes, to) : paint(railFlower, to);
  railRes = to;
  return current;
}

steps.forEach((s) =>
  $('.done-btn', s).addEventListener('click', () => {
    done.has(s.id) ? done.delete(s.id) : done.add(s.id);
    try {
      localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
    } catch {}
    const next = renderGuide();
    if (!done.has(s.id)) return;
    s.open = false;
    if (next) {
      next.open = true;
      $('summary', next).focus({ preventScroll: true });
    }
    (next || $('#first-session')).scrollIntoView();
  }),
);

const firstTodo = renderGuide();
steps.forEach((s) => (s.open = s === firstTodo));

// In-page links open the <details> they point into (install steps, troubleshooting).
function openTarget(hash) {
  let el = hash.length > 1 && document.getElementById(hash.slice(1));
  for (el = el && el.closest('details'); el; el = el.parentElement?.closest('details')) el.open = true;
}
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href^="#"]');
  if (a) openTarget(a.hash);
});
if (location.hash.length > 1) {
  openTarget(location.hash);
  document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

/* ---------- CTA flower: blooms on hover/click ---------- */

const cta = $('#ctaFlower');
let ctaRes = 12;
paint(cta, ctaRes);
const ctaToggle = () => {
  const to = ctaRes === 12 ? 30 : 12;
  bloom(cta, ctaRes, to);
  ctaRes = to;
};
cta.addEventListener('click', ctaToggle);
new IntersectionObserver(
  ([e], obs) => {
    if (e.isIntersecting) {
      setTimeout(ctaToggle, 400);
      obs.disconnect();
    }
  },
  { threshold: 0.6 },
).observe(cta);

/* ---------- Interactive demo ---------- */

const frame = $('#frame');
const stage = $('#stage');
const corner = $('#corner');
const pill = $('#pill');
const cornerCanvas = $('#cornerCanvas');
const panel = $('#panel');
const panelFlower = $('#panelFlower');
const ideasView = $('#panelIdeas');
const answerView = $('#panelAnswer');
const answerTitle = $('#answerTitle');
const answerBody = $('#answerBody');
const answerChips = $('#answerChips');
const marked = $('#marked');
const ideaButtons = $$('.idea', panel);
const dots = [$('#ds0'), $('#ds1'), $('#ds2')];

paint(cornerCanvas, 11);
paint(panelFlower, 11);

// Fit the 600px-tall stage to the frame: wide layout on desktop, narrow on phones.
// The article column stops short of the panel so the passages it marks stay visible.
function fit() {
  const w = frame.clientWidth;
  const W = Math.round(Math.max(600, Math.min(1120, w / 0.92)));
  const narrow = W < 900;
  const s = w / W;
  stage.style.width = W + 'px';
  stage.style.transform = `scale(${s})`;
  stage.classList.toggle('narrow', narrow);
  const bodyStart = narrow ? 60 : 278;
  stage.style.setProperty('--body-w', Math.max(260, Math.min(440, W - 424 - bodyStart - 24)) + 'px');
  frame.style.height = 600 * s + 'px';
}
new ResizeObserver(fit).observe(frame);
fit();

const ANSWERS = [
  {
    title: 'Gradient descent, the whole page',
    marks: [1, 2],
    chips: ['Full page · Gradient descent', 'On screen · 2:14 PM'],
    html: `<p>Gradient descent finds a minimum by repeatedly stepping against the gradient: <b>x ← x − η∇f(x)</b>.</p>
<h6>The key ideas</h6>
<ul><li><b>Intuition:</b> the gradient points uphill, so you walk the other way.</li>
<li><b>Learning rate η:</b> too large overshoots and can diverge; too small crawls.</li>
<li><b>Convergence:</b> for smooth convex functions a small enough η always gets there.</li>
<li><b>Momentum and Adam:</b> reuse past steps or adapt η per parameter to move faster.</li></ul>`,
  },
  {
    title: 'Two step sizes on f(x) = x²',
    marks: [2, 1],
    chips: ['On screen · 2:14 PM', 'Full page · Gradient descent'],
    html: `<p>Here ∇f(x) = 2x, so each step is <b>x ← x(1 − 2η)</b>. Start at x = 4.</p>
<h6>η = 0.1 (shrinks by 0.8 each step)</h6>
<p>4 → 3.2 → 2.56 → 2.05 → 1.64 … steadily toward 0.</p>
<h6>η = 1.1 (multiplies by −1.2)</h6>
<p>4 → −4.8 → 5.76 → −6.91 … it flips sides and grows. That's the overshoot in Figure 2.</p>
<p>Rule for this f: any η between 0 and 1 converges, and η = 0.5 lands on 0 in one step.</p>`,
  },
  {
    title: 'Quiz: step size',
    marks: [2, 1],
    chips: ['On screen · 2:14 PM'],
    html: `<ul><li><b>1.</b> What happens to the iterates if η is far too large?</li>
<li><b>2.</b> For f(x) = x², which η reaches the minimum in one step?</li>
<li><b>3.</b> Name one method that adapts η per parameter.</li></ul>
<h6>Answers</h6>
<p>1. They overshoot, oscillate and can diverge. 2. η = 0.5. 3. AdaGrad or Adam.</p>`,
  },
  {
    title: 'Learning rate meets the loss function',
    marks: [1, 2],
    chips: ['Earlier in this project · Machine learning', 'On screen · 2:14 PM'],
    html: `<p>Earlier in this project you read that training means <b>minimising a loss</b>, such as mean squared error.</p>
<p>Gradient descent is the "how" of that: the loss is the f(x) on this page, and the model's weights are x.</p>
<h6>Why it matters for η</h6>
<p>A steep, narrow loss surface needs a smaller η. That's one reason the ML overview mentioned scaling your features before training.</p>`,
  },
];

let state = 'rest'; // rest | ideas | answer
let res = 11;
let streamTimer = 0;
let autoplay = !reduced;
let demoVisible = false;
const timers = [];

function step(n) {
  dots.forEach((d, i) => d.classList.toggle('on', i === n));
}

function stopAutoplay() {
  autoplay = false;
  timers.splice(0).forEach(clearTimeout);
}

function open() {
  if (state !== 'rest') return;
  state = 'ideas';
  pill.classList.remove('show');
  corner.classList.add('hide');
  panel.classList.add('open');
  ideasView.hidden = false;
  answerView.hidden = true;
  const panelBloom = (r) => {
    panelFlower.style.width = panelFlower.style.height = r * 7 + 'px';
  };
  panelBloom(11);
  bloom(panelFlower, 11, 30, panelBloom);
  res = 30;
  step(1);
}

function close() {
  if (state === 'rest') return;
  state = 'rest';
  clearInterval(streamTimer);
  panel.classList.remove('open');
  corner.classList.remove('hide');
  bloom(cornerCanvas, 17, 11);
  res = 11;
  ideaButtons.forEach((b) => b.classList.remove('hl'));
  step(0);
}

function clearMarks() {
  $$('.mark', stage).forEach((m) => m.classList.remove('on'));
  marked.classList.remove('show');
}

function pick(i) {
  if (state === 'rest') open();
  const a = ANSWERS[i];
  if (!a) return;
  state = 'answer';
  clearMarks();
  clearInterval(streamTimer);
  ideasView.hidden = true;
  answerView.hidden = false;
  answerTitle.textContent = a.title;
  answerChips.innerHTML = a.chips.map((c) => `<span class="chip">${c}</span>`).join('');

  // Stream the answer in word by word.
  answerBody.innerHTML = a.html;
  const walker = document.createTreeWalker(answerBody, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  texts.forEach((t) => {
    const frag = document.createDocumentFragment();
    t.textContent.split(/(\s+)/).forEach((w) => {
      if (!w) return;
      if (/^\s+$/.test(w)) return frag.append(w);
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      frag.append(s);
    });
    t.replaceWith(frag);
  });
  const words = $$('.w', answerBody);
  let n = 0;
  const finish = () => {
    clearInterval(streamTimer);
    words.forEach((w) => w.classList.add('in'));
    setTimeout(() => {
      if (state !== 'answer') return;
      a.marks.forEach((m, k) => setTimeout(() => $(`.mark[data-mark="${m}"]`, stage)?.classList.add('on'), k * 250));
      marked.classList.add('show');
    }, 250);
  };
  if (reduced) finish();
  else
    streamTimer = setInterval(() => {
      for (let k = 0; k < 3 && n < words.length; k++) words[n++].classList.add('in');
      if (n >= words.length) finish();
    }, 45);
  step(2);
}

function back() {
  if (state !== 'answer') return;
  clearInterval(streamTimer);
  state = 'ideas';
  ideasView.hidden = false;
  answerView.hidden = true;
  step(1);
}

// Pointer
$('#cornerFlower').addEventListener('click', () => (stopAutoplay(), open()));
pill.addEventListener('click', () => (stopAutoplay(), open()));
ideaButtons.forEach((b) => b.addEventListener('click', () => (stopAutoplay(), pick(Number(b.dataset.pick)))));
$('#back').addEventListener('click', () => (stopAutoplay(), back()));

// Keys, only while the demo is on screen. Plain keys stand in for fn and ⌘, which browsers keep for themselves.
document.addEventListener('keydown', (e) => {
  if (!demoVisible || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest?.('input, textarea, [contenteditable]')) return;
  if (document.activeElement !== document.body && !frame.contains(document.activeElement)) return;
  const k = e.key.toLowerCase();
  let handled = true;
  if (k === 'k' || k === 'f') state === 'rest' ? open() : close();
  else if (k === 'escape') close();
  else if (/^[1-4]$/.test(k) && state !== 'rest') pick(Number(k) - 1);
  else if (k === '[' || k === 'backspace') back();
  else handled = false;
  if (handled) {
    stopAutoplay();
    e.preventDefault();
  }
});

// Click outside the panel (on the "page") closes it, like esc.
stage.addEventListener('click', (e) => {
  if (state !== 'rest' && !e.target.closest('.panel, .corner')) {
    stopAutoplay();
    close();
  }
});

// Show the nudge pill once the demo scrolls into view, then play a short tour unless the visitor takes over.
new IntersectionObserver(
  ([e]) => {
    demoVisible = e.isIntersecting;
    if (!e.isIntersecting || pill.dataset.shown) return;
    pill.dataset.shown = '1';
    timers.push(setTimeout(() => pill.classList.add('show'), 900));
    if (!autoplay) return;
    timers.push(
      setTimeout(() => autoplay && open(), 3600),
      setTimeout(() => autoplay && ideaButtons[1].classList.add('hl'), 5200),
      setTimeout(() => autoplay && pick(1), 6200),
    );
  },
  { threshold: 0.7 },
).observe(frame);

// Stop the tour as soon as the visitor touches the demo.
frame.addEventListener('pointerdown', stopAutoplay, { capture: true });
