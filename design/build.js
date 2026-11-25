'use strict';
/**
 * FigCraft prototype — "Planilha Eh Tudo"
 * 5 screens: Dashboard, Lançamentos, Categorias, Configurações (src, desktop)
 *            + PWA Home (mobile)
 *
 * Tokens derived from the live repo:
 *   src/css/base/variables.css  → primary #3498db, heading #2c3e50, success #28a745,
 *                                  danger #dc3545, income #4caf50, expense #e53935,
 *                                  bg #f8f9fa, border #ddd, text #333/#666/#888
 *   pwa/src/style.css            → #3B82F6 / #10B981 / #EF4444 / #F9FAFB / #1F2937 / #D1D5DB
 *                                  (unified here onto the src scale)
 *
 * ENGINE RULES LEARNED (FigCraft 0.4.x):
 *   - a `fill` child inside a `hug` parent collapses to 0 → every card uses
 *     explicit width/height instead of fill
 *   - a frame without `fills` is opaque white → always set fills: []
 *   - `strokeBottomWeight` still paints all 4 sides → borders are 1px rects
 */

const {
  createNode, batch, runCommand, saveFile, call,
} = require('C:/Users/edson/.minimax/agents/mavis/skills/figcraft-ui-prototyper/scripts/mcp-client.js');

const FONT = 'Roboto';

const C = {
  primary:   '#3498db',
  heading:   '#2c3e50',
  success:   '#28a745',
  danger:    '#dc3545',
  income:    '#4caf50',
  expense:   '#e53935',
  bg:        '#f8f9fa',
  bgAlt:     '#f5f5f5',
  card:      '#ffffff',
  border:    '#dddddd',
  borderAlt: '#dcdcdc',
  borderLt:  '#e0e0e0',
  line:      '#f0f0f0',
  text:      '#333333',
  muted:     '#666666',
  faint:     '#888888',
  faint2:    '#999999',
  warning:   '#ffc107',
};

const solid = (c) => [{ type: 'solid', color: c }];
const shCard = () => ({ type: 'dropShadow', color: '#00000014', offset: [0, 2], radius: 4, spread: 0 });
const shSoft = () => ({ type: 'dropShadow', color: '#0000000F', offset: [0, 1], radius: 6, spread: 0 });
const shBig  = () => ({ type: 'dropShadow', color: '#00000026', offset: [0, 4], radius: 20, spread: 0 });
const shFab  = () => ({ type: 'dropShadow', color: '#0000004D', offset: [0, 4], radius: 12, spread: 0 });

// ---------------------------------------------------------------- spec builders
function F(name, o = {}) {
  const props = {};
  props.fills = (o.fill === undefined || o.fill === 'none') ? [] : solid(o.fill);
  if (o.layout) {
    props.layout = o.layout;
    props.gap = o.gap || 0;
  }
  if (o.pad !== undefined) props.padding = o.pad;
  if (o.main) props.mainAlign = o.main;
  if (o.cross) props.crossAlign = o.cross;
  if (o.stroke) { props.strokes = solid(o.stroke); props.strokeWeight = o.strokeW || 1; }
  if (o.radius !== undefined) props.cornerRadius = o.radius;
  if (o.effects) props.effects = o.effects;
  props.sizingH = o.w !== undefined ? 'fixed' : (o.sizingH || (o.layout ? 'hug' : 'fill'));
  props.sizingV = o.h !== undefined ? 'fixed' : (o.sizingV || (o.layout ? 'hug' : 'fill'));

  const s = { type: 'frame', name, props };
  if (o.w !== undefined) s.width = o.w;
  if (o.h !== undefined) s.height = o.h;
  if (o.x !== undefined) s.x = o.x;
  if (o.y !== undefined) s.y = o.y;
  return s;
}

function T(name, str, o = {}) {
  const props = {
    fontFamily: FONT,
    fontSize: o.size || 16,
    fontStyle: o.style || 'Regular',
    fills: solid(o.color || C.text),
  };
  if (o.align) props.textAlign = o.align;
  if (o.width !== undefined) { props.textAutoResize = 'height'; props.width = o.width; }
  if (o.ls) props.letterSpacing = o.ls;
  return { type: 'text', name, text: str, props };
}

function R(name, o = {}) {
  const s = F(name, o);
  s.type = 'rectangle';
  return s;
}

async function mk(specs, parent) {
  const cmds = specs.map((s) => {
    const params = { type: s.type, name: s.name, props: s.props };
    if (s.text !== undefined) params.text = s.text;
    params.parent = s.parent !== undefined ? s.parent : parent;
    if (s.x !== undefined) params.x = s.x;
    if (s.y !== undefined) params.y = s.y;
    if (s.width !== undefined) params.width = s.width;
    if (s.height !== undefined) params.height = s.height;
    return { command: 'node.create', params };
  });
  const res = await batch(cmds);
  return (res || []).map((r) => (r && r.id !== undefined ? r.id : r));
}

// ---------------------------------------------------------------- components
async function button(name, label, o, parent) {
  const {
    bg = C.primary, fg = '#FFFFFF', h = 44, w, padX = 20, radius = 8,
    size = 14, style = 'Bold', border, fill,
  } = o;
  const id = (await mk([F(name, {
    w, h, layout: 'horizontal', gap: 8, pad: [0, padX, 0, padX],
    fill: fill !== undefined ? fill : bg,
    radius, main: 'center', cross: 'center', stroke: border,
  })], parent))[0];
  await mk([T(`${name} label`, label, { size, style, color: fg })], id);
  return id;
}

async function iconButton(name, glyph, o, parent) {
  const { size = 18, w = 40, h = 40, radius = 6, fill, color = C.text, border } = o;
  const id = (await mk([F(name, {
    w, h, layout: 'horizontal', pad: 0, fill, radius, main: 'center', cross: 'center', stroke: border,
  })], parent))[0];
  await mk([T(`${name} glyph`, glyph, { size, color })], id);
  return id;
}

