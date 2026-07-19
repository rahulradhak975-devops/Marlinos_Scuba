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
  if (!elements.length) return;

  if (!('IntersectionObserver' in window)) {
    elements.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach((el) => observer.observe(el));

  window.setTimeout(() => {
    elements.forEach((el) => {
      if (!el.classList.contains('visible')) {
        el.classList.add('visible');
      }
    });
  }, 220);
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

function initHeroVideo() {
  const heroVideo = document.getElementById('hero-video');
  if (!heroVideo) return;

  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotionQuery.matches) {
    heroVideo.style.animation = 'none';
    heroVideo.classList.add('is-ready');
    return;
  }

  const revealVideo = () => {
    heroVideo.classList.add('is-ready');
  };

  heroVideo.addEventListener('loadeddata', revealVideo, { once: true });
  heroVideo.addEventListener('canplay', revealVideo, { once: true });

  if (heroVideo.readyState >= 2) {
    revealVideo();
  }

  heroVideo.play().catch(() => {});
}

const lakshadweepSites = [
  {
    name: 'Agatti Island',
    subtitle: 'Gateway to Lakshadweep diving',
    description: 'A calm and vibrant atoll known for crystal-clear lagoons, coral gardens, and ideal conditions for first-time divers.',
    difficulty: 'Beginner Friendly',
    bestFor: 'Discover Scuba Diving',
    maxDepth: '25m',
    visibility: '20–40m',
    waterTemp: '27–31°C',
    coralType: 'Hard coral gardens',
    marineLife: 'Sea turtles, butterflyfish, clownfish',
    recommendedCertification: 'Open Water or Discover Scuba',
    bestSeason: 'October to May',
    avgDiveDuration: '45–60 mins',
    rating: '4.8/5',
    highlights: ['Crystal-clear lagoons', 'Easy reef access', 'Perfect for beginners'],
    filters: ['Beginner', 'Coral Gardens', 'Marine Life'],
    lat: 10.8565,
    lng: 72.1798,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Agatti+Island+Lakshadweep'
  },
  {
    name: 'Bangaram Island',
    subtitle: 'Luxury diving destination',
    description: 'Bangaram offers drift dives along coral walls and deep blue channels with remarkable underwater visibility and marine life.',
    difficulty: 'Intermediate',
    bestFor: 'Drift diving and photography',
    maxDepth: '30m',
    visibility: '18–35m',
    waterTemp: '27–31°C',
    coralType: 'Coral walls and sloping reefs',
    marineLife: 'Eagle rays, reef sharks, turtles',
    recommendedCertification: 'Advanced Open Water',
    bestSeason: 'November to April',
    avgDiveDuration: '50–70 mins',
    rating: '4.9/5',
    highlights: ['Drift dives', 'Coral walls', 'Spectacular photography'],
    filters: ['Intermediate', 'Drift Diving', 'Photography', 'Marine Life'],
    lat: 10.9170,
    lng: 72.2860,
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Bangaram+Island+Lakshadweep'
  },
  {
    name: 'Kavaratti Island',
    subtitle: 'Beautiful coral gardens',
    description: 'Known for calm waters, colourful reefs, and excellent visibility that make it a comfortable choice for intermediate divers.',
    difficulty: 'Beginner to Intermediate',
    bestFor: 'Reef and lagoon dives',
    maxDepth: '28m',
    visibility: '20–35m',
    waterTemp: '27–30°C',
    coralType: 'Coral gardens and lagoon reefs',
    marineLife: 'Stingrays, sea turtles, reef fish',
    recommendedCertification: 'Open Water',
    bestSeason: 'October to April',
    avgDiveDuration: '45–60 mins',
    rating: '4.7/5',
    highlights: ['Calm water', 'Great visibility', 'Reef fish'],
    filters: ['Beginner', 'Intermediate', 'Coral Gardens', 'Marine Life'],
    lat: 10.5626,
    lng: 72.6360,
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Kavaratti+Island+Lakshadweep'
  },
  {
    name: 'Kadmat Island',
    subtitle: 'Advanced Open Water',
    description: 'Kadmat offers long coral reefs, strong biodiversity, and a thriving marine ecosystem perfect for adventurous divers.',
    difficulty: 'Advanced',
    bestFor: 'Biodiversity and reef exploration',
    maxDepth: '32m',
    visibility: '20–40m',
    waterTemp: '27–31°C',
    coralType: 'Long reef lines with hard corals',
    marineLife: 'Barracuda, tuna, groupers',
    recommendedCertification: 'Advanced Open Water',
    bestSeason: 'November to May',
    avgDiveDuration: '50–65 mins',
    rating: '4.8/5',
    highlights: ['Excellent biodiversity', 'Long coral reefs', 'Fish-rich dives'],
    filters: ['Advanced', 'Coral Gardens', 'Marine Life'],
    lat: 11.0,
    lng: 72.8,
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Kadmat+Island+Lakshadweep'
  },
  {
    name: 'Minicoy Island',
    subtitle: 'Deep dives and pelagics',
    description: 'Minicoy invites advanced divers to explore deep water, strong currents, and marine life that includes pelagic species.',
    difficulty: 'Advanced',
    bestFor: 'Deep dives and shipwreck exploration',
    maxDepth: '35m',
    visibility: '18–30m',
    waterTemp: '27–31°C',
    coralType: 'Reef slopes and drop-offs',
    marineLife: 'Manta rays, reef sharks, large pelagics',
    recommendedCertification: 'Advanced Open Water',
    bestSeason: 'January to April',
    avgDiveDuration: '45–60 mins',
    rating: '4.6/5',
    highlights: ['Deep dives', 'Shipwreck exploration', 'Pelagic sightings'],
    filters: ['Advanced', 'Shipwreck', 'Marine Life'],
    lat: 8.3,
    lng: 73.0,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Minicoy+Island+Lakshadweep'
  },
  {
    name: 'Kalpeni Island',
    subtitle: 'Calm lagoon diving',
    description: 'Kalpeni offers calm lagoon diving with colourful reefs, easy conditions, and rich opportunities for macro photography.',
    difficulty: 'Beginner Friendly',
    bestFor: 'Lagoon and macro photography',
    maxDepth: '24m',
    visibility: '20–35m',
    waterTemp: '27–30°C',
    coralType: 'Colourful shallow coral reefs',
    marineLife: 'Butterflyfish, clownfish, macro species',
    recommendedCertification: 'Open Water',
    bestSeason: 'October to May',
    avgDiveDuration: '40–55 mins',
    rating: '4.7/5',
    highlights: ['Calm lagoon diving', 'Macro photography', 'Beginner friendly'],
    filters: ['Beginner', 'Photography', 'Coral Gardens', 'Marine Life'],
    lat: 10.0833,
    lng: 73.6333,
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Kalpeni+Island+Lakshadweep'
  },
  {
    name: 'Thinnakara Island',
    subtitle: 'Shallow reefs and easy dives',
    description: 'Thinnakara shines with shallow reefs and gentle conditions that suit first-time divers and relaxed reef exploration.',
    difficulty: 'Beginner Friendly',
    bestFor: 'First-time divers',
    maxDepth: '18m',
    visibility: '20–35m',
    waterTemp: '27–31°C',
    coralType: 'Shallow coral gardens',
    marineLife: 'Tropical fish, reef species',
    recommendedCertification: 'Discover Scuba',
    bestSeason: 'October to April',
    avgDiveDuration: '35–50 mins',
    rating: '4.5/5',
    highlights: ['Shallow reefs', 'Gentle conditions', 'First-time diver friendly'],
    filters: ['Beginner', 'Coral Gardens'],
    lat: 10.85,
    lng: 72.25,
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Thinnakara+Island+Lakshadweep'
  },
  {
    name: 'Andrott Island',
    subtitle: 'Healthy reef ecosystem',
    description: 'Andrott is a reef-rich destination where healthy coral systems and large schools of fish create a remarkable diving experience.',
    difficulty: 'Intermediate',
    bestFor: 'Reef walls and marine biodiversity',
    maxDepth: '28m',
    visibility: '20–35m',
    waterTemp: '27–31°C',
    coralType: 'Reef walls and healthy corals',
    marineLife: 'Schools of fish, reef species',
    recommendedCertification: 'Open Water',
    bestSeason: 'November to April',
    avgDiveDuration: '45–60 mins',
    rating: '4.7/5',
    highlights: ['Healthy reef ecosystem', 'Reef walls', 'Schools of fish'],
    filters: ['Intermediate', 'Coral Gardens', 'Marine Life'],
    lat: 10.8167,
    lng: 73.1667,
    image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Andrott+Island+Lakshadweep'
  },
  {
    name: 'Amini Island',
    subtitle: 'Peaceful coral formations',
    description: 'Amini offers peaceful dives among coral formations that remain vibrant and accessible in calm conditions.',
    difficulty: 'Beginner Friendly',
    bestFor: 'Peaceful reef diving',
    maxDepth: '22m',
    visibility: '20–35m',
    waterTemp: '27–30°C',
    coralType: 'Coral formations',
    marineLife: 'Reef fish, soft corals',
    recommendedCertification: 'Discover Scuba',
    bestSeason: 'October to April',
    avgDiveDuration: '40–55 mins',
    rating: '4.4/5',
    highlights: ['Peaceful dives', 'Coral formations', 'Beginner friendly'],
    filters: ['Beginner', 'Coral Gardens'],
    lat: 11.1167,
    lng: 72.7167,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Amini+Island+Lakshadweep'
  },
  {
    name: 'Bitra Island',
    subtitle: 'Remote untouched reefs',
    description: 'Bitra is the most remote of the islands and provides untouched reefs, rich biodiversity, and extraordinary visibility.',
    difficulty: 'Advanced',
    bestFor: 'Remote reef exploration',
    maxDepth: '30m',
    visibility: '25–45m',
    waterTemp: '27–31°C',
    coralType: 'Untouched reef systems',
    marineLife: 'Rich biodiversity, reef fish',
    recommendedCertification: 'Advanced Open Water',
    bestSeason: 'November to March',
    avgDiveDuration: '50–65 mins',
    rating: '4.9/5',
    highlights: ['Remote untouched reefs', 'Excellent visibility', 'Rich biodiversity'],
    filters: ['Advanced', 'Coral Gardens', 'Marine Life'],
    lat: 11.5667,
    lng: 72.1667,
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Bitra+Island+Lakshadweep'
  },
  {
    name: 'Chetlat Island',
    subtitle: 'Natural coral reefs',
    description: 'Chetlat offers natural coral reefs and soft corals for a very peaceful underwater experience in a less crowded setting.',
    difficulty: 'Intermediate',
    bestFor: 'Peaceful reef diving',
    maxDepth: '24m',
    visibility: '20–35m',
    waterTemp: '27–30°C',
    coralType: 'Soft corals and natural reefs',
    marineLife: 'Reef fish, coral gardens',
    recommendedCertification: 'Open Water',
    bestSeason: 'October to April',
    avgDiveDuration: '40–55 mins',
    rating: '4.5/5',
    highlights: ['Soft corals', 'Peaceful experience', 'Natural reefs'],
    filters: ['Intermediate', 'Coral Gardens', 'Marine Life'],
    lat: 11.7,
    lng: 72.7,
    image: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
    mapsUrl: 'https://www.google.com/maps/search/Chetlat+Island+Lakshadweep'
  }
];

