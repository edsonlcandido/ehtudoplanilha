var jsonquery = (() => {
  // node_modules/@jsonquerylang/jsonquery/lib/jsonquery.js
  var N = (t) => Array.isArray(t);
  var Y = (t) => t !== null && typeof t == "object" && !N(t);
  var q = (t) => typeof t == "string";
  var A = (t, e) => t === e ? true : t !== null && e !== null && typeof t == "object" && typeof e == "object" && Object.keys(t).length === Object.keys(e).length && Object.entries(t).every(([r, s]) => A(s, e[r]));
  function p(t) {
    return (...e) => {
      const n = e.map((o) => h(o)), r = n[0], s = n[1];
      return n.length === 1 ? (o) => t(r(o)) : n.length === 2 ? (o) => t(r(o), s(o)) : (o) => t(...n.map((d) => d(o)));
    };
  }
  var F = { boolean: 0, number: 1, string: 2 };
  var V = 3;
  var D = (t, e) => typeof t == typeof e && typeof t in F ? t > e : false;
  var tt = (t, e) => A(t, e) || D(t, e);
  var C = (t, e) => typeof t == typeof e && typeof t in F ? t < e : false;
  var et = (t, e) => A(t, e) || C(t, e);
  var M = {
    pipe: (...t) => {
      const e = t.map((n) => h(n));
      return (n) => e.reduce((r, s) => s(r), n);
    },
    object: (t) => {
      const e = Object.keys(t).map((n) => [n, h(t[n])]);
      return (n) => {
        const r = {};
        for (const [s, o] of e)
          r[s] = o(n);
        return r;
      };
    },
    array: (...t) => {
      const e = t.map((n) => h(n));
      return (n) => e.map((r) => r(n));
    },
    get: (...t) => {
      if (t.length === 0)
        return (e) => e ?? null;
      if (t.length === 1) {
        const e = t[0];
        return (n) => (n == null ? void 0 : n[e]) ?? null;
      }
      return (e) => {
        let n = e;
        for (const r of t)
          n = n == null ? void 0 : n[r];
        return n ?? null;
      };
    },
    map: (t) => {
      const e = h(t);
      return (n) => n.map(e);
    },
    mapObject: (t) => {
      const e = h(t);
      return (n) => {
        const r = {};
        for (const s of Object.keys(n)) {
          const o = e({ key: s, value: n[s] });
          r[o.key] = o.value;
        }
        return r;
      };
    },
    mapKeys: (t) => {
      const e = h(t);
      return (n) => {
        const r = {};
        for (const s of Object.keys(n)) {
          const o = e(s);
          r[o] = n[s];
        }
        return r;
      };
    },
    mapValues: (t) => {
      const e = h(t);
      return (n) => {
        const r = {};
        for (const s of Object.keys(n))
          r[s] = e(n[s]);
        return r;
      };
    },
    filter: (t) => {
      const e = h(t);
      return (n) => n.filter((r) => Z(e(r)));
    },
    sort: (t = ["get"], e) => {
      const n = h(t), r = e === "desc" ? -1 : 1;
      function s(o, d) {
        const u = n(o), x = n(d);
        if (typeof u != typeof x) {
          const I = F[typeof u] ?? V, S = F[typeof x] ?? V;
          return I > S ? r : I < S ? -r : 0;
        }
        return typeof u in F ? u > x ? r : u < x ? -r : 0 : 0;
      }
      return (o) => o.slice().sort(s);
    },
    reverse: () => (t) => t.toReversed(),
    pick: (...t) => {
      const e = t.map(
        ([r, ...s]) => [s[s.length - 1], M.get(...s)]
      ), n = (r, s) => {
        const o = {};
        for (const [d, u] of s)
          o[d] = u(r);
        return o;
      };
      return (r) => N(r) ? r.map((s) => n(s, e)) : n(r, e);
    },
    groupBy: (t) => {
      const e = h(t);
      return (n) => {
        const r = {};
        for (const s of n) {
          const o = e(s);
          r[o] ? r[o].push(s) : r[o] = [s];
        }
        return r;
      };
    },
    keyBy: (t) => {
      const e = h(t);
      return (n) => {
        const r = {};
        for (const s of n) {
          const o = e(s);
          o in r || (r[o] = s);
        }
        return r;
      };
    },
    flatten: () => (t) => t.flat(),
    join: (t = "") => (e) => e.join(t),
    split: p(
      (t, e) => e !== void 0 ? t.split(e) : t.trim().split(/\s+/)
    ),
    substring: p(
      (t, e, n) => t.slice(Math.max(e, 0), n)
    ),
    uniq: () => (t) => {
      const e = [];
      for (const n of t)
        e.findIndex((r) => A(r, n)) === -1 && e.push(n);
      return e;
    },
    uniqBy: (t) => (e) => Object.values(M.keyBy(t)(e)),
    limit: (t) => (e) => e.slice(0, Math.max(t, 0)),
    size: () => (t) => t.length,
    keys: () => Object.keys,
    values: () => Object.values,
    prod: () => (t) => T(t, (e, n) => e * n),
    sum: () => (t) => N(t) ? t.reduce((e, n) => e + n, 0) : U(),
    average: () => (t) => N(t) ? t.length > 0 ? t.reduce((e, n) => e + n) / t.length : null : U(),
    min: () => (t) => T(t, (e, n) => Math.min(e, n)),
    max: () => (t) => T(t, (e, n) => Math.max(e, n)),
    and: p((...t) => T(t, (e, n) => !!(e && n))),
    or: p((...t) => T(t, (e, n) => !!(e || n))),
    not: p((t) => !t),
    exists: (t) => {
      const e = t.slice(1), n = e.pop(), r = M.get(...e);
      return (s) => {
        const o = r(s);
        return !!o && Object.hasOwnProperty.call(o, n);
      };
    },
    if: (t, e, n) => {
      const r = h(t), s = h(e), o = h(n);
      return (d) => Z(r(d)) ? s(d) : o(d);
    },
    in: (t, e) => {
      const n = h(t), r = h(e);
      return (s) => {
        const o = n(s);
        return r(s).findIndex((u) => A(u, o)) !== -1;
      };
    },
    "not in": (t, e) => {
      const n = M.in(t, e);
      return (r) => !n(r);
    },
    regex: (t, e, n) => {
      const r = new RegExp(e, n), s = h(t);
      return (o) => r.test(s(o));
    },
    eq: p(A),
    gt: p(D),
    gte: p(tt),
    lt: p(C),
    lte: p(et),
    ne: p((t, e) => !A(t, e)),
    add: p((t, e) => t + e),
    subtract: p((t, e) => t - e),
    multiply: p((t, e) => t * e),
    divide: p((t, e) => t / e),
    mod: p((t, e) => t % e),
    pow: p((t, e) => t ** e),
    abs: p(Math.abs),
    round: p((t, e = 0) => +`${Math.round(+`${t}e${e}`)}e${-e}`),
    number: p((t) => {
      const e = Number(t);
      return Number.isNaN(Number(t)) ? null : e;
    }),
    string: p(String)
  };
  var Z = (t) => t !== null && t !== 0 && t !== false;
  var T = (t, e) => (N(t) || U(), t.length === 0 ? null : t.reduce(e));
  var U = () => {
    z("Array expected");
  };
  var z = (t) => {
    throw new TypeError(t);
  };
  var W = [];
  function h(t, e) {
    W.unshift({ ...M, ...W[0], ...e == null ? void 0 : e.functions });
    try {
      const n = N(t) ? nt(t, W[0]) : Y(t) ? z(
        `Function notation ["object", {...}] expected but got ${JSON.stringify(t)}`
      ) : () => t;
      return (r) => {
        try {
          return n(r);
        } catch (s) {
          throw s.jsonquery = [{ data: r, query: t }, ...s.jsonquery ?? []], s;
        }
      };
    } finally {
      W.shift();
    }
  }
  function nt(t, e) {
    const [n, ...r] = t, s = e[n];
    return s || z(`Unknown function '${n}'`), s(...r);
  }
  var G = [
    { pow: "^" },
    { multiply: "*", divide: "/", mod: "%" },
    { add: "+", subtract: "-" },
    { gt: ">", gte: ">=", lt: "<", lte: "<=", in: "in", "not in": "not in" },
    { eq: "==", ne: "!=" },
    { and: "and" },
    { or: "or" },
    { pipe: "|" }
  ];
  var rt = ["|", "and", "or"];
  var H = ["|", "and", "or", "*", "/", "%", "+", "-"];
  function X(t, e) {
    if (!N(e))
      throw new Error("Invalid custom operators");
    return e.reduce(st, t);
  }
  function st(t, { name: e, op: n, at: r, after: s, before: o }) {
    if (r)
      return t.map((x) => Object.values(x).includes(r) ? { ...x, [e]: n } : x);
    const d = s ?? o, u = t.findIndex((x) => Object.values(x).includes(d));
    if (u !== -1)
      return t.toSpliced(u + (s ? 1 : 0), 0, { [e]: n });
    throw new Error("Invalid custom operator");
  }
  var ct = /^[a-zA-Z_$][a-zA-Z\d_$]*/;
  var it = /^"(?:[^"\\]|\\.)*"/;
  var ut = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/;
  var lt = /^(0|[1-9][0-9]*)/;
  var at = /^(true|false|null)/;
  var ft = /^[ \n\t\r]+/;
  function pt(t, e) {
    const n = (e == null ? void 0 : e.operators) ?? [], r = X(G, n), s = Object.assign({}, ...r), o = rt.concat(
      n.filter((c) => c.vararg).map((c) => c.op)
    ), d = H.concat(
      n.filter((c) => c.leftAssociative).map((c) => c.op)
    ), u = (c = r.length - 1) => {
      const g = r[c];
      if (!g)
        return I();
      const m = t[i] === "(";
      let $ = u(c - 1);
      for (; ; ) {
        f();
        const P = i, R = x(g);
        if (!R)
          break;
        const B = u(c - 1), Q = $[0], K = R === Q && !m;
        if (K && !d.includes(s[R])) {
          i = P;
          break;
        }
        $ = K && o.includes(s[R]) ? [...$, B] : [R, $, B];
      }
      return $;
    }, x = (c) => {
      const g = Object.keys(c).sort((m, $) => $.length - m.length);
      for (const m of g) {
        const $ = c[m];
        if (t.substring(i, i + $.length) === $)
          return i += $.length, f(), m;
      }
    }, I = () => {
      if (f(), t[i] === "(") {
        i++;
        const c = u();
        return j(")"), c;
      }
      return S();
    }, S = () => {
      if (t[i] === ".") {
        const c = [];
        for (; t[i] === "."; )
          i++, c.push(
            l() ?? y() ?? O() ?? _("Property expected")
          );
        return ["get", ...c];
      }
      return L();
    }, L = () => {
      const c = i, g = y();
      if (f(), !g || t[i] !== "(")
        return i = c, E();
      i++, f();
      const m = t[i] !== ")" ? [u()] : [];
      for (; i < t.length && t[i] !== ")"; )
        f(), j(","), m.push(u());
      return j(")"), [g, ...m];
    }, E = () => {
      if (t[i] === "{") {
        i++, f();
        const c = {};
        let g = true;
        for (; i < t.length && t[i] !== "}"; ) {
          g ? g = false : (j(","), f());
          const m = l() ?? y() ?? O() ?? _("Key expected");
          f(), j(":"), c[m] = u();
        }
        return j("}"), ["object", c];
      }
      return a();
    }, a = () => {
      if (t[i] === "[") {
        i++, f();
        const c = [];
        let g = true;
        for (; i < t.length && t[i] !== "]"; )
          g ? g = false : (j(","), f()), c.push(u());
        return j("]"), ["array", ...c];
      }
      return l() ?? b() ?? k();
    }, l = () => v(it, JSON.parse), y = () => v(ct, (c) => c), b = () => v(ut, JSON.parse), O = () => v(lt, JSON.parse), k = () => {
      const c = v(at, JSON.parse);
      if (c !== void 0)
        return c;
      _("Value expected");
    }, w = () => {
      f(), i < t.length && _(`Unexpected part '${t.substring(i)}'`);
    }, v = (c, g) => {
      const m = t.substring(i).match(c);
      if (m)
        return i += m[0].length, g(m[0]);
    }, f = () => v(ft, (c) => c), j = (c) => {
      t[i] !== c && _(`Character '${c}' expected`), i++;
    }, _ = (c, g = i) => {
      throw new SyntaxError(`${c} (pos: ${g})`);
    };
    let i = 0;
    const J = u();
    return w(), J;
  }
  function dt(t, e, n) {
    return h(q(e) ? pt(e, n) : e, n)(t);
  }

  // index.js
  if (typeof window !== "undefined") {
    window.query = dt;
  } else if (typeof global !== "undefined") {
    global.query = dt;
  }
})();
