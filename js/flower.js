// Klair pixel flower, ported from Klair/design/reference/flower.ts (design/DESIGN.md §3).
const FLOWER_COLORS = {
  center: "#EE8378",
  inner: "#F4A39B",
  crease: "#F8BDB7",
  petalMid: "#F9C9C4",
  petalOuter: "#FCDDDA",
  petalEdge: "#FFEEEC",
  budInner: "#F9C3BE",
  budOuter: "#FDE0DE",
  stem: "#9CAA77",
  leafShade: "#8A9868",
  leafLight: "#A9B583"
};
const C = FLOWER_COLORS;
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const x = ax + t * dx - px;
  const y = ay + t * dy - py;
  return Math.sqrt(x * x + y * y);
}
function blossom(u, v, cx, cy, R, rot) {
  const dx = u - cx;
  const dy = v - cy;
  const r = Math.sqrt(dx * dx + dy * dy) / R;
  if (r > 1) return null;
  const th = Math.atan2(dy, dx) - rot;
  const lobe = Math.abs(Math.cos(th * 2.5));
  const edge = 0.38 + 0.62 * Math.pow(lobe, 0.6);
  if (r > edge) return null;
  const rel = r / edge;
  if (r < 0.14) return C.center;
  if (r < 0.28) return C.inner;
  if (lobe < 0.3 && rel > 0.25 && rel < 0.8) return C.crease;
  if (rel < 0.55) return C.petalMid;
  if (rel < 0.85) return C.petalOuter;
  return C.petalEdge;
}
function ellipse(u, v, cx, cy, a, b, ang) {
  const dx = u - cx;
  const dy = v - cy;
  const c = Math.cos(-ang);
  const s = Math.sin(-ang);
  const x = dx * c - dy * s;
  const y = dx * s + dy * c;
  const d = x * x / (a * a) + y * y / (b * b);
  return d <= 1 ? d : null;
}
function leaf(u, v, cx, cy, a, b, ang) {
  const dx = u - cx;
  const dy = v - cy;
  const c = Math.cos(-ang);
  const s = Math.sin(-ang);
  const x = dx * c - dy * s;
  const y = dx * s + dy * c;
  if (Math.abs(x) > a) return null;
  const half = b * (1 - x * x / (a * a));
  if (Math.abs(y) > half) return null;
  return y < 0 ? C.leafShade : C.leafLight;
}
const LEAVES = [
  [0.53, 0.81, 0.12, 0.045, 0.45],
  [0.24, 0.77, 0.1, 0.04, -0.55],
  [0.63, 0.63, 0.085, 0.035, -0.5]
];
const STEMS = [
  [0.34, 0.98, 0.4, 0.74],
  [0.4, 0.74, 0.47, 0.56],
  [0.47, 0.56, 0.58, 0.36],
  [0.41, 0.7, 0.31, 0.56],
  [0.49, 0.52, 0.77, 0.57]
];
function sample(u, v, stemHalfWidth) {
  const a = blossom(u, v, 0.62, 0.28, 0.22, -0.25);
  if (a) return a;
  const b = blossom(u, v, 0.3, 0.54, 0.17, 0.45);
  if (b) return b;
  const bud = ellipse(u, v, 0.83, 0.56, 0.075, 0.05, -0.25);
  if (bud !== null) return bud < 0.4 ? C.budInner : C.budOuter;
  if (ellipse(u, v, 0.765, 0.57, 0.03, 0.035, 0) !== null) return C.leafShade;
  for (const l of LEAVES) {
    const col = leaf(u, v, l[0], l[1], l[2], l[3], l[4]);
    if (col) return col;
  }
  for (const s of STEMS) {
    if (segDist(u, v, s[0], s[1], s[2], s[3]) < stemHalfWidth) return C.stem;
  }
  return null;
}
function toGrey(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const L = Math.round(0.3 * r + 0.59 * g + 0.11 * b);
  return `rgb(${L},${L},${Math.max(0, L - 4)})`;
}
function flowerPixels(res, opts = {}) {
  const N = Math.max(6, Math.min(48, Math.round(res)));
  const stemHalfWidth = Math.max(0.018, 0.6 / N);
  const out = [];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      let c = sample((i + 0.5) / N, (j + 0.5) / N, stemHalfWidth);
      if (c && opts.paused) c = toGrey(c);
      out.push(c);
    }
  }
  return out;
}
function bloomSteps(from, to, step = 3) {
  const seq = [from];
  let r = from;
  while (r !== to) {
    r = r < to ? Math.min(to, r + step) : Math.max(to, r - step);
    seq.push(r);
  }
  return seq;
}
function drawFlower(ctx, res, cell, opts = {}) {
  const N = Math.max(6, Math.min(48, Math.round(res)));
  const px = flowerPixels(N, opts);
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, N * cell, N * cell);
  for (let k = 0; k < px.length; k++) {
    const c = px[k];
    if (!c) continue;
    ctx.fillStyle = c;
    ctx.fillRect(k % N * cell, Math.floor(k / N) * cell, cell, cell);
  }
}
export {
  FLOWER_COLORS,
  bloomSteps,
  drawFlower,
  flowerPixels
};
