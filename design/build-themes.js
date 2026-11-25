'use strict';
/**
 * FigCraft — 5 telas principais do "Planilha Eh Tudo" em 3 frameworks.
 *
 *   Dashboard · Lançamentos · Categorias · Configurações (1440×1200)
 *   PWA Home (412×1120)
 *
 * Cada tela é gerada 3x com o MESMO conteúdo e a MESMA arquitetura de
 * informação, mudando apenas a linguagem visual:
 *   tw   → Tailwind v3      (Inter, blue-600, radius 6, flat)
 *   bs   → Bootstrap 5.3    (Roboto, #0D6EFD, radius 6, header/body/footer)
 *   beer → Beer CSS 5       (Material Design 3, Roboto, #0061A4, pill, tonal)
 *
 * Cliente MCP persistente (design/fig.js) + 1 batch por pai.
 */

const fig = require('./fig.js');

const solid = (c) => [{ type: 'solid', color: c }];

// ================================================================== THEMES
const THEMES = {
  tw: {
    key: 'tw', label: 'Tailwind v3',
    font: 'Inter',
    c: {
      primary: '#2563EB', primaryDk: '#1D4ED8', primarySoft: '#DBEAFE',
      heading: '#111827', body: '#111827', muted: '#374151', faint: '#6B7280', ph: '#9CA3AF',
      bg: '#F9FAFB', surface: '#FFFFFF', surface2: '#F3F4F6', surface3: '#E5E7EB',
      border: '#E5E7EB', borderStrong: '#D1D5DB', divider: '#F3F4F6',
      success: '#16A34A', successDk: '#15803D', danger: '#DC2626', dangerDk: '#B91C1C',
      warning: '#F59E0B', warningDk: '#D97706', expense: '#DC2626', income: '#16A34A',
      activeBg: '#2563EB', activeFg: '#FFFFFF', inactiveFg: '#374151',
      theadBg: '#F9FAFB', theadFg: '#6B7280', rowRule: '#F3F4F6',
      mutedBg: '#F3F4F6',
    },
    r: { sm: 4, md: 6, lg: 8, xl: 12, xxl: 16, pill: 999 },
    sh: {
      soft: { type: 'dropShadow', color: '#0000000F', offset: [0, 1], radius: 6, spread: 0 },
      card: { type: 'dropShadow', color: '#00000014', offset: [0, 2], radius: 4, spread: 0 },
      lg: { type: 'dropShadow', color: '#0000001F', offset: [0, 8], radius: 20, spread: 0 },
      fab: { type: 'dropShadow', color: '#0000004D', offset: [0, 4], radius: 12, spread: 0 },
    },
    nav: { h: 64, titleSize: 18, titleStyle: 'Semi Bold', radius: 8, padX: 24 },
    side: { w: 176, linkH: 40, radius: 8, iconSize: 18, textSize: 14, textStyle: 'Medium', padX: 8 },
    btn: { h: 40, radius: 6, fs: 14, weight: 'Medium', padX: 16 },
    inp: { h: 40, radius: 6, fs: 14, padX: 12, bd: '#D1D5DB' },
    lbl: { fs: 14, weight: 'Medium', color: '#374151' },
    ty: {
      page: 30, pageStyle: 'Bold', section: 24, sectionStyle: 'Bold',
      cardTitle: 16, cardTitleStyle: 'Bold', body: 14, small: 12, upper: true,
    },
    fab: { size: 56, radius: 28, bg: '#16A34A', fg: '#FFFFFF' },
    cols: [50, 130, 140, 110, 378, 140, 110, 110],
    cellFs: 14, cellPad: 8, rowH: 56, headFs: 12,
  },

  bs: {
    key: 'bs', label: 'Bootstrap 5.3',
    font: 'Roboto',
    c: {
      primary: '#0D6EFD', primaryDk: '#0B5ED7', primarySoft: '#CFE2FF',
      heading: '#212529', body: '#212529', muted: '#495057', faint: '#6C757D', ph: '#6C757D',
      bg: '#FFFFFF', surface: '#FFFFFF', surface2: '#F8F9FA', surface3: '#F1F3F5',
      border: '#DEE2E6', borderStrong: '#CED4DA', divider: '#DEE2E6',
      success: '#198754', successDk: '#146C43', danger: '#DC3545', dangerDk: '#B02A37',
      warning: '#FFC107', warningDk: '#FFCA0A', expense: '#DC3545', income: '#198754',
      activeBg: '#0D6EFD', activeFg: '#FFFFFF', inactiveFg: '#212529',
      theadBg: '#F8F9FA', theadFg: '#6C757D', rowRule: '#DEE2E6',
      mutedBg: '#F8F9FA',
    },
    r: { sm: 4, md: 6, lg: 8, xl: 8, xxl: 12, pill: 999 },
    sh: {
      soft: { type: 'dropShadow', color: '#0000000F', offset: [0, 1], radius: 6, spread: 0 },
      card: { type: 'dropShadow', color: '#0000001A', offset: [0, 2], radius: 4, spread: 0 },
      lg: { type: 'dropShadow', color: '#00000026', offset: [0, 8], radius: 16, spread: 0 },
      fab: { type: 'dropShadow', color: '#0000004D', offset: [0, 4], radius: 12, spread: 0 },
    },
    nav: { h: 56, titleSize: 20, titleStyle: 'Bold', radius: 6, padX: 24 },
    side: { w: 200, linkH: 44, radius: 6, iconSize: 18, textSize: 15, textStyle: 'Normal', padX: 12 },
    btn: { h: 38, radius: 6, fs: 16, weight: 'Regular', padX: 16 },
    inp: { h: 38, radius: 6, fs: 16, padX: 12, bd: '#CED4DA' },
    lbl: { fs: 16, weight: 'Regular', color: '#212529' },
    ty: {
      page: 28, pageStyle: 'Bold', section: 24, sectionStyle: 'Bold',
      cardTitle: 20, cardTitleStyle: 'Bold', body: 16, small: 14, upper: false,
    },
    fab: { size: 56, radius: 28, bg: '#198754', fg: '#FFFFFF' },
    cols: [50, 140, 150, 120, 318, 140, 120, 130],
    cellFs: 16, cellPad: 12, rowH: 56, headFs: 14,
  },

  beer: {
    key: 'beer', label: 'Beer CSS 5',
    font: 'Roboto',
    // Paleta Material Design 3 (Material Theme Builder) — azul.
    c: {
      primary: '#0061A4', primaryDk: '#0061A4', primarySoft: '#D1E4FF',   // --primary / --primary-container
      onPrimaryContainer: '#001D36',                                       // --on-primary-container
      secondary: '#535F70', secondarySoft: '#D7E3F7', onSecondaryContainer: '#101C2B', // --secondary-container
      tertiary: '#6B5778', tertiarySoft: '#F2DAFF', onTertiaryContainer: '#251431',     // --tertiary-container
      heading: '#1A1C1E', body: '#1A1C1E',                                   // --on-surface
      muted: '#43474E', faint: '#43474E', ph: '#43474E',                     // --on-surface-variant
      bg: '#FDFCFF',                                                        // --background
      surface: '#FFFFFF',                                                   // --surface-container-lowest
      surface2: '#F4F3F7',                                                  // --surface-container-low
      surface3: '#EEEDF1',                                                  // --surface-container
      surfaceHigh: '#E8E8EB',                                               // --surface-container-high
      border: '#C3C7CF', borderStrong: '#73777F', divider: '#C3C7CF',       // --outline-variant / --outline
      success: '#146C43', successDk: '#146C43',                              // fora da paleta: sem "success" no M3
      danger: '#BA1A1A', dangerDk: '#410002', dangerSoft: '#FFDAD6',         // --error / --on-error-container
      warning: '#6B5778', warningDk: '#6B5778',                             // --tertiary
      expense: '#BA1A1A', income: '#146C43',
      activeBg: '#D7E3F7', activeFg: '#101C2B', inactiveFg: '#43474E',       // --secondary-container ativo
      theadBg: '#EEEDF1', theadFg: '#43474E', rowRule: '#C3C7CF',
      mutedBg: '#F4F3F7',
    },
    r: { sm: 4, md: 8, lg: 12, xl: 16, xxl: 28, pill: 999 },
    sh: {
      soft: { type: 'dropShadow', color: '#1A1C1E12', offset: [0, 1], radius: 3, spread: 0 },
      card: { type: 'dropShadow', color: '#1A1C1E14', offset: [0, 1], radius: 4, spread: 0 },
      lg: { type: 'dropShadow', color: '#1A1C1E24', offset: [0, 6], radius: 12, spread: 0 },
      fab: { type: 'dropShadow', color: '#1A1C1E29', offset: [0, 4], radius: 10, spread: 0 },
    },
    nav: { h: 64, titleSize: 22, titleStyle: 'Semi Bold', radius: 12, padX: 24 },
    side: { w: 200, linkH: 56, radius: 16, iconSize: 22, textSize: 14, textStyle: 'Medium', padX: 16 },
    btn: { h: 40, radius: 20, fs: 14, weight: 'Medium', padX: 24 },
    inp: { h: 52, radius: 4, fs: 16, padX: 16, bd: '#73777F' },
    lbl: { fs: 12, weight: 'Medium', color: '#43474E' },
    ty: {
      page: 32, pageStyle: 'Bold', section: 24, sectionStyle: 'Semi Bold',
      cardTitle: 16, cardTitleStyle: 'Semi Bold', body: 14, small: 12, upper: false,
    },
    fab: { size: 56, radius: 16, bg: '#D1E4FF', fg: '#0061A4' },             // primary-container / primary
    cols: [64, 150, 170, 130, 280, 150, 120, 104],
    cellFs: 14, cellPad: 16, rowH: 56, headFs: 12,
  },
};

