const canvas = document.querySelector('#guide');
const context = canvas.getContext('2d');
const cover = document.querySelector('.cover');
const coverFigure = document.querySelector('.cover-figure');
const finaleDrawing = document.querySelector('.finale-drawing');
const entries = [...document.querySelectorAll('.entry')];
const uncertaintyParagraphs = entries.map(entry => entry.querySelector('[data-line="uncertain"]'));
const learningParagraphs = entries.map(entry => entry.querySelector('.takeaway'));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const singleColumn = matchMedia('(max-width: 760px)');
const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink');

let route = [];
let learningPoints = [];
let frame = 0;
let width = 0;
let height = 0;
let scale = 1;

function bounds(element) {
  const { left, right, top, bottom } = element.getBoundingClientRect();
  return { left, right, top: top + scrollY, bottom: bottom + scrollY };
}

function makeRoute() {
  const coverBox = bounds(cover);
  const figure = bounds(coverFigure);
  const chapters = entries.map(bounds);
  const mobile = singleColumn.matches;
  const left = Math.max(12, coverBox.left - (mobile ? 15 : 32));
  const right = Math.min(width - 9, Math.max(coverBox.right + 28, figure.right + 14));
  const points = [{ x: right - 8, y: -6 }];

  function curve(x1, y1, x2, y2, x, y, stepSize = 8) {
    const start = points.at(-1);
    const distance = Math.hypot(x1 - start.x, y1 - start.y)
      + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x - x2, y - y2);
    const steps = Math.max(12, Math.ceil(distance / stepSize));
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const s = 1 - t;
      points.push({
        x: s ** 3 * start.x + 3 * s ** 2 * t * x1 + 3 * s * t ** 2 * x2 + t ** 3 * x,
        y: s ** 3 * start.y + 3 * s ** 2 * t * y1 + 3 * s * t ** 2 * y2 + t ** 3 * y,
      });
    }
  }

  const shoulder = coverBox.top + 94;
  const bow = Math.min(mobile ? 12 : 64, width * .042);
  curve(right + 3, coverBox.top - 12, right - bow, shoulder - 48, right - bow, shoulder);
  const bendY = figure.bottom + 13;
  curve(right - bow, shoulder + 60, right + 8, bendY - 85, right - 8, bendY);
  const crossY = Math.max(figure.bottom + 39, coverBox.bottom - 54);
  curve(right - 26, crossY + 40, left, crossY - 18, left, chapters[0].top - 14);

  chapters.forEach((chapter, index) => {
    const isLeft = mobile || index % 2 === 0;
    const rail = isLeft ? left : right;
    const outward = isLeft ? -1 : 1;
    const startY = points.at(-1).y;
    const span = chapter.bottom - startY;
    const startIndex = points.length;
    curve(
      rail - outward * 6, startY + span * .32,
      rail + outward * 9, startY + span * .7,
      rail, chapter.bottom + 12, 3,
    );
    const doubt = bounds(uncertaintyParagraphs[index]);
    const doubtCenter = (doubt.top + doubt.bottom) / 2;
    const extent = Math.min(94, Math.max(56, (doubt.bottom - doubt.top) / 2));
    const amplitude = Math.min(mobile ? 10 : 23, rail - 6, width - rail - 6);
    // Let each wave return to the original path with a flat tangent.
    for (let i = startIndex; i < points.length; i++) {
      const point = points[i];
      const phase = (point.y - doubtCenter + extent) / (2 * extent);
      if (phase > 0 && phase < 1) {
        point.x += outward * amplitude * Math.sin(phase * Math.PI * 4) * Math.sin(phase * Math.PI) ** 2;
      }
    }

    const next = chapters[index + 1];
    if (next) {
      const gap = next.top - chapter.bottom;
      const nextRail = mobile ? left : isLeft ? right : left;
      curve(
        mobile ? rail + 26 : rail, chapter.bottom + gap * .59,
        mobile ? nextRail - 10 : nextRail, chapter.bottom + gap * .53,
        nextRail, next.top - 14,
      );
    }
  });

  const last = points.at(-1);
  const artwork = bounds(finaleDrawing);
  const landingX = Math.max(8, artwork.left - (mobile ? 9 : 29));
  const landingY = artwork.top + (mobile ? 12 : 26);
  curve(last.x, last.y + 56, landingX, landingY - 49, landingX, landingY);
  return points;
}

function paint() {
  frame = 0;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.clearRect(0, 0, width, height);
  context.translate(0, -scrollY);

  const remaining = document.documentElement.scrollHeight - scrollY - height;
  const nearEnd = Math.max(0, 1 - remaining / height);
  const guideHeight = height * (.64 + .36 * nearEnd);
  const animate = !reducedMotion.matches;
  const targetY = animate ? scrollY + guideHeight : Infinity;

  context.beginPath();
  context.moveTo(route[0].x, route[0].y);
  let tip = route[0];
  let heading = Math.PI / 2;
  for (let index = 1; index < route.length; index++) {
    const point = route[index];
    heading = Math.atan2(point.y - tip.y, point.x - tip.x);
    if (point.y > targetY) {
      const progress = (targetY - tip.y) / (point.y - tip.y);
      tip = { x: tip.x + (point.x - tip.x) * progress, y: targetY };
      context.lineTo(tip.x, tip.y);
      break;
    }
    context.lineTo(point.x, point.y);
    tip = point;
  }

  context.lineWidth = 1.35;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.strokeStyle = ink;
  context.stroke();

  const distanceToLearning = Math.min(...learningPoints.map(position => Math.abs(position - tip.y)));
  const emphasis = animate && distanceToLearning < 44
    ? (1 + Math.cos(Math.PI * distanceToLearning / 44)) / 2
    : 0;
  context.beginPath();
  context.ellipse(tip.x, tip.y, 4.15 + emphasis * 6.4, 2.4 + emphasis * 3.3, heading, 0, Math.PI * 2);
  context.fillStyle = ink;
  context.fill();
}

function requestPaint() {
  if (!frame) frame = requestAnimationFrame(paint);
}

function measure() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  scale = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  route = makeRoute();
  learningPoints = learningParagraphs.map(paragraph => {
    const note = bounds(paragraph);
    return (note.top + note.bottom) / 2;
  });
  requestPaint();
}

if (context) {
  new ResizeObserver(measure).observe(document.body);
  window.addEventListener('resize', measure);
  window.addEventListener('scroll', requestPaint, { passive: true });
  window.addEventListener('pageshow', requestPaint);
  reducedMotion.addEventListener('change', requestPaint);
  measure();
}
