const reflection = document.querySelector('#reflection');
const openingPoint = document.querySelector('#point');
const closeButton = document.querySelector('#close-reflection');
const readingScroll = document.querySelector('#reading-scroll');

openingPoint.addEventListener('click', () => {
  reflection.showModal();
  document.documentElement.classList.add('is-reading');
  openingPoint.setAttribute('aria-expanded', 'true');
  readingScroll.scrollTop = 0;
  readingScroll.focus({ preventScroll: true });
});

closeButton.addEventListener('click', () => reflection.close());

reflection.addEventListener('click', event => {
  if (event.target === reflection) reflection.close();
});

reflection.addEventListener('close', () => {
  document.documentElement.classList.remove('is-reading');
  openingPoint.setAttribute('aria-expanded', 'false');
  openingPoint.focus({ preventScroll: true });
});
