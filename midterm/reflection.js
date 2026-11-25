const reflection = document.querySelector('#reflection');
const openingPoint = document.querySelector('#point');
const closeButton = document.querySelector('#close-reflection');
const readingScroll = document.querySelector('#reading-scroll');
const languageButtons = [...document.querySelectorAll('[data-language]')];
const articles = [...reflection.querySelectorAll('article')];

function resetReadingPosition() {
  readingScroll.scrollTop = 0;
  reflection.querySelector('article:not([hidden]) h2').focus({ preventScroll: true });
}

openingPoint.addEventListener('click', () => {
  reflection.showModal();
  document.documentElement.classList.add('is-reading');
  openingPoint.setAttribute('aria-expanded', 'true');
  resetReadingPosition();
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

languageButtons.forEach(button => {
  button.addEventListener('click', () => {
    const current = button.dataset.language;
    if (button.getAttribute('aria-pressed') === 'true') return;

    languageButtons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    articles.forEach(article => { article.hidden = article.id !== `reflection-${current}`; });
    resetReadingPosition();
  });
});