const NAV_ITEMS = [
  { glyph: '🏠', label: 'Dashboard' },
  { glyph: '📋', label: 'Lançamentos' },
  { glyph: '🏷️', label: 'Categorias' },
  { glyph: '📱', label: 'Celular' },
];

const DESKTOP_W = 1440;
const DESKTOP_H = 1200;
const PWA_W = 412;
const PWA_H = 1120;
const FOOT_H = 80;
const CONTENT_W = 1200;

// ================================================================== helpers
function F(name, o = {}) {
  const p = {};
  p.fills = (o.fill === undefined || o.fill === 'none') ? [] : solid(o.fill);
  if (o.layout) { p.layout = o.layout; p.gap = o.gap || 0; }
  if (o.pad !== undefined) p.padding = o.pad;
  if (o.main) p.mainAlign = o.main;
  if (o.cross) p.crossAlign = o.cross;
  if (o.stroke) { p.strokes = solid(o.stroke); p.strokeWeight = o.strokeW || 1; }
  if (o.radius !== undefined) p.cornerRadius = o.radius;
  if (o.effects) p.effects = o.effects;
  p.sizingH = o.w !== undefined ? 'fixed' : (o.sizingH || (o.layout ? 'hug' : 'fill'));
  p.sizingV = o.h !== undefined ? 'fixed' : (o.sizingV || (o.layout ? 'hug' : 'fill'));
  const s = { type: 'frame', name, props: p };
  if (o.w !== undefined) s.width = o.w;
  if (o.h !== undefined) s.height = o.h;
  if (o.x !== undefined) s.x = o.x;
  if (o.y !== undefined) s.y = o.y;
  return s;
}

function T(name, str, o = {}) {
  const p = {
    fontFamily: o.font || 'Inter',
    fontSize: o.size || 16,
    fontStyle: o.style || 'Regular',
    fills: solid(o.color || '#111827'),
  };
  if (o.align) p.textAlign = o.align;
  if (o.width !== undefined) { p.textAutoResize = 'height'; p.width = o.width; }
  if (o.ls) p.letterSpacing = o.ls;
  return { type: 'text', name, text: str, props: p };
}

function R(name, o = {}) {
  const s = F(name, o);
  s.type = 'rectangle';
  return s;
}

const mk = (specs, parent) => fig.batch(specs, parent);

/** botão: variante primary | success | warning | danger | outline | ghost | tonal */
async function button(parent, name, label, th, variant, opts = {}) {
  const b = th.btn;
  let bg = th.c.primary, fg = '#FFFFFF', bd = undefined;
  if (variant === 'success') { bg = th.c.success; fg = '#FFFFFF'; bd = th.key === 'bs' ? th.c.successDk : undefined; }
  if (variant === 'warning') { bg = th.c.warning; fg = th.key === 'beer' ? '#FFFFFF' : (th.key === 'bs' ? '#212529' : '#FFFFFF'); bd = th.key === 'bs' ? th.c.warningDk : undefined; }
  if (variant === 'danger') { bg = th.c.danger; fg = '#FFFFFF'; bd = th.key === 'bs' ? th.c.dangerDk : undefined; }
  if (variant === 'outline') { bg = th.c.surface; fg = th.c.body; bd = th.c.borderStrong; }
  if (variant === 'ghost') { bg = 'none'; fg = th.key === 'beer' ? th.c.primary : th.c.muted; }
  if (variant === 'tonal') { bg = th.c.secondarySoft; fg = th.c.onSecondaryContainer; }
  if (opts.bg) bg = opts.bg;
  if (opts.fg) fg = opts.fg;
  const id = (await mk([F(name, {
    w: opts.w, h: opts.h || b.h, layout: 'horizontal', pad: [0, opts.padX || b.padX, 0, opts.padX || b.padX],
    fill: bg, radius: opts.radius !== undefined ? opts.radius : b.radius,
    main: 'center', cross: 'center', stroke: bd,
  })], parent))[0];
  await mk([T(`${name} label`, label, {
    size: opts.size || b.fs, style: opts.weight || b.weight, color: fg, font: th.font,
  })], id);
  return id;
}

/** campo rotulado */
async function field(parent, name, th, label, value, o = {}) {
  const i = th.inp;
  const w = o.w;
  const wrap = (await mk([F(`${name} group`, { w, layout: 'vertical', gap: 6, fills: [] })], parent))[0];
  await mk([T(`${name} label`, label, {
    size: th.lbl.fs, style: th.lbl.weight, color: th.lbl.color, font: th.font,
  })], wrap);
  const box = (await mk([F(`${name} input`, {
    w, h: i.h, layout: 'horizontal', pad: [0, i.padX, 0, i.padX], fill: th.c.surface,
    stroke: i.bd, radius: i.radius, cross: 'center',
  })], wrap))[0];
  await mk([T(`${name} value`, value, {
    size: i.fs, color: value ? th.c.body : th.c.ph, font: th.font,
  })], box);
  return wrap;
}

