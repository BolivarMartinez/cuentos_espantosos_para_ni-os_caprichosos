/* =========================================================
   CUENTOS ESPANTOSOS — lógica del sitio (trabajo hackathon)
   Persistencia: localStorage (simula backend en el navegador)
   ========================================================= */

const DB_KEYS = {
  USERS: 'ce_users',
  CURRENT_USER: 'ce_current_user',
  COMICS: 'ce_comics',
  MERCH: 'ce_merch',
  REVIEWS: 'ce_reviews',   // { [comicId]: [{author, stars, text, date}] }
  CART: 'ce_cart',
  FAVORITES: 'ce_favorites',
  NEWS: 'ce_news',
  ADMIN_SESSION: 'ce_admin_session'
};

const AUDITOR_CREDENTIALS = {
  email: 'auditor@empresa.com',
  password: 'Auditor_2026*'
};

const ADMIN_CREDENTIALS = {
  username: 'cuentos espantosos',
  password: 'LEGENDS_26*'
};

/* ---------- helpers de almacenamiento ---------- */
function load(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function cryptoId() {
  return 'id_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
function formatPrice(value) {
  const amount = parseFloat(String(value || '').replace(/[^0-9.-]+/g, ''));
  return Number.isFinite(amount) ? `C$ ${amount.toFixed(2)}` : 'C$ 0.00';
}
function getProductById(id) {
  const comics = load(DB_KEYS.COMICS, []);
  const merch = load(DB_KEYS.MERCH, []);
  return comics.find(item => item.id === id) || merch.find(item => item.id === id) || null;
}
function getFavoriteIds() {
  if (!currentUser) return [];
  const favorites = load(DB_KEYS.FAVORITES, {});
  return favorites[currentUser.id] || [];
}
function toggleFavorite(productId) {
  if (!requireUser()) return;
  const favorites = load(DB_KEYS.FAVORITES, {});
  const userFavorites = new Set(favorites[currentUser.id] || []);
  if (userFavorites.has(productId)) {
    userFavorites.delete(productId);
    showToast('Eliminado de favoritos');
  } else {
    userFavorites.add(productId);
    showToast('Agregado a favoritos');
  }
  favorites[currentUser.id] = [...userFavorites];
  save(DB_KEYS.FAVORITES, favorites);
  renderFavorites();
  renderComics();
  renderMerch();
}

function renderFavorites() {
  const list = document.getElementById('favoritesList');
  const count = document.getElementById('favoritesCount');
  const buttonCount = document.getElementById('favoritesButtonCount');
  const favoritesButton = document.getElementById('favoritesBtn');
  if (!list || !count) return;

  if (!currentUser) {
    count.textContent = 'Inicia sesión para guardarlos';
    if (buttonCount) buttonCount.textContent = '0';
    if (favoritesButton) favoritesButton.title = 'Favoritos (inicia sesión)';
    list.innerHTML = '<button class="favorites-login" type="button">Iniciar sesión</button>';
    list.querySelector('.favorites-login').addEventListener('click', () => openModal('loginModal'));
    return;
  }

  const favorites = getFavoriteIds()
    .map(id => getProductById(id))
    .filter(Boolean);
  if (buttonCount) buttonCount.textContent = favorites.length;
  if (favoritesButton) favoritesButton.title = `Favoritos (${favorites.length})`;
  count.textContent = `${favorites.length} ${favorites.length === 1 ? 'producto' : 'productos'}`;

  if (favorites.length === 0) {
    list.innerHTML = '<p class="favorites-empty">Aún no has guardado productos.</p>';
    return;
  }

  list.innerHTML = favorites.map(item => {
    const name = item.title || item.name || 'Producto';
    return `<article class="favorite-item">
      ${item.image ? `<img src="${item.image}" alt="${escapeHtml(name)}" />` : '<div class="favorite-no-image">★</div>'}
      <div class="favorite-item-info"><strong>${escapeHtml(name)}</strong><span>${formatPrice(item.price)}</span></div>
      <button class="favorite-buy" data-id="${item.id}" aria-label="Comprar ${escapeHtml(name)}" title="Agregar al carrito">🛒</button>
      <button class="favorite-remove" data-id="${item.id}" aria-label="Quitar ${escapeHtml(name)} de favoritos" title="Quitar de favoritos">♥</button>
    </article>`;
  }).join('');
  list.querySelectorAll('.favorite-buy').forEach(button => {
    button.addEventListener('click', () => addToCart(button.dataset.id));
  });
  list.querySelectorAll('.favorite-remove').forEach(button => {
    button.addEventListener('click', () => toggleFavorite(button.dataset.id));
  });
}

/* ---------- datos iniciales (igual a la maqueta) ---------- */
function seedData() {
  if (!localStorage.getItem(DB_KEYS.COMICS)) {
    save(DB_KEYS.COMICS, [
      { id: cryptoId(), title: 'Comic 1', price: '$12.00', image: 'assets/comic-cover-default.png' },
      { id: cryptoId(), title: 'Comic 2', price: '$12.00', image: 'assets/comic-cover-default.png' }
    ]);
  }
  if (!localStorage.getItem(DB_KEYS.MERCH)) {
    save(DB_KEYS.MERCH, [
      { id: cryptoId(), name: 'Portada coleccionable', image: 'assets/comic-cover-default.png' },
      { id: cryptoId(), name: 'Lámina escena nocturna', image: 'assets/hero-banner.png' },
      { id: cryptoId(), name: 'Póster LEGENDS', image: 'assets/legends-logo.png' }
    ]);
  }
  const users = load(DB_KEYS.USERS, []);
  if (!users.some(user => user.email === AUDITOR_CREDENTIALS.email)) {
    users.push({
      id: 'auditor_account',
      name: 'Auditor del sistema',
      email: AUDITOR_CREDENTIALS.email,
      password: AUDITOR_CREDENTIALS.password,
      role: 'auditor'
    });
    save(DB_KEYS.USERS, users);
  }
  if (!localStorage.getItem(DB_KEYS.REVIEWS)) save(DB_KEYS.REVIEWS, {});
  if (!localStorage.getItem(DB_KEYS.CART)) save(DB_KEYS.CART, {});
  if (!localStorage.getItem(DB_KEYS.NEWS)) save(DB_KEYS.NEWS, []);
}

/* ---------- estado ---------- */
let currentUser = load(DB_KEYS.CURRENT_USER, null);
let isAdmin = load(DB_KEYS.ADMIN_SESSION, false);
let activeReviewComicId = null;
let selectedStars = 0;

/* ---------- utilidades UI ---------- */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

/* =========================================================
   AUTENTICACIÓN DE USUARIOS
   ========================================================= */
function refreshAuthUI() {
  const authBtn = document.getElementById('authBtn');
  authBtn.textContent = currentUser ? `Salir (${currentUser.name})` : 'Registrarse / Iniciar sesión';
}

function requireUser() {
  if (currentUser) return true;
  showToast('Debes registrarte e iniciar sesión para comprar');
  openModal('loginModal');
  return false;
}

document.getElementById('authBtn').addEventListener('click', () => {
  if (currentUser) {
    currentUser = null;
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    document.body.classList.remove('auditor-mode');
    closeModal('auditorPanelModal');
    refreshAuthUI();
    renderFavorites();
    renderComics();
    renderMerch();
    showToast('Sesión cerrada');
  } else {
    openModal('registerModal');
  }
});

document.getElementById('goToLogin').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('registerModal');
  openModal('loginModal');
});
document.getElementById('goToRegister').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('loginModal');
  openModal('registerModal');
});
document.getElementById('reviewLoginLink').addEventListener('click', (e) => {
  e.preventDefault();
  closeModal('reviewsModal');
  openModal('loginModal');
});

