const $ = (id) => document.getElementById(id);

const STORAGE_USERS = 'edumeet_users';
const STORAGE_SESSION = 'edumeet_session';
const STORAGE_BOOKINGS = 'edumeet_bookings';

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

refreshIcons();

const authView = $('authView');
const appView = $('appView');
let currentUser = null;

function readStorage(key, fallback = []) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUsers() {
  return readStorage(STORAGE_USERS, []);
}

function showAuth(which) {
  $('loginForm').classList.toggle('hidden', which !== 'login');
  $('registerForm').classList.toggle('hidden', which !== 'register');
}

$('showRegister').addEventListener('click', () => showAuth('register'));
$('showRegisterBottom').addEventListener('click', () => showAuth('register'));
$('showLogin').addEventListener('click', () => showAuth('login'));

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function clearErrors(ids) {
  ids.forEach(id => {
    const el = $(id);
    if (el) el.textContent = '';
  });
}

function firstName(fullName) {
  return (fullName || '').trim().split(/\s+/)[0] || 'Estudiante';
}

function getMyBookings() {
  if (!currentUser) return [];
  return readStorage(STORAGE_BOOKINGS, []).filter(item =>
    item.userEmail && item.userEmail.toLowerCase() === currentUser.email.toLowerCase()
  );
}

function renderMyBookings() {
  const container = $('myBookingsList');
  if (!container || !currentUser) return;

  const bookings = getMyBookings().sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (!bookings.length) {
    container.innerHTML = '<div class="bookings-empty">Todavía no tienes reservas. Cuando confirmes una asesoría, aparecerá aquí.</div>';
  } else {
    container.innerHTML = bookings.map(item => {
      const [year, month, day] = item.date.split('-');
      const dateLabel = `${day}/${month}/${year}`;
      return `<article class="booking-item">
        <div class="booking-item-main">
          <div class="booking-item-icon"><i data-lucide="calendar-check"></i></div>
          <div>
            <h3>${escapeHTML(item.service)}</h3>
            <p>${dateLabel} · ${escapeHTML(item.time)} · ${escapeHTML(item.modality)}</p>
            <p>Estudiante: ${escapeHTML(firstName(item.studentName))}</p>
          </div>
        </div>
        <span class="booking-status">✓ Confirmada</span>
      </article>`;
    }).join('');
  }

  refreshIcons();

  // El indicador comienza en 0 y aumenta con las reservas registradas.
  const percent = Math.min(bookings.length * 25, 100);
  if ($('progressPercent')) $('progressPercent').textContent = `${percent}%`;
  if ($('progressRing')) $('progressRing').style.background =
    `conic-gradient(#8274e9 0 ${percent}%, #eeecf8 ${percent}% 100%)`;
  if ($('progressBar')) $('progressBar').style.width = `${percent}%`;
  if ($('progressCaption')) {
    $('progressCaption').textContent = bookings.length
      ? `Tienes ${bookings.length} ${bookings.length === 1 ? 'asesoría reservada' : 'asesorías reservadas'}. ¡Sigue avanzando!`
      : 'Aún no tienes reservas. ¡Agenda tu primera asesoría!';
  }
}

function enterApp(user) {
  currentUser = user;
  const name = firstName(user.name);

  // El saludo y el perfil muestran solamente el primer nombre.
  $('welcomeName').textContent = name;
  $('userName').textContent = name;
  $('avatar').textContent = name.charAt(0).toUpperCase();

  // Completa automáticamente los datos del estudiante en la reserva.
  $('studentName').value = user.name;
  $('studentEmail').value = user.email;

  authView.classList.add('hidden');
  appView.classList.remove('hidden');
  window.scrollTo(0, 0);
  updateSummary();
  renderMyBookings();
}

function logout() {
  localStorage.removeItem(STORAGE_SESSION);
  currentUser = null;
  appView.classList.add('hidden');
  authView.classList.remove('hidden');
  $('login').reset();
  $('booking').reset();
  $('bookingMessage').innerHTML = '';
  showAuth('login');
  window.scrollTo(0, 0);
}

$('login').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors(['loginEmailError', 'loginPasswordError']);

  const email = $('loginEmail').value.trim().toLowerCase();
  const password = $('loginPassword').value;
  let ok = true;

  if (!validEmail(email)) {
    $('loginEmailError').textContent = 'Ingresa un correo electrónico válido.';
    ok = false;
  }
  if (!password) {
    $('loginPasswordError').textContent = 'Ingresa tu contraseña.';
    ok = false;
  }
  if (!ok) return;

  const user = getUsers().find(item =>
    item.email.toLowerCase() === email && item.password === password
  );

  if (!user) {
    $('loginPasswordError').textContent =
      'No encontramos una cuenta con esos datos. Verifica tu correo y contraseña o regístrate.';
    return;
  }

  saveStorage(STORAGE_SESSION, { email: user.email });
  enterApp(user);
});

