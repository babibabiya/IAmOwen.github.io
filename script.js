/* =========================================================
   Owen Wu — Portfolio · 页面路由
   三个部分（home / about / projects）只能通过菜单切换；
   部分内部用上下滑（滚轮 / 触摸 / 方向键）翻页。
   ========================================================= */

const DESIGN_W = 1440;
const DESIGN_H = 900;

/* ---------- 1. 1440×900 画布等比适配视口 ---------- */
function fitCanvas() {
  const scale = Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H);
  document.documentElement.style.setProperty('--s', scale.toFixed(4));
}
fitCanvas();
window.addEventListener('resize', fitCanvas, { passive: true });
window.addEventListener('orientationchange', fitCanvas);

/* ---------- 2. 路由状态 ---------- */
const PAGES = {
  home:     [...document.querySelectorAll('[data-section="home"]')],
  about:    [...document.querySelectorAll('[data-section="about"]')],
  projects: [...document.querySelectorAll('[data-section="projects"]')],
  help:     [...document.querySelectorAll('[data-section="help"]')],
};
const ORDER = ['home', 'about', 'projects', 'help'];

const state = { section: 'home', index: 0 };
let locked = false;               // 翻页动画期间锁输入

/* intro 页内向下滚动：露出贴在底部的 footer（footer 是最低点，不是独立一页） */
const introCanvas = document.querySelector('#page-intro .canvas');
let introScrolled = false;
function setIntroScrolled(v) {
  introScrolled = v;
  if (introCanvas) introCanvas.classList.toggle('scrolled', v);
}

function render() {
  for (const sec of ORDER) {
    PAGES[sec].forEach((el, i) => {
      if (sec !== state.section) {
        el.classList.remove('is-active', 'is-above');
        return;
      }
      el.classList.toggle('is-active', i === state.index);
      el.classList.toggle('is-above',  i <  state.index);
    });
  }

  // 底部菜单高亮（每个页面里都有一份）
  document.querySelectorAll('.nav [data-goto]').forEach((b) => {
    b.classList.toggle('active', b.dataset.goto === state.section);
  });
  // About 侧栏高亮
  document.querySelectorAll('.side [data-goto]').forEach((b) => {
    b.classList.toggle(
      'active',
      state.section === 'about' && Number(b.dataset.index) === state.index
    );
  });

  maybeTypeHero();
  maybePlayIntro();
}

function go(section, index = 0) {
  if (!PAGES[section]) return;
  index = Math.max(0, Math.min(index, PAGES[section].length - 1));
  if (section === state.section && index === state.index) return;
  state.section = section;
  state.index = index;
  setIntroScrolled(false);   // 切页时 intro 滚回顶部
  render();
}

function move(delta) {
  if (locked) return;

  // intro 页内：下滑不是翻到新页，而是滚到底露出 footer（footer 为最低点）
  if (state.section === 'home' && state.index === 1) {
    if (delta > 0) {
      if (!introScrolled) {
        setIntroScrolled(true);
        locked = true;
        setTimeout(() => { locked = false; }, 640);
        return;
      }
      return;                 // 已到最低点，停住
    }
    if (introScrolled) {
      setIntroScrolled(false);
      locked = true;
      setTimeout(() => { locked = false; }, 640);
      return;
    }
    // 未滚到底时继续上滑 → 翻回 Hero
  }

  const list = PAGES[state.section];
  const next = state.index + delta;
  if (next < 0 || next >= list.length) return;   // 到边界就停住
  locked = true;
  state.index = next;
  render();
  setTimeout(() => { locked = false; }, 640);
}

/* ---------- 3. 交互绑定 ---------- */
// 菜单跳转（底部菜单 / About 侧栏 / LEARN MORE / 返回箭头 / STORY·ACHIEVEMENTS）
document.querySelectorAll('[data-goto]').forEach((el) => {
  el.addEventListener('click', () => {
    go(el.dataset.goto, el.dataset.index !== undefined ? Number(el.dataset.index) : 0);
  });
});

// 部分内部翻页（chevron / 上翻箭头 / 轮播箭头）
document.querySelectorAll('[data-delta]').forEach((el) => {
  el.addEventListener('click', () => move(Number(el.dataset.delta)));
});