document.getElementById('registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const errorEl = document.getElementById('registerError');

  const users = load(DB_KEYS.USERS, []);
  if (users.some(u => u.email === email)) {
    errorEl.textContent = 'Ya existe una cuenta con ese correo.';
    return;
  }
  const newUser = { id: cryptoId(), name, email, password };
  users.push(newUser);
  save(DB_KEYS.USERS, users);

  currentUser = { id: newUser.id, name: newUser.name, email: newUser.email };
  save(DB_KEYS.CURRENT_USER, currentUser);

  errorEl.textContent = '';
  e.target.reset();
  closeModal('registerModal');
  refreshAuthUI();
  showToast(`¡Bienvenido/a, ${name}!`);
  renderComics();
  renderMerch();
  renderFavorites();
  if (activeReviewComicId) renderReviewForm();
});

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');

  const users = load(DB_KEYS.USERS, []);
  const found = users.find(u => u.email === email && u.password === password);
  if (!found) {
    errorEl.textContent = 'Correo o contraseña incorrectos.';
    return;
  }
  currentUser = { id: found.id, name: found.name, email: found.email, role: found.role || 'customer' };
  save(DB_KEYS.CURRENT_USER, currentUser);
  errorEl.textContent = '';
  e.target.reset();
  closeModal('loginModal');
  refreshAuthUI();
  if (currentUser.role === 'auditor') {
    document.body.classList.add('auditor-mode');
    renderAuditPanel();
    openModal('auditorPanelModal');
    showToast('Modo auditor activado: solo lectura');
  } else {
    showToast(`Sesión iniciada como ${found.name}`);
  }
  renderComics();
  renderMerch();
  renderFavorites();
  if (activeReviewComicId) renderReviewForm();
});

