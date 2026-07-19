/* ═══════════════════════════════════════════════════════════
   《折腾志》 hero3d.js — 活字印刷字块（Three.js, ES Module）
   字块从散落聚合 → 缓缓漂浮旋转 → 鼠标视差
   ═══════════════════════════════════════════════════════════ */

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 1023px)').matches;

async function initHero() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  let THREE;
  try {
    THREE = await import('three');
  } catch (e) {
    document.body.classList.add('no-webgl');
    return;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) {
    document.body.classList.add('no-webgl');
    return;
  }

  const PAPER = 0xf5f1e8;
  renderer.setClearColor(PAPER, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 1.75));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PAPER, isMobile ? 12 : 14, isMobile ? 26 : 30);

  const camera = new THREE.PerspectiveCamera(isMobile ? 46 : 38, 1, 0.1, 100);
  camera.position.set(0, 0, isMobile ? 17 : 15);

  /* ── 灯光 ── */
  const ambient = new THREE.AmbientLight(0xfff6e8, 1.15);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffe9c9, 1.6);
  key.position.set(6, 8, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc2402a, 0.35);
  rim.position.set(-8, -4, -6);
  scene.add(rim);

  /* ── 主题同步（墨黑书卷 ↔ 夜色场景） ── */
  const THEME_3D = {
    light: { paper: 0xf5f1e8, amb: 1.15, key: 1.6, rim: 0.35 },
    dark:  { paper: 0x17140e, amb: 0.55, key: 2.0, rim: 0.6 },
  };
  function applyTheme(t) {
    const c = THEME_3D[t] || THEME_3D.light;
    scene.fog.color.setHex(c.paper);
    ambient.intensity = c.amb;
    key.intensity = c.key;
    rim.intensity = c.rim;
  }
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  addEventListener('ztz:theme', e => applyTheme(e.detail));

  /* ── 纹理 ── */
  const WOOD_TONES = ['#c0a377', '#b3946a', '#a98a5f', '#937850', '#bfa98b', '#8d7350'];

  function woodTexture(tone) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = tone;
    g.fillRect(0, 0, 128, 128);
    // 木纹
    g.globalAlpha = 0.14;
    for (let i = 0; i < 22; i++) {
      g.strokeStyle = Math.random() > 0.5 ? '#5c4a30' : '#e8d9bd';
      g.lineWidth = 0.6 + Math.random() * 1.6;
      g.beginPath();
      const x = Math.random() * 128;
      g.moveTo(x, -8);
      g.bezierCurveTo(x + (Math.random() * 14 - 7), 42, x + (Math.random() * 14 - 7), 86, x + (Math.random() * 10 - 5), 136);
      g.stroke();
    }
    g.globalAlpha = 1;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  function charTexture(tone, ch) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = tone;
    g.fillRect(0, 0, 256, 256);
    // 边框刻痕
    g.strokeStyle = 'rgba(26,24,21,.55)';
    g.lineWidth = 5;
    g.strokeRect(14, 14, 228, 228);
    // 字
    g.fillStyle = '#221c14';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = '900 150px "LXGW WenKai Lite","Noto Serif SC","Songti SC","SimSun",serif';
    g.fillText(ch, 128, 138);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  /* ── 字块 ── */
  const CHARS = isMobile
    ? ['折', '腾', '造', '物', '志']
    : ['折', '腾', '造', '物', '志', '赴', '野', '码', '印', '风'];

  // 目标队形：偏向画面右侧的松散弧阵（移动端：缩小推远，让位给文字）
  const FORMATION = isMobile
    ? [[2.9, 2.6, -2.5], [4.6, 0.6, -3.5], [2.2, -2.6, -3], [5.2, 3.8, -5], [4.0, -4.2, -4]]
    : [[4.6, 2.2, -0.8], [6.8, 0.9, -2.0], [3.8, -1.0, -1.4], [8.0, 2.9, -3.4], [5.8, -2.4, -2.6],
       [8.8, -0.6, -4.4], [3.2, 3.6, -3.0], [7.2, 4.3, -5.2], [9.8, 1.6, -6.0], [5.0, -3.8, -4.0]];

  const BLOCK_SCALE = isMobile ? 0.62 : 1;

  const blocks = [];
  const geo = new THREE.BoxGeometry(1.55, 1.55, 1.55);

  CHARS.forEach((ch, i) => {
    const tone = WOOD_TONES[i % WOOD_TONES.length];
    const wood = new THREE.MeshStandardMaterial({ map: woodTexture(tone), roughness: 0.82, metalness: 0.05 });
    const face = new THREE.MeshStandardMaterial({ map: charTexture(tone, ch), roughness: 0.78, metalness: 0.05 });
    // [+x, -x, +y, -y, +z, -z]：顶面与正面刻字
    const mesh = new THREE.Mesh(geo, [wood, wood, face, wood, face, wood]);
    mesh.scale.setScalar(BLOCK_SCALE);

    const target = new THREE.Vector3(...FORMATION[i % FORMATION.length]);
    // 散落起点：远处大球面
    const start = new THREE.Vector3().randomDirection().multiplyScalar(22 + Math.random() * 14);
    mesh.position.copy(start);
    mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
    mesh.userData = {
      start, target,
      phase: Math.random() * Math.PI * 2,
      floatAmp: 0.22 + Math.random() * 0.25,
      floatSpeed: 0.5 + Math.random() * 0.5,
      rotSpeed: (Math.random() - 0.5) * 0.0035,
      baseRot: new THREE.Euler(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.9,
        (Math.random() - 0.5) * 0.3),
      delay: 0.15 + i * 0.09,
    };
    scene.add(mesh);
    blocks.push(mesh);
  });

  /* ── 交互与尺寸 ── */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!isMobile) {
    addEventListener('pointermove', e => {
      mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  addEventListener('resize', resize, { passive: true });

  /* ── 可见性：离开视口就休眠 ── */
  let visible = true;
  new IntersectionObserver(en => { visible = en[0].isIntersecting; }, { threshold: 0.02 })
    .observe(canvas);
  document.addEventListener('visibilitychange', () => { visible = visible && !document.hidden; });

  /* ── 动画 ── */
  const clock = new THREE.Clock();
  const easeOut = k => 1 - Math.pow(1 - k, 4);
  const INTRO = reducedMotion ? 0 : 2.4;

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    resize();
    const t = clock.getElapsedTime();

    blocks.forEach(b => {
      const u = b.userData;
      const k = INTRO === 0 ? 1 : easeOut(Math.min(1, Math.max(0, (t - u.delay) / INTRO)));
      // 位置：散落 → 队形 → 叠加正弦漂浮
      b.position.lerpVectors(u.start, u.target, k);
      b.position.y += Math.sin(t * u.floatSpeed + u.phase) * u.floatAmp * k;
      b.position.x += Math.cos(t * u.floatSpeed * 0.6 + u.phase) * u.floatAmp * 0.5 * k;
      // 旋转：乱 → 稳态缓旋
      b.rotation.x = u.baseRot.x + Math.sin(t * 0.4 + u.phase) * 0.12 * k + (1 - k) * u.phase * 2;
      b.rotation.y = u.baseRot.y + t * u.rotSpeed * 60 * 0.016 * k + (1 - k) * u.phase * 3;
      b.rotation.z = u.baseRot.z + Math.cos(t * 0.3 + u.phase) * 0.06 * k;
    });

    // 相机视差
    mouse.x += (mouse.tx - mouse.x) * 0.045;
    mouse.y += (mouse.ty - mouse.y) * 0.045;
    camera.position.x = mouse.x * 0.9;
    camera.position.y = -mouse.y * 0.6;
    camera.lookAt(isMobile ? 3.4 : 5.2, 0.4, -2.2);

    renderer.render(scene, camera);
  }
  tick();
}

initHero().catch(() => document.body.classList.add('no-webgl'));