// 滚轮翻页
window.addEventListener('wheel', (e) => {
  if (modal.classList.contains('open')) return;
  if (state.section === 'about') return;   // about 部分只允许按钮切换
  if (Math.abs(e.deltaY) < 24) return;
  move(e.deltaY > 0 ? 1 : -1);
}, { passive: true });

// 触摸上下滑
let touchY = null;
window.addEventListener('touchstart', (e) => {
  touchY = e.touches[0].clientY;
}, { passive: true });
window.addEventListener('touchend', (e) => {
  if (touchY === null) return;
  const dy = touchY - e.changedTouches[0].clientY;
  touchY = null;
  if (state.section === 'about') return;   // about 部分只允许按钮切换
  if (Math.abs(dy) < 48) return;
  move(dy > 0 ? 1 : -1);
}, { passive: true });

// 键盘
window.addEventListener('keydown', (e) => {
  if (modal.classList.contains('open')) {
    if (e.key === 'Escape') closeModal();
    return;
  }
  if (state.section === 'about') return;   // about 部分只允许按钮切换
  if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); move(1); }
  if (['ArrowUp',   'PageUp'].includes(e.key))        { e.preventDefault(); move(-1); }
  if (e.key === 'ArrowRight') move(1);
  if (e.key === 'ArrowLeft')  move(-1);
});

/* ---------- 4. 项目弹窗 ---------- */
const MODALS = {
  desc: {
    title: 'DESCRIPTION',
    body: `Study Nook is a wechat miniprogram from the need of building healthy/useful habits. \n\nAfter getting data from the society, me and my teammates design the strategy for a good homework time habit. \n\nWe separate to finish our own program base on the strategies and finished after a long time of testing.`,
  },
  dp: {
    title: 'DESIGN PROCEDURE',
    body: `At first, we started fixing our target user and making a survey and collect answers in our school. After analyzing the data, we began to design the functions in our tool. \n\nBy applying knowledges we learned on class, gamification is the most important thing to make it contnuous so we combined it with a homework monitor so that users can finish their work efficiently.`,
  },
};

const modal = document.getElementById('modal');
const modalTitle = modal.querySelector('.modal-title');
const modalBody = modal.querySelector('.modal-body');
let lastFocus = null;

function openModal(key) {
  const data = MODALS[key];
  if (!data) return;
  lastFocus = document.activeElement;
  modalTitle.textContent = data.title;
  modalBody.textContent = data.body;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => modal.classList.add('in'));
  modal.querySelector('[data-close]').focus({ preventScroll: true });
}

function closeModal() {
  modal.classList.remove('in');
  modal.setAttribute('aria-hidden', 'true');
  setTimeout(() => modal.classList.remove('open'), 220);
  if (lastFocus) lastFocus.focus({ preventScroll: true });
}

document.querySelectorAll('[data-modal]').forEach((btn) => {
  btn.addEventListener('click', () => openModal(btn.dataset.modal));
});
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.closest('[data-close]')) closeModal();
});

/* ---------- 5. Hero 标题打字机（逐字切图） ---------- */
const heroChars = [...document.querySelectorAll('#hero-title .tc')];
let heroTyping = null;      // 当前 setInterval
let heroWasActive = false;  // 上一次是否在首页（用于检测"重新进入首页"）

function typeHeroTitle() {
  if (heroTyping) clearInterval(heroTyping);
  heroChars.forEach((c) => c.classList.remove('on'));
  let i = 0;
  heroTyping = setInterval(() => {
    heroChars[i].classList.add('on');
    i++;
    if (i >= heroChars.length) {
      clearInterval(heroTyping);
      heroTyping = null;
    }
  }, 90);
}

// 只有从别的页面「进入」首页时才重播；停留在首页翻页不重播
function maybeTypeHero() {
  const isHero = state.section === 'home' && state.index === 0;
  if (isHero && !heroWasActive) typeHeroTitle();
  heroWasActive = isHero;
}

