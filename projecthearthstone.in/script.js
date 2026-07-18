(function () {
    var loader = document.getElementById('hs-loader');
    var fill = document.getElementById('hs-loader-fill');
    if (!loader) return;

    var imageSrcs = [
        'images/homepage/hero-sect.png',
        'images/homepage/what-is.jpg',
        'images/homepage/vision.jpg',
        'images/homepage/mission.jpg',
        'images/homepage/hearthstone-pi.jpg',
        'images/homepage/asl-course.jpg',
        'images/homepage/hearthstone-ai.jpg',
        'images/homepage/sresht.jpg',
        'images/homepage/myra.jpg',
        'images/homepage/aryan.jpg'
    ];

    var loaded = 0;
    var total = imageSrcs.length;

    function tick() {
        loaded++;
        var pct = Math.round((loaded / total) * 100);
        if (fill) fill.style.width = pct + '%';
        if (loaded >= total) {
            setTimeout(dismiss, 280);
        }
    }

    function dismiss() {
        loader.classList.add('hs-loader--done');
        loader.addEventListener('transitionend', function () {
            loader.style.display = 'none';
        }, { once: true });
    }

    imageSrcs.forEach(function (src) {
        var img = new Image();
        img.onload = tick;
        img.onerror = tick;
        img.src = src;
    });

    setTimeout(dismiss, 4000);
})();

function watch(selector, onEnter, onLeave, opts) {
    var els =
        typeof selector === 'string' ? document.querySelectorAll(selector) : selector;
    if (!els || (els.length !== undefined && !els.length)) return;

    var io = new IntersectionObserver(
        function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    onEnter(e.target);
                } else if (onLeave) {
                    onLeave(e.target);
                }
            });
        },
        opts || { threshold: 0.08 }
    );

    if (els.forEach) {
        els.forEach(function (el) {
            io.observe(el);
        });
    } else {
        io.observe(els);
    }
    return io;
}

(function () {

    document.querySelectorAll('.mv-image img, .bento-img img').forEach(function (img) {
        img.addEventListener('error', function () {
            var wrap = img.parentElement;
            img.remove();
            var label = document.createElement('span');
            label.className = 'img-placeholder-label';
            label.textContent = img.alt || 'Image';
            wrap.appendChild(label);
        }, { once: true });
    });
})();

(function () {
    var bar = document.createElement('div');
    bar.id = 'hs-progress';
    Object.assign(bar.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        height: '3px',
        width: '0%',
        zIndex: '9999',
        pointerEvents: 'none',
        background: '#0052D4',
        boxShadow: '0 0 10px rgba(0,82,212,0.4)',
        transition: 'width 0.12s linear',
    });
    document.body.appendChild(bar);
    window.addEventListener(
        'scroll',
        function () {
            var pct =
                (window.scrollY /
                    (document.documentElement.scrollHeight - window.innerHeight)) *
                100;
            bar.style.width = Math.min(pct, 100) + '%';
        },
        { passive: true }
    );
})();

(function () {
    var nav = document.querySelector('nav');
    if (!nav) return;
    window.addEventListener(
        'scroll',
        function () {
            nav.classList.toggle('scrolled', window.scrollY > 60);
        },
        { passive: true }
    );
})();

(function () {
    var items = document.querySelectorAll('.reveal-item');
    if (!items.length) return;

    document.querySelectorAll('.reveal-group').forEach(function (group) {
        group.querySelectorAll('.reveal-item').forEach(function (child, i) {
            if (!child.style.getPropertyValue('--delay')) {
                child.style.setProperty('--delay', i * 0.11 + 's');
            }
        });
    });

    watch(
        items,
        function (el) {
            el.classList.add('is-visible');
        },
        function (el) {
            el.classList.remove('is-visible');
        }
    );
})();

(function () {
    var els = document.querySelectorAll('.slide-in-left, .slide-in-right');
    if (!els.length) return;
    watch(
        els,
        function (el) {
            el.classList.add('is-visible');
        },
        function (el) {
            el.classList.remove('is-visible');
        },
        { threshold: 0.1 }
    );
})();

(function () {
    var header = document.querySelector('.exigency-header');
    if (!header) return;

    var label = header.querySelector('.section-label');
    var lines = header.querySelectorAll('.headline-line-inner');
    var intro = header.querySelector('.exigency-intro');

    new IntersectionObserver(
        function (entries) {
            var isIn = entries[0].isIntersecting;
            if (label) label.classList.toggle('visible', isIn);
            lines.forEach(function (line) {
                line.classList.toggle('visible', isIn);
            });
            if (intro) intro.classList.toggle('visible', isIn);
        },
        { threshold: 0.2 }
    ).observe(header);
})();