// ================================================================== chrome
async function topNav(parent, th, W) {
  const n = th.nav;
  const navId = (await mk([F('nav', {
    w: W, h: n.h, layout: 'horizontal', pad: [0, n.padX, 0, n.padX], fill: th.c.surface,
    main: 'spaceBetween', cross: 'center', x: 0, y: 0,
  })], parent))[0];

  await mk([T('brand', 'Planilha Eh Tudo', {
    size: n.titleSize, style: n.titleStyle, color: th.c.heading, font: th.font,
  })], navId);

  const menu = (await mk([F('user menu', {
    layout: 'horizontal', gap: 8, main: 'center', cross: 'center',
  })], navId))[0];
  const avSize = th.key === 'beer' ? 40 : 32;
  const av = (await mk([F('avatar', {
    w: avSize, h: avSize, layout: 'horizontal', pad: 0,
    fill: th.key === 'beer' ? th.c.primarySoft : th.c.primary,
    radius: avSize / 2, main: 'center', cross: 'center',
  })], menu))[0];
  await mk([T('avatar letter', 'E', {
    size: th.key === 'beer' ? 16 : 14, style: 'Bold',
    color: th.key === 'beer' ? th.c.onPrimaryContainer : '#FFFFFF', font: th.font,
  })], av);
  await mk([T('user name', 'Edson', {
    size: th.key === 'beer' ? 14 : (th.key === 'bs' ? 16 : 14), style: 'Medium', color: th.c.body, font: th.font,
  })], menu);
  await mk([T('chevron', '▾', { size: 13, color: th.c.faint, font: th.font })], menu);
  return navId;
}

async function sideNav(parent, th, activeIdx, top, height) {
  const s = th.side;
  const sideId = (await mk([F('sidebar', {
    w: s.w, h: height, layout: 'vertical', gap: 4,
    pad: [16, s.padX, 16, s.padX], fill: th.c.surface, x: 0, y: top,
  })], parent))[0];

  for (let i = 0; i < NAV_ITEMS.length; i++) {
    const it = NAV_ITEMS[i];
    const active = i === activeIdx;
    const linkId = (await mk([F(`nav link ${it.label}`, {
      w: s.w - s.padX * 2, h: s.linkH, layout: 'horizontal', gap: 12, pad: [0, 12, 0, 12],
      fill: active ? th.c.activeBg : undefined, radius: s.radius, main: 'min', cross: 'center',
    })], sideId))[0];
    await mk([
      T(`${it.label} icon`, it.glyph, { size: s.iconSize, font: th.font }),
      T(`${it.label} text`, it.label, {
        size: s.textSize, style: s.textStyle,
        color: active ? th.c.activeFg : th.c.inactiveFg, font: th.font,
      }),
    ], linkId);
  }
  return sideId;
}

async function footer(parent, th, W, H) {
  const y = H - FOOT_H;
  await mk([R('footer rule', { w: W, h: 1, fill: th.c.border, x: 0, y })], parent);
  const f = (await mk([F('footer', {
    w: W, h: FOOT_H - 1, layout: 'vertical', gap: 4, pad: [24, 24, 24, 24],
    fill: th.c.surface, main: 'center', cross: 'center', x: 0, y: y + 1,
  })], parent))[0];
  await mk([
    T('footer copy', '© 2026 Planilha Eh Tudo. Simplificando suas finanças.', {
      size: th.key === 'beer' ? 12 : 14, color: th.c.faint, font: th.font,
    }),
    T('footer credit', 'Produzido por Eh!Tudo.app', {
      size: 12, color: th.c.faint, font: th.font,
    }),
  ], f);
}

/** chip identificando o framework no canto do frame */
async function themeChip(parent, th, x, y) {
  const row = (await mk([F('theme chip row', { layout: 'horizontal', gap: 8, x, y })], parent))[0];
  const c1 = (await mk([F('theme chip', {
    layout: 'horizontal', pad: [6, 12, 6, 12], fill: th.c.primary, radius: 999,
  })], row))[0];
  await mk([T('theme chip text', th.label, { size: 12, style: 'Bold', color: '#FFFFFF', font: th.font })], c1);
  const c2 = (await mk([F('theme chip 2', {
    layout: 'horizontal', pad: [6, 12, 6, 12], fill: th.c.surface, radius: 999,
  })], row))[0];
  await mk([T('theme chip 2 text', 'Planilha Eh Tudo', {
    size: 12, style: 'Bold', color: th.c.faint, font: th.font,
  })], c2);
}

