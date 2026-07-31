/* ============================================================================
   SITE ROMÂNTICO — "SOB TODAS AS LUAS"  |  script.js
   Sumário (Ctrl+F pelos títulos em CAIXA ALTA):
   01. CONFIG — personalização rápida
   02. UTILITÁRIOS
   03. CURSOR PERSONALIZADO
   04. BARRA DE PROGRESSO
   05. INDICADOR DE CAPÍTULO
   06. VOLTAR AO TOPO
   07. SCROLL SUAVE (botões e âncoras)
   08. CONTADOR DE TEMPO EM TEMPO REAL
   09. MÚSICA (botão flutuante + destaque na Trilha Sonora)
   10. REVELAÇÃO NO SCROLL (fade / slide / zoom)
   11. PARTÍCULAS: CORAÇÕES FLUTUANTES
   12. ESTRELAS (hero + céu estrelado) E BRILHOS (Ariana Grande)
   13. PARALLAX SUAVE NO MOUSE
   14. TILT NOS CARTÕES
   15. RIPPLE NOS BOTÕES
   16. GALERIA + LIGHTBOX
   17. CARROSSEL DE FRASES
   18. CORAÇÕES ESCONDIDOS (mensagens secretas)
   19. RODAPÉ — ANO AUTOMÁTICO
   20. INICIALIZAÇÃO
   ============================================================================ */

/* ============================================================================
   01. CONFIG — mexa só aqui para personalizar sem precisar entender o resto do código
   ============================================================================ */
const CONFIG = {
  // Data e hora de início do relacionamento (formato brasileiro: dia/mês/ano)
  inicioRelacionamento: { dia: 8, mes: 5, ano: 2026, hora: 0, minuto: 0 },

  // Assinatura que aparece no fim da carta e no rodapé — troque como quiser
  assinaturaCarta: 'seu.',
  assinaturaRodape: 'com todo o meu amor, hoje e sempre.',

  // Quantas partículas (corações) aparecem ao mesmo tempo na tela
  maxCoracoesFlutuantes: 12,

  // Intervalo entre a troca de frases (em milissegundos) na seção "Frases"
  intervaloFrases: 4800
};


/* ============================================================================
   02. UTILITÁRIOS
   ============================================================================ */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function throttle(fn, wait) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn(...args); }
  };
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;


/* ============================================================================
   03. CURSOR PERSONALIZADO
   ============================================================================ */
function initCustomCursor() {
  if (!hasFinePointer) return;

  const cursor = $('#cursor');
  const ring = $('#cursorRing');
  if (!cursor || !ring) return;

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  let ringX = mouseX, ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;
  });

  // o anel segue com um leve atraso (lerp) para dar uma sensação premium
  function animateRing() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    requestAnimationFrame(animateRing);
  }
  animateRing();

  const interactive = 'a, button, .tilt-card, .hidden-heart, .gallery-item, input, textarea';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactive)) {
      cursor.classList.add('is-hovering');
      ring.classList.add('is-hovering');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactive)) {
      cursor.classList.remove('is-hovering');
      ring.classList.remove('is-hovering');
    }
  });
}


/* ============================================================================
   04. BARRA DE PROGRESSO
   ============================================================================ */
function initScrollProgress() {
  const bar = $('#scrollProgress');
  if (!bar) return;
  const update = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = `${pct}%`;
  };
  window.addEventListener('scroll', throttle(update, 16));
  update();
}


/* ============================================================================
   05. INDICADOR DE CAPÍTULO
   ============================================================================ */
function initChapterIndicator() {
  const dots = $$('.chapter-dot');
  if (!dots.length) return;

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const target = document.getElementById(dot.dataset.target);
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  const themeSections = $$('section[data-theme]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const theme = entry.target.dataset.theme;
        dots.forEach((dot) => dot.classList.toggle('active', dot.dataset.theme === theme));
        document.body.dataset.theme = theme; // cursor e outros elementos fixos acompanham a cor do capítulo
      }
    });
  }, { threshold: 0.5 });

  themeSections.forEach((sec) => observer.observe(sec));
}


/* ============================================================================
   06. VOLTAR AO TOPO
   ============================================================================ */
function initBackToTop() {
  const btn = $('#backToTop');
  if (!btn) return;
  window.addEventListener('scroll', throttle(() => {
    btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
  }, 100));
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
}


