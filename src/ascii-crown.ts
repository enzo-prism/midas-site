type Point = { x: number; y: number; z: number; edge: boolean };

/** Decorative, entirely local artwork. The return value releases every observer and listener. */
export function mountAsciiCrown(canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext('2d');
  if (!context) return () => {};

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const points: Point[] = [];
  const segments = 108;
  const rows = 22;
  // A continuous crown wall, with five sculpted points and a distinct lower band.
  for (let column = 0; column < segments; column += 1) {
    const angle = (column / segments) * Math.PI * 2;
    const tooth = Math.pow((Math.cos(angle * 5) + 1) / 2, 2.2);
    const top = -0.27 - tooth * 0.91;
    for (let row = 0; row <= rows; row += 1) {
      const y = -1.18 + (row / rows) * 1.83;
      if (y < top || (y > 0.32 && y < 0.43)) continue;
      const radius = 0.98 + (0.65 - y) * 0.12;
      points.push({
        x: Math.sin(angle) * radius,
        y,
        z: Math.cos(angle) * radius,
        edge: y < top + 0.09 || row === rows || (y > 0.22 && y < 0.34),
      });
    }
  }

  let width = 0;
  let height = 0;
  let ink = '#a77c35';
  let dim = '#b9a88a';
  let visible = true;
  let disposed = false;
  let animation = 0;
  let lastFrame = 0;
  let elapsed = 0;

  const readColors = () => {
    const style = getComputedStyle(canvas);
    ink = style.getPropertyValue('--art-ink').trim() || '#a77c35';
    dim = style.getPropertyValue('--art-dim').trim() || '#b9a88a';
  };

  const draw = () => {
    if (!width || !height || disposed) return;
    context.clearRect(0, 0, width, height);
    const scale = Math.min(width / 3.9, height / 3.25);
    const centerX = width / 2;
    const centerY = height * 0.48;
    const yaw = motion.matches ? 0.28 : 0.28 + elapsed * 0.00012;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const tilt = -0.22;
    const fontSize = width < 400 ? 7 : 8.5;
    const cell = fontSize * 0.78;
    context.font = `400 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // An interrupted, quiet orbital trace anchors the object without a solid halo.
    context.fillStyle = dim;
    context.globalAlpha = 0.38;
    for (let i = 0; i < 104; i += 1) {
      if (i % 13 > 8) continue;
      const angle = (i / 104) * Math.PI * 2;
      context.fillText('·', centerX + Math.cos(angle) * scale * 1.58,
        centerY + scale * 0.83 + Math.sin(angle) * scale * 0.28);
    }

    // Resolve one glyph per screen cell so rear walls never become visual noise.
    const cells = new Map<string, { x: number; y: number; depth: number; edge: boolean }>();
    for (const point of points) {
      const x = point.x * cos + point.z * sin;
      const z = point.z * cos - point.x * sin;
      const y = point.y * Math.cos(tilt) - z * Math.sin(tilt);
      const depth = point.y * Math.sin(tilt) + z * Math.cos(tilt);
      const perspective = 4.8 / (4.8 - depth);
      const px = Math.round((centerX + x * scale * perspective) / cell) * cell;
      const py = Math.round((centerY + y * scale * perspective) / cell) * cell;
      const key = `${px},${py}`;
      const existing = cells.get(key);
      if (!existing || existing.depth < depth) cells.set(key, { x: px, y: py, depth, edge: point.edge });
    }
    for (const point of cells.values()) {
      const light = Math.max(0, Math.min(1, (point.depth + 1.4) / 2.8));
      context.fillStyle = light > 0.45 ? ink : dim;
      context.globalAlpha = point.edge ? 0.82 : 0.18 + light * 0.7;
      const glyph = point.edge ? '+' : light > 0.78 ? '#' : light > 0.52 ? '=' : light > 0.3 ? ':' : '·';
      context.fillText(glyph, point.x, point.y);
    }
    context.globalAlpha = 1;
  };

  const stop = () => {
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    lastFrame = 0;
  };
  const tick = (time: number) => {
    animation = 0;
    if (disposed || motion.matches || !visible || document.hidden) return;
    const interval = 1000 / (window.innerWidth < 768 ? 12 : 18);
    if (!lastFrame) lastFrame = time;
    const delta = time - lastFrame;
    if (delta >= interval) {
      elapsed += Math.min(delta, 200);
      lastFrame = time;
      draw();
    }
    animation = requestAnimationFrame(tick);
  };
  const sync = () => {
    stop();
    draw();
    if (!disposed && !motion.matches && visible && !document.hidden) animation = requestAnimationFrame(tick);
  };
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  };
  const theme = () => { readColors(); draw(); };
  const intersection = new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting);
    sync();
  }, { threshold: 0 });
  const sizeObserver = new ResizeObserver(resize);
  canvas.setAttribute('aria-hidden', 'true');
  readColors();
  resize();
  sizeObserver.observe(canvas);
  intersection.observe(canvas);
  motion.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('midas:theme', theme);
  window.addEventListener('resize', resize);
  sync();

  return () => {
    disposed = true;
    stop();
    sizeObserver.disconnect();
    intersection.disconnect();
    motion.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('midas:theme', theme);
    window.removeEventListener('resize', resize);
  };
}