(function () {
    var bars = document.querySelectorAll('.stat-bar');
    var fills = document.querySelectorAll('.stat-bar-fill[data-width]');
    var nums = document.querySelectorAll('.stat-number[data-target]');
    var wrap = document.querySelector('.stat-bars');
    if (!wrap) return;

    function countUp(el) {
        var target = parseInt(el.dataset.target, 10);
        if (isNaN(target)) return;
        var start = performance.now();
        var dur = 1800;
        (function tick(now) {
            var p = Math.min((now - start) / dur, 1);
            var e = 1 - Math.pow(1 - p, 4);
            el.textContent = Math.round(e * target);
            if (p < 1) requestAnimationFrame(tick);
        })(start);
    }

    function reset() {
        bars.forEach(function (bar) {
            bar.classList.remove('visible');
        });
        fills.forEach(function (fill) {
            fill.style.transition = 'none';
            fill.style.width = '0%';
        });
        nums.forEach(function (el) {
            el.textContent = '0';
        });
    }

    function play() {
        bars.forEach(function (bar, i) {
            setTimeout(function () {
                bar.classList.add('visible');
            }, i * 130);
        });
        fills.forEach(function (fill, i) {
            setTimeout(function () {
                fill.style.transition = 'width 1.6s cubic-bezier(0.22,1,0.36,1)';
                fill.style.width = fill.dataset.width + '%';
            }, 180 + i * 150);
        });
        nums.forEach(function (el) {
            countUp(el);
        });
    }

    new IntersectionObserver(
        function (entries) {
            if (entries[0].isIntersecting) {
                play();
            } else {
                reset();
            }
        },
        { threshold: 0.2 }
    ).observe(wrap);
})();

(function () {
    var img = document.querySelector('.hero-img');
    var content = document.querySelector('.hero-content');
    if (!img) return;

    img.style.willChange = 'transform';
    if (content) content.style.willChange = 'transform';

    var ticking = false;
    window.addEventListener(
        'scroll',
        function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                var y = window.scrollY;
                img.style.transform = 'translate3d(0,' + (y * 0.28) + 'px,0)';
                if (content) content.style.transform = 'translate3d(0,' + (y * 0.1) + 'px,0)';
                ticking = false;
            });
        },
        { passive: true }
    );
})();