/* ============================================================================
   07. SCROLL SUAVE (botões com data-scroll-to)
   ============================================================================ */
function initSmoothScrollButtons() {
  $$('[data-scroll-to]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.scrollTo);
      if (target) target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });
}


/* ============================================================================
   08. CONTADOR DE TEMPO EM TEMPO REAL
   ============================================================================ */
function initCounter() {
  const els = {
    anos: $('#cAnos'), meses: $('#cMeses'), dias: $('#cDias'),
    horas: $('#cHoras'), minutos: $('#cMinutos'), segundos: $('#cSegundos')
  };
  if (!els.anos) return;

  const { dia, mes, ano, hora, minuto } = CONFIG.inicioRelacionamento;
  const inicio = new Date(ano, mes - 1, dia, hora || 0, minuto || 0, 0);

  function pad(n) { return String(n).padStart(2, '0'); }

  function atualizar() {
    const agora = new Date();
    let anos = agora.getFullYear() - inicio.getFullYear();
    let meses = agora.getMonth() - inicio.getMonth();
    let dias = agora.getDate() - inicio.getDate();
    let horas = agora.getHours() - inicio.getHours();
    let minutos = agora.getMinutes() - inicio.getMinutes();
    let segundos = agora.getSeconds() - inicio.getSeconds();

    if (segundos < 0) { segundos += 60; minutos--; }
    if (minutos < 0) { minutos += 60; horas--; }
    if (horas < 0) { horas += 24; dias--; }
    if (dias < 0) {
      const ultimoDiaMesAnterior = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate();
      dias += ultimoDiaMesAnterior;
      meses--;
    }
    if (meses < 0) { meses += 12; anos--; }

    els.anos.textContent = Math.max(anos, 0);
    els.meses.textContent = Math.max(meses, 0);
    els.dias.textContent = Math.max(dias, 0);
    els.horas.textContent = pad(Math.max(horas, 0));
    els.minutos.textContent = pad(Math.max(minutos, 0));
    els.segundos.textContent = pad(Math.max(segundos, 0));
  }

  atualizar();
  setInterval(atualizar, 1000);
}


/* ============================================================================
   09. MÚSICA
   ============================================================================ */
function initMusicPlayer() {
  const audio = $('#bgMusic');
  const toggle = $('#musicToggle');
  const icon = $('#musicIcon');
  const label = $('#musicLabel');
  const showcase = $('#playShowcase');
  const showcaseIcon = $('#playShowcaseIcon');
  const showcaseCaption = $('#playShowcaseCaption');
  const equalizer = $('#equalizer');
  if (!audio) return;

  function setState(playing) {
    toggle?.classList.toggle('is-playing', playing);
    equalizer?.classList.toggle('is-playing', playing);
    if (icon) icon.textContent = playing ? '♫' : '▶';
    if (label) label.textContent = playing ? 'Tocando' : 'Música Pausada';
    if (showcaseIcon) showcaseIcon.textContent = playing ? '❚❚' : '▶';
    if (showcaseCaption) showcaseCaption.textContent = playing ? 'tocando agora…' : 'toque para começar';
  }

  async function togglePlay() {
    try {
      if (audio.paused) {
        await audio.play();
        setState(true);
      } else {
        audio.pause();
        setState(false);
      }
    } catch (err) {
      // provavelmente o arquivo de música ainda não foi colocado na pasta /musica
      if (showcaseCaption) showcaseCaption.textContent = 'adicione o arquivo de música na pasta "musica" para tocar aqui';
      setState(false);
    }
  }

  toggle?.addEventListener('click', togglePlay);
  showcase?.addEventListener('click', togglePlay);
  audio.addEventListener('ended', () => setState(false));

  // estado inicial exato pedido: "▶ Tocar Música"
  setState(false);
  if (label) label.textContent = 'Tocar Música';
}


/* ============================================================================
   09.5 FOTOS EM CORAÇÃO POR CAPÍTULO — distribui fundo-tvd-1.jpg, fundo-ariana-1.jpg,
   fundo-teenwolf-1.jpg (etc.) automaticamente pelas seções de cada capítulo, sempre
   visíveis (recortadas em coração) no topo do conteúdo — nunca como fundo.
   Você escolhe quantas fotos tem — o que não existir simplesmente não aparece.
   ============================================================================ */
