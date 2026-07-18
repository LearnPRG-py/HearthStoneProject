(function () {
  var loader = document.getElementById('hs-loader');
  var fill   = document.getElementById('hs-loader-fill');
  if (!loader) return;
  function dismiss() {
    if (fill) fill.style.width = '100%';
    setTimeout(function () {
      loader.classList.add('hs-loader--done');
      loader.addEventListener('transitionend', function () {
        loader.style.display = 'none';
      }, { once: true });
    }, 280);
  }
  setTimeout(dismiss, 1200);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', dismiss);
  } else {
    dismiss();
  }
})();

(function () {
  var nav = document.querySelector('nav');
  if (!nav) return;
  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
})();

function watch(selector, onEnter, onLeave, opts) {
  var els = typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
  if (!els || (els.length !== undefined && !els.length)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { onEnter(e.target); }
      else if (onLeave)     { onLeave(e.target); }
    });
  }, opts || { threshold: 0.08 });
  if (els.forEach) { els.forEach(function (el) { io.observe(el); }); }
  else             { io.observe(els); }
  return io;
}

(function () {
  var items = document.querySelectorAll('.reveal-item');
  if (!items.length) return;
  document.querySelectorAll('.reveal-group').forEach(function (group) {
    group.querySelectorAll('.reveal-item').forEach(function (child, i) {
      if (!child.style.getPropertyValue('--delay')) {
        child.style.setProperty('--delay', i * 0.09 + 's');
      }
    });
  });
  watch(
    items,
    function (el) { el.classList.add('is-visible'); },
    function (el) { el.classList.remove('is-visible'); }
  );
})();

(function () {
  var els = document.querySelectorAll('.reanimate');
  if (!els.length) return;
  watch(
    els,
    function (el) { el.classList.add('is-visible'); },
    function (el) { el.classList.remove('is-visible'); },
    { threshold: 0.15 }
  );
})();

(function () {
  document.querySelectorAll('.section-label').forEach(function (lbl) {
    new IntersectionObserver(function (entries) {
      lbl.style.letterSpacing = entries[0].isIntersecting ? '0.22em' : '0.3em';
    }, { threshold: 0.5 }).observe(lbl);
  });
})();

(function () {
  var banner = document.querySelector('.join-section');
  var inner  = document.querySelector('.join-inner');
  if (!banner || !inner) return;
  new IntersectionObserver(function (entries) {
    var isIn = entries[0].isIntersecting;
    inner.classList.toggle('animate-in', isIn);
  }, { threshold: 0.25 }).observe(banner);
})();

(function () {
  var marquee = document.getElementById('voices-marquee');
  var track = document.getElementById('voices-track');
  if (!track || !marquee) return;

  var originalCards = Array.prototype.slice.call(track.children);
  if (!originalCards.length) return;

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fillTrack() {
    track.innerHTML = '';
    originalCards.forEach(function (card) {
      track.appendChild(card.cloneNode(true));
    });

    var singleSetWidth = track.scrollWidth;
    var viewportWidth = marquee.clientWidth;

    while (track.scrollWidth < Math.max(singleSetWidth * 2, viewportWidth * 2)) {
      originalCards.forEach(function (card) {
        track.appendChild(card.cloneNode(true));
      });
    }

    applyAnimation();
  }

  function applyAnimation() {
    track.style.animation = 'voicesScroll 36s linear infinite';
  }

  fillTrack();

  var resizeTimer;
  var lastWidth = marquee.clientWidth;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var w = marquee.clientWidth;
      if (Math.abs(w - lastWidth) > 4) {
        lastWidth = w;
        fillTrack();
      }
    }, 250);
  });

  track.addEventListener('focusin', function () {
    track.style.animationPlayState = 'paused';
  });
  track.addEventListener('focusout', function () {
    track.style.animationPlayState = 'running';
  });
})();

(function () {
  var counters = document.querySelectorAll('.impact-count');
  if (!counters.length) return;

  function animateCount(el) {
    var target   = parseInt(el.getAttribute('data-target'), 10);
    var duration = 1400;
    var start    = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased    = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var card    = entry.target;
      var counter = card.querySelector('.impact-count');
      if (counter) animateCount(counter);
      io.unobserve(card);
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.impact-card').forEach(function (card) {
    io.observe(card);
  });
})();

(function () {
  var mount = document.getElementById('team-committees');
  if (!mount) return;

  function initialsOf(name) {
    return (name || '').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
  }

  function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function placeholderMarkup(name) {
    return "<div class='profile-photo-placeholder'><span class='profile-initials'>" + initialsOf(name) + '</span></div>';
  }

  window.hsHandlePhotoError = function (imgEl) {
    var wrap = imgEl.parentElement;
    if (!wrap) return;
    wrap.innerHTML = placeholderMarkup(imgEl.getAttribute('data-name'));
  };

  var dataUrl = new URL('hearthstone.json', window.location.href);

  fetch(dataUrl)
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var committees = (data && data.committees) || [];
      var html = committees.map(function (committee, ci) {
        var memberCount = (committee.members || []).length;
        var membersHtml = (committee.members || []).map(function (m, mi) {
          var photoHtml = m.photo
            ? '<img src="' + escapeAttr(m.photo) + '" alt="' + escapeAttr(m.name) + '" data-name="' + escapeAttr(m.name) + '" onerror="window.hsHandlePhotoError(this)" />'
            : placeholderMarkup(m.name);
          return (
            '<div class="profile-card profile-card--' + committee.color + ' reveal-item" style="--delay:' + (mi * 0.06) + 's">' +
              '<div class="profile-photo-wrap"><div class="profile-avatar">' + photoHtml + '</div></div>' +
              '<div class="profile-body">' +
                '<p class="profile-name">' + escapeAttr(m.name) + '</p>' +
                '<span class="profile-role-label">' + escapeAttr(m.role) + '</span>' +
              '</div>' +
            '</div>'
          );
        }).join('');

        return (
          '<div class="committee-block" id="committee-' + committee.id + '">' +
            '<div class="committee-label-row">' +
              '<span class="committee-badge committee-badge--' + committee.color + '">' +
                '<i data-lucide="' + committee.icon + '"></i> ' + committee.name +
              '</span>' +
              '<div class="committee-rule"></div>' +
              '<span class="member-count">' + memberCount + ' member' + (memberCount === 1 ? '' : 's') + '</span>' +
            '</div>' +
            '<p class="committee-desc">' + committee.description + '</p>' +
            '<div class="profile-grid">' + membersHtml + '</div>' +
          '</div>'
        );
      }).join('');

      mount.innerHTML = html;

      if (window.lucide) window.lucide.createIcons();

      var items = mount.querySelectorAll('.reveal-item');
      watch(
        items,
        function (el) { el.classList.add('is-visible'); },
        function (el) { el.classList.remove('is-visible'); }
      );
    })
    .catch(function (err) {
      console.error('Could not load hearthstone.json:', err);
      mount.innerHTML = '<p class="team-load-error">Team data could not be loaded.</p>';
    });
})();