async function field(name, label, placeholder, o, parent) {
  const { labelColor = C.heading, phColor = C.faint2, h = 44, w } = o;
  const specs = [];
  if (label) specs.push(T(`${name} label`, label, { size: 14, style: 'Bold', color: labelColor }));
  specs.push(F(`${name} input`, {
    w, h, layout: 'horizontal', pad: [0, 12, 0, 12], fill: C.card, stroke: C.borderAlt,
    radius: 4, main: 'center', cross: 'center',
  }));
  const boxId = (await mk(specs, parent))[specs.length - 1];
  await mk([T(`${name} ph`, placeholder, { size: 14, color: phColor })], boxId);
  return boxId;
}

// accent card: colored left border drawn as a bar + a white body (explicit sizes)
async function accentCard(parent, name, w, h, accent, pad, gap, cross) {
  const outer = (await mk([F(name, {
    w, h, layout: 'horizontal', gap: 0, pad: 0, fill: accent, radius: 8,
  })], parent))[0];
  await mk([F(`${name} bar`, {
    w: 4, h, layout: 'vertical', sizingH: 'fixed', sizingV: 'fixed', fill: accent,
  })], outer);
  const body = (await mk([F(`${name} body`, {
    w: w - 4, h, layout: 'vertical', gap: gap || 4, pad, fill: C.card,
    sizingH: 'fixed', sizingV: 'fixed', cross,
  })], outer))[0];
  return { outer, body };
}

// ---------------------------------------------------------------- src chrome
async function srcNav(parent, W) {
  const navId = (await mk([F('nav', {
    w: W, h: 53, layout: 'horizontal', pad: [0, 24, 0, 24], fill: C.card,
    main: 'spaceBetween', cross: 'center', x: 0, y: 0,
  })], parent))[0];

  await mk([T('brand', 'Planilha Eh Tudo', { size: 18, style: 'Bold', color: C.heading })], navId);

  const menuId = (await mk([F('user menu', {
    layout: 'horizontal', gap: 8, main: 'center', cross: 'center',
  })], navId))[0];
  const avId = (await mk([F('avatar', {
    w: 32, h: 32, layout: 'horizontal', pad: 0, fill: C.primary, radius: 16,
    main: 'center', cross: 'center',
  })], menuId))[0];
  await mk([T('avatar letter', 'E', { size: 14, style: 'Bold', color: '#FFFFFF' })], avId);
  await mk([T('user name', 'Edson', { size: 14, style: 'Medium', color: C.text })], menuId);
  await mk([T('chevron', '▾', { size: 13, color: C.faint2 })], menuId);
  return navId;
}

const NAV_ITEMS = [
  { glyph: '🏠', label: 'Dashboard' },
  { glyph: '📋', label: 'Lançamentos' },
  { glyph: '🏷️', label: 'Categorias' },
  { glyph: '📱', label: 'Celular' },
];

async function srcSidebar(parent, activeIdx, H) {
  const sideId = (await mk([F('sidebar', {
    w: 160, h: H, layout: 'vertical', gap: 16, pad: [16, 8, 16, 8], fill: C.card,
    x: 0, y: 53, effects: [{ type: 'dropShadow', color: '#0000001A', offset: [2, 0], radius: 4, spread: 0 }],
  })], parent))[0];

  for (let i = 0; i < NAV_ITEMS.length; i++) {
    const it = NAV_ITEMS[i];
    const active = i === activeIdx;
    const linkId = (await mk([F(`nav link ${it.label}`, {
      w: 144, h: 40, layout: 'horizontal', gap: 8, pad: [0, 8, 0, 8],
      fill: active ? C.primary : undefined, radius: 8, main: 'min', cross: 'center',
    })], sideId))[0];
    await mk([
      T(`${it.label} icon`, it.glyph, { size: 18 }),
      T(`${it.label} text`, it.label, { size: 14, style: 'Medium', color: active ? '#FFFFFF' : C.text }),
    ], linkId);
  }
  return sideId;
}

async function srcFooter(parent, W) {
  const ids = await mk([
    F('footer', {
      w: W, h: 79, layout: 'vertical', gap: 4, pad: [24, 24, 24, 24], fill: C.card,
      main: 'center', cross: 'center',
    }),
  ], parent);
  const footId = ids[0];
  await mk([
    T('footer copy', '© 2026 Planilha Eh Tudo. Simplificando suas finanças.', { size: 14, color: C.faint }),
    T('footer credit', 'Produzido por Eh!Tudo.app', { size: 12, color: C.faint2 }),
  ], footId);
  return footId;
}

/** place footer + resize root/sidebar once the content height is known */
async function finalize(rootId, sideId, contentId, W, fabIds, contentY = 93) {
  const c = await call('get_node', { id: contentId, depth: 1 });
  const ch = c.height || 800;
  const ruleY = contentY + ch + 24;
  const footY = ruleY + 1;

  const footId = await srcFooter(rootId, W);
  await call('set_properties', { ids: [footId], props: { x: 0, y: footY } });
  await mk([R('footer rule', { w: W, h: 1, fill: C.borderLt, x: 0, y: ruleY })], rootId);
  await call('set_properties', { ids: [rootId], props: { height: footY + 79 + 16 } });
  await call('set_properties', { ids: [sideId], props: { height: ruleY - 53 } });
  for (const [fid, dx, dy] of fabIds) {
    await call('set_properties', { ids: [fid], props: { x: W - 32 - 60 + dx, y: footY - 60 - 24 + dy } });
  }
  return ch;
}

