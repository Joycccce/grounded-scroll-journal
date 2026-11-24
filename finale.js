(() => {
  const finale = document.querySelector('.finale');
  const portrait = finale.querySelector('img');
  const canvas = finale.querySelector('canvas');
  const pen = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  if (!pen || reducedMotion.matches || !window.IntersectionObserver || typeof teamStrokeOrder === 'undefined') return;

  let frame;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio < .58) return;
    observer.disconnect();
    draw().catch(finish);
  }, { threshold: .58 });

  function finish() {
    cancelAnimationFrame(frame);
    observer.disconnect();
    reducedMotion.removeEventListener('change', finish);
    finale.dataset.drawn = '';
    delete finale.dataset.drawing;
    canvas.hidden = true;
  }

  async function draw() {
    const orderTexture = new Image();
    orderTexture.src = teamStrokeOrder;
    await Promise.all([portrait.decode(), orderTexture.decode()]);
    if (reducedMotion.matches || !finale.hasAttribute('data-drawing')) return finish();

    canvas.width = orderTexture.width;
    canvas.height = orderTexture.height;
    pen.drawImage(orderTexture, 0, 0);
    const order = pen.getImageData(0, 0, canvas.width, canvas.height).data;
    const mask = pen.createImageData(canvas.width, canvas.height);
    const lastStage = 246;
    const strokes = Array.from({ length: lastStage + 1 }, () => []);
    for (let pixel = 0; pixel < order.length; pixel += 4) {
      if (order[pixel] > 0) strokes[order[pixel]].push(pixel + 3);
    }
    pen.clearRect(0, 0, canvas.width, canvas.height);
    canvas.hidden = false;

    let stage = 0;
    let start;
    function trace(time) {
      start ??= time;
      const progress = Math.min(1, (time - start) / 2950);
      const nextStage = Math.floor(progress * lastStage);
      if (stage < nextStage) {
        while (stage < nextStage) {
          for (const alphaIndex of strokes[++stage]) mask.data[alphaIndex] = 255;
        }
        pen.putImageData(mask, 0, 0);
        pen.globalCompositeOperation = 'source-in';
        pen.drawImage(portrait, 0, 0, canvas.width, canvas.height);
        pen.globalCompositeOperation = 'source-over';
      }
      if (progress === 1) finish();
      else frame = requestAnimationFrame(trace);
    }
    frame = requestAnimationFrame(trace);
  }

  finale.dataset.drawing = '';
  reducedMotion.addEventListener('change', finish);
  observer.observe(portrait);
})();