document.getElementById('auditorLogoutBtn').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem(DB_KEYS.CURRENT_USER);
  document.body.classList.remove('auditor-mode');
  closeModal('auditorPanelModal');
  refreshAuthUI();
  renderFavorites();
  renderComics();
  renderMerch();
  showToast('Sesión de auditor cerrada');
});

/* =========================================================
   ACCESO SECRETO DE ADMINISTRADOR (5 clics en el logo)
   ========================================================= */
let logoClicks = 0;
let logoClickTimer = null;
document.getElementById('logoBtn').addEventListener('click', () => {
  logoClicks++;
  clearTimeout(logoClickTimer);
  logoClickTimer = setTimeout(() => { logoClicks = 0; }, 1200);
  if (logoClicks >= 5) {
    logoClicks = 0;
    if (isAdmin) {
      openModal('adminPanelModal');
      renderAdminLists();
    } else {
      openModal('adminLoginModal');
    }
  }
});

document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('adminUser').value.trim();
  const pass = document.getElementById('adminPass').value;
  const errorEl = document.getElementById('adminLoginError');

  if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
    isAdmin = true;
    save(DB_KEYS.ADMIN_SESSION, true);
    errorEl.textContent = '';
    e.target.reset();
    closeModal('adminLoginModal');
    openModal('adminPanelModal');
    renderAdminLists();
    showToast('Acceso de administrador concedido');
  } else {
    errorEl.textContent = 'Usuario o contraseña incorrectos.';
  }
});

document.getElementById('adminLogoutBtn').addEventListener('click', () => {
  isAdmin = false;
  localStorage.removeItem(DB_KEYS.ADMIN_SESSION);
  closeModal('adminPanelModal');
  showToast('Sesión de administrador cerrada');
});

/* =========================================================
   COMICS
   ========================================================= */