/* ---------- 5b. Intro 动效：Launch 圈喷出两个球，弹跳落在 ABOUT / PROJECTS ---------- */
const introAnimEl = document.getElementById('intro-anim');
const introTrails = introAnimEl ? [...introAnimEl.querySelectorAll('.trail')] : [];
const introBalls  = introAnimEl ? [...introAnimEl.querySelectorAll('.ball')]  : [];
let introRAF = null;
let introWasActive = false;
let introDelayTimer = null;

// 喷出特效：球发射瞬间，从圆环中心喷出一圈同色小粒子 + 扩散环
function spawnLaunchFX() {
  if (!introAnimEl) return;
  const cx = 844.5, cy = 584.5;   // Launch 圆环中心（画布坐标）

  const ring = document.createElement('span');
  ring.className = 'fx-ring';
  ring.style.left = cx + 'px';
  ring.style.top = cy + 'px';
  introAnimEl.appendChild(ring);
  ring.animate([
    { transform: 'translate(-50%,-50%) scale(0.5)', opacity: 0.9 },
    { transform: 'translate(-50%,-50%) scale(2.2)', opacity: 0 },
  ], { duration: 460, easing: 'ease-out' }).onfinish = () => ring.remove();

  const N = 6;
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.7;
    const dist = 16 + Math.random() * 14;   // 飞散 16~30px，克制
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const spark = document.createElement('span');
    spark.className = 'fx-spark';
    spark.style.left = cx + 'px';
    spark.style.top = cy + 'px';
    introAnimEl.appendChild(spark);
    spark.animate([
      { transform: 'translate(-50%,-50%)', opacity: 1 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 0 },
    ], { duration: 420, easing: 'cubic-bezier(0.16,0.84,0.44,1)' }).onfinish = () => spark.remove();
  }
}

function playIntroAnim() {
  if (!introAnimEl) return;

  if (introRAF) cancelAnimationFrame(introRAF);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = introTrails.map((trail, i) => ({
    trail, ball: introBalls[i], total: trail.getTotalLength(),
    dur: i === 0 ? 1100 : 1600,   // 球1(近, ABOUT) 1.1s；球2(远, PROJECTS) 1.6s
  }));

  // 减动效偏好：直接静态落到终点
  if (reduced) {
    items.forEach((it) => {
      const pt = it.trail.getPointAtLength(it.total);
      it.ball.setAttribute('cx', pt.x);
      it.ball.setAttribute('cy', pt.y);
      it.ball.style.opacity = 1;
    });
    return;
  }

  const start = performance.now();
  spawnLaunchFX();   // 发射瞬间喷出同色特效
  function frame(now) {
    let allDone = true;
    for (const it of items) {
      const t = Math.min((now - start) / it.dur, 1);
      const p = 1 - Math.pow(1 - t, 3);      // ease-out：喷出快、落地缓
      const pt = it.trail.getPointAtLength(it.total * p);
      it.ball.setAttribute('cx', pt.x);
      it.ball.setAttribute('cy', pt.y);
      it.ball.style.opacity = t > 0 ? 1 : 0;
      if (t < 1) allDone = false;
    }
    if (!allDone) {
      introRAF = requestAnimationFrame(frame);
    } else {
      introRAF = null;
    }
  }
  introRAF = requestAnimationFrame(frame);
}

// 进入 intro 页时，等翻页过渡(0.62s)完成后再发射
function maybePlayIntro() {
  const isIntro = state.section === 'home' && state.index === 1;
  if (isIntro && !introWasActive) {
    if (introDelayTimer) clearTimeout(introDelayTimer);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    introDelayTimer = setTimeout(playIntroAnim, reduced ? 0 : 620);
  } else if (!isIntro) {
    // 离开 intro：取消发射/进行中的动画，并把两个球隐藏
    if (introDelayTimer) { clearTimeout(introDelayTimer); introDelayTimer = null; }
    if (introRAF)        { cancelAnimationFrame(introRAF); introRAF = null; }
    introBalls.forEach((b) => { b.style.opacity = 0; });
  }
  introWasActive = isIntro;
}

/* ---------- 5c. Help 卡片展开 / 收起（活动详情） ---------- */
document.querySelectorAll('.help-head').forEach((head) => {
  head.addEventListener('click', () => {
    const card = head.closest('.help-card');
    const open = card.classList.toggle('open');
    head.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
});

/* ---------- 6. 初始渲染 ---------- */
render();