// ---------------------------------------------------------------- main
async function main() {
  // wipe previous build
  const doc = await call('inspect_document', { depth: 1 });
  const tops = doc.pages[0].children || [];
  if (tops.length) {
    await runCommand({ command: 'edit.delete', params: { ids: tops.map((t) => t.id) } });
    console.log('cleared', tops.length, 'top-level frames');
  }

  const roots = {};

  // ================================================================ DASHBOARD
  {
    const W = 1440;
    const rootId = (await mk([F('Dashboard — src', { w: W, h: 1400, fill: C.bg })], null))[0];
    roots.dashboard = rootId;
    await srcNav(rootId, W);
    const sideId = await srcSidebar(rootId, 0, 900);

    const contentId = (await mk([F('content', {
      w: 1200, layout: 'vertical', gap: 32, pad: 0, fills: [], x: 200, y: 93,
    })], rootId))[0];

    // ---- header
    const headerId = (await mk([F('header', { layout: 'vertical', gap: 8, w: 1200, fills: [] })], contentId))[0];
    await mk([
      T('h1', 'Bem-vindo ao seu Dashboard!', { size: 28, style: 'Bold', color: C.heading }),
      T('subtitle', 'Aqui você pode visualizar resumos e inserir lançamentos de forma simples e rápida.',
        { size: 18, color: C.muted, width: 760 }),
    ], headerId);
    const actionsId = (await mk([F('header actions', { layout: 'horizontal', gap: 12 })], headerId))[0];
    await button('btn atualizar', '🔄  Atualizar', {
      bg: C.card, fg: C.text, border: C.border, style: 'Medium', padX: 20,
    }, actionsId);
    await button('btn configurar', '⚙️  Configurar Integração', {
      bg: C.primary, fg: '#FFFFFF', style: 'Bold', padX: 20,
    }, actionsId);

    // ---- saldo e contas
    await mk([T('section title', 'Saldo e contas', { size: 24, style: 'Bold', color: C.heading })], contentId);
    const balId = (await mk([F('balance block', { layout: 'vertical', gap: 12, w: 1200, fills: [] })], contentId))[0];
    const balRowId = (await mk([F('balance row', { layout: 'horizontal', gap: 16, cross: 'center' })], balId))[0];
    await mk([T('saldo', 'R$ 4.827,30', { size: 32, style: 'Bold', color: C.heading })], balRowId);
    await button('toggle contas', '👁️  Mostrar contas', {
      bg: 'none', fg: C.heading, style: 'Medium', padX: 4, h: 32, radius: 4,
    }, balRowId);

    const accRowId = (await mk([F('accounts row', { layout: 'horizontal', gap: 12, w: 1200 })], balId))[0];
    for (const [name, val] of [['Nubank', 'R$ 2.150,00'], ['Nuconta', 'R$ 1.200,00'], ['Carteira', 'R$ 477,30']]) {
      const { body } = await accentCard(accRowId, `account ${name}`, 392, 78, C.borderLt, [12, 16, 12, 16], 4);
      await mk([
        T(`${name} title`, name, { size: 13, style: 'Bold', color: C.muted, ls: '6%' }),
        T(`${name} value`, val, { size: 18, style: 'Bold', color: C.text }),
      ], body);
    }

    // ---- detalhes orçamentos
    await mk([T('section title', 'Detalhes orçamentos', { size: 24, style: 'Bold', color: C.heading })], contentId);
    const budId = (await mk([F('budget block', { layout: 'vertical', gap: 12, w: 1200, fills: [] })], contentId))[0];
    const budRowId = (await mk([F('budget row', { layout: 'horizontal', gap: 16, cross: 'center' })], budId))[0];
    await mk([T('gastos por contas', 'Gastos por contas', { size: 20, style: 'Semi Bold', color: C.heading })], budRowId);
    await mk([T('budget total', 'R$ 3.120,00', { size: 24, style: 'Bold', color: C.heading })], budRowId);
    const budCardsId = (await mk([F('budget cards', { layout: 'horizontal', gap: 12, w: 1200 })], budId))[0];
    for (const [name, val, accent] of [
      ['Nubank', 'R$ 1.480,00', C.primary],
      ['Cartão de Crédito', 'R$ 980,00', C.expense],
      ['Nuconta', 'R$ 660,00', C.success],
    ]) {
      const { body } = await accentCard(budCardsId, `budget ${name}`, 392, 78, accent, [12, 16, 12, 16], 4);
      await mk([
        T(`${name} title`, name, { size: 13, style: 'Bold', color: C.muted, ls: '6%' }),
        T(`${name} value`, val, { size: 18, style: 'Bold', color: C.text }),
      ], body);
    }

    // ---- two column row
    const twoColId = (await mk([F('two column row', { layout: 'horizontal', gap: 24, w: 1200, cross: 'min' })], contentId))[0];
    const leftId = (await mk([F('left column', { w: 600, layout: 'vertical', gap: 16, fills: [] })], twoColId))[0];
    for (const [name, date, val, accent, h, details] of [
      ['fc agosto', '31/08/2025', 'R$ 1.000,00', C.primary, 132, ['Receitas: R$ 3.200,00', 'Despesas: R$ 2.200,00']],
      ['fc setembro', '30/09/2025', 'R$ 1.450,00', C.expense, 104, null],
      ['fc outubro', '31/10/2025', 'R$ 980,00', C.success, 104, null],
    ]) {
      const { body } = await accentCard(leftId, name, 600, h, accent, [12, 24, 12, 24], 4, 'center');
      await mk([T(`${name} date`, date, { size: 20, style: 'Semi Bold', color: C.text, align: 'center' })], body);
      await mk([T(`${name} value`, val, { size: 24, style: 'Bold', color: C.text, align: 'center' })], body);
      if (details) {
        for (const d of details) {
          await mk([T(`${name} ${d}`, d, { size: 13, color: C.muted, align: 'center' })], body);
        }
      }
      await button(`${name} toggle`, 'Mostrar detalhes', {
        bg: 'none', fg: C.primary, style: 'Medium', size: 13, h: 24, padX: 8, radius: 4,
      }, body);
    }

    const rightId = (await mk([F('right column', { w: 576, layout: 'vertical', gap: 16, fills: [] })], twoColId))[0];
    // chart card
    const chartId = (await mk([F('chart card', {
      w: 576, layout: 'vertical', gap: 12, pad: 16, fill: C.card, radius: 8, effects: [shSoft()],
    })], rightId))[0];
    await mk([T('chart title', 'Orçamento por categoria', { size: 16, style: 'Bold', color: C.text })], chartId);
    for (const [label, pct, col] of [
      ['Alimentação', 82, C.expense], ['Transporte', 64, C.warning], ['Moradia', 91, C.danger],
      ['Lazer', 43, C.primary], ['Saúde', 28, C.success],
    ]) {
      const rowId = (await mk([F(`bar row ${label}`, {
        w: 544, h: 18, layout: 'horizontal', gap: 8, cross: 'center',
      })], chartId))[0];
      await mk([T(`bar label ${label}`, label, { size: 13, color: C.muted, width: 110 })], rowId);
      const trackId = (await mk([F(`bar track ${label}`, {
        w: 374, h: 10, layout: 'horizontal', gap: 0, pad: 0, fill: '#f0f0f0', radius: 5,
      })], rowId))[0];
      await mk([R(`bar ${label}`, { w: Math.max(30, Math.round(pct * 3.6)), h: 10, fill: col, radius: 5 })], trackId);
      await mk([T(`bar pct ${label}`, `${pct}%`, { size: 13, style: 'Bold', color: C.text, width: 44, align: 'right' })], rowId);
    }
    // top 10
    const topId = (await mk([F('top categories card', {
      w: 576, layout: 'vertical', gap: 12, pad: 16, fill: C.card, radius: 8, effects: [shSoft()],
    })], rightId))[0];
    await mk([T('top title', 'Top 10 Gastos por categoria', { size: 16, style: 'Bold', color: C.text })], topId);
    for (const [rank, name, val] of [
      ['#1', 'Transporte', 'R$ -1.234,56'], ['#2', 'Alimentação', 'R$ -980,00'], ['#3', 'Moradia', 'R$ -876,40'],
    ]) {
      const rId = (await mk([F(`top row ${rank}`, {
        w: 544, h: 28, layout: 'horizontal', gap: 12, cross: 'center',
      })], topId))[0];
      const badgeId = (await mk([F(`rank badge ${rank}`, {
        w: 28, h: 28, layout: 'horizontal', pad: 0, fill: C.bg, radius: 6, main: 'center', cross: 'center',
      })], rId))[0];
      await mk([T(`rank text ${rank}`, rank, { size: 13, style: 'Bold', color: C.muted })], badgeId);
      await mk([T(`top name ${rank}`, name, { size: 14, color: C.text, width: 300 })], rId);
      await mk([T(`top value ${rank}`, val, { size: 14, style: 'Bold', color: C.expense, width: 110, align: 'right' })], rId);
    }

    // FAB
    const fabId = (await mk([F('fab', {
      w: 60, h: 60, layout: 'horizontal', pad: 0, fill: C.success, radius: 30,
      main: 'center', cross: 'center', effects: [shFab()],
    })], rootId))[0];
    await mk([T('fab plus', '+', { size: 30, style: 'Bold', color: '#FFFFFF' })], fabId);

    await finalize(rootId, sideId, contentId, W, [[fabId, 0, 0]]);
    console.log('dashboard done');
  }

  // ================================================================ LANCAMENTOS
  {
    const W = 1440;
    const rootId = (await mk([F('Lançamentos — src', { w: W, h: 1400, fill: C.bg })], null))[0];
    roots.lancamentos = rootId;
    await srcNav(rootId, W);
    const sideId = await srcSidebar(rootId, 1, 900);

    const contentId = (await mk([F('content', {
      w: 1200, layout: 'vertical', gap: 24, pad: 0, fills: [], x: 200, y: 93,
    })], rootId))[0];

    const headerId = (await mk([F('header', { layout: 'vertical', gap: 8, w: 1200, fills: [] })], contentId))[0];
    await mk([
      T('h1', 'Lançamentos', { size: 28, style: 'Bold', color: C.heading }),
      T('subtitle', 'Visualize e gerencie todos os seus lançamentos financeiros.', { size: 16, color: C.muted }),
    ], headerId);
    const actionsId = (await mk([F('header actions', { layout: 'horizontal', gap: 12 })], headerId))[0];
    await button('btn atualizar', '🔄  Atualizar', {
      bg: C.card, fg: C.text, border: C.border, style: 'Medium', padX: 20,
    }, actionsId);

    // search
    const searchId = (await mk([F('search bar', {
      w: 1200, h: 48, layout: 'horizontal', gap: 8, pad: [0, 16, 0, 16], fill: C.card,
      stroke: C.borderAlt, radius: 8, cross: 'center',
    })], contentId))[0];
    await mk([
      T('search icon', '🔍', { size: 15, color: C.faint2 }),
      T('search placeholder', 'Pesquisar lançamentos por data, valor, descrição, categoria ou conta...',
        { size: 14, color: C.faint2, width: 1080 }),
      T('search clear', '✕', { size: 15, color: C.faint2 }),
    ], searchId);

    // sorting
    const sortId = (await mk([F('sorting bar', {
      w: 1200, h: 71, layout: 'horizontal', gap: 20, pad: [14, 16, 14, 16], fill: C.bg,
      stroke: C.borderLt, radius: 8, cross: 'center',
    })], contentId))[0];
    await mk([T('sorting label', 'Ordenar por:', { size: 14, style: 'Bold', color: C.heading })], sortId);
    const selectId = (await mk([F('sorting select', {
      w: 190, h: 42, layout: 'horizontal', pad: [0, 12, 0, 12], fill: C.card,
      stroke: C.borderAlt, radius: 6, cross: 'center',
    })], sortId))[0];
    await mk([
      T('select value', 'Linhas da Planilha', { size: 14, color: C.text, width: 130 }),
      T('select chevron', '▾', { size: 12, color: C.muted }),
    ], selectId);

    const cb1 = (await mk([F('checkbox 1', { layout: 'horizontal', gap: 8, cross: 'center' })], sortId))[0];
    const box1 = (await mk([F('box 1', {
      w: 20, h: 20, layout: 'horizontal', pad: 0, fill: C.primary, radius: 4, main: 'center', cross: 'center',
    })], cb1))[0];
    await mk([T('box 1 tick', '✓', { size: 13, style: 'Bold', color: '#FFFFFF' })], box1);
    await mk([T('cb 1 label', 'Mostrar lançamentos consolidados', { size: 14, color: C.heading })], cb1);

    const cb2 = (await mk([F('checkbox 2', { layout: 'horizontal', gap: 8, cross: 'center' })], sortId))[0];
    await mk([F('box 2', {
      w: 20, h: 20, layout: 'horizontal', pad: 0, fill: C.card, stroke: C.borderAlt, radius: 4,
    })], cb2);
    await mk([T('cb 2 label', 'Mostrar lançamentos futuros', { size: 14, color: C.heading })], cb2);

    // table
    const tableId = (await mk([F('table', {
      w: 1200, layout: 'vertical', gap: 0, pad: 0, fill: C.card, stroke: '#e6e6e6', radius: 8,
    })], contentId))[0];

    const COLS = [
      ['#', 50, 'left'], ['Data', 130, 'left'], ['Conta', 140, 'left'], ['Valor', 110, 'right'],
      ['Descrição', 378, 'left'], ['Categoria', 140, 'left'], ['Orçamento', 110, 'left'], ['Ações', 110, 'left'],
    ];

    const headId = (await mk([F('table header', {
      w: 1200, h: 44, layout: 'horizontal', gap: 0, pad: [12, 16, 12, 16], fill: C.bg, cross: 'center',
    })], tableId))[0];
    for (const [label, w, align] of COLS) {
      const cellId = (await mk([F(`head cell ${label}`, {
        w, h: 20, layout: 'vertical', gap: 0, pad: [0, 8, 0, 8], fills: [], cross: 'min',
      })], headId))[0];
      await mk([T(`head text ${label}`, label, {
        size: 13, style: 'Bold', color: C.muted, ls: '4%',
        ...(align === 'right' ? { width: w - 16, align: 'right' } : {}),
      })], cellId);
    }
    await mk([R('table head rule', { w: 1200, h: 2, fill: '#e6e6e6' })], tableId);

    const ROWS = [
      ['3', '23/09/2025 15:02', 'NU PAGAMENTOS', '-R$ 250,00', C.expense, 'CLINICA FRANCO PEGHINI LTDA', 'Outros', '23/09/2025'],
      ['4', '22/09/2025 10:30', 'BANCO DO BRASIL', '-R$ 45,50', C.expense, 'SUPERMERCADO EXEMPLO', 'Alimentação', '22/09/2025'],
      ['5', '20/09/2025 09:15', 'NUBANK', 'R$ 3.200,00', C.income, 'SALARIO', 'Receita', '20/09/2025'],
      ['6', '18/09/2025 18:40', 'CARTEIRA', '-R$ 89,90', C.expense, 'PADARIA DO BAIRRO', 'Alimentação', '18/09/2025'],
      ['7', '15/09/2025 08:05', 'BANCO DO BRASIL', '-R$ 320,00', C.expense, 'CURSO ONLINE', 'Educação', '15/09/2025'],
      ['8', '12/09/2025 19:22', 'NUBANK', '-R$ 156,70', C.expense, 'POSTO SHELL BRASIL', 'Transporte', '12/09/2025'],
    ];

    for (const [idx, data, conta, valor, vColor, desc, cat, orc] of ROWS) {
      const rId = (await mk([F(`row ${idx}`, {
        w: 1200, h: 52, layout: 'horizontal', gap: 0, pad: [12, 16, 12, 16], fill: C.card, cross: 'center',
      })], tableId))[0];
      const cells = [
        [idx, 50, 'left', C.text, 'Medium'], [data, 130, 'left', C.text, 'Regular'],
        [conta, 140, 'left', C.text, 'Regular'], [valor, 110, 'right', vColor, 'Bold'],
        [desc, 378, 'left', C.text, 'Regular'], [cat, 140, 'left', C.text, 'Regular'],
        [orc, 110, 'left', C.text, 'Regular'],
      ];
      for (const [val, w, align, color, style] of cells) {
        const cellId = (await mk([F(`cell ${idx} ${val}`, {
          w, h: 20, layout: 'vertical', gap: 0, pad: [0, 8, 0, 8], fills: [], cross: 'min',
        })], rId))[0];
        await mk([T(`cell text ${idx} ${val}`, val, {
          size: 14, style, color, ...(align === 'right' ? { width: w - 16, align: 'right' } : {}),
        })], cellId);
      }
      const actId = (await mk([F(`actions ${idx}`, {
        w: 110, h: 32, layout: 'horizontal', gap: 8, pad: [0, 8, 0, 8], fills: [], main: 'max', cross: 'center',
      })], rId))[0];
      await iconButton(`act edit ${idx}`, '✎', { w: 32, h: 32, fill: C.bg, color: C.primary }, actId);
      await iconButton(`act del ${idx}`, '🗑️', { w: 32, h: 32, fill: C.bg, color: C.danger }, actId);
      await mk([R(`row rule ${idx}`, { w: 1200, h: 1, fill: C.line })], tableId);
    }

    // FABs
    const fabId = (await mk([F('fab', {
      w: 60, h: 60, layout: 'horizontal', pad: 0, fill: C.success, radius: 30,
      main: 'center', cross: 'center', effects: [shFab()],
    })], rootId))[0];
    await mk([T('fab plus', '+', { size: 30, style: 'Bold', color: '#FFFFFF' })], fabId);
    const ffabId = (await mk([F('filter fab', {
      w: 60, h: 60, layout: 'horizontal', pad: 0, fill: C.primary, radius: 30,
      main: 'center', cross: 'center', effects: [shFab()],
    })], rootId))[0];
    await mk([T('filter fab glyph', '🔽', { size: 24, color: '#FFFFFF' })], ffabId);

    await finalize(rootId, sideId, contentId, W, [[fabId, 0, 0], [ffabId, 0, -76]]);
    console.log('lancamentos done');
  }

  // ================================================================ CATEGORIAS
  {
    const W = 1440;
    const rootId = (await mk([F('Categorias — src', { w: W, h: 1200, fill: C.bg })], null))[0];
    roots.categorias = rootId;
    await srcNav(rootId, W);
    const sideId = await srcSidebar(rootId, 2, 900);

    const contentId = (await mk([F('content', {
      w: 1200, layout: 'vertical', gap: 24, pad: 0, fills: [], x: 200, y: 93,
    })], rootId))[0];

    const headerId = (await mk([F('header', { layout: 'vertical', gap: 8, w: 1200, fills: [] })], contentId))[0];
    await mk([
      T('h1', 'Categorias', { size: 28, style: 'Bold', color: C.heading }),
      T('subtitle', 'Gerencie as categorias dos seus lançamentos. Arraste para reordenar.', { size: 16, color: C.muted }),
    ], headerId);
    const actionsId = (await mk([F('header actions', { layout: 'horizontal', gap: 12 })], headerId))[0];
    await button('btn atualizar', '🔄  Atualizar', {
      bg: C.card, fg: C.text, border: C.border, style: 'Medium', padX: 20,
    }, actionsId);
    await button('btn nova categoria', '➕  Nova Categoria', {
      bg: C.primary, fg: '#FFFFFF', style: 'Bold', padX: 20,
    }, actionsId);

    const listId = (await mk([F('categories list', {
      w: 800, layout: 'vertical', gap: 12, pad: 0, fills: [], cross: 'min',
    })], contentId))[0];

    for (const [cat, type, typeBg, typeFg, budget] of [
      ['Alimentação', 'PRECISO', '#fdecea', '#c0392b', 'Limite: R$ 800,00'],
      ['Transporte', 'PRECISO', '#fdecea', '#c0392b', 'Limite: R$ 500,00'],
      ['Moradia', 'PRECISO', '#fdecea', '#c0392b', 'Limite: R$ 2.000,00'],
      ['Lazer', 'QUERO', '#e8f5e9', '#27ae60', 'Limite: R$ 300,00'],
      ['Saúde', 'QUERO', '#e8f5e9', '#27ae60', 'Limite: R$ 400,00'],
      ['Receitas', 'RENDA', '#ecf0f1', '#7f8c8d', 'Sem limite'],
      ['Investimentos', 'INVESTIMENTOS', '#e3f2fd', '#0074d9', 'Limite: R$ 1.000,00'],
    ]) {
      const row = (await mk([F(`cat ${cat}`, {
        w: 800, h: 64, layout: 'horizontal', gap: 12, pad: [12, 16, 12, 12],
        fill: C.card, radius: 8, effects: [shSoft()], cross: 'center',
      })], listId))[0];
      const gripId = (await mk([F(`${cat} grip`, {
        w: 24, h: 24, layout: 'horizontal', pad: 0, fill: '#f0f6fc', radius: 4,
        main: 'center', cross: 'center',
      })], row))[0];
      await mk([T(`${cat} grip glyph`, '⠿', { size: 14, color: '#0074d9' })], gripId);
      await mk([T(`${cat} name`, cat, { size: 16, color: C.text })], row);
      const badgeId = (await mk([F(`${cat} badge`, {
        layout: 'horizontal', pad: [4, 8, 4, 8], fill: typeBg, radius: 12,
      })], row))[0];
      await mk([T(`${cat} badge text`, type, { size: 12, style: 'Bold', color: typeFg })], badgeId);
      await mk([T(`${cat} budget`, budget, { size: 14, color: C.muted })], row);
      await iconButton(`${cat} edit`, '✎', { w: 32, h: 32, fill: C.bg, color: C.primary }, row);
      await iconButton(`${cat} del`, '🗑️', { w: 32, h: 32, fill: C.bg, color: C.danger }, row);
    }

    await finalize(rootId, sideId, contentId, W, []);

    // ---- modal overlay
    const rootH = (await call('get_node', { id: rootId, depth: 1 })).height;
    const scrimId = (await mk([R('modal scrim', { w: W, h: rootH, fill: '#00000099', x: 0, y: 0 })], rootId))[0];
    await call('set_properties', { ids: [scrimId], props: { height: rootH } });
    const modalId = (await mk([F('categoria modal', {
      w: 450, layout: 'vertical', gap: 16, pad: 24, fill: C.card, radius: 12, effects: [shBig()],
    })], rootId))[0];
    await call('set_properties', { ids: [modalId], props: { x: 495, y: 240 } });
    await mk([T('modal title', 'Nova Categoria', { size: 20, style: 'Bold', color: C.heading })], modalId);
    await field(modalId, 'Nome da Categoria *', 'Ex: Alimentação, Transporte...', { w: 402 }, modalId);
    await field(modalId, 'Tipo', 'Digite ou selecione o tipo', { w: 402 }, modalId);
    const modalActionsId = (await mk([F('modal actions', { layout: 'horizontal', gap: 12, main: 'max' })], modalId))[0];
    await button('modal cancel', 'Cancelar', {
      bg: C.card, fg: C.text, border: C.border, style: 'Medium', padX: 20,
    }, modalActionsId);
    await button('modal save', 'Salvar', { bg: C.primary, fg: '#FFFFFF', style: 'Bold', padX: 24 }, modalActionsId);
    console.log('categorias done');
  }

  // ================================================================ CONFIGURACAO
  {
    const W = 1440;
    const rootId = (await mk([F('Configurações — src', { w: W, h: 1000, fill: C.bg })], null))[0];
    roots.configuracao = rootId;
    await srcNav(rootId, W);
    const sideId = await srcSidebar(rootId, -1, 900);

    const contentId = (await mk([F('content', {
      w: 1200, layout: 'vertical', gap: 32, pad: 0, fills: [], cross: 'center', x: 200, y: 120,
    })], rootId))[0];

    await mk([
      T('h1', 'Configuração', { size: 32, style: 'Bold', color: C.heading, align: 'center', width: 1200 }),
      T('subtitle', 'Configure sua conta para integrar com o Google Drive e selecione sua planilha de controle financeiro.',
        { size: 18, color: C.muted, align: 'center', width: 800 }),
    ], contentId);

    const colId = (await mk([F('config column', {
      w: 600, layout: 'vertical', gap: 32, pad: 0, fills: [], cross: 'center',
    })], contentId))[0];

    const c1 = (await mk([F('card google auth', {
      w: 600, layout: 'vertical', gap: 16, pad: 24, fill: C.card, radius: 12, effects: [shSoft()],
    })], colId))[0];
    await mk([
      T('card1 title', 'Autorização Google Drive', { size: 20, style: 'Bold', color: C.heading }),
      T('card1 text', 'Autorize o acesso ao Google Drive para criar sua planilha de controle financeiro.',
        { size: 16, color: C.muted, width: 552 }),
    ], c1);
    await button('btn autorizar', '🔑  Autorizar com Google', {
      bg: C.primary, fg: '#FFFFFF', style: 'Bold', size: 16, padX: 24, w: 552,
    }, c1);

    const c2 = (await mk([F('card planilha', {
      w: 600, layout: 'vertical', gap: 16, pad: 24, fill: C.card, radius: 12, effects: [shSoft()],
    })], colId))[0];
    await mk([
      T('card2 title', 'Planilha', { size: 20, style: 'Bold', color: C.heading }),
      T('card2 name', 'Nenhuma planilha configurada', { size: 16, style: 'Bold', color: '#e74c3c' }),
      T('card2 text', 'Autorize o Google Drive para gerenciar suas planilhas.', { size: 16, color: C.muted, width: 552 }),
    ], c2);
    await button('btn criar planilha', '➕  Criar Nova Planilha', {
      bg: C.success, fg: '#FFFFFF', style: 'Bold', size: 15, padX: 24, w: 552,
    }, c2);
    await button('btn carregar planilhas', '📋  Carregar Minhas Planilhas', {
      bg: C.card, fg: C.text, border: C.border, style: 'Medium', size: 15, padX: 24, w: 552,
    }, c2);

    await finalize(rootId, sideId, contentId, W, [], 120);
    console.log('configuracao done');
  }

  // ================================================================ PWA
  {
    const W = 412;
    const H = 1120;
    const NAV_Y = 1050;
    const rootId = (await mk([F('PWA — Celular', { w: W, h: H, fill: C.bg })], null))[0];
    roots.pwa = rootId;

    const sbId = (await mk([F('status bar', {
      w: W, h: 28, layout: 'horizontal', pad: [0, 16, 0, 16], fill: C.bg,
      main: 'spaceBetween', cross: 'center', x: 0, y: 0,
    })], rootId))[0];
    await mk([
      T('status time', '9:41', { size: 12, style: 'Bold', color: C.text }),
      T('status icons', '▮▮▮   5G   100%', { size: 11, style: 'Medium', color: C.text }),
    ], sbId);

    const contentId = (await mk([F('pwa content', {
      w: W, layout: 'vertical', gap: 16, pad: [16, 16, 16, 16], fills: [], x: 0, y: 28,
    })], rootId))[0];

    await mk([
      T('pwa title', 'Bem vindo ao nosso app!', { size: 28, style: 'Bold', color: C.heading }),
      T('pwa desc', 'Essa é nossa extensão para celular onde é possível enviar comprovantes, incluir lançamentos em linguagem natural usando agentes de IA.',
        { size: 16, color: C.muted, width: 380 }),
    ], contentId);

    // shared content card (blue left accent)
    const outer = (await mk([F('shared content card', {
      w: 380, h: 352, layout: 'horizontal', gap: 0, pad: 0, fill: C.primary, radius: 6,
    })], contentId))[0];
    await mk([F('shared accent', {
      w: 5, h: 352, layout: 'vertical', sizingH: 'fixed', sizingV: 'fixed', fill: C.primary,
    })], outer);
    const sharedBody = (await mk([F('shared body', {
      w: 375, h: 352, layout: 'vertical', gap: 12, pad: 16, fill: C.card,
      sizingH: 'fixed', sizingV: 'fixed',
    })], outer))[0];
    await mk([
      T('shared title', 'Conteúdo Compartilhado Recebido!', { size: 16, style: 'Bold', color: C.primary }),
      T('shared sub', 'Cartões Processados:', { size: 14, style: 'Bold', color: C.text }),
    ], sharedBody);

    // cartao item
    const cartaoId = (await mk([F('cartao item', {
      w: 343, h: 260, layout: 'vertical', gap: 8, pad: 16, fill: C.card, stroke: C.border,
      radius: 8, effects: [shSoft()],
    })], sharedBody))[0];
    const chHeadId = (await mk([F('cartao header', { w: 311, h: 21, layout: 'horizontal', gap: 8, cross: 'min' })], cartaoId))[0];
    await mk([
      T('cartao valor', '-R$ 45,50', { size: 20, style: 'Bold', color: C.danger }),
      T('cartao data', '22/09/2025 10:30', { size: 14, color: C.muted, width: 140, align: 'right' }),
    ], chHeadId);
    await mk([R('cartao rule', { w: 311, h: 1, fill: C.border })], cartaoId);
    await mk([
      T('cartao descricao', 'SUPERMERCADO EXEMPLO', { size: 16, style: 'Bold', color: C.text }),
      T('cartao conta', 'BANCO DO BRASIL', { size: 14, style: 'Medium', color: C.muted }),
    ], cartaoId);
    const cdetId = (await mk([F('cartao details', { w: 311, h: 35, layout: 'horizontal', gap: 12 })], cartaoId))[0];
    const d1 = (await mk([F('cartao det 1', { w: 149, h: 35, layout: 'vertical', gap: 4, fills: [] })], cdetId))[0];
    await mk([
      T('det1 label', 'CATEGORIA', { size: 12, style: 'Bold', color: C.faint, ls: '6%' }),
      T('det1 value', 'Alimentação', { size: 14, style: 'Medium', color: C.text }),
    ], d1);
    const d2 = (await mk([F('cartao det 2', { w: 149, h: 35, layout: 'vertical', gap: 4, fills: [] })], cdetId))[0];
    await mk([
      T('det2 label', 'ORÇAMENTO', { size: 12, style: 'Bold', color: C.faint, ls: '6%' }),
      T('det2 value', '22/09/2025', { size: 14, style: 'Medium', color: C.text }),
    ], d2);
    const obsId = (await mk([F('cartao observacao', {
      w: 311, h: 40, layout: 'horizontal', pad: 12, fill: C.bg, radius: 4, cross: 'center',
    })], cartaoId))[0];
    await mk([T('obs text', 'Compra no supermercado — débito automático', { size: 14, color: C.muted, width: 287 })], obsId);
    await mk([R('cartao rule 2', { w: 311, h: 1, fill: C.border })], cartaoId);
    const cfootId = (await mk([F('cartao footer', { w: 311, h: 36, layout: 'horizontal', gap: 8, main: 'max' })], cartaoId))[0];
    await button('cartao enviar', '✓  Enviar', {
      bg: C.success, fg: '#FFFFFF', style: 'Bold', padX: 20, h: 36, radius: 4,
    }, cfootId);

    // upload area
    const upId = (await mk([F('upload area', {
      w: 380, h: 311, layout: 'vertical', gap: 12, pad: 24, fill: C.card, radius: 8, effects: [shSoft()],
    })], contentId))[0];
    await mk([
      T('upload title', '📷  Enviar Comprovante', { size: 24, style: 'Bold', color: C.heading }),
      T('upload desc', 'Envie uma foto do comprovante ou use o chat para lançar em linguagem natural.',
        { size: 14, color: C.muted, width: 332 }),
    ], upId);
    const dropId = (await mk([F('file selection', {
      w: 332, h: 174, layout: 'vertical', gap: 8, pad: [24, 16, 24, 16], fill: C.bg,
      stroke: C.border, radius: 8, cross: 'center',
    })], upId))[0];
    await mk([
      T('upload icon', '📁', { size: 48, color: C.faint2, align: 'center', width: 300 }),
      T('upload hint', 'JPG, PNG, WEBP ou GIF até 10MB', { size: 14, color: C.muted, align: 'center', width: 300 }),
    ], dropId);
    const selBtn = (await mk([F('select button', {
      w: 180, h: 44, layout: 'horizontal', pad: [0, 24, 0, 24], fill: C.primary,
      radius: 4, main: 'center', cross: 'center',
    })], dropId))[0];
    await mk([T('select button label', 'Selecionar Arquivo', { size: 14, style: 'Bold', color: '#FFFFFF' })], selBtn);

    // install section
    const instId = (await mk([F('install section', {
      w: 380, h: 122, layout: 'vertical', gap: 12, pad: 24, fill: C.card, stroke: C.primary,
      strokeW: 2, radius: 8, cross: 'center', effects: [shSoft()],
    })], contentId))[0];
    const instBtn = (await mk([F('install button', {
      w: 200, h: 44, layout: 'horizontal', pad: [0, 24, 0, 24], fill: C.primary,
      radius: 6, main: 'center', cross: 'center',
    })], instId))[0];
    await mk([T('install button label', '📱  Instalar App', { size: 16, style: 'Bold', color: '#FFFFFF' })], instBtn);
    await mk([T('install desc', 'Instale para compartilhar imagens diretamente!', { size: 14, color: C.muted, align: 'center', width: 332 })], instId);

    // chat FAB
    const chatId = (await mk([F('chat fab', {
      w: 56, h: 56, layout: 'horizontal', pad: 0, fill: C.primary, radius: 28,
      main: 'center', cross: 'center', effects: [shFab()], x: 336, y: NAV_Y - 78,
    })], rootId))[0];
    await mk([T('chat fab glyph', '💬', { size: 24, color: '#FFFFFF' })], chatId);

    // bottom nav
    const navId = (await mk([F('bottom nav', {
      w: W, h: 70, layout: 'horizontal', gap: 8, pad: [8, 8, 8, 8], fill: C.card,
      main: 'spaceEvenly', cross: 'center', x: 0, y: NAV_Y,
    })], rootId))[0];
    await mk([R('bottom nav rule', { w: W, h: 1, fill: C.border, x: 0, y: NAV_Y })], rootId);

    for (let i = 0; i < NAV_ITEMS.length; i++) {
      const it = NAV_ITEMS[i];
      const active = i === 3;
      const linkId = (await mk([F(`pwa nav ${it.label}`, {
        w: 88, h: 56, layout: 'vertical', gap: 4, pad: [4, 4, 4, 4],
        fill: active ? '#3498db14' : undefined, radius: 8, cross: 'center',
      })], navId))[0];
      await mk([
        T(`pwa nav icon ${it.label}`, it.glyph, { size: 22, align: 'center', width: 80 }),
        T(`pwa nav text ${it.label}`, it.label, { size: 11, style: 'Medium', color: active ? C.primary : C.muted, align: 'center', width: 80 }),
      ], linkId);
    }
    console.log('pwa done');
  }

  // ---- position the frames on the page
  const XS = { dashboard: 0, lancamentos: 1520, categorias: 3040, configuracao: 4560, pwa: 6080 };
  for (const [k, id] of Object.entries(roots)) {
    await call('set_properties', { ids: [id], props: { x: XS[k], y: 0 } });
  }

  const OUT = 'D:/repos/edsonlcandido/ehtudoplanilha/design';
  await saveFile({ path: `${OUT}/planilha-ehtudo.figcraft` });

  for (const [file, key] of [
    ['dashboard', 'dashboard'], ['lancamentos', 'lancamentos'], ['categorias', 'categorias'],
    ['configuracao', 'configuracao'], ['pwa', 'pwa'],
  ]) {
    await runCommand({
      command: 'file.export',
      params: { ids: [roots[key]], format: 'png', scale: 2, path: `${OUT}/${file}.png` },
    });
    console.log('exported', file);
  }
  console.log('DONE');
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
