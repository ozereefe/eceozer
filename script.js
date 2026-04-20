// ── Nav scroll ────────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Hamburger ─────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav__links');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));

// ── İletişim formu (basit) ────────────────────────────────
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  document.getElementById('formSuccess').classList.add('visible');
  this.reset();
});

// ── Mailchimp abone ───────────────────────────────────────
function subscribeToMailchimp(email) {
  return new Promise((resolve) => {
    const cb = 'mc_cb_' + Date.now();
    const script = document.createElement('script');
    window[cb] = (data) => {
      delete window[cb];
      script.remove();
      resolve(data);
    };
    const { baseUrl, u, id } = CONFIG.mailchimp;
    script.src = `${baseUrl}?u=${u}&id=${id}&EMAIL=${encodeURIComponent(email)}&c=${cb}`;
    document.body.appendChild(script);
    setTimeout(() => { if (window[cb]) { delete window[cb]; script.remove(); resolve(null); } }, 5000);
  });
}

// ── Supabase kayıt ────────────────────────────────────────
async function saveToSupabase(data) {
  const res = await fetch(`${CONFIG.supabase.url}/rest/v1/trial_sessions`, {
    method: 'POST',
    headers: {
      'apikey': CONFIG.supabase.anonKey,
      'Authorization': `Bearer ${CONFIG.supabase.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Supabase kayıt hatası');
}

// ── Modal ─────────────────────────────────────────────────
const overlay    = document.getElementById('modalOverlay');
const openBtn    = document.getElementById('openBooking');
const closeBtn   = document.getElementById('closeModal');

function openModal() {
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  resetModal();
}

openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Adım yönetimi ─────────────────────────────────────────
let currentStep = 1;

function goToStep(n) {
  document.getElementById(`step${currentStep}`).classList.add('hidden');
  document.getElementById(`step${n}`).classList.remove('hidden');

  document.querySelectorAll('.modal__step').forEach(el => {
    const s = parseInt(el.dataset.step);
    el.classList.remove('active', 'done');
    if (s === n)    el.classList.add('active');
    if (s < n)      el.classList.add('done');
  });

  currentStep = n;
}

function resetModal() {
  goToStep(1);
  document.querySelectorAll('.modal input, .modal textarea').forEach(el => el.value = '');
  document.querySelectorAll('.quiz__error').forEach(el => el.classList.remove('visible'));
}

// ── Quiz → Adım 2 ─────────────────────────────────────────
document.getElementById('toStep2').addEventListener('click', () => {
  const q1 = document.querySelector('input[name="q1"]:checked');
  const q2 = document.querySelector('input[name="q2"]:checked');
  const q3 = document.querySelector('input[name="q3"]:checked');
  const err = document.getElementById('quizError');

  if (!q1 || !q2 || !q3) {
    err.classList.add('visible');
    return;
  }
  err.classList.remove('visible');
  goToStep(2);
});

// ── Adım 1'e dön ──────────────────────────────────────────
document.getElementById('toStep1').addEventListener('click', () => goToStep(1));

// ── Formu gönder ──────────────────────────────────────────
document.getElementById('submitBooking').addEventListener('click', async () => {
  const name  = document.getElementById('b_name').value.trim();
  const email = document.getElementById('b_email').value.trim();
  const err   = document.getElementById('formError');

  if (!name || !email) {
    err.classList.add('visible');
    return;
  }
  err.classList.remove('visible');

  const q1 = document.querySelector('input[name="q1"]:checked').value;
  const q2 = document.querySelector('input[name="q2"]:checked').value;
  const q3 = document.querySelector('input[name="q3"]:checked').value;

  const submitBtn = document.getElementById('submitBooking');
  submitBtn.textContent = 'Gönderiliyor...';
  submitBtn.disabled = true;

  try {
    await Promise.all([
      saveToSupabase({
        name,
        email,
        phone:               document.getElementById('b_phone').value.trim() || null,
        topic:               q1,
        therapy_experience:  q2,
        availability:        q3,
        message:             document.getElementById('b_message').value.trim() || null,
      }),
      subscribeToMailchimp(email),
    ]);
    goToStep(3);
  } catch (e) {
    alert('Bir hata oluştu, lütfen WhatsApp\'tan ulaşın.');
  } finally {
    submitBtn.textContent = 'Gönder';
    submitBtn.disabled = false;
  }
});
