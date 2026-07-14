const whatsappPhone = '918891454631';
const pageTransition = document.getElementById('pageTransition');
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');
const interactiveSelectors = 'a, button, input, select, textarea, .btn-primary, .btn-outline, .pkg-book, .faq-toggle, .whatsapp-float';
let cursorVisible = true;

function openWhatsApp(message) {
  const url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function startRevealObserver() {
  const elements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  elements.forEach(el => observer.observe(el));
}

function startCursor() {
  if (!cursorDot || !cursorOutline) return;

  document.addEventListener('mousemove', (event) => {
    cursorDot.style.left = `${event.clientX}px`;
    cursorDot.style.top = `${event.clientY}px`;
    cursorOutline.style.left = `${event.clientX}px`;
    cursorOutline.style.top = `${event.clientY}px`;
  });

  document.querySelectorAll(interactiveSelectors).forEach((el) => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  document.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget || event.relatedTarget.nodeName === 'HTML') {
      cursorVisible = false;
      cursorDot.style.opacity = '0';
      cursorOutline.style.opacity = '0';
    }
  });

  document.addEventListener('mouseenter', () => {
    cursorVisible = true;
    cursorDot.style.opacity = '1';
    cursorOutline.style.opacity = '1';
  });
}

function attachMobileNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('open');
    links.classList.toggle('open');
  });
}

function attachPageTransition() {
  if (!pageTransition) return;
  document.querySelectorAll('a[href]').forEach((link) => {
    if (link.target === '_blank' || link.href.startsWith('mailto:') || link.href.startsWith('tel:')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    if (url.pathname === window.location.pathname && url.hash) return;

    link.addEventListener('click', (event) => {
      if (link.href === window.location.href) return;
      event.preventDefault();
      pageTransition.classList.add('visible');
      setTimeout(() => {
        window.location.href = link.href;
      }, 220);
    });
  });

  window.addEventListener('beforeunload', () => {
    if (pageTransition) pageTransition.classList.add('visible');
  });
}

function attachWhatsAppButton() {
  const waFloat = document.querySelector('.whatsapp-float');
  if (!waFloat) return;
  waFloat.addEventListener('click', () => {
    const message = `Hi Marlinos Diventures, I want to inquire about dive packages and availability.`;
    openWhatsApp(message);
  });
}

function attachWhatsAppChatButtons() {
  document.querySelectorAll('.whatsapp-chat').forEach((button) => {
    button.addEventListener('click', () => {
      const message = `Hi Marlinos Diventures, I would like to chat about dive planning and availability.`;
      openWhatsApp(message);
    });
  });
}

async function notifyOwnerAndOpenCustomer(payload, customerMessage) {
  const ownerMessage = `New Dive Booking Request\n\nName: ${payload.name || 'N/A'}\nEmail: ${payload.email || 'N/A'}\nPhone: ${payload.phone || 'N/A'}\nPackage: ${payload.package || 'N/A'}\nPreferred Date: ${payload.date || 'N/A'}\n\nMessage: ${payload.message || 'N/A'}`;
  const ownerUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(ownerMessage)}`;

  let result = null;
  try {
    const response = await fetch('/booking-notification/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    result = await response.json();
  } catch (error) {
    console.error('Booking notification failed', error);
  }

  const notice = document.getElementById('bookingNotice');
  if (notice) {
    notice.hidden = false;
    if (result?.meta_error) {
      notice.textContent = 'Your booking was prepared for WhatsApp, but Meta rejected the access token. Please refresh the credentials to enable direct delivery.';
    } else {
      notice.textContent = 'Your booking request is being prepared. You will be redirected to WhatsApp shortly.';
    }
  }

  window.open(ownerUrl, '_blank', 'width=600,height=800');
  window.location.href = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(customerMessage)}`;
}

function attachWhatsAppForm(formId, fields, headerText) {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const values = Object.fromEntries(
      Object.entries(fields).map(([key, fieldId]) => [key, document.getElementById(fieldId)?.value || ''])
    );

    const payload = {
      name: values.name || '',
      email: values.email || '',
      phone: values.phone || '',
      package: values.package || '',
      date: values.date || '',
      message: values.message || ''
    };

    let message = `🌊 ${headerText}\n\nName: ${payload.name}\nEmail: ${payload.email}\nPhone: ${payload.phone}`;
    if (payload.package) message += `\nPackage: ${payload.package}`;
    if (payload.date) message += `\nPreferred Date: ${payload.date}`;
    if (payload.message) message += `\n\nMessage: ${payload.message}`;

    notifyOwnerAndOpenCustomer(payload, message);
  });
}

function attachBookingForm() {
  attachWhatsAppForm(
    'bookingForm',
    { name: 'name', email: 'email', phone: 'phone', package: 'package', date: 'date', message: 'message' },
    'New Dive Booking Request'
  );
}

function attachContactForm() {
  attachWhatsAppForm(
    'contactForm',
    { name: 'contactName', email: 'contactEmail', phone: 'contactPhone', message: 'contactMessage' },
    'New Contact Request'
  );
}