// ================================================================== telas
async function screenDashboard(parent, th) {
  const c = th.c;
  const content = (await mk([F('content', {
    w: CONTENT_W, layout: 'vertical', gap: 32, fills: [], x: th.side.w + 40, y: th.nav.h + 40,
  })], parent))[0];

  // header
  const head = (await mk([F('header', { w: CONTENT_W, layout: 'vertical', gap: 8, fills: [] })], content))[0];
  await mk([
    T('h1', 'Bem-vindo ao seu Dashboard!', { size: th.ty.page, style: th.ty.pageStyle, color: c.heading, font: th.font }),
    T('subtitle', 'Aqui você pode visualizar resumos e inserir lançamentos de forma simples e rápida.',
      { size: th.key === 'beer' ? 14 : (th.key === 'bs' ? 18 : 18), color: c.muted, width: 760, font: th.font }),
  ], head);
  const acts = (await mk([F('header actions', { layout: 'horizontal', gap: 12 })], head))[0];
  await button(acts, 'btn atualizar', '🔄  Atualizar', th, 'outline');
  await button(acts, 'btn configurar', '⚙️  Configurar Integração', th, 'primary');

  // saldo e contas
  await mk([T('section title', 'Saldo e contas', { size: th.ty.section, style: th.ty.sectionStyle, color: c.heading, font: th.font })], content);
  const bal = (await mk([F('balance block', { w: CONTENT_W, layout: 'vertical', gap: 12, fills: [] })], content))[0];
  const balRow = (await mk([F('balance row', { layout: 'horizontal', gap: 16, cross: 'center' })], bal))[0];
  await mk([T('saldo', 'R$ 4.827,30', { size: th.key === 'beer' ? 34 : 32, style: 'Bold', color: c.heading, font: th.font })], balRow);
  await button(balRow, 'toggle contas', '👁️  Mostrar contas', th, 'ghost', { h: 32, padX: 4, radius: th.r.sm, size: 14, weight: 'Regular' });

  const accRow = (await mk([F('accounts row', { w: CONTENT_W, layout: 'horizontal', gap: 12 })], bal))[0];
  for (const [name, val] of [['Nubank', 'R$ 2.150,00'], ['Nuconta', 'R$ 1.200,00'], ['Carteira', 'R$ 477,30']]) {
    await accentCard(accRow, `account ${name}`, th, 392, 78, c.borderStrong, 'Nubank' === name ? c.borderStrong : c.borderStrong, name, val, false);
  }

  // detalhes orçamentos
  await mk([T('section title', 'Detalhes orçamentos', { size: th.ty.section, style: th.ty.sectionStyle, color: c.heading, font: th.font })], content);
  const bud = (await mk([F('budget block', { w: CONTENT_W, layout: 'vertical', gap: 12, fills: [] })], content))[0];
  const budRow = (await mk([F('budget row', { layout: 'horizontal', gap: 16, cross: 'center' })], bud))[0];
  await mk([T('gastos por contas', 'Gastos por contas', { size: th.ty.cardTitle, style: th.ty.cardTitleStyle, color: c.heading, font: th.font })], budRow);
  await mk([T('budget total', 'R$ 3.120,00', { size: 24, style: 'Bold', color: c.heading, font: th.font })], budRow);
  const budCards = (await mk([F('budget cards', { w: CONTENT_W, layout: 'horizontal', gap: 12 })], bud))[0];
  await accentCard(budCards, 'budget Nubank', th, 392, 78, c.primary, c.primary, 'Nubank', 'R$ 1.480,00', false);
  await accentCard(budCards, 'budget Cartao', th, 392, 78, c.expense, c.expense, 'Cartão de Crédito', 'R$ 980,00', false);
  await accentCard(budCards, 'budget Nuconta', th, 392, 78, c.success, c.success, 'Nuconta', 'R$ 660,00', false);

  // 2 colunas
  const two = (await mk([F('two column row', { w: CONTENT_W, layout: 'horizontal', gap: 24, cross: 'min' })], content))[0];
  const left = (await mk([F('left column', { w: 600, layout: 'vertical', gap: 16, fills: [] })], two))[0];
  for (const [name, date, val, accent, h, details] of [
    ['fc agosto', '31/08/2025', 'R$ 1.000,00', c.primary, 132, ['Receitas: R$ 3.200,00', 'Despesas: R$ 2.200,00']],
    ['fc setembro', '30/09/2025', 'R$ 1.450,00', c.expense, 104, null],
    ['fc outubro', '31/10/2025', 'R$ 980,00', c.success, 104, null],
  ]) {
    const { body } = await accentCard(left, name, th, 600, h, accent, accent, date, val, true, details);
    void body;
  }

  const right = (await mk([F('right column', { w: 576, layout: 'vertical', gap: 16, fills: [] })], two))[0];
  const chart = (await mk([F('chart card', {
    w: 576, layout: 'vertical', gap: 12, pad: 16, fill: th.c.surface,
    radius: th.r.xl, stroke: th.key === 'beer' ? undefined : c.border, strokeW: 1,
    effects: th.key === 'beer' ? [th.sh.soft] : [th.sh.soft],
  })], right))[0];
  await mk([T('chart title', 'Orçamento por categoria', { size: th.ty.cardTitle, style: th.ty.cardTitleStyle, color: c.heading, font: th.font })], chart);
  for (const [label, pct, col] of [
    ['Alimentação', 82, c.expense], ['Transporte', 64, c.warning], ['Moradia', 91, c.danger],
    ['Lazer', 43, c.primary], ['Saúde', 28, c.success],
  ]) {
    const row = (await mk([F(`bar row ${label}`, { w: 544, h: 18, layout: 'horizontal', gap: 8, cross: 'center' })], chart))[0];
    await mk([
      T(`bar label ${label}`, label, { size: 13, color: c.muted, width: 110, font: th.font }),
      F(`bar track ${label}`, { w: 374, h: 10, layout: 'horizontal', gap: 0, pad: 0, fill: c.surface3, radius: 5 }),
      T(`bar pct ${label}`, `${pct}%`, { size: 13, style: 'Bold', color: c.body, width: 44, align: 'right', font: th.font }),
    ], row);
    const track = (await fig.getNode(row, 2)).children[1].id;
    await mk([R(`bar ${label}`, { w: Math.max(30, Math.round(pct * 3.6)), h: 10, fill: col, radius: 5 })], track);
  }

  const top = (await mk([F('top categories card', {
    w: 576, layout: 'vertical', gap: 12, pad: 16, fill: th.c.surface,
    radius: th.r.xl, stroke: th.key === 'beer' ? undefined : c.border, strokeW: 1, effects: [th.sh.soft],
  })], right))[0];
  await mk([T('top title', 'Top 10 Gastos por categoria', { size: th.ty.cardTitle, style: th.ty.cardTitleStyle, color: c.heading, font: th.font })], top);
  for (const [rank, name, val] of [
    ['#1', 'Transporte', 'R$ -1.234,56'], ['#2', 'Alimentação', 'R$ -980,00'], ['#3', 'Moradia', 'R$ -876,40'],
  ]) {
    const r = (await mk([F(`top row ${rank}`, { w: 544, h: 32, layout: 'horizontal', gap: 12, cross: 'center' })], top))[0];
    const badge = (await mk([F(`rank badge ${rank}`, {
      w: 28, h: 28, layout: 'horizontal', pad: 0, fill: c.surface2, radius: th.r.md,
      main: 'center', cross: 'center',
    })], r))[0];
    await mk([T(`rank text ${rank}`, rank, { size: 13, style: 'Bold', color: c.muted, font: th.font })], badge);
    await mk([
      T(`top name ${rank}`, name, { size: 14, color: c.body, width: 300, font: th.font }),
      T(`top value ${rank}`, val, { size: 14, style: 'Bold', color: c.expense, width: 110, align: 'right', font: th.font }),
    ], r);
  }

  // FAB
  const fab = (await mk([F('fab', {
    w: th.fab.size, h: th.fab.size, layout: 'horizontal', pad: 0, fill: th.fab.bg,
    radius: th.fab.radius, main: 'center', cross: 'center', effects: [th.sh.fab],
    x: DESKTOP_W - 32 - th.fab.size, y: DESKTOP_H - FOOT_H - 24 - th.fab.size,
  })], parent))[0];
  await mk([T('fab plus', '+', { size: 30, style: 'Bold', color: th.fab.fg, font: th.font })], fab);
}

/** card com barra de acento colorida à esquerda */
async function accentCard(parent, name, th, w, h, barColor, accent, title, value, isFinancial, details) {
  const c = th.c;
  const outer = (await mk([F(name, {
    w, h, layout: 'horizontal', gap: 0, pad: 0, fill: barColor, radius: th.r.lg,
    // Beer (M3) usa elevação tonal, sem borda. Tailwind/Bootstrap usam borda:
    // no Bootstrap o body é branco e o card branco sumiria sem ela.
    stroke: th.key === 'beer' ? undefined : c.border, strokeW: 1,
  })], parent))[0];
  await mk([F(`${name} bar`, { w: 4, h, layout: 'vertical', sizingH: 'fixed', sizingV: 'fixed', fill: barColor })], outer);
  const body = (await mk([F(`${name} body`, {
    w: w - 4, h, layout: 'vertical', gap: 4,
    pad: isFinancial ? [12, 24, 12, 24] : [12, 16, 12, 16],
    fill: th.key === 'beer' ? c.surface : c.surface,
    sizingH: 'fixed', sizingV: 'fixed', cross: isFinancial ? 'center' : 'min',
  })], outer))[0];

  if (isFinancial) {
    await mk([
      T(`${name} date`, title, { size: 20, style: 'Semi Bold', color: c.body, align: 'center', font: th.font }),
      T(`${name} value`, value, { size: 24, style: 'Bold', color: c.body, align: 'center', font: th.font }),
    ], body);
    if (details) {
      for (const d of details) {
        await mk([T(`${name} ${d}`, d, { size: 13, color: c.muted, align: 'center', font: th.font })], body);
      }
    }
    await button(body, `${name} toggle`, 'Mostrar detalhes', th, 'ghost', {
      h: 24, padX: 8, radius: th.r.sm, size: 13, weight: 'Medium', fg: th.key === 'beer' ? c.primary : c.primary,
    });
  } else {
    await mk([
      T(`${name} title`, title, { size: 12, style: 'Bold', color: c.muted, ls: '6%', font: th.font }),
      T(`${name} value`, value, { size: 18, style: 'Bold', color: c.body, font: th.font }),
    ], body);
  }
  return { outer, body };
}

