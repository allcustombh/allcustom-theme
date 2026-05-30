/* ============================================
   ATELIER DE HOROLOGY — ANIMATIONS ENGINE
   Scroll reveals, counters, parallax, and 
   micro-interactions for the luxury experience
   ============================================ */

(function() {
  'use strict';

  /* --- SCROLL REVEAL ANIMATION --- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('atelier-revealed');
        // For staggered children
        const children = entry.target.querySelectorAll('.atelier-stagger');
        children.forEach((child, i) => {
          child.style.transitionDelay = (i * 0.15) + 's';
          child.classList.add('atelier-revealed');
        });
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  // Observe all elements with reveal class
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.atelier-reveal').forEach(el => {
      revealObserver.observe(el);
    });

    // Also observe Dawn sections for subtle entrance
    document.querySelectorAll('.shopify-section').forEach(section => {
      if (!section.classList.contains('shopify-section-header') && 
          !section.classList.contains('shopify-section-footer')) {
        section.classList.add('atelier-section-reveal');
        sectionObserver.observe(section);
      }
    });

    // Initialize counters
    initCounters();
    
    // Initialize tilt effects on product cards
    initCardEffects();
  });

  /* --- SECTION REVEAL --- */
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('atelier-section-visible');
      }
    });
  }, {
    threshold: 0.08
  });

  /* --- COUNTER ANIMATION --- */
  function initCounters() {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.counted) {
          entry.target.dataset.counted = 'true';
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.atelier-counter').forEach(el => {
      counterObserver.observe(el);
    });
  }

  function animateCounter(el) {
    const target = parseInt(el.dataset.target) || 0;
    const duration = 2000;
    const start = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      
      el.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    
    requestAnimationFrame(update);
  }

  /* --- PRODUCT CARD TILT EFFECT --- */
  function initCardEffects() {
    document.querySelectorAll('.card-wrapper').forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = 'transform 0.1s ease-out';
      });
      
      card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -3;
        const rotateY = (x - centerX) / centerX * 3;
        
        this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
      });
      
      card.addEventListener('mouseleave', function() {
        this.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        this.style.transform = '';
      });
    });
  }

  /* --- SMOOTH PARALLAX ON IMAGES --- */
  window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    
    document.querySelectorAll('.atelier-parallax').forEach(el => {
      const speed = parseFloat(el.dataset.speed) || 0.3;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const yPos = -(scrolled * speed);
        el.style.transform = `translateY(${yPos}px)`;
      }
    });
  }, { passive: true });

  /* --- MAGNETIC BUTTON EFFECT --- */
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.button--primary, .mc-btn').forEach(btn => {
      btn.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        this.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) translateY(-2px)`;
      });
      
      btn.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
  });

})();
