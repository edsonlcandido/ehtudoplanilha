'use strict';
/**
 * Cliente MCP persistente do FigCraft.
 * Mantém UM `figcraft-cli mcp --attach <porta>` vivo e multiplexa JSON-RPC
 * por stdin (uma request por linha, resposta casada por id).
 * O `mcp-client.js` da skill abre um processo por call — inviável p/ builds
 * de milhares de nós.
 */
const { spawn } = require('child_process');

const CLI = process.env.FIGCRAFT_CLI
  || 'D:\\Arquivos de Programas portateis\\ArtCraft Launcher\\FigCraft\\figcraft-cli.exe';
const PORT = process.env.FIGCRAFT_PORT || '7979';

let child = null;
let nextId = 1;
let buf = '';
const pending = new Map();

function ensure() {
  if (child) return child;
  child = spawn(CLI, ['mcp', '--attach', PORT], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.stdout.on('data', (d) => {
    buf += d;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i);
      buf = buf.slice(i + 1);
      const t = line.trim();
      if (!t.startsWith('{')) continue;
      let obj;
      try { obj = JSON.parse(t); } catch (_) { continue; }
      if (obj.id === undefined || !pending.has(obj.id)) continue;
      const p = pending.get(obj.id);
      pending.delete(obj.id);
      const content = obj.result && obj.result.content && obj.result.content[0];
      if (obj.error) { p.reject(new Error(JSON.stringify(obj.error))); continue; }
      if (content && content.type === 'text') {
        let parsed;
        try { parsed = JSON.parse(content.text); } catch (_) { parsed = content.text; }
        if (obj.result.isError) p.reject(new Error('tool error: ' + content.text));
        else p.resolve(parsed);
      } else if (obj.result && obj.result.isError) {
        p.reject(new Error('tool error (no content)'));
      } else {
        p.resolve(obj.result);
      }
    }
  });
  child.on('close', () => {
    child = null;
    for (const [, p] of pending) p.reject(new Error('mcp closed'));
    pending.clear();
  });
  return child;
}

function call(name, args = {}, timeoutMs = 60000) {
  const c = ensure();
  const id = nextId++;
  const payload = JSON.stringify({
    jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args },
  }) + '\n';
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timeout: ${name}`));
    }, timeoutMs);
    pending.set(id, {
      resolve: (v) => { clearTimeout(timer); resolve(v); },
      reject: (e) => { clearTimeout(timer); reject(e); },
    });
    c.stdin.write(payload);
  });
}

/** cria nós; um único batch por pai, filhos na ordem do spec */
async function batch(specs, parentId) {
  const commands = specs.map((s) => {
    const params = { type: s.type, name: s.name, props: s.props };
    if (s.text !== undefined) params.text = s.text;
    params.parent = s.parent !== undefined ? s.parent : parentId;
    if (s.x !== undefined) params.x = s.x;
    if (s.y !== undefined) params.y = s.y;
    if (s.width !== undefined) params.width = s.width;
    if (s.height !== undefined) params.height = s.height;
    return { command: 'node.create', params };
  });
  const res = await call('batch', { commands });
  return (res || []).map((r) => (r && r.id !== undefined ? r.id : r));
}

const setProps = (ids, props) => call('set_properties', { ids, props });
const getNode = (id, depth = 1) => call('get_node', { id, depth });
const runCommand = (command, params) => call('run_command', { command, params });
const saveFile = (path) => call('save_file', { path });
const inspect = (depth = 1) => call('inspect_document', { depth });

function close() {
  if (child) { try { child.stdin.end(); child.kill(); } catch (_) {} child = null; }
}

module.exports = { call, batch, setProps, getNode, runCommand, saveFile, inspect, close, CLI, PORT };