async function screenLancamentos(parent, th) {
  const c = th.c;
  const content = (await mk([F('content', {
    w: CONTENT_W, layout: 'vertical', gap: 24, fills: [], x: th.side.w + 40, y: th.nav.h + 40,
  })], parent))[0];

  const head = (await mk([F('header', { w: CONTENT_W, layout: 'vertical', gap: 8, fills: [] })], content))[0];
  await mk([
    T('h1', 'Lançamentos', { size: th.ty.page, style: th.ty.pageStyle, color: c.heading, font: th.font }),
    T('subtitle', 'Visualize e gerencie todos os seus lançamentos financeiros.', { size: th.ty.body, color: c.muted, font: th.font }),
  ], head);
  const acts = (await mk([F('header actions', { layout: 'horizontal', gap: 12 })], head))[0];
  await button(acts, 'btn atualizar', '🔄  Atualizar', th, 'outline');

  // busca
  const search = (await mk([F('search bar', {
    w: CONTENT_W, h: th.inp.h, layout: 'horizontal', gap: 8, pad: [0, th.inp.padX, 0, th.inp.padX],
    fill: th.c.surface, stroke: th.inp.bd, radius: th.inp.radius, cross: 'center',
  })], content))[0];
  await mk([
    T('search icon', '🔍', { size: 15, color: c.faint, font: th.font }),
    T('search placeholder', 'Pesquisar lançamentos por data, valor, descrição, categoria ou conta...',
      { size: th.inp.fs, color: c.ph, width: 1040, font: th.font }),
    T('search clear', '✕', { size: 15, color: c.faint, font: th.font }),
  ], search);

  // ordenação
  const sort = (await mk([F('sorting bar', {
    w: CONTENT_W, h: th.key === 'beer' ? 72 : 71, layout: 'horizontal', gap: 20,
    pad: [14, 16, 14, 16], fill: th.c.surface2, stroke: th.key === 'beer' ? undefined : c.border,
    radius: th.r.lg, cross: 'center',
  })], content))[0];
  await mk([T('sorting label', 'Ordenar por:', { size: th.ty.body, style: 'Semi Bold', color: c.heading, font: th.font })], sort);
  const select = (await mk([F('sorting select', {
    w: 210, h: th.inp.h, layout: 'horizontal', pad: [0, 12, 0, 12], fill: th.c.surface,
    stroke: th.inp.bd, radius: th.r.sm, cross: 'center',
  })], sort))[0];
  await mk([
    T('select value', 'Linhas da Planilha', { size: th.inp.fs, color: c.body, width: 148, font: th.font }),
    T('select chevron', '▾', { size: 12, color: c.muted, font: th.font }),
  ], select);

  const cb1 = (await mk([F('checkbox 1', { layout: 'horizontal', gap: 8, cross: 'center' })], sort))[0];
  const box1 = (await mk([F('box 1', {
    w: 20, h: 20, layout: 'horizontal', pad: 0, fill: c.primary, radius: th.r.sm,
    main: 'center', cross: 'center',
  })], cb1))[0];
  await mk([T('box 1 tick', '✓', { size: 13, style: 'Bold', color: '#FFFFFF', font: th.font })], box1);
  await mk([T('cb 1 label', 'Mostrar lançamentos consolidados', { size: th.ty.body, color: c.heading, font: th.font })], cb1);

  const cb2 = (await mk([F('checkbox 2', { layout: 'horizontal', gap: 8, cross: 'center' })], sort))[0];
  await mk([F('box 2', {
    w: 20, h: 20, layout: 'horizontal', pad: 0, fill: th.c.surface, stroke: th.inp.bd, radius: th.r.sm,
  })], cb2);
  await mk([T('cb 2 label', 'Mostrar lançamentos futuros', { size: th.ty.body, color: c.heading, font: th.font })], cb2);

  // tabela
  const table = (await mk([F('table', {
    w: CONTENT_W, layout: 'vertical', gap: 0, pad: 0, fill: th.c.surface,
    stroke: th.key === 'beer' ? undefined : c.border, radius: th.r.lg,
  })], content))[0];

  const COLS = [
    ['#', th.cols[0], 'left'], ['Data', th.cols[1], 'left'], ['Conta', th.cols[2], 'left'],
    ['Valor', th.cols[3], 'right'], ['Descrição', th.cols[4], 'left'],
    ['Categoria', th.cols[5], 'left'], ['Orçamento', th.cols[6], 'left'], ['Ações', th.cols[7], 'left'],
  ];

  const headRow = (await mk([F('table header', {
    w: CONTENT_W, h: th.key === 'beer' ? 48 : 44, layout: 'horizontal', gap: 0,
    pad: [12, 16, 12, 16], fill: th.key === 'beer' ? c.theadBg : c.theadBg, cross: 'center',
  })], table))[0];
  for (const [label, w, align] of COLS) {
    const cell = (await mk([F(`head cell ${label}`, {
      w, h: 20, layout: 'vertical', gap: 0, pad: [0, th.cellPad, 0, th.cellPad], fills: [], cross: 'min',
    })], headRow))[0];
    await mk([T(`head text ${label}`, th.ty.upper ? label.toUpperCase() : label, {
      size: th.headFs, style: 'Semi Bold', color: c.theadFg,
      ...(align === 'right' ? { width: w - th.cellPad * 2, align: 'right' } : {}), font: th.font,
    })], cell);
  }
  await mk([R('table head rule', { w: CONTENT_W, h: th.key === 'beer' ? 1 : 2, fill: th.key === 'beer' ? c.divider : '#E6E6E6' })], table);

  const ROWS = [
    ['3', '23/09/2025 15:02', 'NU PAGAMENTOS', '-R$ 250,00', 'expense', 'CLINICA FRANCO PEGHINI LTDA', 'Outros', '23/09/2025'],
    ['4', '22/09/2025 10:30', 'BANCO DO BRASIL', '-R$ 45,50', 'expense', 'SUPERMERCADO EXEMPLO', 'Alimentação', '22/09/2025'],
    ['5', '20/09/2025 09:15', 'NUBANK', 'R$ 3.200,00', 'income', 'SALARIO', 'Receita', '20/09/2025'],
    ['6', '18/09/2025 18:40', 'CARTEIRA', '-R$ 89,90', 'expense', 'PADARIA DO BAIRRO', 'Alimentação', '18/09/2025'],
    ['7', '15/09/2025 08:05', 'BANCO DO BRASIL', '-R$ 320,00', 'expense', 'CURSO ONLINE', 'Educação', '15/09/2025'],
    ['8', '12/09/2025 19:22', 'NUBANK', '-R$ 156,70', 'expense', 'POSTO SHELL BRASIL', 'Transporte', '12/09/2025'],
  ];

  for (const [idx, data, conta, valor, kind, desc, cat, orc] of ROWS) {
    const r = (await mk([F(`row ${idx}`, {
      w: CONTENT_W, h: th.rowH, layout: 'horizontal', gap: 0, pad: [12, 16, 12, 16],
      fill: th.c.surface, cross: 'center',
    })], table))[0];
    const cells = [
      [idx, th.cols[0], 'left', c.body, 'Regular'], [data, th.cols[1], 'left', c.body, 'Regular'],
      [conta, th.cols[2], 'left', c.body, 'Regular'],
      [valor, th.cols[3], 'right', kind === 'expense' ? c.expense : c.income, 'Semi Bold'],
      [desc, th.cols[4], 'left', c.body, 'Regular'], [cat, th.cols[5], 'left', c.body, 'Regular'],
      [orc, th.cols[6], 'left', c.body, 'Regular'],
    ];
    for (const [val, w, align, color, style] of cells) {
      const cell = (await mk([F(`cell ${idx} ${val}`, {
        w, h: 20, layout: 'vertical', gap: 0, pad: [0, th.cellPad, 0, th.cellPad], fills: [], cross: 'min',
      })], r))[0];
      await mk([T(`cell text ${idx} ${val}`, val, {
        size: th.cellFs, style, color,
        ...(align === 'right' ? { width: w - th.cellPad * 2, align: 'right' } : {}), font: th.font,
      })], cell);
    }
    const acts2 = (await mk([F(`actions ${idx}`, {
      w: th.cols[7], h: 32, layout: 'horizontal', gap: 8, pad: [0, th.cellPad, 0, th.cellPad],
      fills: [], main: 'max', cross: 'center',
    })], r))[0];
    const b1 = (await mk([F(`act edit ${idx}`, {
      w: 32, h: 32, layout: 'horizontal', pad: 0, fill: c.surface2, radius: th.r.md,
      main: 'center', cross: 'center',
    })], acts2))[0];
    await mk([T(`act edit glyph ${idx}`, '✎', { size: 16, color: c.primary, font: th.font })], b1);
    const b2 = (await mk([F(`act del ${idx}`, {
      w: 32, h: 32, layout: 'horizontal', pad: 0, fill: c.surface2, radius: th.r.md,
      main: 'center', cross: 'center',
    })], acts2))[0];
    await mk([T(`act del glyph ${idx}`, '🗑️', { size: 16, color: c.danger, font: th.font })], b2);
    await mk([R(`row rule ${idx}`, { w: CONTENT_W, h: 1, fill: th.key === 'beer' ? c.divider : c.rowRule })], table);
  }

  // FABs
  const fab = (await mk([F('fab', {
    w: th.fab.size, h: th.fab.size, layout: 'horizontal', pad: 0, fill: th.fab.bg,
    radius: th.fab.radius, main: 'center', cross: 'center', effects: [th.sh.fab],
    x: DESKTOP_W - 32 - th.fab.size, y: DESKTOP_H - FOOT_H - 24 - th.fab.size,
  })], parent))[0];
  await mk([T('fab plus', '+', { size: 30, style: 'Bold', color: th.fab.fg, font: th.font })], fab);

  const ffab = (await mk([F('filter fab', {
    w: th.fab.size, h: th.fab.size, layout: 'horizontal', pad: 0, fill: c.primary,
    radius: th.fab.radius, main: 'center', cross: 'center', effects: [th.sh.fab],
    x: DESKTOP_W - 32 - th.fab.size, y: DESKTOP_H - FOOT_H - 100 - th.fab.size,
  })], parent))[0];
  await mk([T('filter fab glyph', '🔽', { size: 22, color: '#FFFFFF', font: th.font })], ffab);
}