(function () {
    if (window.innerWidth > 1024 && !window.matchMedia('(pointer:coarse)').matches) {
        document
            .querySelectorAll('.mv-callout, .stat-card')
            .forEach(function (card) {
                card.addEventListener('mousemove', function (e) {
                    let rect;

                    card.addEventListener('mouseenter', () => {
                        rect = card.getBoundingClientRect();
                    });

                    card.addEventListener('mousemove', e => {
                        const rotX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -6;
                        const rotY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 6;

                        card.style.transform =
                            `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
                    });

                    var rotX = ((e.clientY - e.target.getBoundingClientRect().top - e.target.getBoundingClientRect().height / 2) / (e.target.getBoundingClientRect().height / 2)) * -6;
                    var rotY = ((e.clientX - e.target.getBoundingClientRect().left - e.target.getBoundingClientRect().width / 2) / (e.target.getBoundingClientRect().width / 2)) * 6;
                    card.style.transition = 'transform 0.08s linear, box-shadow 0.08s linear';
                    card.style.transform =
                        'perspective(900px) rotateX(' +
                        rotX +
                        'deg) rotateY(' +
                        rotY +
                        'deg) translateY(-4px)';
                });
                card.addEventListener('mouseleave', function () {
                    card.style.transition =
                        'transform 0.7s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.5s ease';
                    card.style.transform = '';
                });
            });
    }
})();

(function () {
    var card = document.querySelector('.about-visual-card');
    if (!card) return;
    var pills = card.querySelectorAll('.avc-pill');

    pills.forEach(function (p) {
        p.style.opacity = '0';
        p.style.transform = 'translateY(12px)';
        p.style.transition = 'opacity .6s var(--ease-expo), transform .6s var(--ease-expo)';
    });

    new IntersectionObserver(
        function (entries) {
            var isIn = entries[0].isIntersecting;
            pills.forEach(function (p, i) {
                if (isIn) {
                    setTimeout(
                        function () {
                            p.style.opacity = '1';
                            p.style.transform = '';
                        },
                        200 + i * 100
                    );
                } else {
                    p.style.opacity = '0';
                    p.style.transform = 'translateY(12px)';
                }
            });
        },
        { threshold: 0.3 }
    ).observe(card);
})();

(function () {
    document.querySelectorAll('.mv-row').forEach(function (row) {
        var num = row.querySelector('.mv-numeral');
        if (!num) return;
        new IntersectionObserver(
            function (entries) {
                num.style.transition = 'color 1s ease';
                num.style.color = entries[0].isIntersecting
                    ? 'rgba(0,82,212,0.12)'
                    : 'var(--bg-3)';
            },
            { threshold: 0.4 }
        ).observe(row);
    });
})();



document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
        var t = document.querySelector(a.getAttribute('href'));
        if (t) {
            e.preventDefault();
            t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

(function () {
    var GAP = 20;
    var TRACK, LEFT_BTN, RIGHT_BTN;
    var updates = [];
    var activeIndex = 0;

    async function init() {
        TRACK = document.getElementById('updates-track');
        LEFT_BTN = document.querySelector('.nav-btn.left');
        RIGHT_BTN = document.querySelector('.nav-btn.right');
        if (!TRACK || !LEFT_BTN || !RIGHT_BTN) return;

        var resp = await fetch('updates.json');
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        updates = await resp.json();

        renderCards();
        activeIndex = 0;
        requestAnimationFrame(function () {
            updatePosition(false);
        });
        attachListeners();

        var section = document.querySelector('.updates-section');
        if (section) {
            new IntersectionObserver(
                function (entries) {
                    if (entries[0].isIntersecting) {
                        TRACK.querySelectorAll('.update-card').forEach(function (card, i) {
                            card.style.opacity = '0';
                            card.style.transform = 'translateY(36px) scale(0.93)';
                            card.style.transition = 'none';
                            setTimeout(function () {
                                card.style.transition =
                                    'opacity 0.6s cubic-bezier(0.16,1,0.3,1) ' +
                                    i * 0.07 +
                                    's, ' +
                                    'transform 0.6s cubic-bezier(0.16,1,0.3,1) ' +
                                    i * 0.07 +
                                    's, box-shadow 0.35s';
                                card.style.opacity = '1';
                                card.style.transform = '';
                            }, 40);
                        });
                    } else {
                        TRACK.querySelectorAll('.update-card').forEach(function (card) {
                            card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                            card.style.opacity = '0';
                            card.style.transform = 'translateY(36px) scale(0.93)';
                        });
                    }
                },
                { threshold: 0.15 }
            ).observe(section);
        }
    }

    function renderCards() {
        TRACK.innerHTML = '';
        updates.forEach(function (u, i) {
            var card = document.createElement('article');
            var importanceMap = { 1: 'importance-1', 2: 'importance-2', 3: 'importance-3' };
            card.className = 'update-card ' + (importanceMap[u.importance] || '');
            card.setAttribute('role', 'listitem');
            card.dataset.index = i;

            var imgDiv = document.createElement('div');
            imgDiv.className = 'thumb';
            var img = document.createElement('img');
            img.src = u.image;
            img.alt = u.title || 'Update ' + (i + 1);
            img.loading = 'lazy';
            imgDiv.appendChild(img);
            img.addEventListener('error', function () {
                imgDiv.style.backgroundColor = 'rgba(255,255,255,0.02)';
                img.remove();
            });

            var meta = document.createElement('div');
            meta.className = 'meta';
            var h3 = document.createElement('h3');
            h3.textContent = u.title;
            var p = document.createElement('p');
            p.textContent = u.description;
            var t = document.createElement('time');
            t.textContent = new Date(u.date).toLocaleDateString();
            meta.appendChild(h3);
            meta.appendChild(p);
            meta.appendChild(t);
            card.appendChild(imgDiv);
            card.appendChild(meta);
            TRACK.appendChild(card);
        });
        requestAnimationFrame(function () {
            TRACK.style.paddingLeft = '0px';
            TRACK.style.paddingRight = '0px';
            setCenterClass();
        });
    }

    function cardDimensions() {
        var card = TRACK.querySelector('.update-card');
        if (!card) return { w: 320, gap: GAP };
        return { w: Math.round(card.getBoundingClientRect().width), gap: GAP };
    }

    function updatePosition(animate) {
        if (animate === undefined) animate = true;
        var dims = cardDimensions();
        var step = dims.w + dims.gap;
        var mask = TRACK.closest('.updates-mask');
        if (!mask) return;
        var translateX = Math.round(
            mask.getBoundingClientRect().width / 2 - dims.w / 2 - activeIndex * step
        );
        if (!animate) {
            TRACK.style.transition = 'none';
            TRACK.style.transform = 'translateX(' + translateX + 'px)';
            void TRACK.offsetWidth;
            TRACK.style.transition = '';
        } else {
            TRACK.style.transform = 'translateX(' + translateX + 'px)';
        }
        setCenterClass();
    }

    function setCenterClass() {
        TRACK.querySelectorAll('.update-card').forEach(function (c) {
            c.classList.remove('center');
        });
        var cc = TRACK.querySelector('.update-card[data-index="' + activeIndex + '"]');
        if (cc) cc.classList.add('center');
    }

    function attachListeners() {
        LEFT_BTN.addEventListener('click', function () {
            if (activeIndex > 0) {
                activeIndex--;
                updatePosition(true);
            }
        });
        RIGHT_BTN.addEventListener('click', function () {
            if (activeIndex < updates.length - 1) {
                activeIndex++;
                updatePosition(true);
            }
        });
        setupDrag();
        document.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowLeft') LEFT_BTN.click();
            if (e.key === 'ArrowRight') RIGHT_BTN.click();
        });
    }

    function setupDrag() {
        var mask = TRACK.parentElement;
        var dragging = false,
            startX = 0,
            startTranslate = 0;
        mask.addEventListener('pointerdown', function (e) {
            dragging = true;
            startX = e.clientX;
            TRACK.style.transition = 'none';
            startTranslate =
                new DOMMatrixReadOnly(window.getComputedStyle(TRACK).transform).m41 || 0;
            if (mask.setPointerCapture) mask.setPointerCapture(e.pointerId);
        });
        mask.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            TRACK.style.transform =
                'translateX(' + Math.round(startTranslate + e.clientX - startX) + 'px)';
        });
        mask.addEventListener('pointerup', function (e) {
            if (!dragging) return;
            dragging = false;
            TRACK.style.transition = '';
            var dims = cardDimensions();
            var deltaIndex = Math.round(-(e.clientX - startX) / (dims.w + dims.gap));
            activeIndex = Math.max(0, Math.min(updates.length - 1, activeIndex + deltaIndex));
            updatePosition(true);
        });
        mask.addEventListener('pointercancel', function () {
            dragging = false;
            updatePosition(true);
        });
    }

    window.addEventListener('resize', function () {
        updatePosition(false);
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

(function () {
    var cards = document.querySelectorAll('.founder-card');
    if (!cards.length) return;
    watch(
        cards,
        function (el) { el.classList.add('is-visible'); },
        null,
        { threshold: 0.1 }
    );
})();

(function () {
    var banner = document.querySelector('.cta-banner');
    var inner = document.querySelector('.cta-inner');
    if (!banner || !inner) return;

    new IntersectionObserver(
        function (entries) {
            var isIn = entries[0].isIntersecting;
            inner.classList.toggle('animate-in', isIn);
            banner.classList.toggle('orbs-active', isIn);
            if (!isIn) {
                inner.classList.remove('animate-in');
                void inner.offsetWidth;
            }
        },
        { threshold: 0.25 }
    ).observe(banner);
})();

(function () {
    document
        .querySelectorAll('.cta-actions .btn-primary, .cta-actions .btn-outline')
        .forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                var r = btn.getBoundingClientRect();
                var span = document.createElement('span');
                span.className = 'cta-btn-ripple';
                var size = Math.max(r.width, r.height);
                span.style.cssText =
                    'width:' + size + 'px;height:' + size + 'px;' +
                    'left:' + (e.clientX - r.left - size / 2) + 'px;' +
                    'top:' + (e.clientY - r.top - size / 2) + 'px;';
                btn.appendChild(span);
                span.addEventListener('animationend', function () {
                    span.remove();
                });
            });
        });
})();

(function () {
    var nums = document.querySelectorAll('.stat-bar-num');
    nums.forEach(function (n, i) {
        n.style.transitionDelay = (i * 0.13) + 's';
    });
})();

(function () {
    var hero = document.querySelector('.hero');
    var orb = document.querySelector('.hero .hero-overlay');
    if (!hero || !orb) return;
    hero.addEventListener('mousemove', function (e) {
        var r = hero.getBoundingClientRect();
        var x = ((e.clientX - r.left) / r.width - 0.5) * 18;
        var y = ((e.clientY - r.top) / r.height - 0.5) * 12;
        orb.style.transform = 'translate(' + x + 'px,' + y + 'px)';
        orb.style.transition = 'transform 0.15s linear';
    });
    hero.addEventListener('mouseleave', function () {
        orb.style.transform = '';
        orb.style.transition = 'transform 0.8s var(--ease-expo)';
    });
})();

(function () {
    document.querySelectorAll('.section-label').forEach(function (lbl) {
        new IntersectionObserver(
            function (entries) {
                lbl.style.letterSpacing = entries[0].isIntersecting ? '0.22em' : '0.38em';
                lbl.style.opacity = entries[0].isIntersecting ? '1' : '0';
            },
            { threshold: 0.5 }
        ).observe(lbl);
    });
})();