function renderComics() {
  const comics = load(DB_KEYS.COMICS, []);
  const grid = document.getElementById('comicsGrid');
  const cart = load(DB_KEYS.CART, {});
  const favoriteIds = getFavoriteIds();
  grid.innerHTML = '';
  comics.forEach(comic => {
    const qty = (cart[comic.id] && cart[comic.id].qty) || 0;
    const card = document.createElement('div');
    card.className = 'comic-card';
    card.innerHTML = `
      <h3 class="comic-title">${escapeHtml(comic.title)}</h3>
      <button class="favorite-btn ${favoriteIds.includes(comic.id) ? 'active' : ''}" data-id="${comic.id}" aria-label="${favoriteIds.includes(comic.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}" title="${favoriteIds.includes(comic.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}">${favoriteIds.includes(comic.id) ? '♥' : '♡'}</button>
      <div class="comic-cover-wrap" data-comic="${comic.id}" title="Ver reseñas y comentarios">
        ${comic.image
          ? `<img src="${comic.image}" alt="${escapeHtml(comic.title)}" />`
          : `<div class="comic-cover-placeholder">${escapeHtml(comic.title)}</div>`}
      </div>
      <button class="price-btn" data-id="${comic.id}" title="Agregar al carrito">${formatPrice(comic.price)}</button>
      <div class="qty-controls">
        <button class="qty-minus" data-id="${comic.id}" aria-label="Disminuir">−</button>
        <span class="qty-count" data-id="${comic.id}">${qty}</span>
        <button class="qty-plus" data-id="${comic.id}" aria-label="Aumentar">+</button>
      </div>
      <span class="qty-badge" data-qty="${comic.id}">${qty > 0 ? `En tu carrito: ${qty}` : ''}</span>
    `;
    grid.appendChild(card);

    const plus = card.querySelector('.qty-plus');
    const minus = card.querySelector('.qty-minus');
    if (plus) plus.addEventListener('click', () => updateCartQty(plus.dataset.id, 1));
    if (minus) minus.addEventListener('click', () => updateCartQty(minus.dataset.id, -1));
  });

  grid.querySelectorAll('.price-btn').forEach(btn => btn.addEventListener('click', () => addToCart(btn.dataset.id)));
  grid.querySelectorAll('.favorite-btn').forEach(btn => btn.addEventListener('click', () => toggleFavorite(btn.dataset.id)));
  grid.querySelectorAll('.comic-cover-wrap').forEach(el => el.addEventListener('click', () => openReviews(el.dataset.comic)));
}

function addToCart(comicId) {
  if (!requireUser()) return;
  const cart = load(DB_KEYS.CART, {});
  const current = (cart[comicId] && cart[comicId].qty) || 0;
  cart[comicId] = { qty: current + 1 };
  save(DB_KEYS.CART, cart);
  const badge = document.querySelector(`[data-qty="${comicId}"]`);
  if (badge) badge.textContent = `En tu carrito: ${current + 1}`;
  showToast('Agregado al carrito');
  renderComics();
  renderMerch();
  renderCart();
  refreshCartUI();
}

/* ---------- control de cantidades y carrito UI ---------- */
function updateCartQty(comicId, delta) {
  if (!requireUser()) return;
  const cart = load(DB_KEYS.CART, {});
  const current = (cart[comicId] && cart[comicId].qty) || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) delete cart[comicId]; else cart[comicId] = { qty: next };
  save(DB_KEYS.CART, cart);
  const badge = document.querySelector(`[data-qty="${comicId}"]`);
  if (badge) badge.textContent = next > 0 ? `En tu carrito: ${next}` : '';
  const qtySpan = document.querySelector(`.qty-count[data-id="${comicId}"]`);
  if (qtySpan) qtySpan.textContent = next;
  renderComics();
  renderMerch();
  renderCart();
  refreshCartUI();
}

function refreshCartUI() {
  const cart = load(DB_KEYS.CART, {});
  const count = Object.values(cart).reduce((s, it) => s + (it.qty || 0), 0);
  const countEl = document.getElementById('cartCount');
  if (countEl) countEl.textContent = count;
  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) cartBtn.title = `Carrito (${count})`;
}