async function screenCategorias(parent, th) {
  const c = th.c;
  const content = (await mk([F('content', {
    w: CONTENT_W, layout: 'vertical', gap: 24, fills: [], x: th.side.w + 40, y: th.nav.h + 40,
  })], parent))[0];

  const head = (await mk([F('header', { w: CONTENT_W, layout: 'vertical', gap: 8, fills: [] })], content))[0];
  await mk([
    T('h1', 'Categorias', { size: th.ty.page, style: th.ty.pageStyle, color: c.heading, font: th.font }),
    T('subtitle', 'Gerencie as categorias dos seus lançamentos. Arraste para reordenar.', { size: th.ty.body, color: c.muted, font: th.font }),
  ], head);
  const acts = (await mk([F('header actions', { layout: 'horizontal', gap: 12 })], head))[0];
  await button(acts, 'btn atualizar', '🔄  Atualizar', th, 'outline');
  await button(acts, 'btn nova categoria', '➕  Nova Categoria', th, 'primary');

  const list = (await mk([F('categories list', { w: 800, layout: 'vertical', gap: 12, fills: [], cross: 'min' })], content))[0];

  for (const [cat, type, typeBg, typeFg, budget] of [
    ['Alimentação', 'PRECISO', '#FDECEA', '#C0392B', 'Limite: R$ 800,00'],
    ['Transporte', 'PRECISO', '#FDECEA', '#C0392B', 'Limite: R$ 500,00'],
    ['Moradia', 'PRECISO', '#FDECEA', '#C0392B', 'Limite: R$ 2.000,00'],
    ['Lazer', 'QUERO', '#E8F5E9', '#27AE60', 'Limite: R$ 300,00'],
    ['Saúde', 'QUERO', '#E8F5E9', '#27AE60', 'Limite: R$ 400,00'],
    // badges neutros/primários seguem o tema (PRECISO/QUERO são semântica fixa)
    ['Receitas', 'RENDA', th.c.surface2, th.c.muted, 'Sem limite'],
    ['Investimentos', 'INVESTIMENTOS', th.c.primarySoft, th.c.onPrimaryContainer || th.c.muted, 'Limite: R$ 1.000,00'],
  ]) {
    const row = (await mk([F(`cat ${cat}`, {
      w: 800, h: 64, layout: 'horizontal', gap: 12, pad: [12, 16, 12, 12],
      fill: th.c.surface, radius: th.r.lg, stroke: th.key === 'beer' ? undefined : c.border,
      strokeW: 1, effects: [th.sh.soft], cross: 'center',
    })], list))[0];
    const grip = (await mk([F(`${cat} grip`, {
      w: 24, h: 24, layout: 'horizontal', pad: 0, fill: c.primarySoft, radius: th.r.sm,
      main: 'center', cross: 'center',
    })], row))[0];
    await mk([T(`${cat} grip glyph`, '⠿', { size: 14, color: c.primary, font: th.font })], grip);
    await mk([T(`${cat} name`, cat, { size: th.key === 'bs' ? 16 : 16, color: c.body, font: th.font })], row);
    const badge = (await mk([F(`${cat} badge`, {
      layout: 'horizontal', pad: [4, 8, 4, 8], fill: typeBg, radius: th.key === 'bs' ? 4 : 12,
    })], row))[0];
    await mk([T(`${cat} badge text`, type, { size: 12, style: 'Bold', color: typeFg, font: th.font })], badge);
    await mk([T(`${cat} budget`, budget, { size: 14, color: c.muted, font: th.font })], row);
    const b1 = (await mk([F(`${cat} edit`, {
      w: 32, h: 32, layout: 'horizontal', pad: 0, fill: c.surface2, radius: th.r.md,
      main: 'center', cross: 'center',
    })], row))[0];
    await mk([T(`${cat} edit glyph`, '✎', { size: 16, color: c.primary, font: th.font })], b1);
    const b2 = (await mk([F(`${cat} del`, {
      w: 32, h: 32, layout: 'horizontal', pad: 0, fill: c.surface2, radius: th.r.md,
      main: 'center', cross: 'center',
    })], row))[0];
    await mk([T(`${cat} del glyph`, '🗑️', { size: 16, color: c.danger, font: th.font })], b2);
  }
}