let activeFilter = 'all';
let searchQuery = '';
let selectedSiteName = lakshadweepSites[0]?.name || '';

function getFilteredSites() {
  const query = searchQuery.trim().toLowerCase();
  return lakshadweepSites.filter((site) => {
    const matchesFilter = activeFilter === 'all' || site.filters.includes(activeFilter);
    const matchesQuery = !query || site.name.toLowerCase().includes(query);
    return matchesFilter && matchesQuery;
  });
}

function renderSiteList() {
  const container = document.getElementById('lakshadweep-site-list');
  if (!container) return;
  const sites = getFilteredSites();
  container.innerHTML = '';

  if (!sites.length) {
    container.innerHTML = '<div class="lakshadweep-card-meta">No matching islands found.</div>';
    return;
  }

  sites.forEach((site) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `lakshadweep-site-item${site.name === selectedSiteName ? ' active' : ''}`;
    button.setAttribute('role', 'option');
    button.innerHTML = `<span>${site.name}</span><span class="section-eyebrow">${site.difficulty}</span>`;
    button.addEventListener('click', () => {
      selectedSiteName = site.name;
      renderSiteDetails();
      renderSiteList();
      updateMapSelection();
    });
    container.appendChild(button);
  });
}

function renderSiteDetails() {
  const panel = document.getElementById('lakshadweep-panel');
  const content = document.getElementById('lakshadweep-panel-content');
  const sites = getFilteredSites();
  const selectedSite = sites.find((site) => site.name === selectedSiteName) || sites[0] || lakshadweepSites.find((site) => site.name === selectedSiteName) || lakshadweepSites[0];
  if (!panel || !content || !selectedSite) return;

  const detailSite = selectedSite;

  const card = document.createElement('div');
  card.innerHTML = `
    <div class="lakshadweep-card-image" style="background-image:url('${detailSite.image}')"></div>
    <p class="lakshadweep-card-subtitle">${detailSite.subtitle}</p>
    <h3 class="lakshadweep-card-title">${detailSite.name}</h3>
    <p class="lakshadweep-card-description">${detailSite.description}</p>
    <div class="lakshadweep-card-rating">★★★★★ <span>${detailSite.rating}</span></div>
    <div class="lakshadweep-card-meta">
      <div><strong>Difficulty Level:</strong> ${detailSite.difficulty}</div>
      <div><strong>Best For:</strong> ${detailSite.bestFor}</div>
      <div><strong>Maximum Depth:</strong> ${detailSite.maxDepth}</div>
      <div><strong>Average Visibility:</strong> ${detailSite.visibility}</div>
      <div><strong>Water Temperature:</strong> ${detailSite.waterTemp}</div>
      <div><strong>Coral Type:</strong> ${detailSite.coralType}</div>
      <div><strong>Marine Life:</strong> ${detailSite.marineLife}</div>
      <div><strong>Recommended Certification:</strong> ${detailSite.recommendedCertification}</div>
      <div><strong>Best Season:</strong> ${detailSite.bestSeason}</div>
      <div><strong>Average Dive Duration:</strong> ${detailSite.avgDiveDuration}</div>
    </div>
    <ul class="lakshadweep-card-list">
      ${detailSite.highlights.map((item) => `<li>${item}</li>`).join('')}
    </ul>
    <div class="lakshadweep-actions">
      <a href="{% url 'booking' %}?site=${encodeURIComponent(detailSite.name)}" class="btn-primary premium-cta">Book This Dive</a>
      <a href="${detailSite.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline">Open in Google Maps</a>
    </div>
  `;
  content.innerHTML = '';
  content.appendChild(card);
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('is-open');
}