function renderCart() {
  const cart = load(DB_KEYS.CART, {});
  const cartList = document.getElementById('cartList');
  if (!cartList) return;
  cartList.innerHTML = '';
  let total = 0;
  Object.keys(cart).forEach(id => {
    const item = cart[id];
    const product = getProductById(id) || {};
    const priceNum = product.price ? parseFloat(String(product.price).replace(/[^0-9.-]+/g, '')) : 0;
    const lineTotal = (priceNum || 0) * (item.qty || 0);
    total += lineTotal;

    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="cart-item-left">
        ${product.image ? `<img src="${product.image}" alt="${escapeHtml(product.title || product.name || 'Artículo')}" />` : ''}
        <div>
          <div class="cart-item-title">${escapeHtml(product.title || product.name || 'Artículo')}</div>
          <div class="cart-item-price">${formatPrice(product.price)}</div>
          <div class="cart-item-subtotal">Subtotal: ${formatPrice(lineTotal)}</div>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="cart-qty-controls">
          <button class="cart-decr" data-id="${id}">−</button>
          <span class="cart-qty" data-id="${id}">${item.qty}</span>
          <button class="cart-incr" data-id="${id}">+</button>
        </div>
        <button class="cart-remove" data-id="${id}">Eliminar</button>
      </div>
    `;
    cartList.appendChild(row);
  });
  document.getElementById('cartTotal').textContent = formatPrice(total);

  cartList.querySelectorAll('.cart-incr').forEach(btn => btn.addEventListener('click', () => updateCartQty(btn.dataset.id, 1)));
  cartList.querySelectorAll('.cart-decr').forEach(btn => btn.addEventListener('click', () => updateCartQty(btn.dataset.id, -1)));
  cartList.querySelectorAll('.cart-remove').forEach(btn => btn.addEventListener('click', () => {
    const c = load(DB_KEYS.CART, {});
    delete c[btn.dataset.id];
    save(DB_KEYS.CART, c);
    renderComics();
    renderMerch();
    renderCart();
    refreshCartUI();
  }));
  refreshCartUI();
}

/* =========================================================
   RESEÑAS / COMENTARIOS
   ========================================================= */
function openReviews(comicId) {
  activeReviewComicId = comicId;
  const comics = load(DB_KEYS.COMICS, []);
  const comic = comics.find(c => c.id === comicId);
  document.getElementById('reviewsComicTitle').textContent = `Reseñas — ${comic ? comic.title : ''}`;
  selectedStars = 0;
  updateStarPicker();
  document.getElementById('reviewText').value = '';
  renderReviewForm();
  renderReviewsList();
  openModal('reviewsModal');
}

function renderReviewForm() {
  const formWrap = document.getElementById('reviewFormWrap');
  const notice = document.getElementById('reviewLoginNotice');
  if (currentUser) {
    formWrap.style.display = 'block';
    notice.style.display = 'none';
  } else {
    formWrap.style.display = 'none';
    notice.style.display = 'block';
  }
}

document.querySelectorAll('#starPicker span').forEach(star => {
  star.addEventListener('click', () => {
    selectedStars = parseInt(star.dataset.star, 10);
    updateStarPicker();
  });
});
function updateStarPicker() {
  document.querySelectorAll('#starPicker span').forEach(star => {
    star.classList.toggle('active', parseInt(star.dataset.star, 10) <= selectedStars);
  });
}

document.getElementById('reviewForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!currentUser) {
    showToast('Debes registrarte e iniciar sesión para comentar');
    openModal('loginModal');
    return;
  }
  if (!activeReviewComicId) return;
  if (selectedStars === 0) { showToast('Selecciona una calificación de 1 a 5 estrellas'); return; }

  const text = document.getElementById('reviewText').value.trim();
  if (!text) return;

  const reviews = load(DB_KEYS.REVIEWS, {});
  if (!reviews[activeReviewComicId]) reviews[activeReviewComicId] = [];
  reviews[activeReviewComicId].push({
    id: cryptoId(),
    author: currentUser.name,
    stars: selectedStars,
    text,
    date: new Date().toLocaleDateString('es-NI')
  });
  save(DB_KEYS.REVIEWS, reviews);

  document.getElementById('reviewText').value = '';
  selectedStars = 0;
  updateStarPicker();
  renderReviewsList();
  showToast('Reseña publicada');
});

function renderReviewsList() {
  const reviews = load(DB_KEYS.REVIEWS, {});
  const list = reviews[activeReviewComicId] || [];
  const container = document.getElementById('reviewsList');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<p class="form-hint">Todavía no hay reseñas para este cómic.</p>';
    return;
  }

  list.slice().reverse().forEach(r => {
    const item = document.createElement('div');
    item.className = 'review-item';
    item.innerHTML = `
      <div class="review-top">
        <span class="review-author">${escapeHtml(r.author)}</span>
        <span class="review-stars">${'★'.repeat(r.stars)}${'☆'.repeat(5 - r.stars)}</span>
      </div>
      <p class="review-text">${escapeHtml(r.text)}</p>
      ${isAdmin ? `<button class="review-del" data-id="${r.id}">Eliminar comentario</button>` : ''}
    `;
    container.appendChild(item);
  });

  if (isAdmin) {
    container.querySelectorAll('.review-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const reviewsAll = load(DB_KEYS.REVIEWS, {});
        reviewsAll[activeReviewComicId] = (reviewsAll[activeReviewComicId] || []).filter(r => r.id !== btn.dataset.id);
        save(DB_KEYS.REVIEWS, reviewsAll);
        renderReviewsList();
        showToast('Comentario eliminado');
      });
    });
  }
}

/* =========================================================
   MERCHANDISING
   ========================================================= */
function renderMerch() {
  const merch = load(DB_KEYS.MERCH, []);
  const cart = load(DB_KEYS.CART, {});
  const favoriteIds = getFavoriteIds();
  const grid = document.getElementById('merchGrid');
  grid.innerHTML = '';
  merch.forEach(item => {
    const card = document.createElement('div');
    card.className = 'merch-card';
    const qty = (cart[item.id] && cart[item.id].qty) || 0;
    card.innerHTML = `
      ${item.image
        ? `<button class="merch-image-btn" data-image="${item.image}" data-name="${escapeHtml(item.name)}" aria-label="Ampliar ${escapeHtml(item.name)}"><img src="${item.image}" alt="${escapeHtml(item.name)}" /></button>`
        : '<div class="merch-placeholder">foto</div>'}
      <div class="merch-info">
        <div class="merch-name-row"><span class="merch-name" data-id="${item.id}" role="button" tabindex="0" title="Agregar al carrito">${escapeHtml(item.name)}<strong>${formatPrice(item.price)}</strong></span><button class="favorite-btn ${favoriteIds.includes(item.id) ? 'active' : ''}" data-id="${item.id}" aria-label="${favoriteIds.includes(item.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}" title="${favoriteIds.includes(item.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}">${favoriteIds.includes(item.id) ? '♥' : '♡'}</button></div>
        <div class="qty-controls">
          <button class="qty-minus" data-id="${item.id}" aria-label="Disminuir">−</button>
          <span class="qty-count" data-id="${item.id}">${qty}</span>
          <button class="qty-plus" data-id="${item.id}" aria-label="Aumentar">+</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('.merch-name').forEach(name => {
    name.addEventListener('click', () => addToCart(name.dataset.id));
    name.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        addToCart(name.dataset.id);
      }
    });
  });
  grid.querySelectorAll('.favorite-btn').forEach(btn => btn.addEventListener('click', () => toggleFavorite(btn.dataset.id)));
  grid.querySelectorAll('.qty-plus').forEach(btn => btn.addEventListener('click', () => updateCartQty(btn.dataset.id, 1)));
  grid.querySelectorAll('.qty-minus').forEach(btn => btn.addEventListener('click', () => updateCartQty(btn.dataset.id, -1)));
  grid.querySelectorAll('.merch-image-btn').forEach(btn => btn.addEventListener('click', () => openImageZoom(btn.dataset.image, btn.dataset.name)));
}