async function screenConfig(parent, th) {
  const c = th.c;
  const content = (await mk([F('content', {
    w: CONTENT_W, layout: 'vertical', gap: 32, fills: [], cross: 'center',
    x: th.side.w + 40, y: th.nav.h + 60,
  })], parent))[0];

  await mk([
    T('h1', 'Configuração', { size: th.ty.page, style: th.ty.pageStyle, color: c.heading, align: 'center', width: CONTENT_W, font: th.font }),
    T('subtitle', 'Configure sua conta para integrar com o Google Drive e selecione sua planilha de controle financeiro.',
      { size: th.key === 'beer' ? 14 : 18, color: c.muted, align: 'center', width: 800, font: th.font }),
  ], content);

  const col = (await mk([F('config column', { w: 600, layout: 'vertical', gap: 32, fills: [], cross: 'center' })], content))[0];

  const c1 = (await mk([F('card google auth', {
    w: 600, layout: 'vertical', gap: 16, pad: 24, fill: th.key === 'beer' ? c.surface3 : th.c.surface,
    radius: th.r.xl, stroke: th.key === 'beer' ? undefined : c.border, strokeW: 1, effects: [th.sh.soft],
  })], col))[0];
  await mk([
    T('card1 title', 'Autorização Google Drive', { size: th.ty.cardTitle, style: th.ty.cardTitleStyle, color: c.heading, font: th.font }),
    T('card1 text', 'Autorize o acesso ao Google Drive para criar sua planilha de controle financeiro.',
      { size: th.key === 'beer' ? 14 : 16, color: c.muted, width: 552, font: th.font }),
  ], c1);
  await button(c1, 'btn autorizar', '🔑  Autorizar com Google', th, 'primary', { w: 552 });

  const c2 = (await mk([F('card planilha', {
    w: 600, layout: 'vertical', gap: 16, pad: 24, fill: th.key === 'beer' ? c.surface3 : th.c.surface,
    radius: th.r.xl, stroke: th.key === 'beer' ? undefined : c.border, strokeW: 1, effects: [th.sh.soft],
  })], col))[0];
  await mk([
    T('card2 title', 'Planilha', { size: th.ty.cardTitle, style: th.ty.cardTitleStyle, color: c.heading, font: th.font }),
    T('card2 name', 'Nenhuma planilha configurada', { size: 16, style: 'Bold', color: th.key === 'beer' ? c.danger : '#E74C3C', font: th.font }),
    T('card2 text', 'Autorize o Google Drive para gerenciar suas planilhas.', { size: th.key === 'beer' ? 14 : 16, color: c.muted, width: 552, font: th.font }),
  ], c2);
  await button(c2, 'btn criar planilha', '➕  Criar Nova Planilha', th, 'success', { w: 552 });
  await button(c2, 'btn carregar planilhas', '📋  Carregar Minhas Planilhas', th, 'outline', { w: 552 });
}

async function screenPwa(parent, th) {
  const c = th.c;
  const NAV_Y = PWA_H - 70;

  const sb = (await mk([F('status bar', {
    w: PWA_W, h: 28, layout: 'horizontal', pad: [0, 16, 0, 16], fill: c.bg,
    main: 'spaceBetween', cross: 'center', x: 0, y: 0,
  })], parent))[0];
  await mk([
    T('status time', '9:41', { size: 12, style: 'Bold', color: c.body, font: th.font }),
    T('status icons', '▮▮▮   5G   100%', { size: 11, style: 'Medium', color: c.body, font: th.font }),
  ], sb);

  const content = (await mk([F('pwa content', {
    w: PWA_W, layout: 'vertical', gap: 16, pad: [16, 16, 16, 16], fills: [], x: 0, y: 28,
  })], parent))[0];

  await mk([
    T('pwa title', 'Bem vindo ao nosso app!', { size: th.key === 'beer' ? 28 : (th.key === 'bs' ? 28 : 28), style: 'Bold', color: c.heading, font: th.font }),
    T('pwa desc', 'Essa é nossa extensão para celular onde é possível enviar comprovantes, incluir lançamentos em linguagem natural usando agentes de IA.',
      { size: th.key === 'beer' ? 14 : 16, color: c.muted, width: 380, font: th.font }),
  ], content);

  // card de conteúdo compartilhado
  const outer = (await mk([F('shared content card', {
    w: 380, h: 352, layout: 'horizontal', gap: 0, pad: 0, fill: c.primary, radius: th.r.lg,
    stroke: th.key === 'beer' ? undefined : c.border, strokeW: 1,
  })], content))[0];
  await mk([F('shared accent', { w: 5, h: 352, layout: 'vertical', sizingH: 'fixed', sizingV: 'fixed', fill: c.primary })], outer);
  const shared = (await mk([F('shared body', {
    w: 375, h: 352, layout: 'vertical', gap: 12, pad: 16, fill: th.c.surface,
    sizingH: 'fixed', sizingV: 'fixed',
  })], outer))[0];
  await mk([
    T('shared title', 'Conteúdo Compartilhado Recebido!', { size: 16, style: 'Bold', color: c.primary, font: th.font }),
    T('shared sub', 'Cartões Processados:', { size: 14, style: 'Bold', color: c.body, font: th.font }),
  ], shared);

  // cartão do lançamento
  const cartao = (await mk([F('cartao item', {
    w: 343, h: 260, layout: 'vertical', gap: 8, pad: 16, fill: th.c.surface,
    stroke: th.key === 'beer' ? undefined : c.border, radius: th.r.lg, effects: [th.sh.soft],
  })], shared))[0];
  const chHead = (await mk([F('cartao header', { w: 311, h: 21, layout: 'horizontal', gap: 8, cross: 'min' })], cartao))[0];
  await mk([
    T('cartao valor', '-R$ 45,50', { size: 20, style: 'Bold', color: c.danger, font: th.font }),
    T('cartao data', '22/09/2025 10:30', { size: 14, color: c.muted, width: 140, align: 'right', font: th.font }),
  ], chHead);
  await mk([R('cartao rule', { w: 311, h: 1, fill: th.key === 'beer' ? c.divider : c.border })], cartao);
  await mk([
    T('cartao descricao', 'SUPERMERCADO EXEMPLO', { size: 16, style: 'Bold', color: c.body, font: th.font }),
    T('cartao conta', 'BANCO DO BRASIL', { size: 14, style: 'Medium', color: c.muted, font: th.font }),
  ], cartao);
  const dets = (await mk([F('cartao details', { w: 311, h: 35, layout: 'horizontal', gap: 12 })], cartao))[0];
  const d1 = (await mk([F('cartao det 1', { w: 149, h: 35, layout: 'vertical', gap: 4, fills: [] })], dets))[0];
  await mk([
    T('det1 label', 'CATEGORIA', { size: 12, style: 'Bold', color: c.faint, ls: '6%', font: th.font }),
    T('det1 value', 'Alimentação', { size: 14, style: 'Medium', color: c.body, font: th.font }),
  ], d1);
  const d2 = (await mk([F('cartao det 2', { w: 149, h: 35, layout: 'vertical', gap: 4, fills: [] })], dets))[0];
  await mk([
    T('det2 label', 'ORÇAMENTO', { size: 12, style: 'Bold', color: c.faint, ls: '6%', font: th.font }),
    T('det2 value', '22/09/2025', { size: 14, style: 'Medium', color: c.body, font: th.font }),
  ], d2);
  const obs = (await mk([F('cartao observacao', {
    w: 311, h: 40, layout: 'horizontal', pad: 12, fill: c.surface2, radius: th.r.sm, cross: 'center',
  })], cartao))[0];
  await mk([T('obs text', 'Compra no supermercado — débito automático', { size: 14, color: c.muted, width: 287, font: th.font })], obs);
  await mk([R('cartao rule 2', { w: 311, h: 1, fill: th.key === 'beer' ? c.divider : c.border })], cartao);
  const cf = (await mk([F('cartao footer', { w: 311, h: 36, layout: 'horizontal', gap: 8, main: 'max' })], cartao))[0];
  await button(cf, 'cartao enviar', '✓  Enviar', th, 'success', { h: 36, padX: 20, radius: th.r.sm });

  // upload
  const up = (await mk([F('upload area', {
    w: 380, h: 311, layout: 'vertical', gap: 12, pad: 24, fill: th.c.surface,
    radius: th.r.lg, stroke: th.key === 'beer' ? undefined : c.border, strokeW: 1, effects: [th.sh.soft],
  })], content))[0];
  await mk([
    T('upload title', '📷  Enviar Comprovante', { size: 24, style: 'Bold', color: c.heading, font: th.font }),
    T('upload desc', 'Envie uma foto do comprovante ou use o chat para lançar em linguagem natural.',
      { size: 14, color: c.muted, width: 332, font: th.font }),
  ], up);
  const drop = (await mk([F('file selection', {
    w: 332, h: 174, layout: 'vertical', gap: 8, pad: [24, 16, 24, 16], fill: c.surface2,
    stroke: th.key === 'beer' ? undefined : c.border, radius: th.r.lg, cross: 'center',
  })], up))[0];
  await mk([
    T('upload icon', '📁', { size: 48, color: c.faint, align: 'center', width: 300, font: th.font }),
    T('upload hint', 'JPG, PNG, WEBP ou GIF até 10MB', { size: 14, color: c.muted, align: 'center', width: 300, font: th.font }),
  ], drop);
  await button(drop, 'select button', 'Selecionar Arquivo', th, 'primary', { w: 180, h: 44, radius: th.r.md });

  // instalar
  const inst = (await mk([F('install section', {
    w: 380, h: 122, layout: 'vertical', gap: 12, pad: 24, fill: th.c.surface,
    stroke: c.primary, strokeW: 2, radius: th.r.lg, cross: 'center', effects: [th.sh.soft],
  })], content))[0];
  await button(inst, 'install button', '📱  Instalar App', th, 'primary', { w: 200, h: 44, radius: th.r.md });
  await mk([T('install desc', 'Instale para compartilhar imagens diretamente!', { size: 14, color: c.muted, align: 'center', width: 332, font: th.font })], inst);

  // chat FAB — fica logo acima da bottom nav, sem cobrir o texto "Instale para…"
  const chat = (await mk([F('chat fab', {
    w: 56, h: 56, layout: 'horizontal', pad: 0, fill: th.key === 'beer' ? c.primarySoft : c.primary,
    radius: th.key === 'beer' ? 16 : 28, main: 'center', cross: 'center', effects: [th.sh.fab],
    x: 336, y: NAV_Y - 62,
  })], parent))[0];
  await mk([T('chat fab glyph', '💬', { size: 24, color: th.key === 'beer' ? c.primary : '#FFFFFF', font: th.font })], chat);

  // bottom nav
  await mk([R('bottom nav rule', { w: PWA_W, h: 1, fill: th.key === 'beer' ? c.divider : c.border, x: 0, y: NAV_Y })], parent);
  const nav = (await mk([F('bottom nav', {
    w: PWA_W, h: 70, layout: 'horizontal', gap: 8, pad: [8, 8, 8, 8], fill: th.c.surface,
    main: 'spaceEvenly', cross: 'center', x: 0, y: NAV_Y,
  })], parent))[0];
  for (let i = 0; i < NAV_ITEMS.length; i++) {
    const it = NAV_ITEMS[i];
    const active = i === 3;
    const link = (await mk([F(`pwa nav ${it.label}`, {
      w: 88, h: 56, layout: 'vertical', gap: 4, pad: [4, 4, 4, 4],
      fill: active ? (th.key === 'beer' ? c.secondarySoft : c.primarySoft) : undefined,
      radius: th.key === 'beer' ? 16 : 8, cross: 'center',
    })], nav))[0];
    await mk([
      T(`pwa nav icon ${it.label}`, it.glyph, { size: 22, align: 'center', width: 80, font: th.font }),
      T(`pwa nav text ${it.label}`, it.label, {
        size: 11, style: 'Medium', color: active ? (th.key === 'beer' ? c.onSecondaryContainer : c.primary) : c.muted,
        align: 'center', width: 80, font: th.font,
      }),
    ], link);
  }
}

