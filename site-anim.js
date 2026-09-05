/*!
 * site-anim.js — 黑金水墨动效系统（渐进增强）
 *
 * 原则：内容默认可见。GSAP 缺失 / 系统要求减动效 / 本脚本异常时，
 * 页面回退为完整静态形态，绝不因动效丢失内容。
 * 图层：进场（首屏编排）→ 滚动（章节显现 / 笔触标题 / 卡片盖章）→ 氛围（视差）→ 交互（墨晕）。
 */
(function () {
    'use strict';

    var docEl = document.documentElement;
    function mq(q) { return window.matchMedia ? window.matchMedia(q).matches : false; }
    var reduced = mq('(prefers-reduced-motion: reduce)');
    var desktop = mq('(min-width: 1024px)');
    var finePointer = mq('(pointer: fine)');
    var touched = [];

    function started() { docEl.setAttribute('data-anim-started', '1'); }

    /* 只对首屏以下的元素做滚动显现的初始隐藏，首屏内元素交给进场层 */
    function belowFold(el) {
        return el.getBoundingClientRect().top > window.innerHeight * 0.92;
    }

    function track(targets) {
        var list = gsap.utils.toArray(targets);
        list.forEach(function (el) { touched.push(el); });
        return list;
    }

    function init() {
        if (reduced || typeof window.gsap === 'undefined') { started(); return; }
        try { setup(); } catch (err) { revert(); }
        started();
    }

    /* 异常兜底：清掉所有已设置的初始态，并解除 CSS 隐藏，页面回到静态完整形态 */
    function revert() {
        docEl.classList.add('anim-failsafe');
        try {
            if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
            window.gsap.globalTimeline.clear();
            touched.forEach(function (el) { window.gsap.set(el, { clearProps: 'all' }); });
        } catch (e) { /* 静默 */ }
    }

    function setup() {
        var gsap = window.gsap;
        var ST = window.ScrollTrigger;
        if (ST) gsap.registerPlugin(ST);

        var mode = document.querySelector('.hero') ? 'home'
                 : document.querySelector('.demo-container') ? 'demo'
                 : 'doc';
        var header = document.querySelector('.doc-header, .analysis-header, .demo-header');

        /* ================= 进场层：每次进入只播一次 ================= */
        var enterTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        if (mode === 'home') {
            enterTl
                .fromTo(track('.hero-character'),
                    { opacity: 0, scale: 1.04 },
                    { opacity: 1, scale: 1, duration: 1.0, ease: 'power1.out' }, 0)
                .fromTo(track('.hero-label'),
                    { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, 0.15)
                .fromTo(track('.hero h1'),
                    { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
                    { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.75, ease: 'power3.inOut' }, 0.3)
                .fromTo(track('.hero-en'),
                    { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5 }, 0.65)
                .fromTo(track('.hero-line'),
                    { opacity: 0, scaleX: 0, transformOrigin: 'left center' },
                    { opacity: 1, scaleX: 1, duration: 0.55, ease: 'power2.inOut' }, 0.72)
                .fromTo(track('.hero .desc'),
                    { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55 }, 0.85)
                .fromTo(track('.hero-tags .tag'),
                    { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.07 }, 1.0)
                .fromTo(track('.info-module'),
                    { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.09 }, 1.15)
                .fromTo(track('.hero-vertical'),
                    { opacity: 0 }, { opacity: 1, duration: 0.9 }, 1.25);
        } else if (header) {
            var h1 = header.querySelector('h1');
            if (h1) {
                enterTl.fromTo(track(h1),
                    { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
                    { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power3.inOut' }, 0.1);
            }
            var rest = gsap.utils.toArray(header.querySelectorAll('[data-anim]')).filter(function (el) { return el !== h1; });
            if (rest.length) {
                enterTl.fromTo(track(rest),
                    { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, 0.42);
            }
            if (mode === 'demo') {
                var layout = gsap.utils.toArray('.game-layout > [data-anim]');
                if (layout.length) {
                    enterTl.fromTo(track(layout),
                        { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.55, stagger: 0.1 }, 0.55);
                }
            }
        }

        /* ================= 滚动层 ================= */
        function reveal(targets, vars) {
            gsap.utils.toArray(targets).forEach(function (el) {
                if (!belowFold(el)) return;
                track(el);
                gsap.fromTo(el, { opacity: 0, y: 26 }, Object.assign({
                    opacity: 1, y: 0, duration: 0.7, ease: 'power2.out',
                    scrollTrigger: { trigger: el, start: 'top 86%', once: true }
                }, vars || {}));
            });
        }

        function staggerGroup(group, itemSel, opts) {
            opts = opts || {};
            gsap.utils.toArray(group).forEach(function (g) {
                if (!belowFold(g)) return;
                var items = gsap.utils.toArray(g.querySelectorAll(itemSel));
                if (!items.length) return;
                track(items);
                if (!desktop) {
                    gsap.set(items, { opacity: 0 });
                    gsap.to(items, {
                        opacity: 1, duration: 0.6, ease: 'power1.out',
                        scrollTrigger: { trigger: g, start: 'top 86%', once: true }
                    });
                    return;
                }
                gsap.set(items, { opacity: 0, y: 22 });
                gsap.to(items, {
                    opacity: 1, y: 0, duration: 0.55, ease: 'power2.out',
                    stagger: opts.stagger || 0.09,
                    scrollTrigger: { trigger: g, start: 'top 86%', once: true }
                });
            });
        }

        /* 卡片"盖章"：快速落下 + 微弹回稳，签名动效 B */
        function stampCards(cards) {
            gsap.utils.toArray(cards).forEach(function (card, i) {
                if (!belowFold(card)) return;
                track(card);
                var tl = gsap.timeline({
                    delay: i * 0.12,
                    scrollTrigger: { trigger: card, start: 'top 86%', once: true }
                });
                tl.fromTo(card,
                        { opacity: 0, scale: 1.14, rotation: -1.5, y: 8 },
                        { opacity: 1, scale: 0.985, rotation: 0, y: 0, duration: 0.3, ease: 'power2.in' })
                  .to(card, { scale: 1, duration: 0.28, ease: 'back.out(2.2)' });
            });
        }

        if (mode === 'home') {
            /* 章节头：编号 → 标题笔触 → 副题 → 金线延伸 → 描述（签名动效 A） */
            gsap.utils.toArray('.section').forEach(function (sec) {
                var head = sec.querySelector('.section-header');
                if (!head || !belowFold(head)) return;
                track(head);
                var title = sec.querySelector('.section-title');
                var num = sec.querySelector('.section-num');
                var subtitle = sec.querySelector('.section-subtitle');
                var line = sec.querySelector('.section-line');
                var desc = sec.querySelector('.section-desc');
                var tl = gsap.timeline({
                    scrollTrigger: { trigger: head, start: 'top 80%', once: true },
                    defaults: { ease: 'power2.out' }
                });
                if (num) tl.fromTo(num, { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: 0.5 }, 0);
                if (title) tl.fromTo(title,
                    { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
                    { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.65, ease: 'power3.inOut' }, 0.1);
                if (subtitle) tl.fromTo(subtitle, { opacity: 0 }, { opacity: 1, duration: 0.45 }, 0.42);
                if (line) tl.fromTo(line,
                    { clipPath: 'inset(0 100% 0 0)' },
                    { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.inOut' }, 0.38);
                if (desc) tl.fromTo(desc, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, 0.5);
            });

            /* 内容大块 */
            reveal('.project-showcase, .analysis-highlight, .dialogue-box, .skills, .gaming-experience, .analysis-content > a.btn-primary');

            /* doc-card 走"盖章"节奏 */
            gsap.utils.toArray('.doc-grid').forEach(function (grid) {
                stampCards(grid.querySelectorAll('.doc-card'));
            });

            /* 朱砂印章：进入视口时快速盖下 */
            gsap.utils.toArray('.seal-mark').forEach(function (seal) {
                if (!belowFold(seal)) return;
                track(seal);
                gsap.fromTo(seal,
                    { opacity: 0, scale: 1.6, rotation: -10 },
                    { opacity: 1, scale: 1, rotation: -3, duration: 0.35, ease: 'power3.in',
                      scrollTrigger: { trigger: seal, start: 'top 90%', once: true } });
            });

            /* 列表错峰 */
            gsap.utils.toArray('.analysis-grid').forEach(function (g) { staggerGroup(g, '.analysis-item', { stagger: 0.08 }); });
            gsap.utils.toArray('.features ul').forEach(function (g) { staggerGroup(g, 'li', { stagger: 0.07 }); });
            gsap.utils.toArray('.tech-stack').forEach(function (g) { staggerGroup(g, '.tech-tags span', { stagger: 0.05 }); });
            gsap.utils.toArray('.btn-group').forEach(function (g) { staggerGroup(g, ':scope > *', { stagger: 0.08 }); });
            gsap.utils.toArray('.skill-group').forEach(function (g) { staggerGroup(g, 'li', { stagger: 0.04 }); });
        } else {
            /* 文档页：章节淡入 + h2 笔触入场 */
            gsap.utils.toArray('.doc-section, .analysis-section').forEach(function (sec) {
                if (!belowFold(sec)) return;
                track(sec);
                var h2 = sec.querySelector('h2');
                var tl = gsap.timeline({
                    scrollTrigger: { trigger: sec, start: 'top 84%', once: true },
                    defaults: { ease: 'power2.out' }
                });
                tl.fromTo(sec, { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.65 }, 0);
                if (h2) tl.fromTo(h2,
                    { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
                    { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.55, ease: 'power3.inOut' }, 0.08);
            });
        }

        /* ================= 氛围层：滚动视差（桌面端） ================= */
        if (ST && desktop) {
            var inkBg = document.querySelector('.ink-bg');
            if (inkBg) {
                track(inkBg);
                gsap.to(inkBg, {
                    yPercent: -6, ease: 'none',
                    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.5 }
                });
            }
            var heroSec = document.querySelector('.hero');
            var heroChar = document.querySelector('.hero-character');
            if (heroSec && heroChar) {
                track(heroChar);
                gsap.to(heroChar, {
                    y: 70, ease: 'none',
                    scrollTrigger: { trigger: heroSec, start: 'top top', end: 'bottom top', scrub: 1.2 }
                });
            }
        }

        /* 氛围层：Hero 人物鼠标微视差（桌面 + 精确指针） */
        if (desktop && finePointer) {
            var heroImg = document.querySelector('.hero-character img');
            if (heroImg) {
                track(heroImg);
                var qx = gsap.quickTo(heroImg, 'x', { duration: 1.1, ease: 'power2.out' });
                var qy = gsap.quickTo(heroImg, 'y', { duration: 1.1, ease: 'power2.out' });
                window.addEventListener('mousemove', function (e) {
                    qx(((e.clientX / window.innerWidth) - 0.5) * -14);
                    qy(((e.clientY / window.innerHeight) - 0.5) * -10);
                }, { passive: true });
            }
        }

        /* ================= 交互层：触点墨晕（注入叠加层，避免污染既有伪元素） ================= */
        if (finePointer) {
            gsap.utils.toArray('.doc-card, .analysis-item, .dialogue-box, .info-module').forEach(function (card) {
                if (card.querySelector('.ink-glow')) return;
                var glow = document.createElement('span');
                glow.className = 'ink-glow';
                glow.setAttribute('aria-hidden', 'true');
                card.appendChild(glow);
                card.classList.add('ink-host');
                card.addEventListener('mousemove', function (e) {
                    var r = card.getBoundingClientRect();
                    glow.style.setProperty('--mx', (e.clientX - r.left).toFixed(1) + 'px');
                    glow.style.setProperty('--my', (e.clientY - r.top).toFixed(1) + 'px');
                }, { passive: true });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