function openImageZoom(image, name) {
  document.getElementById('zoomImage').src = image;
  document.getElementById('zoomImage').alt = name;
  openModal('imageZoomModal');
}

function formatNewsDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('es-NI', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function renderNews() {
  const list = document.getElementById('newsList');
  if (!list) return;
  const news = load(DB_KEYS.NEWS, []).slice().sort((first, second) =>
    String(second.date || '').localeCompare(String(first.date || ''))
  );
  if (news.length === 0) {
    list.innerHTML = '<p class="news-empty">Próximamente encontrarás aquí las novedades de la tienda.</p>';
    return;
  }
  list.innerHTML = news.map(item => `
    <article class="news-card">
      <div class="news-card-top">
        <span class="news-category">${escapeHtml(item.category)}</span>
        <time datetime="${escapeHtml(item.date)}">${escapeHtml(formatNewsDate(item.date))}</time>
      </div>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.description)}</p>
    </article>
  `).join('');
}

/* =========================================================
   PANEL ADMIN — CRUD
   ========================================================= */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function imageToDataUrl(file) {
  const source = await fileToDataUrl(file);
  const image = new Image();
  image.src = source;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const maxSize = 1200;
  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

document.getElementById('addComicForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('newComicTitle').value.trim();
  const price = document.getElementById('newComicPrice').value.trim();
  const fileInput = document.getElementById('newComicImage');
  let image = '';
  try {
    if (fileInput.files[0]) image = await imageToDataUrl(fileInput.files[0]);
  } catch {
    showToast('No se pudo cargar la imagen');
    return;
  }

  const comics = load(DB_KEYS.COMICS, []);
  comics.push({ id: cryptoId(), title, price, image });
  save(DB_KEYS.COMICS, comics);

  e.target.reset();
  renderAdminLists();
  renderComics();
  refreshAuditIfOpen();
  showToast('Cómic agregado');
});

document.getElementById('addMerchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('newMerchName').value.trim();
  const price = document.getElementById('newMerchPrice').value.trim();
  const fileInput = document.getElementById('newMerchImage');
  let image = '';
  try {
    if (fileInput.files[0]) image = await imageToDataUrl(fileInput.files[0]);
  } catch {
    showToast('No se pudo cargar la imagen');
    return;
  }

  const merch = load(DB_KEYS.MERCH, []);
  merch.push({ id: cryptoId(), name, price, image });
  save(DB_KEYS.MERCH, merch);

  e.target.reset();
  renderAdminLists();
  renderMerch();
  refreshAuditIfOpen();
  showToast('Producto agregado');
});

