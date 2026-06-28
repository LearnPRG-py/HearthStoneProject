const footerUrl = new URL('./index.html', import.meta.url);

fetch(footerUrl)
  .then(res => res.text())
  .then(html => {
    document.getElementById("footercontainer").innerHTML = html;

    // Animate signal bars on scroll into view
    const signalSpans = document.querySelectorAll('.signal-line span');
    const footer = document.querySelector('.hearthstone-footer');

    if (footer && signalSpans.length) {
      const observer = new IntersectionObserver(([entry]) => {
        signalSpans.forEach(span => {
          span.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
        });
      }, { threshold: 0.1 });

      observer.observe(footer);
    }

    // Animate stat numbers counting up when footer scrolls into view
    const statNumbers = document.querySelectorAll('.stat-number');

    if (statNumbers.length) {
      const countObserver = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;

        statNumbers.forEach(el => {
          const raw = el.textContent.trim();
          const num = parseInt(raw.replace(/\D/g, ''), 10);
          if (isNaN(num)) return; // skip X, ∞, etc.

          let start = 0;
          const duration = 1200;
          const step = 16;
          const increment = num / (duration / step);

          const timer = setInterval(() => {
            start += increment;
            if (start >= num) {
              el.textContent = raw; // restore original (with any suffix)
              clearInterval(timer);
            } else {
              el.textContent = Math.floor(start);
            }
          }, step);
        });

        countObserver.disconnect();
      }, { threshold: 0.3 });

      const statsSection = document.querySelector('.stats');
      if (statsSection) countObserver.observe(statsSection);
    }

    // Highlight active nav link in footer based on current page
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
      if (link.href && window.location.href.includes(link.getAttribute('href'))) {
        link.style.color = '#9D97AF';
        link.style.opacity = '1';
      }
    });
  })
  .catch(err => console.error('Footer failed to load:', err));
  