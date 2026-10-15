'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const storage = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(`fashion-${key}`)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(`fashion-${key}`, JSON.stringify(value)); } catch { /* Keep this session usable when storage is unavailable. */ } }
};
const metadata = {
  'product-dress': ['Women', 'Clothing', 'A softly textured knit dress paired with a warm camel layer.'],
  'product-old-money': ['Women', 'Clothing', 'Cream tailoring and tonal layers for a quietly confident look.'],
  'product-jacket': ['Men', 'Clothing', 'A rich brown jacket with an easy fit and timeless appeal.'],
  'product-girl': ['Children', 'Clothing', 'A smart pinafore and classic white blouse for little wardrobes.'],
  'trendy-bag': ['Accessories', 'Accessories', 'An understated backpack with room for your daily essentials.'],
  'trendy-hat': ['Accessories', 'Accessories', 'An ivory fedora with a warm leather band and sculpted crown.'],
  'trendy-belt': ['Accessories', 'Accessories', 'A classic brown belt to bring your everyday look together.'],
  'trendy-shirt': ['Men', 'Clothing', 'A versatile neutral polo with a relaxed, considered finish.'],
  'all-tatlum': ['Women', 'Clothing', 'A light, relaxed shirt made for easy layering and sunny days.'],
  'all-quiet': ['Women', 'Clothing', 'Warm tailored separates with an effortless modern silhouette.'],
  'all-sunglasses': ['Accessories', 'Accessories', 'Dark lenses and a warm gold frame for a polished finishing touch.'],
  'all-cutout': ['Children', 'Clothing', 'A simple white dress for bright days and special little moments.'],
  'all-casual': ['Men', 'Clothing', 'An olive jacket and soft neutral layers for everyday dressing.'],
  'all-kids': ['Children', 'Clothing', 'A charming pastel tweed set with a classic collar and beret.']
};
const products = $$('.product-card, .catalog-card').map(card => {
  const image = $('img', card);
  const id = image.getAttribute('src').split('/').pop().replace(/\.(png|jpe?g|webp)$/i, '');
  const button = $('[data-product], [data-cart-product]', card);
  const [department, category, description] = metadata[id];
  const product = { id, name: $('h3', card).textContent, image: image.getAttribute('src'), price: Number(button.dataset.price || button.dataset.cartPrice), department, category, description, collection: id.startsWith('product-') ? 'best' : id.startsWith('trendy-') ? 'trendy' : 'all' };
  card.dataset.productId = id;
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `View ${product.name}`);
  image.addEventListener('click', () => openProduct(product));
  image.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openProduct(product); } });
  const favorite = $('.favorite', card);
  if (favorite) favorite.dataset.saveId = id;
  button.dataset.addId = id;
  button.dataset.product = product.name;
  const price = $('.product-purchase strong, .catalog-purchase strong', card);
  if (price) price.textContent = money(product.price);
  const descriptionNode = $('.catalog-description', card);
  if (descriptionNode) descriptionNode.textContent = description;
  return product;
});
const productById = id => products.find(product => product.id === id);
const savedRaw = storage.get('favorites', []);
let favorites = new Set(Array.isArray(savedRaw) ? savedRaw.filter(id => productById(id)) : []);
const cartRaw = storage.get('cart', []);
let cart = Array.isArray(cartRaw) ? cartRaw.filter(item => item && productById(item.id) && Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 99 && typeof item.size === 'string' && typeof item.color === 'string') : [];
const dialog = $('#information');
const content = document.createElement('div');
content.id = 'dialog-content';
dialog.append(content);
const dialogStatus = document.createElement('p');
dialogStatus.className = 'dialog-status';
dialogStatus.setAttribute('role', 'status');
dialogStatus.setAttribute('aria-live', 'polite');
dialog.append(dialogStatus);
let toastTimeout;
function toast(message) {
  if (dialog.open) dialogStatus.textContent = message;
  $('.toast').textContent = message;
  $('.toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('.toast').classList.remove('visible'), 3500);
}
function openDialog(title, html = '', description = '') {
  dialogStatus.textContent = '';
  const alreadyOpen = dialog.open;
  $('#dialog-title').textContent = title;
  $('#dialog-description').textContent = description;
  $('#dialog-description').hidden = !description;
  content.innerHTML = html;
  dialog.classList.toggle('wide-dialog', Boolean(html));
  if (!dialog.open) dialog.showModal();
  if (alreadyOpen) { $('#dialog-title').tabIndex = -1; $('#dialog-title').focus(); }
  document.body.classList.add('dialog-open');
}
function closeDialog() { dialog.close(); }
$('.close-dialog').addEventListener('click', closeDialog);
dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeDialog();
});
function scrollToSection(selector) {
  const section = $(selector);
  if (!section) return;
  section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
}
function updateCounts() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $('.cart-button').classList.toggle('has-items', count > 0);
  $('.cart-dot').hidden = count === 0;
  $('.cart-dot').textContent = count > 99 ? '99+' : count;
  $('.cart-button').setAttribute('aria-label', `Open shopping bag, ${count} items`);
  $('.saved-count').hidden = favorites.size === 0;
  $('.saved-count').textContent = favorites.size;
  $$('.favorite[data-save-id]').forEach(button => {
    const active = favorites.has(button.dataset.saveId);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `${active ? 'Unsave' : 'Save'} ${productById(button.dataset.saveId).name}`);
    button.classList.toggle('is-favorite', active);
    $('span', button).textContent = active ? '♥' : '♡';
  });
  storage.set('cart', cart);
  storage.set('favorites', [...favorites]);
}
function addToCart(id, size = 'One size', color = 'As pictured') {
  const product = productById(id);
  if (!product) return;
  const existing = cart.find(item => item.id === id && item.size === size && item.color === color);
  if (existing && existing.quantity >= 99) { toast('You can add up to 99 of this item.'); return; }
  if (existing) existing.quantity += 1;
  else cart.push({ id, size, color, quantity: 1 });
  updateCounts();
  toast(`${product.name} added to your bag`);
}
function openProduct(product) {
  const clothing = product.category === 'Clothing';
  const sizes = clothing ? (product.department === 'Children' ? ['4–5 years', '6–7 years', '8–9 years', '10–11 years', '12–13 years'] : ['XS', 'S', 'M', 'L', 'XL']) : ['One size'];
  openDialog(product.name, `<div class="product-detail"><img src="${product.image}" alt="${escapeHTML(product.name)}"><div class="detail-copy"><span class="eyebrow">${product.department} / ${product.category}</span><p class="detail-price">${money(product.price)}</p><p>${escapeHTML(product.description)}</p><form id="product-form"><label for="product-size">${clothing ? 'Choose your size' : 'Size'}</label><select id="product-size" name="size" ${clothing ? 'required' : ''}>${clothing ? '<option value="">Select a size</option>' : ''}${sizes.map(size => `<option>${size}</option>`).join('')}</select><p class="variant-note">Color: as pictured</p><button class="primary-button" type="submit">Add to bag — ${money(product.price)}</button></form><button class="text-button" data-detail-save="${product.id}">${favorites.has(product.id) ? 'Remove from saved' : 'Save for later'}</button><p class="detail-note">Need help choosing? <button class="text-button" data-info="sizing">Read the size guide</button></p></div></div>`);
  $('#product-form').addEventListener('submit', event => { event.preventDefault(); addToCart(product.id, $('#product-size').value); });
}
function renderCart() {
  if (!cart.length) { openDialog('Your shopping bag', '<div class="empty-state"><span class="empty-mark" aria-hidden="true">↗</span><h3>A little room for something lovely.</h3><p>Your bag is empty. Find your next favorite in the collection.</p><button class="primary-button" data-continue>Explore the collection</button></div>'); return; }
  const total = cart.reduce((sum, item) => sum + productById(item.id).price * item.quantity, 0);
  openDialog('Your shopping bag', `<div class="bag-items">${cart.map((item, index) => {
    const product = productById(item.id);
    return `<article class="bag-item"><img src="${product.image}" alt="${escapeHTML(product.name)}"><div><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(item.size)} · ${escapeHTML(item.color)}</p><strong>${money(product.price * item.quantity)}</strong><div class="quantity-controls"><button data-quantity="${index}" data-delta="-1" aria-label="Decrease quantity of ${escapeHTML(product.name)}">−</button><span aria-label="Quantity">${item.quantity}</span><button data-quantity="${index}" data-delta="1" aria-label="Increase quantity of ${escapeHTML(product.name)}" ${item.quantity >= 99 ? 'disabled' : ''}>+</button><button class="remove-item" data-remove="${index}">Remove</button></div></div></article>`;
  }).join('')}</div><div class="bag-summary"><span>Subtotal</span><strong>${money(total)}</strong></div><p class="checkout-note">Your bag is saved on this device. Online payment and delivery checkout are not available yet.</p><button class="primary-button" data-continue>Continue shopping</button>`);
}
function miniCard(product) {
  return `<article class="result-card"><button class="result-image" data-view="${product.id}"><img src="${product.image}" alt="${escapeHTML(product.name)}" loading="lazy"></button><span class="eyebrow">${product.department}</span><h3>${escapeHTML(product.name)}</h3><div><strong>${money(product.price)}</strong><button class="text-button" data-view="${product.id}">View details ↗</button></div></article>`;
}
function browse({ query = '', department = '', category = '', collection = '', saved = false } = {}) {
  let list = products.filter(product => (!query || `${product.name} ${product.description} ${product.department} ${product.category}`.toLowerCase().includes(query.toLowerCase())) && (!department || product.department === department) && (!category || product.category === category) && (!['best', 'trendy'].includes(collection) || product.collection === collection) && (!saved || favorites.has(product.id)));
  if (collection === 'price-low') list.sort((a, b) => a.price - b.price);
  if (collection === 'price-high') list.sort((a, b) => b.price - a.price);
  const title = saved ? 'Your saved pieces' : query ? `Results for “${query}”` : department || category || (collection === 'best' ? 'Best sellers' : collection === 'trendy' ? 'Trending now' : 'Explore the collection');
  openDialog(title, `<p class="results-count">${list.length} ${list.length === 1 ? 'piece' : 'pieces'}${saved ? ' saved for later' : ' to make your own'}</p>${list.length ? `<div class="results-grid">${list.map(miniCard).join('')}</div>` : '<div class="empty-state"><h3>No pieces here just yet.</h3><p>Try another search, or explore the full collection.</p><button class="primary-button" data-show-all>View all products</button></div>'}`);
}
$('.cart-button').addEventListener('click', renderCart);
$('.saved-button').addEventListener('click', () => browse({ saved: true }));
$('#shop-now').addEventListener('click', () => scrollToSection('#collections'));
$('#learn-more').addEventListener('click', () => scrollToSection('.benefits'));
const menuButton = $('.menu-button');
menuButton.setAttribute('aria-expanded', 'true');
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(expanded));
  $('#main-navigation').hidden = !expanded;
});
$$('[data-department]').forEach(button => button.addEventListener('click', () => browse({ department: button.dataset.department })));
$('.search').addEventListener('submit', event => { event.preventDefault(); browse({ query: $('#search').value.trim(), category: $('#category').value, collection: $('#collection').value }); });
$('#category').addEventListener('change', event => browse({ category: event.target.value }));
$('#collection').addEventListener('change', event => browse({ collection: event.target.value }));
$$('[data-collection]').forEach(button => button.addEventListener('click', () => {
  const name = button.dataset.collection;
  if (/Men’s/.test(name)) browse({ department: 'Men' });
  else if (/Women’s/.test(name)) browse({ department: 'Women' });
  else if (/Girls/.test(name)) browse({ department: 'Children' });
  else if (/Shoes/.test(name)) openDialog('The shoe edit', '<div class="coming-edit"><img src="images/shoe-clean.webp" alt="White sneaker with a brown heel"><h3>A fresh step, coming soon.</h3><p>Our footwear collection is on its way. Explore accessories while we put the finishing touches on it.</p><button class="primary-button" data-accessories>Shop accessories</button></div>');
  else if (/Watches/.test(name)) openDialog('The watch edit', '<div class="coming-edit"><img src="images/watch-clean.webp" alt="Gold wristwatch"><h3>Good things take time.</h3><p>Our watch collection is coming soon. Discover the accessories available now.</p><button class="primary-button" data-accessories>Shop accessories</button></div>');
  else browse();
}));
const info = {
  delivery: ['Delivery & returns', 'Delivery services and a returns process will be confirmed before the store opens for orders. Browsing and saving a bag do not place an order or charge you.'],
  sizing: ['Find your fit', 'Use a soft measuring tape to measure around the fullest part of your chest, your natural waist, and the widest part of your hips. Keep the tape level and comfortably loose. Sizes in this preview are indicative; garment measurements will be confirmed before ordering. For children, measure the child rather than relying on age alone.'],
  care: ['Care for your favorites', 'Always follow the care label on your garment. Wash similar colors together and use a gentle cycle where permitted. Air dry delicate pieces, store knitwear folded, and keep leather accessories away from heat and moisture.'],
  contact: ['Here to help', 'Can I place an order? Online checkout is not open yet. You can explore the collection and save a bag.\n\nWill my saved items stay? Your bag and favorites are stored in this browser on this device.\n\nHow can I contact the store? Customer support contact details will be added before orders open.'],
  privacy: ['Your privacy', 'This storefront saves your bag, favorites, and optional profile in your browser on this device. There is no account server or email delivery connected, and this site does not collect payment details. Use “Clear saved data” below to remove this storefront’s saved information.'],
  terms: ['Store information', 'This storefront is a preview catalog. Product images include AI-enhanced reconstructions. Displayed prices are in USD and do not constitute a completed order. Stock, sizing, delivery, returns, and payment terms must be confirmed before purchasing.']
};
function showInfo(key) {
  const [title, description] = info[key] || info.contact;
  openDialog(title, key === 'privacy' ? '<button class="text-button" data-clear-data>Clear saved data</button>' : '', description);
}
function openProfile() {
  const profile = storage.get('profile', {});
  openDialog('Your Fashion edit', `<p>Save your style preferences and make this space your own.</p><form id="profile-form" class="profile-form"><label for="profile-name">First name</label><input id="profile-name" name="name" autocomplete="given-name" required maxlength="60" value="${escapeHTML(profile.name || '')}"><label for="profile-email">Email address</label><input id="profile-email" name="email" type="email" autocomplete="email" required maxlength="254" value="${escapeHTML(profile.email || '')}"><label for="profile-interest">Your style</label><select id="profile-interest" name="interest"><option>All collections</option><option>Women</option><option>Men</option><option>Children</option><option>Accessories</option></select><p class="detail-note">Saved on this device only. This does not create an online account or subscribe you to emails.</p><button class="primary-button">Save my preferences</button></form>`);
  if (profile.interest) $('#profile-interest').value = profile.interest;
  $('#profile-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    storage.set('profile', { name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), interest: form.elements.interest.value });
    updateProfile(); closeDialog(); toast('Your preferences are saved on this device.');
  });
}
function updateProfile() {
  const profile = storage.get('profile', {});
  $('.signup-button>span:last-child').textContent = profile.name ? 'MY EDIT' : 'SIGN UP';
  $('.profile-avatar').textContent = profile.name ? profile.name[0].toUpperCase() : 'F';
}
$('.signup-button').addEventListener('click', openProfile);
$('.footer-join').addEventListener('click', openProfile);
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.addId) openProduct(productById(button.dataset.addId));
  if (button.dataset.saveId || button.dataset.detailSave) {
    const id = button.dataset.saveId || button.dataset.detailSave;
    const wasSaved = favorites.has(id);
    if (wasSaved) favorites.delete(id); else favorites.add(id);
    updateCounts();
    if (button.dataset.detailSave) button.textContent = wasSaved ? 'Save for later' : 'Remove from saved';
    toast(wasSaved ? 'Removed from saved pieces' : 'Saved for later');
  }
  if (button.dataset.view) openProduct(productById(button.dataset.view));
  if ('quantity' in button.dataset) {
    const index = Number(button.dataset.quantity);
    cart[index].quantity += Number(button.dataset.delta);
    cart = cart.filter(item => item.quantity > 0);
    updateCounts(); renderCart();
    $(`[data-quantity="${Math.min(index, cart.length - 1)}"][data-delta="${button.dataset.delta}"]`)?.focus();
  }
  if ('remove' in button.dataset) { cart.splice(Number(button.dataset.remove), 1); updateCounts(); renderCart(); }
  if ('continue' in button.dataset) { closeDialog(); scrollToSection('#all-cloths'); }
  if ('showAll' in button.dataset) browse();
  if ('accessories' in button.dataset) browse({ department: 'Accessories' });
  if (button.dataset.info) showInfo(button.dataset.info);
  if ('clearData' in button.dataset) { cart = []; favorites.clear(); storage.set('profile', {}); updateCounts(); updateProfile(); closeDialog(); toast('Your saved data has been cleared.'); }
});
const styleNotes = [
  ['Start with a neutral foundation. Add texture, a considered accessory, and a little of your own personality.', '01 / 03 — The everyday edit'],
  ['Good layers go a long way. A soft knit, a tailored jacket, and an easy fit make getting dressed feel effortless.', '02 / 03 — The art of layering'],
  ['Choose pieces you love wearing, then wear them your way. Personal style lives in the small details.', '03 / 03 — Make it your own']
];
let noteIndex = 0;
const noteFigure = $('.testimonial-quote');
const noteMotion = matchMedia('(prefers-reduced-motion: reduce)');
let noteTimer;
let noteAnimation;
function changeStyleNote(direction) {
  noteIndex = (noteIndex + direction + styleNotes.length) % styleNotes.length;
  $('#testimonial-text').textContent = styleNotes[noteIndex][0];
  $('#testimonial-author').textContent = styleNotes[noteIndex][1];
  if (!noteMotion.matches) {
    noteAnimation?.cancel();
    noteAnimation = noteFigure.animate([
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 500, easing: 'ease-out' });
  }
}
function startNoteRotation() {
  clearInterval(noteTimer);
  if (document.hidden) return;
  noteTimer = setInterval(() => changeStyleNote(1), 3000);
}
$('.testimonial-previous').addEventListener('click', () => { changeStyleNote(-1); startNoteRotation(); });
$('.testimonial-next').addEventListener('click', () => { changeStyleNote(1); startNoteRotation(); });
document.addEventListener('visibilitychange', startNoteRotation);
noteMotion.addEventListener('change', startNoteRotation);
$('#testimonial-text').setAttribute('aria-live', 'off');
startNoteRotation();
$('#copyright-year').textContent = new Date().getFullYear();
updateCounts();
updateProfile();
