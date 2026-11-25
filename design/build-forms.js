'use strict';
/**
 * FigCraft — FORMULÁRIOS DE LANÇAMENTO em Tailwind e Bootstrap 5.
 *
 * Mantém os 5 frames já existentes (Dashboard, Lançamentos, Categorias,
 * Configurações, PWA) e adiciona 4 frames de comparação:
 *   1. Formulário de Lançamento — Tailwind      (desktop, 1440×1024)
 *   2. Formulário de Lançamento — Bootstrap 5   (desktop, 1440×1024)
 *   3. Formulário de Lançamento PWA — Tailwind  (412×1020)
 *   4. Formulário de Lançamento PWA — Bootstrap 5 (412×1020)
 *
 * Campos faithful a src/components/entry-modal.ts e pwa/src/components/EntryModal.vue:
 *   Data · Conta · Valor (toggle de sinal) · Descrição · Categoria · Orçamento (data-chave)
 *   PWA acrescenta: Observação (textarea)
 *   Ações: Limpar / Salvar (desktop) · Cancelar / Salvar (PWA)
 */

const {
  createNode, batch, runCommand, saveFile, call,
} = require('C:/Users/edson/.minimax/agents/mavis/skills/figcraft-ui-prototyper/scripts/mcp-client.js');

const solid = (c) => [{ type: 'solid', color: c }];

// ------------------------------------------------------------------ tokens
const TW = {
  primary:   '#2563EB',   // blue-600
  page:      '#F3F4F6',   // gray-100
  dim:       '#E5E7EB',   // gray-200
  g100:      '#F3F4F6',
  g300:      '#D1D5DB',
  g400:      '#9CA3AF',
  g500:      '#6B7280',
  g700:      '#374151',
  g900:      '#111827',
  green:     '#16A34A',   // green-600
  amber:     '#F59E0B',   // amber-500
  white:     '#FFFFFF',
  font:      'Inter',
};

const BS = {
  primary:    '#0D6EFD',
  secondary:  '#6C757D',
  success:    '#198754',
  successDk:  '#146C43',
  warning:    '#FFC107',
  body:       '#212529',
  softBg:     '#F8F9FA',
  border:     '#DEE2E6',
  inputBd:    '#CED4DA',
  muted:      '#6C757D',
  dim:        '#E9ECEF',
  white:      '#FFFFFF',
  font:       'Roboto',
};

// ------------------------------------------------------------------ builders
function F(name, o = {}) {
  const props = {};
  props.fills = (o.fill === undefined || o.fill === 'none') ? [] : solid(o.fill);
  if (o.layout) { props.layout = o.layout; props.gap = o.gap || 0; }
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
    fontFamily: o.font || 'Inter',
    fontSize: o.size || 16,
    fontStyle: o.style || 'Regular',
    fills: solid(o.color || '#111827'),
  };
  if (o.align) props.textAlign = o.align;
  if (o.width !== undefined) { props.textAutoResize = 'height'; props.width = o.width; }
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

// ------------------------------------------------------------------ campos
/**
 * label + input empacotados num wrapper (gap interno 6/8px),
 * para o gap do formulário ficar só ENTRE os campos.
 */
async function field(parent, name, label, value, o) {
  const { fw, ih, fs, lh, lblColor, txtColor, phColor, radius, bd, font, labelStyle, labelGap } = o;
  const wrapId = (await mk([F(`${name} group`, {
    w: fw, layout: 'vertical', gap: labelGap, fills: [],
  })], parent))[0];
  await mk([T(`${name} label`, label, { size: lh, style: labelStyle || 'Medium', color: lblColor, font })], wrapId);
  const boxId = (await mk([F(`${name} input`, {
    w: fw, h: ih, layout: 'horizontal', pad: [0, 12, 0, 12], fill: '#FFFFFF',
    stroke: bd, radius, cross: 'center',
  })], wrapId))[0];
  await mk([T(`${name} value`, value, { size: fs, color: value ? txtColor : phColor, font })], boxId);
  return wrapId;
}