function attachFaqToggle() {
  document.querySelectorAll('.faq-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const answer = button.nextElementSibling;
      if (!answer) return;
      answer.classList.toggle('hidden');
      button.setAttribute('aria-expanded', answer.classList.contains('hidden') ? 'false' : 'true');
    });
  });
}

function attachDiveSiteSelectors() {
  const items = document.querySelectorAll('.site-item');
  if (!items.length) return;
  items.forEach((item) => {
    item.addEventListener('click', () => {
      const name = item.dataset.name;
      const desc = item.dataset.desc;
      const depth = item.dataset.depth;
      const fish = item.dataset.fish;
      const image = item.dataset.img;
      document.querySelectorAll('.site-item').forEach((el) => el.classList.remove('active'));
      item.classList.add('active');
      document.getElementById('siteName').textContent = name;
      document.getElementById('siteDesc').textContent = desc;
      document.getElementById('siteDepth').textContent = `Max depth: ${depth}`;
      document.getElementById('siteFish').textContent = fish;
      document.getElementById('siteImage').style.backgroundImage = `url('${image}')`;
    });
  });
}

function attachGalleryLightbox() {
  const cards = document.querySelectorAll('.gallery-card');
  const modal = document.getElementById('galleryLightbox');
  const image = document.getElementById('galleryLightboxImage');
  const title = document.getElementById('galleryLightboxTitle');
  const caption = document.getElementById('galleryLightboxCaption');
  const closeButton = document.getElementById('galleryLightboxClose');

  if (!cards.length || !modal || !image || !title || !caption || !closeButton) return;

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  const openModal = (card) => {
    image.style.backgroundImage = `url('${card.dataset.image}')`;
    title.textContent = card.dataset.title || '';
    caption.textContent = card.dataset.caption || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  };

  cards.forEach((card) => {
    card.addEventListener('click', () => openModal(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(card);
      }
    });
  });

  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });
}

function startCounters() {
  document.querySelectorAll('[data-count]').forEach((node) => {
    const target = Number(node.dataset.count || 0);
    let current = 0;
    const step = Math.ceil(target / 60);
    const suffix = node.dataset.suffix || '+';
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      node.textContent = `${current}${suffix}`;
    }, 28);
  });
}

function spawnBubble(container) {
  if (!container) return;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  const size = 6 + Math.random() * 18;
  bubble.style.width = `${size}px`;
  bubble.style.height = `${size}px`;
  bubble.style.left = `${Math.random() * 100}%`;
  bubble.style.animationDuration = `${7 + Math.random() * 8}s`;
  bubble.style.animationDelay = '0s';
  container.appendChild(bubble);
  setTimeout(() => bubble.remove(), 18000);
}

function startBubbles() {
  const bubbleContainer = document.getElementById('hero-bubbles');
  if (!bubbleContainer) return;
  for (let i = 0; i < 10; i += 1) {
    setTimeout(() => spawnBubble(bubbleContainer), i * 200);
  }
  setInterval(() => spawnBubble(bubbleContainer), 600);
}

function attachSiteLinks() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      document.querySelector('.nav-links.open')?.classList.remove('open');
      document.querySelector('.nav-toggle.open')?.classList.remove('open');
    });
  });
}

function initLoader() {
  const loader = document.getElementById('loader');
  const loaderBubblesCont = document.getElementById('bubbles-loader');
  const loaderNum = document.getElementById('loaderNum');
  if (!loader || !loaderBubblesCont || !loaderNum) return;

  for (let i = 0; i < 18; i += 1) {
    const bubble = document.createElement('div');
    bubble.className = 'lb';
    const size = 4 + Math.random() * 14;
    bubble.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      animation-duration: ${3 + Math.random() * 5}s;
      animation-delay: ${Math.random() * 4}s;
      opacity: ${0.3 + Math.random() * 0.5};
    `;
    loaderBubblesCont.appendChild(bubble);
  }

  let depth = 0;
  const targetDepth = 40;
  const depthInterval = setInterval(() => {
    depth += 1;
    loaderNum.innerHTML = `${depth} <span>m</span>`;
    if (depth >= targetDepth) clearInterval(depthInterval);
  }, 60);

  let completed = false;
  const finishLoader = () => {
    if (completed) return;
    completed = true;
    clearInterval(depthInterval);
    loaderNum.innerHTML = `${targetDepth} <span>m</span>`;
    window.setTimeout(() => {
      loader.classList.add('loader-done');
      window.setTimeout(() => {
        loader.style.display = 'none';
        loader.setAttribute('aria-hidden', 'true');
      }, 700);
      startCounters();
    }, 2200);
  };

  if (document.readyState === 'complete') {
    finishLoader();
  } else {
    window.addEventListener('load', finishLoader, { once: true });
    window.setTimeout(finishLoader, 2800);
  }
}

function init() {
  initLoader();
  startRevealObserver();
  startCursor();
  attachMobileNavigation();
  attachPageTransition();
  attachWhatsAppButton();
  attachWhatsAppChatButtons();
  attachBookingForm();
  attachContactForm();
  attachFaqToggle();
  attachDiveSiteSelectors();
  attachGalleryLightbox();
  attachSiteLinks();
  startCounters();
  startBubbles();
}

window.addEventListener('DOMContentLoaded', init);