// ================================================================== main
const SCREENS = [
  ['Dashboard', screenDashboard, 0],
  ['Lançamentos', screenLancamentos, 1],
  ['Categorias', screenCategorias, 2],
  ['Configurações', screenConfig, -1],
  ['PWA', screenPwa, 3],
];

async function main() {
  // FIGCRAFT_ONLY=beer rebuild só um tema (mantém a posição na grade).
  const ONLY = process.env.FIGCRAFT_ONLY || null;
  const ORDER = ['tw', 'bs', 'beer'];

  const doc = await fig.inspect(1);
  const tops = doc.pages[0].children || [];
  // só os frames de tema (— Tailwind v3 / — Bootstrap 5.3 / — Beer CSS 5).
  // NÃO casa com "— src", "— Celular", "— Tailwind" nem "— Bootstrap 5" (formulários).
  const stale = tops.filter((t) => {
    if (!/— (Tailwind v3|Bootstrap 5\.3|Beer CSS 5)$/.test(t.name)) return false;
    if (!ONLY) return true;
    return t.name.endsWith(THEMES[ONLY].label);
  });
  if (stale.length) {
    console.log('removendo frames anteriores:', stale.map((s) => s.name).join(' | '));
    await fig.runCommand('edit.delete', { ids: stale.map((s) => s.id) });
  }

  const OUT = 'D:/repos/edsonlcandido/ehtudoplanilha/design';
  const made = [];

  for (const themeKey of ORDER) {
    if (ONLY && themeKey !== ONLY) continue;
    const th = THEMES[themeKey];
    const row = ORDER.indexOf(themeKey);
    const y = 1400 + row * 1300;
    let col = 0;
    for (const [label, builder, activeIdx] of SCREENS) {
      const isPwa = label === 'PWA';
      const name = isPwa ? `PWA — ${th.label}` : `${label} — ${th.label}`;
      const root = (await mk([F(name, {
        w: isPwa ? PWA_W : DESKTOP_W, h: isPwa ? PWA_H : DESKTOP_H,
        fill: th.c.bg, x: 0, y: 0,
      })], null))[0];

      if (isPwa) {
        await builder(root, th);
      } else {
        await topNav(root, th, DESKTOP_W);
        await sideNav(root, th, activeIdx, th.nav.h, DESKTOP_H - th.nav.h - FOOT_H);
        await footer(root, th, DESKTOP_W, DESKTOP_H);
        await builder(root, th);
        await themeChip(root, th, th.side.w + 40, 12);
      }

      const x = col === 0 ? 0 : col * 1520;
      await fig.setProps([root], { x, y });
      made.push({ file: `${themeKey}-${label.toLowerCase().replace(/[^a-z]/g, '') || 'pwa'}`, id: root });
      console.log('  ✓', name);
      col++;
    }
  }

  await fig.saveFile(`${OUT}/planilha-ehtudo.figcraft`);
  console.log('salvo');

  for (const m of made) {
    await fig.runCommand('file.export', {
      ids: [m.id], format: 'png', scale: 2, path: `${OUT}/fw-${m.file}.png`,
    });
  }
  console.log('DONE —', made.length, 'frames');
  fig.close();
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