async function textareaField(parent, name, label, ph, o) {
  const { fw, h, fs, lh, lblColor, phColor, radius, bd, font, labelStyle, labelGap } = o;
  const wrapId = (await mk([F(`${name} group`, {
    w: fw, layout: 'vertical', gap: labelGap, fills: [],
  })], parent))[0];
  await mk([T(`${name} label`, label, { size: lh, style: labelStyle || 'Medium', color: lblColor, font })], wrapId);
  const boxId = (await mk([F(`${name} area`, {
    w: fw, h, layout: 'vertical', pad: 10, fill: '#FFFFFF', stroke: bd, radius,
  })], wrapId))[0];
  await mk([T(`${name} ph`, ph, { size: fs, color: phColor, font, width: fw - 22 })], boxId);
  return wrapId;
}

/** input group: botão de sinal + campo */
async function valueGroup(parent, name, o) {
  const { fw, ih, fs, lh, lblColor, bd, font, sign, signBg, signColor, radius, labelGap } = o;
  const wrapId = (await mk([F(`${name} group`, {
    w: fw, layout: 'vertical', gap: labelGap, fills: [],
  })], parent))[0];
  await mk([T(`${name} label`, 'Valor', { size: lh, style: 'Medium', color: lblColor, font })], wrapId);
  const grpId = (await mk([F(`${name} input group`, { w: fw, h: ih, layout: 'horizontal', gap: 0 })], wrapId))[0];
  const parts = await mk([
    F(`${name} toggle`, {
      w: 42, h: ih, layout: 'horizontal', pad: 0, fill: signBg, stroke: bd, radius,
      main: 'center', cross: 'center',
    }),
    F(`${name} input`, {
      w: fw - 42, h: ih, layout: 'horizontal', pad: [0, 12, 0, 12], fill: '#FFFFFF',
      stroke: bd, radius, cross: 'center',
    }),
  ], grpId);
  await mk([T(`${name} sign`, sign, { size: 16, style: 'Bold', color: signColor, font })], parts[0]);
  await mk([T(`${name} value`, '0,00', { size: fs, color: o.phColor || '#9CA3AF', font })], parts[1]);
  return wrapId;
}

// ------------------------------------------------------------------ botões
async function button(parent, name, label, o) {
  const { bg, fg, bd, w, h, radius, size, weight, font } = o;
  const id = (await mk([F(name, {
    w, h, layout: 'horizontal', pad: [0, 16, 0, 16], fill: bg, stroke: bd, radius,
    main: 'center', cross: 'center',
  })], parent))[0];
  await mk([T(`${name} label`, label, { size, style: weight, color: fg, font })], id);
  return id;
}

async function chip(parent, name, text, o) {
  const { bg, fg, font } = o;
  const id = (await mk([F(name, {
    layout: 'horizontal', pad: [6, 12, 6, 12], fill: bg, radius: 999,
  })], parent))[0];
  await mk([T(`${name} text`, text, { size: 12, style: 'Bold', color: fg, font })], id);
  return id;
}

/** título + botão X (spaceBetween) */
async function header(parent, name, title, o) {
  const { w, h, pad, size, color, font, titleStyle, closeSize, closeColor, closeW, closeH } = o;
  const headId = (await mk([F(name, {
    w, h, layout: 'horizontal', gap: 12, pad, fill: o.fill || '#FFFFFF',
    main: 'spaceBetween', cross: 'center',
  })], parent))[0];
  await mk([T(`${name} title`, title, { size, style: titleStyle, color, font })], headId);
  const closeId = (await mk([F(`${name} close`, {
    w: closeW, h: closeH, layout: 'horizontal', pad: 0, fill: o.fill || '#FFFFFF', radius: closeSize,
    main: 'center', cross: 'center',
  })], headId))[0];
  await mk([T(`${name} close glyph`, '×', { size: closeSize === 999 ? 22 : 20, color: closeColor, font })], closeId);
  return headId;
}

