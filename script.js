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

// ── Validasyon kuralları ───────────────────────────────────
const TR_LETTERS = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s\-']+$/;

function validateName(val) {
  if (!val.trim()) return 'Ad soyad zorunludur.';
  if (!TR_LETTERS.test(val)) return 'İsimde rakam veya özel karakter kullanılamaz.';
  const parts = val.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return 'Lütfen hem adınızı hem soyadınızı girin.';
  if (parts.some(p => p.length < 2)) return 'Ad ve soyad en az 2 harf içermelidir.';
  return null;
}

function validateEmail(val) {
  if (!val.trim()) return 'E-posta zorunludur.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim())) return 'Geçerli bir e-posta adresi girin. (örn: ad@email.com)';
  return null;
}

function validatePhone(val) {
  if (!val.trim()) return null; // isteğe bağlı
  const cleaned = val.replace(/[\s\-\(\)]/g, '');
  if (!/^(\+90|0)?5[0-9]{9}$/.test(cleaned)) return 'Geçerli bir Türkiye numarası girin. (örn: 0530 000 00 00)';
  return null;
}

function validateMessage(val) {
  if (!val.trim()) return 'Mesaj alanı zorunludur.';
  if (val.trim().length < 10) return 'Mesajınız en az 10 karakter olmalıdır.';
  return null;
}

// ── Hata göster / temizle ─────────────────────────────────
function showErr(inputEl, errId, msg) {
  const errEl = document.getElementById(errId);
  if (!errEl) return;
  if (msg) {
    errEl.textContent = msg;
    inputEl.classList.add('invalid');
    inputEl.classList.remove('valid');
  } else {
    errEl.textContent = '';
    inputEl.classList.remove('invalid');
    inputEl.classList.add('valid');
  }
  return !msg;
}

function clearErr(inputEl, errId) {
  const errEl = document.getElementById(errId);
  if (errEl) errEl.textContent = '';
  inputEl.classList.remove('invalid', 'valid');
}

// Alandan çıkınca anlık kontrol
function attachBlur(inputEl, errId, fn) {
  inputEl.addEventListener('blur', () => {
    const err = fn(inputEl.value);
    showErr(inputEl, errId, err);
  });
  inputEl.addEventListener('input', () => {
    if (inputEl.classList.contains('invalid')) {
      const err = fn(inputEl.value);
      showErr(inputEl, errId, err);
    }
  });
}

// ── İletişim formu ────────────────────────────────────────
const cName    = document.getElementById('name');
const cEmail   = document.getElementById('email');
const cPhone   = document.getElementById('phone');
const cMessage = document.getElementById('message');

attachBlur(cName,    'name-err',    validateName);
attachBlur(cEmail,   'email-err',   validateEmail);
attachBlur(cPhone,   'phone-err',   validatePhone);
attachBlur(cMessage, 'message-err', validateMessage);

document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const v1 = showErr(cName,    'name-err',    validateName(cName.value));
  const v2 = showErr(cEmail,   'email-err',   validateEmail(cEmail.value));
  const v3 = showErr(cPhone,   'phone-err',   validatePhone(cPhone.value));
  const v4 = showErr(cMessage, 'message-err', validateMessage(cMessage.value));
  if (!v1 || !v2 || !v3 || !v4) return;
  document.getElementById('formSuccess').classList.add('visible');
  this.reset();
  [cName, cEmail, cPhone, cMessage].forEach(el => el.classList.remove('valid'));
});

// ── Mailchimp ─────────────────────────────────────────────
function subscribeToMailchimp(email) {
  return new Promise((resolve) => {
    const cb = 'mc_cb_' + Date.now();
    const script = document.createElement('script');
    window[cb] = (data) => { delete window[cb]; script.remove(); resolve(data); };
    const { baseUrl, u, id } = CONFIG.mailchimp;
    script.src = `${baseUrl}?u=${u}&id=${id}&EMAIL=${encodeURIComponent(email)}&c=${cb}`;
    document.body.appendChild(script);
    setTimeout(() => { if (window[cb]) { delete window[cb]; script.remove(); resolve(null); } }, 5000);
  });
}

// ── Supabase ──────────────────────────────────────────────
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
const overlay  = document.getElementById('modalOverlay');
const openBtn  = document.getElementById('openBooking');
const closeBtn = document.getElementById('closeModal');

function openModal()  { overlay.classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeModal() { overlay.classList.remove('open'); document.body.style.overflow = ''; resetModal(); }

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
    if (s === n) el.classList.add('active');
    if (s < n)   el.classList.add('done');
  });
  currentStep = n;
}

function resetModal() {
  goToStep(1);
  document.querySelectorAll('.modal input, .modal textarea').forEach(el => {
    el.value = '';
    el.classList.remove('valid', 'invalid');
  });
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('input[type="radio"]').forEach(el => el.checked = false);
}

// ── Booking formu blur validasyonları ────────────────────
const bName  = document.getElementById('b_name');
const bEmail = document.getElementById('b_email');
const bPhone = document.getElementById('b_phone');

attachBlur(bName,  'b_name-err',  validateName);
attachBlur(bEmail, 'b_email-err', validateEmail);
attachBlur(bPhone, 'b_phone-err', validatePhone);

// ── Quiz → Adım 2 ─────────────────────────────────────────
document.getElementById('toStep2').addEventListener('click', () => {
  const q1  = document.querySelector('input[name="q1"]:checked');
  const q2  = document.querySelector('input[name="q2"]:checked');
  const q3  = document.querySelector('input[name="q3"]:checked');
  const err = document.getElementById('quizError');
  if (!q1 || !q2 || !q3) { err.classList.add('visible'); return; }
  err.classList.remove('visible');
  goToStep(2);
});

document.getElementById('toStep1').addEventListener('click', () => goToStep(1));

// ── Booking gönder ────────────────────────────────────────
document.getElementById('submitBooking').addEventListener('click', async () => {
  const v1 = showErr(bName,  'b_name-err',  validateName(bName.value));
  const v2 = showErr(bEmail, 'b_email-err', validateEmail(bEmail.value));
  const v3 = showErr(bPhone, 'b_phone-err', validatePhone(bPhone.value));
  if (!v1 || !v2 || !v3) return;

  const submitBtn = document.getElementById('submitBooking');
  submitBtn.textContent = 'Gönderiliyor...';
  submitBtn.disabled = true;

  try {
    await Promise.all([
      saveToSupabase({
        name:               bName.value.trim(),
        email:              bEmail.value.trim(),
        phone:              bPhone.value.trim() || null,
        topic:              document.querySelector('input[name="q1"]:checked').value,
        therapy_experience: document.querySelector('input[name="q2"]:checked').value,
        availability:       document.querySelector('input[name="q3"]:checked').value,
        message:            document.getElementById('b_message').value.trim() || null,
      }),
      subscribeToMailchimp(bEmail.value.trim()),
    ]);
    goToStep(3);
  } catch {
    alert('Bir hata oluştu, lütfen WhatsApp\'tan ulaşın.');
  } finally {
    submitBtn.textContent = 'Gönder';
    submitBtn.disabled = false;
  }
});