document.getElementById('addNewsForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const news = load(DB_KEYS.NEWS, []);
  news.push({
    id: cryptoId(),
    category: document.getElementById('newNewsCategory').value,
    title: document.getElementById('newNewsTitle').value.trim(),
    date: document.getElementById('newNewsDate').value,
    description: document.getElementById('newNewsDescription').value.trim()
  });
  save(DB_KEYS.NEWS, news);
  e.target.reset();
  renderAdminLists();
  renderNews();
  refreshAuditIfOpen();
  showToast('Noticia publicada');
});

function renderAdminLists() {
  const comics = load(DB_KEYS.COMICS, []);
  const merch = load(DB_KEYS.MERCH, []);

  const comicsList = document.getElementById('adminComicsList');
  comicsList.innerHTML = '';
  comics.forEach(c => {
    const row = document.createElement('div');
    row.className = 'admin-list-item';
    row.innerHTML = `
      <span class="item-info">${c.image ? `<img src="${c.image}" />` : ''}${escapeHtml(c.title)} — ${formatPrice(c.price)}</span>
      <button class="del-btn" data-id="${c.id}">Eliminar</button>
    `;
    comicsList.appendChild(row);
  });
  comicsList.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const updated = load(DB_KEYS.COMICS, []).filter(c => c.id !== btn.dataset.id);
      save(DB_KEYS.COMICS, updated);
      renderAdminLists();
      renderComics();
      refreshAuditIfOpen();
      showToast('Cómic eliminado');
    });
  });

  const merchList = document.getElementById('adminMerchList');
  merchList.innerHTML = '';
  merch.forEach(m => {
    const row = document.createElement('div');
    row.className = 'admin-list-item';
    row.innerHTML = `
      <span class="item-info">${m.image ? `<img src="${m.image}" />` : ''}${escapeHtml(m.name)} — ${formatPrice(m.price)}</span>
      <button class="del-btn" data-id="${m.id}">Eliminar</button>
    `;
    merchList.appendChild(row);
  });
  merchList.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const updated = load(DB_KEYS.MERCH, []).filter(m => m.id !== btn.dataset.id);
      save(DB_KEYS.MERCH, updated);
      renderAdminLists();
      renderMerch();
      refreshAuditIfOpen();
      showToast('Producto eliminado');
    });
  });

  const newsList = document.getElementById('adminNewsList');
  newsList.innerHTML = '';
  const news = load(DB_KEYS.NEWS, []);
  news.forEach(item => {
    const row = document.createElement('div');
    row.className = 'admin-list-item';
    row.innerHTML = `
      <span class="item-info news-admin-info"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} — ${escapeHtml(formatNewsDate(item.date))}</small></span>
      <button class="del-btn" data-id="${item.id}">Eliminar</button>
    `;
    newsList.appendChild(row);
  });
  newsList.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const updated = load(DB_KEYS.NEWS, []).filter(item => item.id !== btn.dataset.id);
      save(DB_KEYS.NEWS, updated);
      renderAdminLists();
      renderNews();
      refreshAuditIfOpen();
      showToast('Noticia eliminada');
    });
  });
}

