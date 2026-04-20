// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// Mobile hamburger
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav__links');
hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Contact form — mailto fallback (no backend needed)
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name    = document.getElementById('name').value;
  const email   = document.getElementById('email').value;
  const phone   = document.getElementById('phone').value;
  const message = document.getElementById('message').value;

  const subject = encodeURIComponent('Online Terapi Randevu Talebi - ' + name);
  const body    = encodeURIComponent(
    `Ad Soyad: ${name}\nE-posta: ${email}\nTelefon: ${phone || '-'}\n\nMesaj:\n${message}`
  );

  window.location.href = `mailto:ozereeece@gmail.com?subject=${subject}&body=${body}`;

  document.getElementById('formSuccess').classList.add('visible');
  this.reset();
});