$('register').addEventListener('submit', (e) => {
  e.preventDefault();
  clearErrors(['regNameError', 'regEmailError', 'regPasswordError']);

  const name = $('regName').value.trim().replace(/\s+/g, ' ');
  const email = $('regEmail').value.trim().toLowerCase();
  const password = $('regPassword').value;
  let ok = true;

  if (name.length < 3 || name.split(' ').length < 2) {
    $('regNameError').textContent = 'Escribe tu nombre y apellido.';
    ok = false;
  }
  if (!validEmail(email)) {
    $('regEmailError').textContent = 'Ingresa un correo electrónico válido.';
    ok = false;
  }
  if (password.length < 4) {
    $('regPasswordError').textContent = 'Usa al menos 4 caracteres.';
    ok = false;
  }
  if (!ok) return;

  const users = getUsers();
  if (users.some(item => item.email.toLowerCase() === email)) {
    $('regEmailError').textContent =
      'Este correo ya tiene una cuenta. Inicia sesión o utiliza otro correo.';
    return;
  }

  const newUser = {
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
    name,
    email,
    password,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveStorage(STORAGE_USERS, users);
  saveStorage(STORAGE_SESSION, { email: newUser.email });

  $('register').reset();
  enterApp(newUser);
});

$('logout').addEventListener('click', logout);

// Al recargar la página, recupera la sesión guardada en este navegador.
(function restoreSession() {
  const session = readStorage(STORAGE_SESSION, null);
  if (!session?.email) return;

  const user = getUsers().find(item => item.email.toLowerCase() === session.email.toLowerCase());
  if (user) enterApp(user);
  else localStorage.removeItem(STORAGE_SESSION);
})();

document.querySelectorAll('[data-service]').forEach(btn => {
  btn.addEventListener('click', () => {
    $('service').value = btn.dataset.service;
    updateSummary();
    $('reserva').scrollIntoView({ behavior: 'smooth' });
  });
});

const fields = {
  service: 'sumService',
  studentName: 'sumName',
  date: 'sumDate',
  time: 'sumTime',
  modality: 'sumMode'
};

function updateSummary() {
  Object.entries(fields).forEach(([field, target]) => {
    let value = $(field).value || (field === 'service' ? 'Por seleccionar' : '—');
    if (field === 'date' && value) {
      const [y, m, d] = value.split('-');
      value = `${d}/${m}/${y}`;
    }
    $(target).textContent = value;
  });
}

Object.keys(fields).forEach(id => $(id).addEventListener('input', updateSummary));

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString().split('T')[0];
$('date').min = localToday;

$('booking').addEventListener('submit', (e) => {
  e.preventDefault();

  if (!currentUser) {
    $('bookingMessage').textContent = 'Inicia sesión para registrar una reserva.';
    return;
  }

  const required = ['service', 'studentName', 'studentEmail', 'date', 'time', 'modality'];
  required.forEach(id => $(id + 'Error').textContent = '');
  let ok = true;

  required.forEach(id => {
    const el = $(id);
    if (!el.value.trim()) {
      $(id + 'Error').textContent = 'Este campo es obligatorio.';
      ok = false;
    }
  });

  if ($('studentName').value.trim().length < 3) {
    $('studentNameError').textContent = 'Ingresa un nombre válido.';
    ok = false;
  }
  if (!validEmail($('studentEmail').value.trim())) {
    $('studentEmailError').textContent = 'Ingresa un correo válido, por ejemplo nombre@correo.com.';
    ok = false;
  }
  if ($('date').value && $('date').value < localToday) {
    $('dateError').textContent = 'Selecciona una fecha actual o futura.';
    ok = false;
  }

  if (!ok) {
    const first = required.find(id => $(id + 'Error').textContent);
    $(first).focus();
    return;
  }

  updateSummary();

  const booking = {
    id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
    userEmail: currentUser.email,
    studentName: currentUser.name,
    service: $('service').value,
    date: $('date').value,
    time: $('time').value,
    modality: $('modality').value,
    comments: $('comments') ? $('comments').value.trim() : '',
    createdAt: new Date().toISOString()
  };

  const bookings = readStorage(STORAGE_BOOKINGS, []);
  bookings.push(booking);
  saveStorage(STORAGE_BOOKINGS, bookings);
  renderMyBookings();

  $('bookingMessage').innerHTML = `
    <div class="success" role="status">
      <strong>✓ ¡Tu reserva se registró correctamente!</strong>
      Gracias, ${escapeHTML(firstName(currentUser.name))}. Tu reserva de
      ${escapeHTML(booking.service)} se guardó en este navegador.
    </div>`;
  $('bookingMessage').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

function filterServices(query) {
  const q = query.trim().toLocaleLowerCase('es');
  document.querySelectorAll('.service-card').forEach(card => {
    card.style.display = card.textContent.toLocaleLowerCase('es').includes(q) ? '' : 'none';
  });
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}