function initHeartPhotos() {
  const capitulos = [
    { tema: 'tvd', prefixo: 'tvd', totalFotos: 6 },
    { tema: 'ag', prefixo: 'ariana', totalFotos: 5 },
    { tema: 'tw', prefixo: 'teenwolf', totalFotos: 5 }
  ];

  capitulos.forEach(({ tema, prefixo, totalFotos }) => {
    // a galeria já mostra as fotos dela em destaque — não precisa de outra foto ali
    const secoes = $$(`section[data-theme="${tema}"]`).filter((s) => s.id !== 'galeria');

    secoes.forEach((secao, indice) => {
      const alvo = secao.querySelector('.section-inner') || secao.querySelector('.chapter-card-content');
      if (!alvo || alvo.querySelector('.heart-photo-wrap')) return;

      const numero = (indice % totalFotos) + 1;
      const wrap = document.createElement('div');
      wrap.className = 'heart-photo-wrap';
      const img = document.createElement('img');
      img.className = 'heart-photo';
      img.alt = '';
      img.loading = 'lazy';
      img.src = `fotos/fundo-${prefixo}-${numero}.jpg`;
      img.addEventListener('error', () => wrap.remove(), { once: true });
      wrap.appendChild(img);
      alvo.insertBefore(wrap, alvo.firstChild);
    });
  });
}


/* ============================================================================
   10. REVELAÇÃO NO SCROLL
   ============================================================================ */
function initScrollReveal() {
  const items = $$('.reveal');
  if (!items.length) return;

  if (prefersReducedMotion) {
    items.forEach((el) => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  items.forEach((el) => observer.observe(el));
}


/* ============================================================================
   11. PARTÍCULAS: CORAÇÕES FLUTUANTES
   ============================================================================ */
function initFloatingHearts() {
  const container = $('#heartsContainer');
  if (!container || prefersReducedMotion) return;

  const simbolos = ['♥', '♡'];
  let ativos = 0;

  function criarCoracao() {
    if (ativos >= CONFIG.maxCoracoesFlutuantes) return;
    ativos++;
    const heart = document.createElement('span');
    heart.className = 'heart-particle';
    heart.textContent = simbolos[Math.floor(Math.random() * simbolos.length)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
    heart.style.fontSize = `${0.7 + Math.random() * 1.1}rem`;
    heart.style.animationDuration = `${7 + Math.random() * 6}s`;
    container.appendChild(heart);
    heart.addEventListener('animationend', () => { heart.remove(); ativos--; });
  }

  setInterval(criarCoracao, 1400);
  for (let i = 0; i < 3; i++) setTimeout(criarCoracao, i * 500);
}


/* ============================================================================
   12. ESTRELAS E BRILHOS
   ============================================================================ */
function populateStars(container, quantidade) {
  if (!container) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < quantidade; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    const size = 1 + Math.random() * 2.4;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.animationDuration = `${2 + Math.random() * 3}s`;
    star.style.animationDelay = `${Math.random() * 4}s`;
    frag.appendChild(star);
  }
  container.appendChild(frag);
}

function populateSparkles(container, quantidade) {
  if (!container) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < quantidade; i++) {
    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.animationDelay = `${Math.random() * 3}s`;
    sparkle.style.animationDuration = `${1.8 + Math.random() * 2}s`;
    frag.appendChild(sparkle);
  }
  container.appendChild(frag);
}

function initStarsAndSparkles() {
  populateStars($('#heroStars'), 60);
  populateSparkles($('#sparkleMotivos'), 18);
  populateSparkles($('#sparkleTrilha'), 14);

  const starfield = $('#starfield');
  if (starfield) {
    populateStars(starfield, 90);
    starfield.addEventListener('click', (e) => {
      if (!e.target.classList.contains('star')) return;
      const burst = document.createElement('span');
      burst.className = 'star-burst';
      burst.style.left = e.target.style.left;
      burst.style.top = e.target.style.top;
      starfield.appendChild(burst);
      burst.addEventListener('animationend', () => burst.remove());
    });
  }
}


/* ============================================================================
   13. PARALLAX SUAVE NO MOUSE (hero)
   ============================================================================ */
function initMouseParallax() {
  if (!hasFinePointer || prefersReducedMotion) return;
  const layers = $$('.hero [data-parallax]');
  if (!layers.length) return;

  window.addEventListener('mousemove', throttle((e) => {
    const relX = (e.clientX / window.innerWidth - 0.5);
    const relY = (e.clientY / window.innerHeight - 0.5);
    layers.forEach((layer) => {
      const depth = parseFloat(layer.dataset.parallax) || 0.05;
      layer.style.transform = `translate(${relX * depth * 100}px, ${relY * depth * 100}px)`;
    });
  }, 30));
}


/* ============================================================================
   14. TILT NOS CARTÕES
   ============================================================================ */
function initTilt() {
  if (!hasFinePointer || prefersReducedMotion) return;
  $$('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateX(${y * -8}deg) rotateY(${x * 8}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}


/* ============================================================================
   15. RIPPLE NOS BOTÕES
   ============================================================================ */
function initRipple() {
  $$('.btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });
}


/* ============================================================================
   16. GALERIA + LIGHTBOX
   ============================================================================ */
function initGalleryLightbox() {
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const lightboxCaption = $('#lightboxCaption');
  const closeBtn = $('#lightboxClose');
  if (!lightbox) return;

  $$('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      if (item.classList.contains('gallery-item--empty')) return;
      const img = item.querySelector('img');
      const caption = item.querySelector('figcaption');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxCaption.textContent = caption ? caption.textContent : '';
      lightbox.classList.add('is-open');
    });
  });

  function fechar() { lightbox.classList.remove('is-open'); }
  closeBtn?.addEventListener('click', fechar);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
}


/* ============================================================================
   17. CARROSSEL DE FRASES
   ============================================================================ */
function initQuoteCarousel() {
  const quotes = $$('.quote-text');
  const dotsContainer = $('#quoteDots');
  if (!quotes.length) return;

  quotes.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'quote-dot' + (i === 0 ? ' is-active' : '');
    dot.addEventListener('click', () => mostrar(i));
    dotsContainer?.appendChild(dot);
  });
  const dots = dotsContainer ? $$('.quote-dot', dotsContainer) : [];

  let atual = 0;
  function mostrar(indice) {
    quotes[atual].classList.remove('is-active');
    dots[atual]?.classList.remove('is-active');
    atual = indice % quotes.length;
    quotes[atual].classList.add('is-active');
    dots[atual]?.classList.add('is-active');
  }

  setInterval(() => mostrar(atual + 1), CONFIG.intervaloFrases);
}


