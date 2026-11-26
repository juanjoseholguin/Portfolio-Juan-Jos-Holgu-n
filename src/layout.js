/*
 * Posición de cada sección guardada en memoria. Leerla del DOM en cada cuadro
 * obliga al navegador a recalcular la página y produce tirones al hacer scroll.
 */
const cache = new Map();
const clear = () => cache.clear();
window.addEventListener('resize', clear);
window.addEventListener('load', clear);
document.fonts?.ready.then(clear);
new ResizeObserver(clear).observe(document.body);

function box(el) {
  let b = cache.get(el);
  if (!b) {
    const r = el.getBoundingClientRect();
    b = { top: r.top + window.scrollY, height: el.offsetHeight };
    cache.set(el, b);
  }
  return b;
}

export const inView = (el) => {
  const { top, height } = box(el);
  return top + height > window.scrollY && top < window.scrollY + window.innerHeight;
};

export const progress = (el) => {
  const { top, height } = box(el);
  return Math.min(Math.max((window.scrollY - top) / Math.max(height - window.innerHeight, 1), 0), 1);
};