// ------------------------------------------------------------------ main
async function main() {
  const doc = await call('inspect_document', { depth: 1 });
  const tops = doc.pages[0].children || [];
  console.log('frames existentes:', tops.map((t) => t.name).join(' | '));

  const stale = tops.filter((t) => /Formulário/.test(t.name));
  if (stale.length) {
    await runCommand({ command: 'edit.delete', params: { ids: stale.map((s) => s.id) } });
    console.log('removidos frames anteriores:', stale.map((s) => s.name).join(', '));
  }

  const made = {};

  // ====================================================== TAILWIND — DESKTOP
  {
    const W = 1440, H = 1024;
    const CW = 520, PAD = 24, INNER = CW - PAD * 2;   // 472
    const rootId = (await mk([F('Formulário de Lançamento — Tailwind', { w: W, h: H, fill: TW.dim })], null))[0];
    made.twDesktop = rootId;

    const chipRow = (await mk([F('chip row', { layout: 'horizontal', gap: 8, x: 24, y: 24 })], rootId))[0];
    await chip(chipRow, 'fw chip', 'Tailwind v3', { bg: TW.primary, fg: TW.white, font: TW.font });
    await chip(chipRow, 'fw chip 2', 'desktop · modal', { bg: TW.white, fg: TW.g500, font: TW.font });

    const CARD_H = 608;
    const cardId = (await mk([F('modal card', {
      w: CW, h: CARD_H, layout: 'vertical', gap: 20, pad: PAD, fill: TW.white, radius: 16,
      effects: [{ type: 'dropShadow', color: '#0000001F', offset: [0, 20], radius: 25, spread: -5 }],
      x: (W - CW) / 2, y: (H - CARD_H) / 2,
    })], rootId))[0];

    await header(cardId, 'modal header', 'Lançamento de Despesa/Receita', {
      w: INNER, h: 28, pad: [0, 0, 0, 0], size: 20, color: TW.g900, font: TW.font,
      titleStyle: 'Bold', closeSize: 999, closeColor: TW.g400, closeW: 32, closeH: 32,
    });

    const formId = (await mk([F('form', { w: INNER, layout: 'vertical', gap: 16, fills: [] })], cardId))[0];
    const base = {
      fw: INNER, ih: 38, fs: 14, lh: 14, lblColor: TW.g700, txtColor: TW.g900, phColor: TW.g400,
      radius: 6, bd: TW.g300, font: TW.font, labelStyle: 'Medium', labelGap: 6,
    };
    await field(formId, 'f data', 'Data', '23/09/2025 15:02', base);
    await field(formId, 'f conta', 'Conta', 'Ex: Conta Corrente', base);
    await valueGroup(formId, 'f valor', {
      fw: INNER, ih: 38, fs: 14, lh: 14, lblColor: TW.g700, bd: TW.g300, font: TW.font,
      sign: '−', signBg: TW.g100, signColor: TW.g500, radius: 6, labelGap: 6, phColor: TW.g400,
    });
    await field(formId, 'f descricao', 'Descrição', 'Descrição da despesa', base);
    await field(formId, 'f categoria', 'Categoria', 'Digite uma categoria', base);
    await field(formId, 'f orcamento', 'Orçamento (data-chave)', '23/09/2025', base);

    const actId = (await mk([F('form actions', { w: INNER, h: 40, layout: 'horizontal', gap: 12, main: 'max' })], cardId))[0];
    await button(actId, 'btn limpar', 'Limpar', {
      bg: TW.amber, fg: TW.white, w: 96, h: 40, radius: 6, size: 14, weight: 'Medium', font: TW.font,
    });
    await button(actId, 'btn salvar', 'Salvar', {
      bg: TW.green, fg: TW.white, w: 104, h: 40, radius: 6, size: 14, weight: 'Medium', font: TW.font,
    });
    console.log('tailwind desktop ok');
  }

  // ====================================================== BOOTSTRAP — DESKTOP
  {
    const W = 1440, H = 1024;
    const CW = 540, PADX = 24;
    const rootId = (await mk([F('Formulário de Lançamento — Bootstrap 5', { w: W, h: H, fill: BS.dim })], null))[0];
    made.bsDesktop = rootId;

    const chipRow = (await mk([F('chip row', { layout: 'horizontal', gap: 8, x: 24, y: 24 })], rootId))[0];
    await chip(chipRow, 'fw chip', 'Bootstrap 5.3', { bg: BS.primary, fg: BS.white, font: BS.font });
    await chip(chipRow, 'fw chip 2', 'desktop · modal', { bg: BS.white, fg: BS.muted, font: BS.font });

    const BODY_H = 540;
    const CARD_H = 58 + 1 + BODY_H + 1 + 71;
    const cardId = (await mk([F('modal dialog', {
      w: CW, h: CARD_H, layout: 'vertical', gap: 0, pad: 0, fill: BS.white,
      stroke: '#00000033', radius: 8,
      effects: [{ type: 'dropShadow', color: '#00000026', offset: [0, 8], radius: 16, spread: 0 }],
      x: (W - CW) / 2, y: (H - CARD_H) / 2,
    })], rootId))[0];

    await header(cardId, 'modal header', 'Lançamento de Despesa/Receita', {
      w: CW, h: 58, pad: [16, 24, 16, 24], size: 20, color: BS.body, font: BS.font,
      titleStyle: 'Medium', closeSize: 8, closeColor: BS.muted, closeW: 32, closeH: 32,
    });
    await mk([R('header rule', { w: CW, h: 1, fill: BS.border })], cardId);

    const bodyId = (await mk([F('modal body', {
      w: CW, h: BODY_H, layout: 'vertical', gap: 18, pad: [24, 24, 24, 24], fill: BS.white,
    })], cardId))[0];
    const INNER = CW - 48;
    const base = {
      fw: INNER, ih: 38, fs: 16, lh: 16, lblColor: BS.body, txtColor: BS.body, phColor: BS.muted,
      radius: 6, bd: BS.inputBd, font: BS.font, labelStyle: 'Regular', labelGap: 8,
    };
    await field(bodyId, 'f data', 'Data', '23/09/2025 15:02', base);
    await field(bodyId, 'f conta', 'Conta', 'Ex: Conta Corrente', base);
    await valueGroup(bodyId, 'f valor', {
      fw: INNER, ih: 38, fs: 16, lh: 16, lblColor: BS.body, bd: BS.inputBd, font: BS.font,
      sign: '−', signBg: BS.softBg, signColor: BS.body, radius: 6, labelGap: 8, phColor: BS.muted,
    });
    await field(bodyId, 'f descricao', 'Descrição', 'Descrição da despesa', base);
    await field(bodyId, 'f categoria', 'Categoria', 'Digite uma categoria', base);
    await field(bodyId, 'f orcamento', 'Orçamento (data-chave)', '23/09/2025', base);

    await mk([R('footer rule', { w: CW, h: 1, fill: BS.border })], cardId);
    const footId = (await mk([F('modal footer', {
      w: CW, h: 71, layout: 'horizontal', gap: 12, pad: [16, 24, 16, 24], fill: BS.softBg, cross: 'center',
    })], cardId))[0];
    const actId = (await mk([F('form actions', { w: INNER, h: 38, layout: 'horizontal', gap: 12, main: 'max' })], footId))[0];
    await button(actId, 'btn limpar', 'Limpar', {
      bg: BS.warning, fg: BS.body, bd: BS.warning, w: 88, h: 38, radius: 6, size: 16, weight: 'Regular', font: BS.font,
    });
    await button(actId, 'btn salvar', 'Salvar', {
      bg: BS.success, fg: BS.white, bd: BS.successDk, w: 92, h: 38, radius: 6, size: 16, weight: 'Regular', font: BS.font,
    });
    console.log('bootstrap desktop ok');
  }

  // ====================================================== TAILWIND — PWA
  {
    const W = 412, H = 1020;
    const CW = 371, PAD = 20, INNER = CW - PAD * 2;   // 331
    const rootId = (await mk([F('Formulário de Lançamento PWA — Tailwind', { w: W, h: H, fill: TW.dim })], null))[0];
    made.twPwa = rootId;

    const chipRow = (await mk([F('chip row', { layout: 'horizontal', gap: 8, x: 20, y: 20 })], rootId))[0];
    await chip(chipRow, 'fw chip', 'Tailwind v3', { bg: TW.primary, fg: TW.white, font: TW.font });
    await chip(chipRow, 'fw chip 2', 'PWA · bottom sheet', { bg: TW.white, fg: TW.g500, font: TW.font });

    const CARD_H = 702;
    const cardId = (await mk([F('sheet', {
      w: CW, h: CARD_H, layout: 'vertical', gap: 20, pad: PAD, fill: TW.white, radius: 12,
      effects: [{ type: 'dropShadow', color: '#00000024', offset: [0, 12], radius: 24, spread: -6 }],
      x: (W - CW) / 2, y: (H - CARD_H) / 2,
    })], rootId))[0];

    await header(cardId, 'sheet header', 'Lançamento de Despesa/Receita', {
      w: INNER, h: 26, pad: [0, 0, 0, 0], size: 18, color: TW.g900, font: TW.font,
      titleStyle: 'Bold', closeSize: 999, closeColor: TW.g400, closeW: 30, closeH: 30,
    });

    const formId = (await mk([F('form', { w: INNER, layout: 'vertical', gap: 14, fills: [] })], cardId))[0];
    const base = {
      fw: INNER, ih: 38, fs: 14, lh: 14, lblColor: TW.g700, txtColor: TW.g900, phColor: TW.g400,
      radius: 6, bd: TW.g300, font: TW.font, labelStyle: 'Medium', labelGap: 6,
    };
    await field(formId, 'f data', 'Data', '23/09/2025 15:02', base);
    await field(formId, 'f conta', 'Conta', 'Ex: Conta Corrente', base);
    await valueGroup(formId, 'f valor', {
      fw: INNER, ih: 38, fs: 14, lh: 14, lblColor: TW.g700, bd: TW.g300, font: TW.font,
      sign: '−', signBg: TW.g100, signColor: TW.g500, radius: 6, labelGap: 6, phColor: TW.g400,
    });
    await field(formId, 'f descricao', 'Descrição', 'Descrição da despesa', base);
    await field(formId, 'f categoria', 'Categoria', 'Digite uma categoria', base);
    await field(formId, 'f orcamento', 'Orçamento (data-chave)', '23/09/2025', base);
    await textareaField(formId, 'f observacao', 'Observação', 'Observações adicionais (opcional)', {
      fw: INNER, h: 76, fs: 14, lh: 14, lblColor: TW.g700, phColor: TW.g400, radius: 6,
      bd: TW.g300, font: TW.font, labelStyle: 'Medium', labelGap: 6,
    });

    const actId = (await mk([F('form actions', { w: INNER, h: 40, layout: 'horizontal', gap: 12, main: 'max' })], cardId))[0];
    await button(actId, 'btn cancelar', 'Cancelar', {
      bg: TW.white, fg: TW.g700, bd: TW.g300, w: 104, h: 40, radius: 6, size: 14, weight: 'Medium', font: TW.font,
    });
    await button(actId, 'btn salvar', 'Salvar', {
      bg: TW.green, fg: TW.white, w: 104, h: 40, radius: 6, size: 14, weight: 'Medium', font: TW.font,
    });
    console.log('tailwind pwa ok');
  }

  // ====================================================== BOOTSTRAP — PWA
  {
    const W = 412, H = 1020;
    const CW = 371, PADX = 24;
    const rootId = (await mk([F('Formulário de Lançamento PWA — Bootstrap 5', { w: W, h: H, fill: BS.dim })], null))[0];
    made.bsPwa = rootId;

    const chipRow = (await mk([F('chip row', { layout: 'horizontal', gap: 8, x: 20, y: 20 })], rootId))[0];
    await chip(chipRow, 'fw chip', 'Bootstrap 5.3', { bg: BS.primary, fg: BS.white, font: BS.font });
    await chip(chipRow, 'fw chip 2', 'PWA · bottom sheet', { bg: BS.white, fg: BS.muted, font: BS.font });

    const BODY_H = 685;
    const CARD_H = 54 + 1 + BODY_H + 1 + 71;
    const cardId = (await mk([F('sheet', {
      w: CW, h: CARD_H, layout: 'vertical', gap: 0, pad: 0, fill: BS.white,
      stroke: '#00000033', radius: 8,
      effects: [{ type: 'dropShadow', color: '#00000026', offset: [0, 8], radius: 16, spread: 0 }],
      x: (W - CW) / 2, y: (H - CARD_H) / 2,
    })], rootId))[0];

    await header(cardId, 'sheet header', 'Lançamento de Despesa/Receita', {
      w: CW, h: 54, pad: [16, 24, 16, 24], size: 18, color: BS.body, font: BS.font,
      titleStyle: 'Medium', closeSize: 8, closeColor: BS.muted, closeW: 30, closeH: 30,
    });
    await mk([R('header rule', { w: CW, h: 1, fill: BS.border })], cardId);

    const bodyId = (await mk([F('sheet body', {
      w: CW, h: BODY_H, layout: 'vertical', gap: 18, pad: [24, 24, 24, 24], fill: BS.white,
    })], cardId))[0];
    const INNER = CW - 48;
    const base = {
      fw: INNER, ih: 38, fs: 16, lh: 16, lblColor: BS.body, txtColor: BS.body, phColor: BS.muted,
      radius: 6, bd: BS.inputBd, font: BS.font, labelStyle: 'Regular', labelGap: 8,
    };
    await field(bodyId, 'f data', 'Data', '23/09/2025 15:02', base);
    await field(bodyId, 'f conta', 'Conta', 'Ex: Conta Corrente', base);
    await valueGroup(bodyId, 'f valor', {
      fw: INNER, ih: 38, fs: 16, lh: 16, lblColor: BS.body, bd: BS.inputBd, font: BS.font,
      sign: '−', signBg: BS.softBg, signColor: BS.body, radius: 6, labelGap: 8, phColor: BS.muted,
    });
    await field(bodyId, 'f descricao', 'Descrição', 'Descrição da despesa', base);
    await field(bodyId, 'f categoria', 'Categoria', 'Digite uma categoria', base);
    await field(bodyId, 'f orcamento', 'Orçamento (data-chave)', '23/09/2025', base);
    await textareaField(bodyId, 'f observacao', 'Observação', 'Observações adicionais (opcional)', {
      fw: INNER, h: 88, fs: 16, lh: 16, lblColor: BS.body, phColor: BS.muted, radius: 6,
      bd: BS.inputBd, font: BS.font, labelStyle: 'Regular', labelGap: 8,
    });

    await mk([R('footer rule', { w: CW, h: 1, fill: BS.border })], cardId);
    const footId = (await mk([F('sheet footer', {
      w: CW, h: 71, layout: 'horizontal', gap: 12, pad: [16, 24, 16, 24], fill: BS.softBg, cross: 'center',
    })], cardId))[0];
    const actId = (await mk([F('form actions', { w: INNER, h: 38, layout: 'horizontal', gap: 12, main: 'max' })], footId))[0];
    await button(actId, 'btn cancelar', 'Cancelar', {
      bg: BS.white, fg: BS.body, bd: BS.inputBd, w: 100, h: 38, radius: 6, size: 16, weight: 'Regular', font: BS.font,
    });
    await button(actId, 'btn salvar', 'Salvar', {
      bg: BS.success, fg: BS.white, bd: BS.successDk, w: 92, h: 38, radius: 6, size: 16, weight: 'Regular', font: BS.font,
    });
    console.log('bootstrap pwa ok');
  }

  // ---- position + save + export
  const XS = { twDesktop: 7600, bsDesktop: 9120, twPwa: 10640, bsPwa: 12160 };
  for (const [k, id] of Object.entries(made)) {
    await call('set_properties', { ids: [id], props: { x: XS[k], y: 0 } });
  }

  const OUT = 'D:/repos/edsonlcandido/ehtudoplanilha/design';
  await saveFile({ path: `${OUT}/planilha-ehtudo.figcraft` });

  for (const [file, key] of [
    ['form-tw-desktop', 'twDesktop'], ['form-bs-desktop', 'bsDesktop'],
    ['form-tw-pwa', 'twPwa'], ['form-bs-pwa', 'bsPwa'],
  ]) {
    await runCommand({
      command: 'file.export',
      params: { ids: [made[key]], format: 'png', scale: 2, path: `${OUT}/${file}.png` },
    });
    console.log('exported', file);
  }
  console.log('DONE');
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