/* ============================================================================
   18. CORAÇÕES ESCONDIDOS
   ============================================================================ */
function initHiddenHearts() {
  const bubble = $('#secretBubble');
  if (!bubble) return;
  let timeoutId;

  $$('.hidden-heart').forEach((heart) => {
    heart.addEventListener('click', () => {
      bubble.textContent = heart.dataset.message || '';
      bubble.classList.add('is-visible');
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => bubble.classList.remove('is-visible'), 4200);
    });
  });
}


/* ============================================================================
   19. RODAPÉ — ANO AUTOMÁTICO
   ============================================================================ */
function initFooterYear() {
  const el = $('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
}


/* ============================================================================
   20. INICIALIZAÇÃO — aplica as personalizações do CONFIG e liga tudo
   ============================================================================ */
function applyConfigTexts() {
  const sig = $('#letterSignature');
  if (sig && CONFIG.assinaturaCarta) sig.textContent = CONFIG.assinaturaCarta;
  const footerSig = $('#footerSignature');
  if (footerSig && CONFIG.assinaturaRodape) footerSig.textContent = CONFIG.assinaturaRodape;
}

document.addEventListener('DOMContentLoaded', () => {
  applyConfigTexts();
  initCustomCursor();
  initScrollProgress();
  initChapterIndicator();
  initBackToTop();
  initSmoothScrollButtons();
  initCounter();
  initMusicPlayer();
  initHeartPhotos();
  initScrollReveal();
  initFloatingHearts();
  initStarsAndSparkles();
  initMouseParallax();
  initTilt();
  initRipple();
  initGalleryLightbox();
  initQuoteCarousel();
  initHiddenHearts();
  initFooterYear();
});