/* VETCARE · etched-animal draw-in trigger, duo.html only.
   The cat and dog sketch themselves in (and loop) once scrolled into view. */

document.documentElement.classList.add('etch-js');

const etchIO = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('etch-in'); etchIO.unobserve(entry.target); }
  });
}, { threshold: .3 });
document.querySelectorAll('.x-etch').forEach((el) => etchIO.observe(el));