function renderMapFallback(siteName = selectedSiteName) {
  const mapContainer = document.getElementById('lakshadweep-map');
  if (!mapContainer) return;

  const fallbackSite = lakshadweepSites.find((site) => site.name === siteName) || lakshadweepSites[0];
  if (!fallbackSite) return;

  mapContainer.innerHTML = `
    <div class="lakshadweep-map-fallback">
      <div class="lakshadweep-map-fallback-card">
        <p class="section-eyebrow">Map preview</p>
        <h3>${fallbackSite.name}</h3>
        <p>${fallbackSite.description}</p>
        <a href="${fallbackSite.mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline">Open in Google Maps</a>
      </div>
      <iframe
        title="${fallbackSite.name} on Google Maps"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps?q=${encodeURIComponent(`${fallbackSite.name} Lakshadweep`)}&z=10&output=embed"
      ></iframe>
    </div>
  `;
}

function updateMapSelection() {
  const sites = getFilteredSites();
  const selectedSite = sites.find((site) => site.name === selectedSiteName) || sites[0] || lakshadweepSites.find((site) => site.name === selectedSiteName) || lakshadweepSites[0];
  if (!selectedSite) return;

  if (!window.google?.maps) {
    renderMapFallback(selectedSite.name);
    return;
  }

  const marker = window.lakshadweepMarkers?.find((entry) => entry.name === selectedSite.name);
  if (marker?.marker) {
    window.lakshadweepMarkers.forEach((entry) => entry.marker.setAnimation(null));
    marker.marker.setAnimation(window.google?.maps?.Animation?.BOUNCE || null);
  }
}

