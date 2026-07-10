// ============================================
// MAIN.JS — shared behaviour across every page
// ============================================

// Nav background on scroll (nav has class "on-dark" only on index.html,
// since that page opens on a dark hero)
const nav = document.getElementById('nav');
if(nav){
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// Custom circular cursor (non-touch devices)
if (!('ontouchstart' in window) && document.body) {
  const cursor = document.createElement('div');
  cursor.id = 'custom-cursor';
  document.body.appendChild(cursor);

  let isDown = false;
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  }, { passive: true });

  document.addEventListener('mousedown', () => { isDown = true; cursor.classList.add('cursor--press'); });
  document.addEventListener('mouseup', () => { isDown = false; cursor.classList.remove('cursor--press'); });

  const hoverTargets = 'a, button, .work-card, .work-link, .cs-media, .cs-video, .nav-cta, .btn, .chip';
  document.querySelectorAll(hoverTargets).forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('cursor--hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('cursor--hover'));
  });

  // ensure inputs keep native cursor for usability
  document.querySelectorAll('input, textarea, select').forEach(el => {
    el.addEventListener('mouseenter', () => { cursor.style.display = 'none'; });
    el.addEventListener('mouseleave', () => { cursor.style.display = ''; });
  });
}

// Highlight the current page's nav link.
// Each nav link should carry a data-page attribute matching the file name,
// and body should carry <body data-page="...">.
const currentPage = document.body.dataset.page;
document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
  if(link.dataset.page === currentPage) link.classList.add('active');
});

// KPI count-up animation — only present on index.html
const kpis = document.querySelectorAll('.kpi .num');
if(kpis.length){
  const formatters = {
    0: (v) => v + '+',
    1: (v) => v + '+',
    2: (v) => v + '+',
    3: (v) => v + '+'
  };
  let done = false;
  function animateKpis(){
    if(done) return;
    done = true;
    kpis.forEach((el, i) => {
      const target = parseInt(el.dataset.count, 10);
      let cur = 0;
      const step = Math.max(1, Math.round(target / 40));
      const iv = setInterval(() => {
        cur += step;
        if(cur >= target){ cur = target; clearInterval(iv); }
        el.textContent = formatters[i](cur);
      }, 30);
    });
  }
  const hero = document.getElementById('hero');
  if(hero){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if(e.isIntersecting) animateKpis(); });
    }, { threshold: 0.4 });
    io.observe(hero);
  }
}

// Video hover/click behavior for work case studies (run when videos exist on page)
if (document.querySelector('.cs-video')) {
  document.querySelectorAll('.cs-video').forEach(video => {
    video.muted = true;
    video.addEventListener('mouseenter', () => {
      video.muted = true;
      video.play().catch(() => {});
    });
    video.addEventListener('mouseleave', () => {
      video.pause();
      video.currentTime = 0;
    });
    video.addEventListener('click', () => {
      video.muted = false;
      video.play().catch(() => {});
    });
  });
}

// Media lightbox for images and videos in case studies
if (document.querySelector('.cs-media')) {
  const modal = document.getElementById('media-modal');
  const modalInner = modal && modal.querySelector('.media-modal__inner');
  const modalClose = modal && modal.querySelector('.media-modal__close');

  function openModalWithImage(src, alt){
    if(!modalInner) return;
    modalInner.innerHTML = '';
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    modalInner.appendChild(img);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
  }

  function openModalWithVideo(src){
    if(!modalInner) return;
    modalInner.innerHTML = '';
    const v = document.createElement('video');
    v.src = src;
    v.controls = true;
    v.autoplay = true;
    v.playsInline = true;
    v.muted = false;
    v.style.maxHeight = 'calc(100vh - 140px)';
    modalInner.appendChild(v);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    v.play().catch(() => {});
  }

  function closeModal(){
    if(!modalInner) return;
    // pause any playing media
    const vid = modalInner.querySelector('video');
    if(vid){ vid.pause(); vid.src = ''; }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    modalInner.innerHTML = '';
  }

  // click handlers for images and videos inside .cs-media
  document.querySelectorAll('.cs-media img').forEach(img => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      openModalWithImage(img.src, img.alt);
    });
  });

  document.querySelectorAll('.cs-media video').forEach(orig => {
    orig.style.cursor = 'zoom-in';
    orig.addEventListener('click', (e) => {
      e.stopPropagation();
      // try to find source url
      const source = orig.querySelector('source');
      const src = (source && source.src) || orig.currentSrc || orig.src;
      if(src) openModalWithVideo(src);
    });
  });

  // close controls
  if(modal){
    modal.addEventListener('click', (e) => {
      if(e.target === modal || e.target.classList.contains('media-modal__backdrop') || e.target === modalClose) closeModal();
    });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });
  }
}

// Smooth anchor scrolling for on-page navigation
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e){
    const href = a.getAttribute('href');
    if(!href || href === '#') return;
    const target = document.querySelector(href);
    if(target){
      e.preventDefault();
      const offset = (document.getElementById('nav') && document.getElementById('nav').offsetHeight) || 80;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset - 12;
      window.scrollTo({ top, behavior: 'smooth' });
      // update URL hash without jumping
      history.pushState && history.pushState(null, '', href);
    }
  });
});

// Scroll reveal animations: auto-attach `reveal` and observe
function initScrollReveal(){
  try{
    const selectors = 'section, .work-card, .cs-media, .work-cover, .kpi, .timeline-item, .education-item, .service-card, .case-study, .feature, .animate-on-scroll';
    const nodeList = Array.from(document.querySelectorAll(selectors));
    if(!nodeList.length) return;

    // Attach base class and optional delays
    nodeList.forEach((el, idx) => {
      if(!el.classList.contains('reveal')) el.classList.add('reveal');
      // apply data-delay if present, otherwise small stagger for groups
      if(el.dataset.revealDelay){
        el.style.transitionDelay = el.dataset.revealDelay;
      } else if(el.parentElement && el.parentElement.classList.contains('stagger')){
        const children = Array.from(el.parentElement.children).filter(n=>n.nodeType===1);
        const i = children.indexOf(el);
        el.style.transitionDelay = (i * 70) + 'ms';
      } else {
        // small variety to make it feel organic
        el.style.transitionDelay = ((idx % 4) * 55) + 'ms';
      }
    });

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    nodeList.forEach(el => io.observe(el));
  }catch(e){ console.warn('initScrollReveal error', e); }
}

document.addEventListener('DOMContentLoaded', () => { initScrollReveal(); });

// Verify resume PDF exists; if not, fall back to a text resume we included
(function verifyResume(){
  const link = document.getElementById('download-resume');
  if(!link) return;
  const pdfUrl = link.getAttribute('href');
  // Try a HEAD request to check availability
  fetch(pdfUrl, { method: 'HEAD' }).then(res => {
    if(!res.ok){
      // fallback to included text resume
      link.href = 'assets/resume.txt';
      link.setAttribute('download', 'resume.txt');
      link.title = 'PDF not found — downloading plain-text resume instead';
    }
  }).catch(() => {
    link.href = 'assets/resume.txt';
    link.setAttribute('download', 'resume.txt');
    link.title = 'Offline — downloading plain-text resume instead';
  });
})();