function renderAuditPanel() {
  const comics = load(DB_KEYS.COMICS, []);
  const merch = load(DB_KEYS.MERCH, []);
  const news = load(DB_KEYS.NEWS, []);
  const reviews = load(DB_KEYS.REVIEWS, {});
  const cart = load(DB_KEYS.CART, {});
  const salesUnits = Object.values(cart).reduce((total, item) => total + (item.qty || 0), 0);
  const reviewCount = Object.values(reviews).reduce((total, list) => total + list.length, 0);

  document.getElementById('auditStats').innerHTML = `
    <div class="audit-stat"><strong>${comics.length}</strong><span>Cómics</span></div>
    <div class="audit-stat"><strong>${merch.length}</strong><span>Productos</span></div>
    <div class="audit-stat"><strong>${news.length}</strong><span>Noticias</span></div>
    <div class="audit-stat"><strong>${reviewCount}</strong><span>Reseñas</span></div>
    <div class="audit-stat"><strong>${salesUnits}</strong><span>Unidades en ventas</span></div>
  `;

  renderAuditList('auditComicsList', comics, item => `${item.title} — ${formatPrice(item.price)}`, 'No hay cómics registrados.');
  renderAuditList('auditMerchList', merch, item => `${item.name} — ${formatPrice(item.price)}`, 'No hay productos registrados.');
  renderAuditList('auditNewsList', news, item => `${item.title} — ${formatNewsDate(item.date)}`, 'No hay noticias publicadas.');
}

function refreshAuditIfOpen() {
  if (currentUser && currentUser.role === 'auditor' && document.getElementById('auditorPanelModal').classList.contains('open')) {
    renderAuditPanel();
  }
}

function renderAuditList(elementId, items, label, emptyMessage) {
  const list = document.getElementById(elementId);
  if (items.length === 0) {
    list.innerHTML = `<p class="audit-empty">${emptyMessage}</p>`;
    return;
  }
  list.innerHTML = items.map(item => `<div class="audit-list-item"><span>${escapeHtml(label(item))}</span><span class="read-only-label">Lectura</span></div>`).join('');
}

window.addEventListener('storage', event => {
  const auditDataKeys = [DB_KEYS.COMICS, DB_KEYS.MERCH, DB_KEYS.NEWS];
  if (auditDataKeys.includes(event.key) && currentUser && currentUser.role === 'auditor') {
    renderAuditPanel();
  }
});

/* =========================================================
   UTIL
   ========================================================= */
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* =========================================================
   INIT
   ========================================================= */
seedData();
if (currentUser && currentUser.role === 'auditor') {
  document.body.classList.add('auditor-mode');
  renderAuditPanel();
  openModal('auditorPanelModal');
}
refreshAuthUI();
renderFavorites();
renderNews();
renderComics();
renderMerch();
renderCart();
refreshCartUI();

const cartBtnEl = document.getElementById('cartBtn');
if (cartBtnEl) cartBtnEl.addEventListener('click', () => {
  const panel = document.getElementById('cartPanel');
  if (panel) {
    panel.classList.add('open');
    renderCart();
  }
});
const favoritesBtnEl = document.getElementById('favoritesBtn');
if (favoritesBtnEl) favoritesBtnEl.addEventListener('click', () => {
  const strip = document.getElementById('favoritesStrip');
  if (strip) {
    const isOpen = strip.classList.toggle('open');
    favoritesBtnEl.setAttribute('aria-expanded', String(isOpen));
    strip.setAttribute('aria-hidden', String(!isOpen));
  }
});
const cartCloseEl = document.getElementById('cartClose');
if (cartCloseEl) cartCloseEl.addEventListener('click', () => {
  const panel = document.getElementById('cartPanel');
  if (panel) panel.classList.remove('open');
});
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
  if (!requireUser()) return;
  showToast('Función de pago no implementada');
});