function initLakshadweepExplorer() {
  const searchInput = document.getElementById('lakshadweep-search');
  const filterButtons = document.querySelectorAll('.filter-chip');
  const panelClose = document.getElementById('lakshadweep-panel-close');
  if (!searchInput || !filterButtons.length) return;

  window.gm_authFailure = function gmAuthFailure() {
    renderMapFallback(selectedSiteName);
  };

  searchInput.addEventListener('input', (event) => {
    searchQuery = event.target.value;
    renderSiteList();
    renderSiteDetails();
    updateMapSelection();
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((chip) => {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
      activeFilter = button.dataset.filter || 'all';
      renderSiteList();
      renderSiteDetails();
      updateMapSelection();
    });
  });

  if (panelClose) {
    panelClose.addEventListener('click', () => {
      const panel = document.getElementById('lakshadweep-panel');
      if (panel) {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
      }
    });
  }

  renderSiteList();
  renderSiteDetails();

  const mapContainer = document.getElementById('lakshadweep-map');
  if (!mapContainer) return;

  const script = document.createElement('script');
  script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyAq-3h8g5UNmN2PAAi0YIVGmWq9sJxgQbYQ&callback=initLakshadweepMap&loading=async';
  script.async = true;
  script.defer = true;
  script.onerror = () => {
    renderMapFallback(selectedSiteName);
  };
  document.head.appendChild(script);

  window.setTimeout(() => {
    if (!window.google?.maps) {
      renderMapFallback(selectedSiteName);
    }
  }, 3500);
}

window.initLakshadweepMap = function initLakshadweepMap() {
  const mapContainer = document.getElementById('lakshadweep-map');
  if (!mapContainer || !window.google?.maps) {
    renderMapFallback();
    return;
  }

  const center = { lat: 10.5, lng: 72.8 };
  const map = new window.google.maps.Map(mapContainer, {
    center,
    zoom: 8,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#0b2230' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#f4f4f4' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#0f2534' }] },
      { featureType: 'water', stylers: [{ color: '#1e5a7a' }] },
      { featureType: 'landscape', stylers: [{ color: '#123c50' }] },
      { featureType: 'poi', stylers: [{ visibility: 'off' }] }
    ]
  });

  const icon = {
    path: 'M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.6c-1.4 0-2.6-1.1-2.6-2.6S10.6 6.4 12 6.4 14.6 7.5 14.6 9c0 1.4-1.2 2.6-2.6 2.6z',
    fillColor: '#00C9B1',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1.4,
    scale: 1.15,
    anchor: new window.google.maps.Point(12, 24)
  };

  window.lakshadweepMarkers = lakshadweepSites.map((site) => {
    const marker = new window.google.maps.Marker({
      position: { lat: site.lat, lng: site.lng },
      map,
      title: site.name,
      icon,
      animation: window.google.maps.Animation.DROP
    });

    marker.addListener('click', () => {
      selectedSiteName = site.name;
      renderSiteDetails();
      renderSiteList();
      window.lakshadweepMarkers.forEach((entry) => entry.marker.setAnimation(null));
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
    });

    return { name: site.name, marker };
  });
};

function initLoader() {

    return { name: site.name, marker };
  });
};

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
  initHeroVideo();
  initLakshadweepExplorer();
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
