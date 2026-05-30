var Ks = Object.defineProperty;
var Gn = (a) => {
  throw TypeError(a);
};
var Js = (a, t, e) => t in a ? Ks(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var A = (a, t, e) => Js(a, typeof t != "symbol" ? t + "" : t, e), qt = (a, t, e) => t.has(a) || Gn("Cannot " + e);
var x = (a, t, e) => (qt(a, t, "read from private field"), e ? e.call(a) : t.get(a)), C = (a, t, e) => t.has(a) ? Gn("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(a) : t.set(a, e), R = (a, t, e, n) => (qt(a, t, "write to private field"), n ? n.call(a, e) : t.set(a, e), e), d = (a, t, e) => (qt(a, t, "access private method"), e);
var Ke, me, Je, Ne, Rt, cs;
class ei extends EventTarget {
  constructor(e = globalThis.fetch.bind(globalThis)) {
    super();
    C(this, Rt);
    C(this, Ke);
    C(this, me, !1);
    C(this, Je, null);
    C(this, Ne, null);
    R(this, Ke, e);
  }
  abort() {
    var e;
    R(this, me, !0), (e = x(this, Je)) == null || e.cancel();
  }
  async connect(e, n = {}) {
    R(this, me, !1);
    const i = (await x(this, Ke).call(this, e, n)).body.getReader();
    R(this, Je, i);
    const o = new TextDecoder();
    let l = "";
    for (; !x(this, me); ) {
      const { done: c, value: h } = await i.read();
      if (c) break;
      l += o.decode(h, { stream: !0 });
      const f = l.split(`
`);
      l = f.pop() ?? "";
      for (const g of f) {
        if (x(this, me)) break;
        g === "" ? R(this, Ne, null) : d(this, Rt, cs).call(this, g);
      }
    }
    i.cancel();
  }
}
Ke = new WeakMap(), me = new WeakMap(), Je = new WeakMap(), Ne = new WeakMap(), Rt = new WeakSet(), cs = function(e) {
  if (e.startsWith("event: ")) {
    R(this, Ne, e.slice(7).trim());
    return;
  }
  if (!e.startsWith("data: ")) return;
  const n = e.slice(6);
  let s;
  try {
    s = JSON.parse(n);
  } catch {
    return;
  }
  const i = x(this, Ne) ?? s.type;
  switch (i) {
    case "token":
      this.dispatchEvent(new CustomEvent("chunk", { detail: { text: s.content ?? s.text } }));
      break;
    case "done":
      this.dispatchEvent(new CustomEvent("done", { detail: { conversationId: s.conversation_id, usage: s.usage } }));
      break;
    case "error":
      this.dispatchEvent(new CustomEvent("error", {
        detail: { code: s.code, message: s.message, retryable: s.retryable }
      }));
      break;
    case "context_summary":
      this.dispatchEvent(new CustomEvent("context_summary", { detail: { text: s.summary ?? s.text } }));
      break;
    case "tool_started":
    case "tool_finished":
    case "tool_failed":
      this.dispatchEvent(new CustomEvent(i, { detail: { name: s.name, phase: s.phase } }));
      break;
  }
};
function hn() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null
  };
}
let we = hn();
function us(a) {
  we = a;
}
const ps = /[&<>"']/, ti = new RegExp(ps.source, "g"), hs = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, ni = new RegExp(hs.source, "g"), si = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, jn = (a) => si[a];
function Z(a, t) {
  if (t) {
    if (ps.test(a))
      return a.replace(ti, jn);
  } else if (hs.test(a))
    return a.replace(ni, jn);
  return a;
}
const ii = /(^|[^\[])\^/g;
function S(a, t) {
  let e = typeof a == "string" ? a : a.source;
  t = t || "";
  const n = {
    replace: (s, i) => {
      let o = typeof i == "string" ? i : i.source;
      return o = o.replace(ii, "$1"), e = e.replace(s, o), n;
    },
    getRegex: () => new RegExp(e, t)
  };
  return n;
}
function qn(a) {
  try {
    a = encodeURI(a).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return a;
}
const Ve = { exec: () => null };
function Wn(a, t) {
  const e = a.replace(/\|/g, (i, o, l) => {
    let c = !1, h = o;
    for (; --h >= 0 && l[h] === "\\"; )
      c = !c;
    return c ? "|" : " |";
  }), n = e.split(/ \|/);
  let s = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n[n.length - 1].trim() && n.pop(), t)
    if (n.length > t)
      n.splice(t);
    else
      for (; n.length < t; )
        n.push("");
  for (; s < n.length; s++)
    n[s] = n[s].trim().replace(/\\\|/g, "|");
  return n;
}
function He(a, t, e) {
  const n = a.length;
  if (n === 0)
    return "";
  let s = 0;
  for (; s < n && a.charAt(n - s - 1) === t; )
    s++;
  return a.slice(0, n - s);
}
function ri(a, t) {
  if (a.indexOf(t[1]) === -1)
    return -1;
  let e = 0;
  for (let n = 0; n < a.length; n++)
    if (a[n] === "\\")
      n++;
    else if (a[n] === t[0])
      e++;
    else if (a[n] === t[1] && (e--, e < 0))
      return n;
  return -1;
}
function Zn(a, t, e, n) {
  const s = t.href, i = t.title ? Z(t.title) : null, o = a[1].replace(/\\([\[\]])/g, "$1");
  if (a[0].charAt(0) !== "!") {
    n.state.inLink = !0;
    const l = {
      type: "link",
      raw: e,
      href: s,
      title: i,
      text: o,
      tokens: n.inlineTokens(o)
    };
    return n.state.inLink = !1, l;
  }
  return {
    type: "image",
    raw: e,
    href: s,
    title: i,
    text: Z(o)
  };
}
function oi(a, t) {
  const e = a.match(/^(\s+)(?:```)/);
  if (e === null)
    return t;
  const n = e[1];
  return t.split(`
`).map((s) => {
    const i = s.match(/^\s+/);
    if (i === null)
      return s;
    const [o] = i;
    return o.length >= n.length ? s.slice(n.length) : s;
  }).join(`
`);
}
class _t {
  // set by the lexer
  constructor(t) {
    A(this, "options");
    A(this, "rules");
    // set by the lexer
    A(this, "lexer");
    this.options = t || we;
  }
  space(t) {
    const e = this.rules.block.newline.exec(t);
    if (e && e[0].length > 0)
      return {
        type: "space",
        raw: e[0]
      };
  }
  code(t) {
    const e = this.rules.block.code.exec(t);
    if (e) {
      const n = e[0].replace(/^(?: {1,4}| {0,3}\t)/gm, "");
      return {
        type: "code",
        raw: e[0],
        codeBlockStyle: "indented",
        text: this.options.pedantic ? n : He(n, `
`)
      };
    }
  }
  fences(t) {
    const e = this.rules.block.fences.exec(t);
    if (e) {
      const n = e[0], s = oi(n, e[3] || "");
      return {
        type: "code",
        raw: n,
        lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2],
        text: s
      };
    }
  }
  heading(t) {
    const e = this.rules.block.heading.exec(t);
    if (e) {
      let n = e[2].trim();
      if (/#$/.test(n)) {
        const s = He(n, "#");
        (this.options.pedantic || !s || / $/.test(s)) && (n = s.trim());
      }
      return {
        type: "heading",
        raw: e[0],
        depth: e[1].length,
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  hr(t) {
    const e = this.rules.block.hr.exec(t);
    if (e)
      return {
        type: "hr",
        raw: He(e[0], `
`)
      };
  }
  blockquote(t) {
    const e = this.rules.block.blockquote.exec(t);
    if (e) {
      let n = He(e[0], `
`).split(`
`), s = "", i = "";
      const o = [];
      for (; n.length > 0; ) {
        let l = !1;
        const c = [];
        let h;
        for (h = 0; h < n.length; h++)
          if (/^ {0,3}>/.test(n[h]))
            c.push(n[h]), l = !0;
          else if (!l)
            c.push(n[h]);
          else
            break;
        n = n.slice(h);
        const f = c.join(`
`), g = f.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`).replace(/^ {0,3}>[ \t]?/gm, "");
        s = s ? `${s}
${f}` : f, i = i ? `${i}
${g}` : g;
        const k = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(g, o, !0), this.lexer.state.top = k, n.length === 0)
          break;
        const w = o[o.length - 1];
        if ((w == null ? void 0 : w.type) === "code")
          break;
        if ((w == null ? void 0 : w.type) === "blockquote") {
          const y = w, I = y.raw + `
` + n.join(`
`), Y = this.blockquote(I);
          o[o.length - 1] = Y, s = s.substring(0, s.length - y.raw.length) + Y.raw, i = i.substring(0, i.length - y.text.length) + Y.text;
          break;
        } else if ((w == null ? void 0 : w.type) === "list") {
          const y = w, I = y.raw + `
` + n.join(`
`), Y = this.list(I);
          o[o.length - 1] = Y, s = s.substring(0, s.length - w.raw.length) + Y.raw, i = i.substring(0, i.length - y.raw.length) + Y.raw, n = I.substring(o[o.length - 1].raw.length).split(`
`);
          continue;
        }
      }
      return {
        type: "blockquote",
        raw: s,
        tokens: o,
        text: i
      };
    }
  }
  list(t) {
    let e = this.rules.block.list.exec(t);
    if (e) {
      let n = e[1].trim();
      const s = n.length > 1, i = {
        type: "list",
        raw: "",
        ordered: s,
        start: s ? +n.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      n = s ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = s ? n : "[*+-]");
      const o = new RegExp(`^( {0,3}${n})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let l = !1;
      for (; t; ) {
        let c = !1, h = "", f = "";
        if (!(e = o.exec(t)) || this.rules.block.hr.test(t))
          break;
        h = e[0], t = t.substring(h.length);
        let g = e[2].split(`
`, 1)[0].replace(/^\t+/, ($e) => " ".repeat(3 * $e.length)), k = t.split(`
`, 1)[0], w = !g.trim(), y = 0;
        if (this.options.pedantic ? (y = 2, f = g.trimStart()) : w ? y = e[1].length + 1 : (y = e[2].search(/[^ ]/), y = y > 4 ? 1 : y, f = g.slice(y), y += e[1].length), w && /^[ \t]*$/.test(k) && (h += k + `
`, t = t.substring(k.length + 1), c = !0), !c) {
          const $e = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), rt = new RegExp(`^ {0,${Math.min(3, y - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), ot = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:\`\`\`|~~~)`), pe = new RegExp(`^ {0,${Math.min(3, y - 1)}}#`), P = new RegExp(`^ {0,${Math.min(3, y - 1)}}<(?:[a-z].*>|!--)`, "i");
          for (; t; ) {
            const oe = t.split(`
`, 1)[0];
            let ne;
            if (k = oe, this.options.pedantic ? (k = k.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  "), ne = k) : ne = k.replace(/\t/g, "    "), ot.test(k) || pe.test(k) || P.test(k) || $e.test(k) || rt.test(k))
              break;
            if (ne.search(/[^ ]/) >= y || !k.trim())
              f += `
` + ne.slice(y);
            else {
              if (w || g.replace(/\t/g, "    ").search(/[^ ]/) >= 4 || ot.test(g) || pe.test(g) || rt.test(g))
                break;
              f += `
` + k;
            }
            !w && !k.trim() && (w = !0), h += oe + `
`, t = t.substring(oe.length + 1), g = ne.slice(y);
          }
        }
        i.loose || (l ? i.loose = !0 : /\n[ \t]*\n[ \t]*$/.test(h) && (l = !0));
        let I = null, Y;
        this.options.gfm && (I = /^\[[ xX]\] /.exec(f), I && (Y = I[0] !== "[ ] ", f = f.replace(/^\[[ xX]\] +/, ""))), i.items.push({
          type: "list_item",
          raw: h,
          task: !!I,
          checked: Y,
          loose: !1,
          text: f,
          tokens: []
        }), i.raw += h;
      }
      i.items[i.items.length - 1].raw = i.items[i.items.length - 1].raw.trimEnd(), i.items[i.items.length - 1].text = i.items[i.items.length - 1].text.trimEnd(), i.raw = i.raw.trimEnd();
      for (let c = 0; c < i.items.length; c++)
        if (this.lexer.state.top = !1, i.items[c].tokens = this.lexer.blockTokens(i.items[c].text, []), !i.loose) {
          const h = i.items[c].tokens.filter((g) => g.type === "space"), f = h.length > 0 && h.some((g) => /\n.*\n/.test(g.raw));
          i.loose = f;
        }
      if (i.loose)
        for (let c = 0; c < i.items.length; c++)
          i.items[c].loose = !0;
      return i;
    }
  }
  html(t) {
    const e = this.rules.block.html.exec(t);
    if (e)
      return {
        type: "html",
        block: !0,
        raw: e[0],
        pre: e[1] === "pre" || e[1] === "script" || e[1] === "style",
        text: e[0]
      };
  }
  def(t) {
    const e = this.rules.block.def.exec(t);
    if (e) {
      const n = e[1].toLowerCase().replace(/\s+/g, " "), s = e[2] ? e[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return {
        type: "def",
        tag: n,
        raw: e[0],
        href: s,
        title: i
      };
    }
  }
  table(t) {
    const e = this.rules.block.table.exec(t);
    if (!e || !/[:|]/.test(e[2]))
      return;
    const n = Wn(e[1]), s = e[2].replace(/^\||\| *$/g, "").split("|"), i = e[3] && e[3].trim() ? e[3].replace(/\n[ \t]*$/, "").split(`
`) : [], o = {
      type: "table",
      raw: e[0],
      header: [],
      align: [],
      rows: []
    };
    if (n.length === s.length) {
      for (const l of s)
        /^ *-+: *$/.test(l) ? o.align.push("right") : /^ *:-+: *$/.test(l) ? o.align.push("center") : /^ *:-+ *$/.test(l) ? o.align.push("left") : o.align.push(null);
      for (let l = 0; l < n.length; l++)
        o.header.push({
          text: n[l],
          tokens: this.lexer.inline(n[l]),
          header: !0,
          align: o.align[l]
        });
      for (const l of i)
        o.rows.push(Wn(l, o.header.length).map((c, h) => ({
          text: c,
          tokens: this.lexer.inline(c),
          header: !1,
          align: o.align[h]
        })));
      return o;
    }
  }
  lheading(t) {
    const e = this.rules.block.lheading.exec(t);
    if (e)
      return {
        type: "heading",
        raw: e[0],
        depth: e[2].charAt(0) === "=" ? 1 : 2,
        text: e[1],
        tokens: this.lexer.inline(e[1])
      };
  }
  paragraph(t) {
    const e = this.rules.block.paragraph.exec(t);
    if (e) {
      const n = e[1].charAt(e[1].length - 1) === `
` ? e[1].slice(0, -1) : e[1];
      return {
        type: "paragraph",
        raw: e[0],
        text: n,
        tokens: this.lexer.inline(n)
      };
    }
  }
  text(t) {
    const e = this.rules.block.text.exec(t);
    if (e)
      return {
        type: "text",
        raw: e[0],
        text: e[0],
        tokens: this.lexer.inline(e[0])
      };
  }
  escape(t) {
    const e = this.rules.inline.escape.exec(t);
    if (e)
      return {
        type: "escape",
        raw: e[0],
        text: Z(e[1])
      };
  }
  tag(t) {
    const e = this.rules.inline.tag.exec(t);
    if (e)
      return !this.lexer.state.inLink && /^<a /i.test(e[0]) ? this.lexer.state.inLink = !0 : this.lexer.state.inLink && /^<\/a>/i.test(e[0]) && (this.lexer.state.inLink = !1), !this.lexer.state.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(e[0]) ? this.lexer.state.inRawBlock = !0 : this.lexer.state.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(e[0]) && (this.lexer.state.inRawBlock = !1), {
        type: "html",
        raw: e[0],
        inLink: this.lexer.state.inLink,
        inRawBlock: this.lexer.state.inRawBlock,
        block: !1,
        text: e[0]
      };
  }
  link(t) {
    const e = this.rules.inline.link.exec(t);
    if (e) {
      const n = e[2].trim();
      if (!this.options.pedantic && /^</.test(n)) {
        if (!/>$/.test(n))
          return;
        const o = He(n.slice(0, -1), "\\");
        if ((n.length - o.length) % 2 === 0)
          return;
      } else {
        const o = ri(e[2], "()");
        if (o > -1) {
          const c = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + o;
          e[2] = e[2].substring(0, o), e[0] = e[0].substring(0, c).trim(), e[3] = "";
        }
      }
      let s = e[2], i = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(s);
        o && (s = o[1], i = o[3]);
      } else
        i = e[3] ? e[3].slice(1, -1) : "";
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), Zn(e, {
        href: s && s.replace(this.rules.inline.anyPunctuation, "$1"),
        title: i && i.replace(this.rules.inline.anyPunctuation, "$1")
      }, e[0], this.lexer);
    }
  }
  reflink(t, e) {
    let n;
    if ((n = this.rules.inline.reflink.exec(t)) || (n = this.rules.inline.nolink.exec(t))) {
      const s = (n[2] || n[1]).replace(/\s+/g, " "), i = e[s.toLowerCase()];
      if (!i) {
        const o = n[0].charAt(0);
        return {
          type: "text",
          raw: o,
          text: o
        };
      }
      return Zn(n, i, n[0], this.lexer);
    }
  }
  emStrong(t, e, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(t);
    if (!s || s[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const o = [...s[0]].length - 1;
      let l, c, h = o, f = 0;
      const g = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (g.lastIndex = 0, e = e.slice(-1 * t.length + o); (s = g.exec(e)) != null; ) {
        if (l = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !l)
          continue;
        if (c = [...l].length, s[3] || s[4]) {
          h += c;
          continue;
        } else if ((s[5] || s[6]) && o % 3 && !((o + c) % 3)) {
          f += c;
          continue;
        }
        if (h -= c, h > 0)
          continue;
        c = Math.min(c, c + h + f);
        const k = [...s[0]][0].length, w = t.slice(0, o + s.index + k + c);
        if (Math.min(o, c) % 2) {
          const I = w.slice(1, -1);
          return {
            type: "em",
            raw: w,
            text: I,
            tokens: this.lexer.inlineTokens(I)
          };
        }
        const y = w.slice(2, -2);
        return {
          type: "strong",
          raw: w,
          text: y,
          tokens: this.lexer.inlineTokens(y)
        };
      }
    }
  }
  codespan(t) {
    const e = this.rules.inline.code.exec(t);
    if (e) {
      let n = e[2].replace(/\n/g, " ");
      const s = /[^ ]/.test(n), i = /^ /.test(n) && / $/.test(n);
      return s && i && (n = n.substring(1, n.length - 1)), n = Z(n, !0), {
        type: "codespan",
        raw: e[0],
        text: n
      };
    }
  }
  br(t) {
    const e = this.rules.inline.br.exec(t);
    if (e)
      return {
        type: "br",
        raw: e[0]
      };
  }
  del(t) {
    const e = this.rules.inline.del.exec(t);
    if (e)
      return {
        type: "del",
        raw: e[0],
        text: e[2],
        tokens: this.lexer.inlineTokens(e[2])
      };
  }
  autolink(t) {
    const e = this.rules.inline.autolink.exec(t);
    if (e) {
      let n, s;
      return e[2] === "@" ? (n = Z(e[1]), s = "mailto:" + n) : (n = Z(e[1]), s = n), {
        type: "link",
        raw: e[0],
        text: n,
        href: s,
        tokens: [
          {
            type: "text",
            raw: n,
            text: n
          }
        ]
      };
    }
  }
  url(t) {
    var n;
    let e;
    if (e = this.rules.inline.url.exec(t)) {
      let s, i;
      if (e[2] === "@")
        s = Z(e[0]), i = "mailto:" + s;
      else {
        let o;
        do
          o = e[0], e[0] = ((n = this.rules.inline._backpedal.exec(e[0])) == null ? void 0 : n[0]) ?? "";
        while (o !== e[0]);
        s = Z(e[0]), e[1] === "www." ? i = "http://" + e[0] : i = e[0];
      }
      return {
        type: "link",
        raw: e[0],
        text: s,
        href: i,
        tokens: [
          {
            type: "text",
            raw: s,
            text: s
          }
        ]
      };
    }
  }
  inlineText(t) {
    const e = this.rules.inline.text.exec(t);
    if (e) {
      let n;
      return this.lexer.state.inRawBlock ? n = e[0] : n = Z(e[0]), {
        type: "text",
        raw: e[0],
        text: n
      };
    }
  }
}
const ai = /^(?:[ \t]*(?:\n|$))+/, li = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, ci = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, st = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ui = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, fs = /(?:[*+-]|\d{1,9}[.)])/, ds = S(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, fs).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), fn = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, pi = /^[^\n]+/, dn = /(?!\s*\])(?:\\.|[^\[\]\\])+/, hi = S(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", dn).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), fi = S(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, fs).getRegex(), It = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", mn = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, di = S("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", mn).replace("tag", It).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ms = S(fn).replace("hr", st).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", It).getRegex(), mi = S(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ms).getRegex(), gn = {
  blockquote: mi,
  code: li,
  def: hi,
  fences: ci,
  heading: ui,
  hr: st,
  html: di,
  lheading: ds,
  list: fi,
  newline: ai,
  paragraph: ms,
  table: Ve,
  text: pi
}, Yn = S("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", st).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", It).getRegex(), gi = {
  ...gn,
  table: Yn,
  paragraph: S(fn).replace("hr", st).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Yn).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", It).getRegex()
}, bi = {
  ...gn,
  html: S(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", mn).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Ve,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: S(fn).replace("hr", st).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ds).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, gs = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, xi = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, bs = /^( {2,}|\\)\n(?!\s*$)/, ki = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, it = "\\p{P}\\p{S}", wi = S(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, it).getRegex(), Ti = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, yi = S(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, it).getRegex(), Ei = S("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, it).getRegex(), _i = S("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, it).getRegex(), Ai = S(/\\([punct])/, "gu").replace(/punct/g, it).getRegex(), Si = S(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), Ri = S(mn).replace("(?:-->|$)", "-->").getRegex(), Ii = S("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Ri).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), At = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, vi = S(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", At).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), xs = S(/^!?\[(label)\]\[(ref)\]/).replace("label", At).replace("ref", dn).getRegex(), ks = S(/^!?\[(ref)\](?:\[\])?/).replace("ref", dn).getRegex(), Li = S("reflink|nolink(?!\\()", "g").replace("reflink", xs).replace("nolink", ks).getRegex(), bn = {
  _backpedal: Ve,
  // only used for GFM url
  anyPunctuation: Ai,
  autolink: Si,
  blockSkip: Ti,
  br: bs,
  code: xi,
  del: Ve,
  emStrongLDelim: yi,
  emStrongRDelimAst: Ei,
  emStrongRDelimUnd: _i,
  escape: gs,
  link: vi,
  nolink: ks,
  punctuation: wi,
  reflink: xs,
  reflinkSearch: Li,
  tag: Ii,
  text: ki,
  url: Ve
}, Ci = {
  ...bn,
  link: S(/^!?\[(label)\]\((.*?)\)/).replace("label", At).getRegex(),
  reflink: S(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", At).getRegex()
}, Qt = {
  ...bn,
  escape: S(gs).replace("])", "~|])").getRegex(),
  url: S(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Oi = {
  ...Qt,
  br: S(bs).replace("{2,}", "*").getRegex(),
  text: S(Qt.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, gt = {
  normal: gn,
  gfm: gi,
  pedantic: bi
}, Ge = {
  normal: bn,
  gfm: Qt,
  breaks: Oi,
  pedantic: Ci
};
class V {
  constructor(t) {
    A(this, "tokens");
    A(this, "options");
    A(this, "state");
    A(this, "tokenizer");
    A(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || we, this.options.tokenizer = this.options.tokenizer || new _t(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const e = {
      block: gt.normal,
      inline: Ge.normal
    };
    this.options.pedantic ? (e.block = gt.pedantic, e.inline = Ge.pedantic) : this.options.gfm && (e.block = gt.gfm, this.options.breaks ? e.inline = Ge.breaks : e.inline = Ge.gfm), this.tokenizer.rules = e;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: gt,
      inline: Ge
    };
  }
  /**
   * Static Lex Method
   */
  static lex(t, e) {
    return new V(e).lex(t);
  }
  /**
   * Static Lex Inline Method
   */
  static lexInline(t, e) {
    return new V(e).inlineTokens(t);
  }
  /**
   * Preprocessing
   */
  lex(t) {
    t = t.replace(/\r\n|\r/g, `
`), this.blockTokens(t, this.tokens);
    for (let e = 0; e < this.inlineQueue.length; e++) {
      const n = this.inlineQueue[e];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(t, e = [], n = !1) {
    this.options.pedantic && (t = t.replace(/\t/g, "    ").replace(/^ +$/gm, ""));
    let s, i, o;
    for (; t; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((l) => (s = l.call({ lexer: this }, t, e)) ? (t = t.substring(s.raw.length), e.push(s), !0) : !1))) {
        if (s = this.tokenizer.space(t)) {
          t = t.substring(s.raw.length), s.raw.length === 1 && e.length > 0 ? e[e.length - 1].raw += `
` : e.push(s);
          continue;
        }
        if (s = this.tokenizer.code(t)) {
          t = t.substring(s.raw.length), i = e[e.length - 1], i && (i.type === "paragraph" || i.type === "text") ? (i.raw += `
` + s.raw, i.text += `
` + s.text, this.inlineQueue[this.inlineQueue.length - 1].src = i.text) : e.push(s);
          continue;
        }
        if (s = this.tokenizer.fences(t)) {
          t = t.substring(s.raw.length), e.push(s);
          continue;
        }
        if (s = this.tokenizer.heading(t)) {
          t = t.substring(s.raw.length), e.push(s);
          continue;
        }
        if (s = this.tokenizer.hr(t)) {
          t = t.substring(s.raw.length), e.push(s);
          continue;
        }
        if (s = this.tokenizer.blockquote(t)) {
          t = t.substring(s.raw.length), e.push(s);
          continue;
        }
        if (s = this.tokenizer.list(t)) {
          t = t.substring(s.raw.length), e.push(s);
          continue;
        }
        if (s = this.tokenizer.html(t)) {
          t = t.substring(s.raw.length), e.push(s);
          continue;
        }
        if (s = this.tokenizer.def(t)) {
          t = t.substring(s.raw.length), i = e[e.length - 1], i && (i.type === "paragraph" || i.type === "text") ? (i.raw += `
` + s.raw, i.text += `
` + s.raw, this.inlineQueue[this.inlineQueue.length - 1].src = i.text) : this.tokens.links[s.tag] || (this.tokens.links[s.tag] = {
            href: s.href,
            title: s.title
          });
          continue;
        }
        if (s = this.tokenizer.table(t)) {
          t = t.substring(s.raw.length), e.push(s);
          continue;
        }
        if (s = this.tokenizer.lheading(t)) {
          t = t.substring(s.raw.length), e.push(s);
          continue;
        }
        if (o = t, this.options.extensions && this.options.extensions.startBlock) {
          let l = 1 / 0;
          const c = t.slice(1);
          let h;
          this.options.extensions.startBlock.forEach((f) => {
            h = f.call({ lexer: this }, c), typeof h == "number" && h >= 0 && (l = Math.min(l, h));
          }), l < 1 / 0 && l >= 0 && (o = t.substring(0, l + 1));
        }
        if (this.state.top && (s = this.tokenizer.paragraph(o))) {
          i = e[e.length - 1], n && (i == null ? void 0 : i.type) === "paragraph" ? (i.raw += `
` + s.raw, i.text += `
` + s.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = i.text) : e.push(s), n = o.length !== t.length, t = t.substring(s.raw.length);
          continue;
        }
        if (s = this.tokenizer.text(t)) {
          t = t.substring(s.raw.length), i = e[e.length - 1], i && i.type === "text" ? (i.raw += `
` + s.raw, i.text += `
` + s.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = i.text) : e.push(s);
          continue;
        }
        if (t) {
          const l = "Infinite loop on byte: " + t.charCodeAt(0);
          if (this.options.silent) {
            console.error(l);
            break;
          } else
            throw new Error(l);
        }
      }
    return this.state.top = !0, e;
  }
  inline(t, e = []) {
    return this.inlineQueue.push({ src: t, tokens: e }), e;
  }
  /**
   * Lexing/Compiling
   */
  inlineTokens(t, e = []) {
    let n, s, i, o = t, l, c, h;
    if (this.tokens.links) {
      const f = Object.keys(this.tokens.links);
      if (f.length > 0)
        for (; (l = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          f.includes(l[0].slice(l[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, l.index) + "[" + "a".repeat(l[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (l = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, l.index) + "[" + "a".repeat(l[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (l = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, l.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; t; )
      if (c || (h = ""), c = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((f) => (n = f.call({ lexer: this }, t, e)) ? (t = t.substring(n.raw.length), e.push(n), !0) : !1))) {
        if (n = this.tokenizer.escape(t)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (n = this.tokenizer.tag(t)) {
          t = t.substring(n.raw.length), s = e[e.length - 1], s && n.type === "text" && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : e.push(n);
          continue;
        }
        if (n = this.tokenizer.link(t)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (n = this.tokenizer.reflink(t, this.tokens.links)) {
          t = t.substring(n.raw.length), s = e[e.length - 1], s && n.type === "text" && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : e.push(n);
          continue;
        }
        if (n = this.tokenizer.emStrong(t, o, h)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (n = this.tokenizer.codespan(t)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (n = this.tokenizer.br(t)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (n = this.tokenizer.del(t)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (n = this.tokenizer.autolink(t)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (!this.state.inLink && (n = this.tokenizer.url(t))) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (i = t, this.options.extensions && this.options.extensions.startInline) {
          let f = 1 / 0;
          const g = t.slice(1);
          let k;
          this.options.extensions.startInline.forEach((w) => {
            k = w.call({ lexer: this }, g), typeof k == "number" && k >= 0 && (f = Math.min(f, k));
          }), f < 1 / 0 && f >= 0 && (i = t.substring(0, f + 1));
        }
        if (n = this.tokenizer.inlineText(i)) {
          t = t.substring(n.raw.length), n.raw.slice(-1) !== "_" && (h = n.raw.slice(-1)), c = !0, s = e[e.length - 1], s && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : e.push(n);
          continue;
        }
        if (t) {
          const f = "Infinite loop on byte: " + t.charCodeAt(0);
          if (this.options.silent) {
            console.error(f);
            break;
          } else
            throw new Error(f);
        }
      }
    return e;
  }
}
class St {
  // set by the parser
  constructor(t) {
    A(this, "options");
    A(this, "parser");
    this.options = t || we;
  }
  space(t) {
    return "";
  }
  code({ text: t, lang: e, escaped: n }) {
    var o;
    const s = (o = (e || "").match(/^\S*/)) == null ? void 0 : o[0], i = t.replace(/\n$/, "") + `
`;
    return s ? '<pre><code class="language-' + Z(s) + '">' + (n ? i : Z(i, !0)) + `</code></pre>
` : "<pre><code>" + (n ? i : Z(i, !0)) + `</code></pre>
`;
  }
  blockquote({ tokens: t }) {
    return `<blockquote>
${this.parser.parse(t)}</blockquote>
`;
  }
  html({ text: t }) {
    return t;
  }
  heading({ tokens: t, depth: e }) {
    return `<h${e}>${this.parser.parseInline(t)}</h${e}>
`;
  }
  hr(t) {
    return `<hr>
`;
  }
  list(t) {
    const e = t.ordered, n = t.start;
    let s = "";
    for (let l = 0; l < t.items.length; l++) {
      const c = t.items[l];
      s += this.listitem(c);
    }
    const i = e ? "ol" : "ul", o = e && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + o + `>
` + s + "</" + i + `>
`;
  }
  listitem(t) {
    let e = "";
    if (t.task) {
      const n = this.checkbox({ checked: !!t.checked });
      t.loose ? t.tokens.length > 0 && t.tokens[0].type === "paragraph" ? (t.tokens[0].text = n + " " + t.tokens[0].text, t.tokens[0].tokens && t.tokens[0].tokens.length > 0 && t.tokens[0].tokens[0].type === "text" && (t.tokens[0].tokens[0].text = n + " " + t.tokens[0].tokens[0].text)) : t.tokens.unshift({
        type: "text",
        raw: n + " ",
        text: n + " "
      }) : e += n + " ";
    }
    return e += this.parser.parse(t.tokens, !!t.loose), `<li>${e}</li>
`;
  }
  checkbox({ checked: t }) {
    return "<input " + (t ? 'checked="" ' : "") + 'disabled="" type="checkbox">';
  }
  paragraph({ tokens: t }) {
    return `<p>${this.parser.parseInline(t)}</p>
`;
  }
  table(t) {
    let e = "", n = "";
    for (let i = 0; i < t.header.length; i++)
      n += this.tablecell(t.header[i]);
    e += this.tablerow({ text: n });
    let s = "";
    for (let i = 0; i < t.rows.length; i++) {
      const o = t.rows[i];
      n = "";
      for (let l = 0; l < o.length; l++)
        n += this.tablecell(o[l]);
      s += this.tablerow({ text: n });
    }
    return s && (s = `<tbody>${s}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + s + `</table>
`;
  }
  tablerow({ text: t }) {
    return `<tr>
${t}</tr>
`;
  }
  tablecell(t) {
    const e = this.parser.parseInline(t.tokens), n = t.header ? "th" : "td";
    return (t.align ? `<${n} align="${t.align}">` : `<${n}>`) + e + `</${n}>
`;
  }
  /**
   * span level renderer
   */
  strong({ tokens: t }) {
    return `<strong>${this.parser.parseInline(t)}</strong>`;
  }
  em({ tokens: t }) {
    return `<em>${this.parser.parseInline(t)}</em>`;
  }
  codespan({ text: t }) {
    return `<code>${t}</code>`;
  }
  br(t) {
    return "<br>";
  }
  del({ tokens: t }) {
    return `<del>${this.parser.parseInline(t)}</del>`;
  }
  link({ href: t, title: e, tokens: n }) {
    const s = this.parser.parseInline(n), i = qn(t);
    if (i === null)
      return s;
    t = i;
    let o = '<a href="' + t + '"';
    return e && (o += ' title="' + e + '"'), o += ">" + s + "</a>", o;
  }
  image({ href: t, title: e, text: n }) {
    const s = qn(t);
    if (s === null)
      return n;
    t = s;
    let i = `<img src="${t}" alt="${n}"`;
    return e && (i += ` title="${e}"`), i += ">", i;
  }
  text(t) {
    return "tokens" in t && t.tokens ? this.parser.parseInline(t.tokens) : t.text;
  }
}
class xn {
  // no need for block level renderers
  strong({ text: t }) {
    return t;
  }
  em({ text: t }) {
    return t;
  }
  codespan({ text: t }) {
    return t;
  }
  del({ text: t }) {
    return t;
  }
  html({ text: t }) {
    return t;
  }
  text({ text: t }) {
    return t;
  }
  link({ text: t }) {
    return "" + t;
  }
  image({ text: t }) {
    return "" + t;
  }
  br() {
    return "";
  }
}
class Q {
  constructor(t) {
    A(this, "options");
    A(this, "renderer");
    A(this, "textRenderer");
    this.options = t || we, this.options.renderer = this.options.renderer || new St(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new xn();
  }
  /**
   * Static Parse Method
   */
  static parse(t, e) {
    return new Q(e).parse(t);
  }
  /**
   * Static Parse Inline Method
   */
  static parseInline(t, e) {
    return new Q(e).parseInline(t);
  }
  /**
   * Parse Loop
   */
  parse(t, e = !0) {
    let n = "";
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[i.type]) {
        const l = i, c = this.options.extensions.renderers[l.type].call({ parser: this }, l);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(l.type)) {
          n += c || "";
          continue;
        }
      }
      const o = i;
      switch (o.type) {
        case "space": {
          n += this.renderer.space(o);
          continue;
        }
        case "hr": {
          n += this.renderer.hr(o);
          continue;
        }
        case "heading": {
          n += this.renderer.heading(o);
          continue;
        }
        case "code": {
          n += this.renderer.code(o);
          continue;
        }
        case "table": {
          n += this.renderer.table(o);
          continue;
        }
        case "blockquote": {
          n += this.renderer.blockquote(o);
          continue;
        }
        case "list": {
          n += this.renderer.list(o);
          continue;
        }
        case "html": {
          n += this.renderer.html(o);
          continue;
        }
        case "paragraph": {
          n += this.renderer.paragraph(o);
          continue;
        }
        case "text": {
          let l = o, c = this.renderer.text(l);
          for (; s + 1 < t.length && t[s + 1].type === "text"; )
            l = t[++s], c += `
` + this.renderer.text(l);
          e ? n += this.renderer.paragraph({
            type: "paragraph",
            raw: c,
            text: c,
            tokens: [{ type: "text", raw: c, text: c }]
          }) : n += c;
          continue;
        }
        default: {
          const l = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent)
            return console.error(l), "";
          throw new Error(l);
        }
      }
    }
    return n;
  }
  /**
   * Parse Inline Tokens
   */
  parseInline(t, e) {
    e = e || this.renderer;
    let n = "";
    for (let s = 0; s < t.length; s++) {
      const i = t[s];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[i.type]) {
        const l = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (l !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
          n += l || "";
          continue;
        }
      }
      const o = i;
      switch (o.type) {
        case "escape": {
          n += e.text(o);
          break;
        }
        case "html": {
          n += e.html(o);
          break;
        }
        case "link": {
          n += e.link(o);
          break;
        }
        case "image": {
          n += e.image(o);
          break;
        }
        case "strong": {
          n += e.strong(o);
          break;
        }
        case "em": {
          n += e.em(o);
          break;
        }
        case "codespan": {
          n += e.codespan(o);
          break;
        }
        case "br": {
          n += e.br(o);
          break;
        }
        case "del": {
          n += e.del(o);
          break;
        }
        case "text": {
          n += e.text(o);
          break;
        }
        default: {
          const l = 'Token with "' + o.type + '" type was not found.';
          if (this.options.silent)
            return console.error(l), "";
          throw new Error(l);
        }
      }
    }
    return n;
  }
}
class Qe {
  constructor(t) {
    A(this, "options");
    A(this, "block");
    this.options = t || we;
  }
  /**
   * Process markdown before marked
   */
  preprocess(t) {
    return t;
  }
  /**
   * Process HTML after marked is finished
   */
  postprocess(t) {
    return t;
  }
  /**
   * Process all tokens before walk tokens
   */
  processAllTokens(t) {
    return t;
  }
  /**
   * Provide function to tokenize markdown
   */
  provideLexer() {
    return this.block ? V.lex : V.lexInline;
  }
  /**
   * Provide function to parse tokens
   */
  provideParser() {
    return this.block ? Q.parse : Q.parseInline;
  }
}
A(Qe, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
class Ni {
  constructor(...t) {
    A(this, "defaults", hn());
    A(this, "options", this.setOptions);
    A(this, "parse", this.parseMarkdown(!0));
    A(this, "parseInline", this.parseMarkdown(!1));
    A(this, "Parser", Q);
    A(this, "Renderer", St);
    A(this, "TextRenderer", xn);
    A(this, "Lexer", V);
    A(this, "Tokenizer", _t);
    A(this, "Hooks", Qe);
    this.use(...t);
  }
  /**
   * Run callback for every token
   */
  walkTokens(t, e) {
    var s, i;
    let n = [];
    for (const o of t)
      switch (n = n.concat(e.call(this, o)), o.type) {
        case "table": {
          const l = o;
          for (const c of l.header)
            n = n.concat(this.walkTokens(c.tokens, e));
          for (const c of l.rows)
            for (const h of c)
              n = n.concat(this.walkTokens(h.tokens, e));
          break;
        }
        case "list": {
          const l = o;
          n = n.concat(this.walkTokens(l.items, e));
          break;
        }
        default: {
          const l = o;
          (i = (s = this.defaults.extensions) == null ? void 0 : s.childTokens) != null && i[l.type] ? this.defaults.extensions.childTokens[l.type].forEach((c) => {
            const h = l[c].flat(1 / 0);
            n = n.concat(this.walkTokens(h, e));
          }) : l.tokens && (n = n.concat(this.walkTokens(l.tokens, e)));
        }
      }
    return n;
  }
  use(...t) {
    const e = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return t.forEach((n) => {
      const s = { ...n };
      if (s.async = this.defaults.async || s.async || !1, n.extensions && (n.extensions.forEach((i) => {
        if (!i.name)
          throw new Error("extension name required");
        if ("renderer" in i) {
          const o = e.renderers[i.name];
          o ? e.renderers[i.name] = function(...l) {
            let c = i.renderer.apply(this, l);
            return c === !1 && (c = o.apply(this, l)), c;
          } : e.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const o = e[i.level];
          o ? o.unshift(i.tokenizer) : e[i.level] = [i.tokenizer], i.start && (i.level === "block" ? e.startBlock ? e.startBlock.push(i.start) : e.startBlock = [i.start] : i.level === "inline" && (e.startInline ? e.startInline.push(i.start) : e.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (e.childTokens[i.name] = i.childTokens);
      }), s.extensions = e), n.renderer) {
        const i = this.defaults.renderer || new St(this.defaults);
        for (const o in n.renderer) {
          if (!(o in i))
            throw new Error(`renderer '${o}' does not exist`);
          if (["options", "parser"].includes(o))
            continue;
          const l = o, c = n.renderer[l], h = i[l];
          i[l] = (...f) => {
            let g = c.apply(i, f);
            return g === !1 && (g = h.apply(i, f)), g || "";
          };
        }
        s.renderer = i;
      }
      if (n.tokenizer) {
        const i = this.defaults.tokenizer || new _t(this.defaults);
        for (const o in n.tokenizer) {
          if (!(o in i))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const l = o, c = n.tokenizer[l], h = i[l];
          i[l] = (...f) => {
            let g = c.apply(i, f);
            return g === !1 && (g = h.apply(i, f)), g;
          };
        }
        s.tokenizer = i;
      }
      if (n.hooks) {
        const i = this.defaults.hooks || new Qe();
        for (const o in n.hooks) {
          if (!(o in i))
            throw new Error(`hook '${o}' does not exist`);
          if (["options", "block"].includes(o))
            continue;
          const l = o, c = n.hooks[l], h = i[l];
          Qe.passThroughHooks.has(o) ? i[l] = (f) => {
            if (this.defaults.async)
              return Promise.resolve(c.call(i, f)).then((k) => h.call(i, k));
            const g = c.call(i, f);
            return h.call(i, g);
          } : i[l] = (...f) => {
            let g = c.apply(i, f);
            return g === !1 && (g = h.apply(i, f)), g;
          };
        }
        s.hooks = i;
      }
      if (n.walkTokens) {
        const i = this.defaults.walkTokens, o = n.walkTokens;
        s.walkTokens = function(l) {
          let c = [];
          return c.push(o.call(this, l)), i && (c = c.concat(i.call(this, l))), c;
        };
      }
      this.defaults = { ...this.defaults, ...s };
    }), this;
  }
  setOptions(t) {
    return this.defaults = { ...this.defaults, ...t }, this;
  }
  lexer(t, e) {
    return V.lex(t, e ?? this.defaults);
  }
  parser(t, e) {
    return Q.parse(t, e ?? this.defaults);
  }
  parseMarkdown(t) {
    return (n, s) => {
      const i = { ...s }, o = { ...this.defaults, ...i }, l = this.onError(!!o.silent, !!o.async);
      if (this.defaults.async === !0 && i.async === !1)
        return l(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null)
        return l(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string")
        return l(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      o.hooks && (o.hooks.options = o, o.hooks.block = t);
      const c = o.hooks ? o.hooks.provideLexer() : t ? V.lex : V.lexInline, h = o.hooks ? o.hooks.provideParser() : t ? Q.parse : Q.parseInline;
      if (o.async)
        return Promise.resolve(o.hooks ? o.hooks.preprocess(n) : n).then((f) => c(f, o)).then((f) => o.hooks ? o.hooks.processAllTokens(f) : f).then((f) => o.walkTokens ? Promise.all(this.walkTokens(f, o.walkTokens)).then(() => f) : f).then((f) => h(f, o)).then((f) => o.hooks ? o.hooks.postprocess(f) : f).catch(l);
      try {
        o.hooks && (n = o.hooks.preprocess(n));
        let f = c(n, o);
        o.hooks && (f = o.hooks.processAllTokens(f)), o.walkTokens && this.walkTokens(f, o.walkTokens);
        let g = h(f, o);
        return o.hooks && (g = o.hooks.postprocess(g)), g;
      } catch (f) {
        return l(f);
      }
    };
  }
  onError(t, e) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, t) {
        const s = "<p>An error occurred:</p><pre>" + Z(n.message + "", !0) + "</pre>";
        return e ? Promise.resolve(s) : s;
      }
      if (e)
        return Promise.reject(n);
      throw n;
    };
  }
}
const ke = new Ni();
function _(a, t) {
  return ke.parse(a, t);
}
_.options = _.setOptions = function(a) {
  return ke.setOptions(a), _.defaults = ke.defaults, us(_.defaults), _;
};
_.getDefaults = hn;
_.defaults = we;
_.use = function(...a) {
  return ke.use(...a), _.defaults = ke.defaults, us(_.defaults), _;
};
_.walkTokens = function(a, t) {
  return ke.walkTokens(a, t);
};
_.parseInline = ke.parseInline;
_.Parser = Q;
_.parser = Q.parse;
_.Renderer = St;
_.TextRenderer = xn;
_.Lexer = V;
_.lexer = V.lex;
_.Tokenizer = _t;
_.Hooks = Qe;
_.parse = _;
_.options;
_.setOptions;
_.use;
_.walkTokens;
_.parseInline;
Q.parse;
V.lex;
/*! @license DOMPurify 3.4.3 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.3/LICENSE */
function Xn(a, t) {
  (t == null || t > a.length) && (t = a.length);
  for (var e = 0, n = Array(t); e < t; e++) n[e] = a[e];
  return n;
}
function Di(a) {
  if (Array.isArray(a)) return a;
}
function Mi(a, t) {
  var e = a == null ? null : typeof Symbol < "u" && a[Symbol.iterator] || a["@@iterator"];
  if (e != null) {
    var n, s, i, o, l = [], c = !0, h = !1;
    try {
      if (i = (e = e.call(a)).next, t !== 0) for (; !(c = (n = i.call(e)).done) && (l.push(n.value), l.length !== t); c = !0) ;
    } catch (f) {
      h = !0, s = f;
    } finally {
      try {
        if (!c && e.return != null && (o = e.return(), Object(o) !== o)) return;
      } finally {
        if (h) throw s;
      }
    }
    return l;
  }
}
function zi() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function $i(a, t) {
  return Di(a) || Mi(a, t) || Pi(a, t) || zi();
}
function Pi(a, t) {
  if (a) {
    if (typeof a == "string") return Xn(a, t);
    var e = {}.toString.call(a).slice(8, -1);
    return e === "Object" && a.constructor && (e = a.constructor.name), e === "Map" || e === "Set" ? Array.from(a) : e === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e) ? Xn(a, t) : void 0;
  }
}
const ws = Object.entries, Vn = Object.setPrototypeOf, Fi = Object.isFrozen, Ui = Object.getPrototypeOf, Bi = Object.getOwnPropertyDescriptor;
let G = Object.freeze, K = Object.seal, ve = Object.create, Ts = typeof Reflect < "u" && Reflect, Kt = Ts.apply, Jt = Ts.construct;
G || (G = function(t) {
  return t;
});
K || (K = function(t) {
  return t;
});
Kt || (Kt = function(t, e) {
  for (var n = arguments.length, s = new Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++)
    s[i - 2] = arguments[i];
  return t.apply(e, s);
});
Jt || (Jt = function(t) {
  for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), s = 1; s < e; s++)
    n[s - 1] = arguments[s];
  return new t(...n);
});
const Ae = N(Array.prototype.forEach), Hi = N(Array.prototype.lastIndexOf), Qn = N(Array.prototype.pop), Se = N(Array.prototype.push), Gi = N(Array.prototype.splice), H = Array.isArray, We = N(String.prototype.toLowerCase), Wt = N(String.prototype.toString), Kn = N(String.prototype.match), Re = N(String.prototype.replace), Jn = N(String.prototype.indexOf), ji = N(String.prototype.trim), qi = N(Number.prototype.toString), Wi = N(Boolean.prototype.toString), es = typeof BigInt > "u" ? null : N(BigInt.prototype.toString), ts = typeof Symbol > "u" ? null : N(Symbol.prototype.toString), v = N(Object.prototype.hasOwnProperty), je = N(Object.prototype.toString), U = N(RegExp.prototype.test), bt = Zi(TypeError);
function N(a) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), s = 1; s < e; s++)
      n[s - 1] = arguments[s];
    return Kt(a, t, n);
  };
}
function Zi(a) {
  return function() {
    for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
      e[n] = arguments[n];
    return Jt(a, e);
  };
}
function T(a, t) {
  let e = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : We;
  if (Vn && Vn(a, null), !H(t))
    return a;
  let n = t.length;
  for (; n--; ) {
    let s = t[n];
    if (typeof s == "string") {
      const i = e(s);
      i !== s && (Fi(t) || (t[n] = i), s = i);
    }
    a[s] = !0;
  }
  return a;
}
function Yi(a) {
  for (let t = 0; t < a.length; t++)
    v(a, t) || (a[t] = null);
  return a;
}
function q(a) {
  const t = ve(null);
  for (const n of ws(a)) {
    var e = $i(n, 2);
    const s = e[0], i = e[1];
    v(a, s) && (H(i) ? t[s] = Yi(i) : i && typeof i == "object" && i.constructor === Object ? t[s] = q(i) : t[s] = i);
  }
  return t;
}
function Xi(a) {
  switch (typeof a) {
    case "string":
      return a;
    case "number":
      return qi(a);
    case "boolean":
      return Wi(a);
    case "bigint":
      return es ? es(a) : "0";
    case "symbol":
      return ts ? ts(a) : "Symbol()";
    case "undefined":
      return je(a);
    case "function":
    case "object": {
      if (a === null)
        return je(a);
      const t = a, e = Le(t, "toString");
      if (typeof e == "function") {
        const n = e(t);
        return typeof n == "string" ? n : je(n);
      }
      return je(a);
    }
    default:
      return je(a);
  }
}
function Le(a, t) {
  for (; a !== null; ) {
    const n = Bi(a, t);
    if (n) {
      if (n.get)
        return N(n.get);
      if (typeof n.value == "function")
        return N(n.value);
    }
    a = Ui(a);
  }
  function e() {
    return null;
  }
  return e;
}
function Vi(a) {
  try {
    return U(a, ""), !0;
  } catch {
    return !1;
  }
}
const ns = G(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), Zt = G(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), Yt = G(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Qi = G(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), Xt = G(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Ki = G(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), ss = G(["#text"]), is = G(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]), Vt = G(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), rs = G(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), xt = G(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Ji = K(/{{[\w\W]*|^[\w\W]*}}/g), er = K(/<%[\w\W]*|^[\w\W]*%>/g), tr = K(/\${[\w\W]*/g), nr = K(/^data-[\-\w.\u00B7-\uFFFF]+$/), sr = K(/^aria-[\-\w]+$/), os = K(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), ir = K(/^(?:\w+script|data):/i), rr = K(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), or = K(/^html$/i), ar = K(/^[a-z][.\w]*(-[.\w]+)+$/i), Ie = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, lr = function() {
  return typeof window > "u" ? null : window;
}, cr = function(t, e) {
  if (typeof t != "object" || typeof t.createPolicy != "function")
    return null;
  let n = null;
  const s = "data-tt-policy-suffix";
  e && e.hasAttribute(s) && (n = e.getAttribute(s));
  const i = "dompurify" + (n ? "#" + n : "");
  try {
    return t.createPolicy(i, {
      createHTML(o) {
        return o;
      },
      createScriptURL(o) {
        return o;
      }
    });
  } catch {
    return console.warn("TrustedTypes policy " + i + " could not be created."), null;
  }
}, as = function() {
  return {
    afterSanitizeAttributes: [],
    afterSanitizeElements: [],
    afterSanitizeShadowDOM: [],
    beforeSanitizeAttributes: [],
    beforeSanitizeElements: [],
    beforeSanitizeShadowDOM: [],
    uponSanitizeAttribute: [],
    uponSanitizeElement: [],
    uponSanitizeShadowNode: []
  };
};
function ys() {
  let a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : lr();
  const t = (b) => ys(b);
  if (t.version = "3.4.3", t.removed = [], !a || !a.document || a.document.nodeType !== Ie.document || !a.Element)
    return t.isSupported = !1, t;
  let e = a.document;
  const n = e, s = n.currentScript, i = a.DocumentFragment, o = a.HTMLTemplateElement, l = a.Node, c = a.Element, h = a.NodeFilter, f = a.NamedNodeMap, g = f === void 0 ? a.NamedNodeMap || a.MozNamedAttrMap : f, k = a.HTMLFormElement, w = a.DOMParser, y = a.trustedTypes, I = c.prototype, Y = Le(I, "cloneNode"), $e = Le(I, "remove"), rt = Le(I, "nextSibling"), ot = Le(I, "childNodes"), pe = Le(I, "parentNode");
  if (typeof o == "function") {
    const b = e.createElement("template");
    b.content && b.content.ownerDocument && (e = b.content.ownerDocument);
  }
  let P, oe = "";
  const ne = e, vt = ne.implementation, $s = ne.createNodeIterator, Ps = ne.createDocumentFragment, Fs = ne.getElementsByTagName, Us = n.importNode;
  let B = as();
  t.isSupported = typeof ws == "function" && typeof pe == "function" && vt && vt.createHTMLDocument !== void 0;
  const at = Ji, lt = er, ct = tr, Bs = nr, Hs = sr, Gs = ir, kn = rr, js = ar;
  let wn = os, M = null;
  const Tn = T({}, [...ns, ...Zt, ...Yt, ...Xt, ...ss]);
  let F = null;
  const yn = T({}, [...is, ...Vt, ...rs, ...xt]);
  let L = Object.seal(ve(null, {
    tagNameCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    attributeNameCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    allowCustomizedBuiltInElements: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: !1
    }
  })), Pe = null, ut = null;
  const le = Object.seal(ve(null, {
    tagCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    },
    attributeCheck: {
      writable: !0,
      configurable: !1,
      enumerable: !0,
      value: null
    }
  }));
  let En = !0, Lt = !0, _n = !1, An = !0, he = !1, Fe = !0, fe = !1, Ct = !1, Ot = !1, Te = !1, pt = !1, ht = !1, Sn = !0, Rn = !1;
  const In = "user-content-";
  let Nt = !0, Ue = !1, ye = {}, se = null;
  const Dt = T({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let vn = null;
  const Ln = T({}, ["audio", "video", "img", "source", "image", "track"]);
  let Mt = null;
  const Cn = T({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), ft = "http://www.w3.org/1998/Math/MathML", dt = "http://www.w3.org/2000/svg", ie = "http://www.w3.org/1999/xhtml";
  let Ee = ie, zt = !1, $t = null;
  const qs = T({}, [ft, dt, ie], Wt);
  let Pt = T({}, ["mi", "mo", "mn", "ms", "mtext"]), Ft = T({}, ["annotation-xml"]);
  const Ws = T({}, ["title", "style", "font", "a", "script"]);
  let Be = null;
  const Zs = ["application/xhtml+xml", "text/html"], Ys = "text/html";
  let D = null, _e = null;
  const Xs = e.createElement("form"), On = function(r) {
    return r instanceof RegExp || r instanceof Function;
  }, Ut = function() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (_e && _e === r)
      return;
    (!r || typeof r != "object") && (r = {}), r = q(r), Be = // eslint-disable-next-line unicorn/prefer-includes
    Zs.indexOf(r.PARSER_MEDIA_TYPE) === -1 ? Ys : r.PARSER_MEDIA_TYPE, D = Be === "application/xhtml+xml" ? Wt : We, M = v(r, "ALLOWED_TAGS") && H(r.ALLOWED_TAGS) ? T({}, r.ALLOWED_TAGS, D) : Tn, F = v(r, "ALLOWED_ATTR") && H(r.ALLOWED_ATTR) ? T({}, r.ALLOWED_ATTR, D) : yn, $t = v(r, "ALLOWED_NAMESPACES") && H(r.ALLOWED_NAMESPACES) ? T({}, r.ALLOWED_NAMESPACES, Wt) : qs, Mt = v(r, "ADD_URI_SAFE_ATTR") && H(r.ADD_URI_SAFE_ATTR) ? T(q(Cn), r.ADD_URI_SAFE_ATTR, D) : Cn, vn = v(r, "ADD_DATA_URI_TAGS") && H(r.ADD_DATA_URI_TAGS) ? T(q(Ln), r.ADD_DATA_URI_TAGS, D) : Ln, se = v(r, "FORBID_CONTENTS") && H(r.FORBID_CONTENTS) ? T({}, r.FORBID_CONTENTS, D) : Dt, Pe = v(r, "FORBID_TAGS") && H(r.FORBID_TAGS) ? T({}, r.FORBID_TAGS, D) : q({}), ut = v(r, "FORBID_ATTR") && H(r.FORBID_ATTR) ? T({}, r.FORBID_ATTR, D) : q({}), ye = v(r, "USE_PROFILES") ? r.USE_PROFILES && typeof r.USE_PROFILES == "object" ? q(r.USE_PROFILES) : r.USE_PROFILES : !1, En = r.ALLOW_ARIA_ATTR !== !1, Lt = r.ALLOW_DATA_ATTR !== !1, _n = r.ALLOW_UNKNOWN_PROTOCOLS || !1, An = r.ALLOW_SELF_CLOSE_IN_ATTR !== !1, he = r.SAFE_FOR_TEMPLATES || !1, Fe = r.SAFE_FOR_XML !== !1, fe = r.WHOLE_DOCUMENT || !1, Te = r.RETURN_DOM || !1, pt = r.RETURN_DOM_FRAGMENT || !1, ht = r.RETURN_TRUSTED_TYPE || !1, Ot = r.FORCE_BODY || !1, Sn = r.SANITIZE_DOM !== !1, Rn = r.SANITIZE_NAMED_PROPS || !1, Nt = r.KEEP_CONTENT !== !1, Ue = r.IN_PLACE || !1, wn = Vi(r.ALLOWED_URI_REGEXP) ? r.ALLOWED_URI_REGEXP : os, Ee = typeof r.NAMESPACE == "string" ? r.NAMESPACE : ie, Pt = v(r, "MATHML_TEXT_INTEGRATION_POINTS") && r.MATHML_TEXT_INTEGRATION_POINTS && typeof r.MATHML_TEXT_INTEGRATION_POINTS == "object" ? q(r.MATHML_TEXT_INTEGRATION_POINTS) : T({}, ["mi", "mo", "mn", "ms", "mtext"]), Ft = v(r, "HTML_INTEGRATION_POINTS") && r.HTML_INTEGRATION_POINTS && typeof r.HTML_INTEGRATION_POINTS == "object" ? q(r.HTML_INTEGRATION_POINTS) : T({}, ["annotation-xml"]);
    const u = v(r, "CUSTOM_ELEMENT_HANDLING") && r.CUSTOM_ELEMENT_HANDLING && typeof r.CUSTOM_ELEMENT_HANDLING == "object" ? q(r.CUSTOM_ELEMENT_HANDLING) : ve(null);
    if (L = ve(null), v(u, "tagNameCheck") && On(u.tagNameCheck) && (L.tagNameCheck = u.tagNameCheck), v(u, "attributeNameCheck") && On(u.attributeNameCheck) && (L.attributeNameCheck = u.attributeNameCheck), v(u, "allowCustomizedBuiltInElements") && typeof u.allowCustomizedBuiltInElements == "boolean" && (L.allowCustomizedBuiltInElements = u.allowCustomizedBuiltInElements), he && (Lt = !1), pt && (Te = !0), ye && (M = T({}, ss), F = ve(null), ye.html === !0 && (T(M, ns), T(F, is)), ye.svg === !0 && (T(M, Zt), T(F, Vt), T(F, xt)), ye.svgFilters === !0 && (T(M, Yt), T(F, Vt), T(F, xt)), ye.mathMl === !0 && (T(M, Xt), T(F, rs), T(F, xt))), le.tagCheck = null, le.attributeCheck = null, v(r, "ADD_TAGS") && (typeof r.ADD_TAGS == "function" ? le.tagCheck = r.ADD_TAGS : H(r.ADD_TAGS) && (M === Tn && (M = q(M)), T(M, r.ADD_TAGS, D))), v(r, "ADD_ATTR") && (typeof r.ADD_ATTR == "function" ? le.attributeCheck = r.ADD_ATTR : H(r.ADD_ATTR) && (F === yn && (F = q(F)), T(F, r.ADD_ATTR, D))), v(r, "ADD_URI_SAFE_ATTR") && H(r.ADD_URI_SAFE_ATTR) && T(Mt, r.ADD_URI_SAFE_ATTR, D), v(r, "FORBID_CONTENTS") && H(r.FORBID_CONTENTS) && (se === Dt && (se = q(se)), T(se, r.FORBID_CONTENTS, D)), v(r, "ADD_FORBID_CONTENTS") && H(r.ADD_FORBID_CONTENTS) && (se === Dt && (se = q(se)), T(se, r.ADD_FORBID_CONTENTS, D)), Nt && (M["#text"] = !0), fe && T(M, ["html", "head", "body"]), M.table && (T(M, ["tbody"]), delete Pe.tbody), r.TRUSTED_TYPES_POLICY) {
      if (typeof r.TRUSTED_TYPES_POLICY.createHTML != "function")
        throw bt('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      if (typeof r.TRUSTED_TYPES_POLICY.createScriptURL != "function")
        throw bt('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      P = r.TRUSTED_TYPES_POLICY, oe = P.createHTML("");
    } else
      P === void 0 && (P = cr(y, s)), P !== null && typeof oe == "string" && (oe = P.createHTML(""));
    G && G(r), _e = r;
  }, Nn = T({}, [...Zt, ...Yt, ...Qi]), Dn = T({}, [...Xt, ...Ki]), Vs = function(r) {
    let u = pe(r);
    (!u || !u.tagName) && (u = {
      namespaceURI: Ee,
      tagName: "template"
    });
    const m = We(r.tagName), E = We(u.tagName);
    return $t[r.namespaceURI] ? r.namespaceURI === dt ? u.namespaceURI === ie ? m === "svg" : u.namespaceURI === ft ? m === "svg" && (E === "annotation-xml" || Pt[E]) : !!Nn[m] : r.namespaceURI === ft ? u.namespaceURI === ie ? m === "math" : u.namespaceURI === dt ? m === "math" && Ft[E] : !!Dn[m] : r.namespaceURI === ie ? u.namespaceURI === dt && !Ft[E] || u.namespaceURI === ft && !Pt[E] ? !1 : !Dn[m] && (Ws[m] || !Nn[m]) : !!(Be === "application/xhtml+xml" && $t[r.namespaceURI]) : !1;
  }, J = function(r) {
    Se(t.removed, {
      element: r
    });
    try {
      pe(r).removeChild(r);
    } catch {
      $e(r);
    }
  }, de = function(r, u) {
    try {
      Se(t.removed, {
        attribute: u.getAttributeNode(r),
        from: u
      });
    } catch {
      Se(t.removed, {
        attribute: null,
        from: u
      });
    }
    if (u.removeAttribute(r), r === "is")
      if (Te || pt)
        try {
          J(u);
        } catch {
        }
      else
        try {
          u.setAttribute(r, "");
        } catch {
        }
  }, Mn = function(r) {
    let u = null, m = null;
    if (Ot)
      r = "<remove></remove>" + r;
    else {
      const O = Kn(r, /^[\r\n\t ]+/);
      m = O && O[0];
    }
    Be === "application/xhtml+xml" && Ee === ie && (r = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + r + "</body></html>");
    const E = P ? P.createHTML(r) : r;
    if (Ee === ie)
      try {
        u = new w().parseFromString(E, Be);
      } catch {
      }
    if (!u || !u.documentElement) {
      u = vt.createDocument(Ee, "template", null);
      try {
        u.documentElement.innerHTML = zt ? oe : E;
      } catch {
      }
    }
    const z = u.body || u.documentElement;
    return r && m && z.insertBefore(e.createTextNode(m), z.childNodes[0] || null), Ee === ie ? Fs.call(u, fe ? "html" : "body")[0] : fe ? u.documentElement : z;
  }, zn = function(r) {
    return $s.call(
      r.ownerDocument || r,
      r,
      // eslint-disable-next-line no-bitwise
      h.SHOW_ELEMENT | h.SHOW_COMMENT | h.SHOW_TEXT | h.SHOW_PROCESSING_INSTRUCTION | h.SHOW_CDATA_SECTION,
      null
    );
  }, Bt = function(r) {
    return r instanceof k && (typeof r.nodeName != "string" || typeof r.textContent != "string" || typeof r.removeChild != "function" || !(r.attributes instanceof g) || typeof r.removeAttribute != "function" || typeof r.setAttribute != "function" || typeof r.namespaceURI != "string" || typeof r.insertBefore != "function" || typeof r.hasChildNodes != "function");
  }, Ht = function(r) {
    return typeof l == "function" && r instanceof l;
  };
  function ae(b, r, u) {
    Ae(b, (m) => {
      m.call(t, r, u, _e);
    });
  }
  const $n = function(r) {
    let u = null;
    if (ae(B.beforeSanitizeElements, r, null), Bt(r))
      return J(r), !0;
    const m = D(r.nodeName);
    if (ae(B.uponSanitizeElement, r, {
      tagName: m,
      allowedTags: M
    }), Fe && r.hasChildNodes() && !Ht(r.firstElementChild) && U(/<[/\w!]/g, r.innerHTML) && U(/<[/\w!]/g, r.textContent) || Fe && r.namespaceURI === ie && m === "style" && Ht(r.firstElementChild) || r.nodeType === Ie.progressingInstruction || Fe && r.nodeType === Ie.comment && U(/<[/\w]/g, r.data))
      return J(r), !0;
    if (Pe[m] || !(le.tagCheck instanceof Function && le.tagCheck(m)) && !M[m]) {
      if (!Pe[m] && Fn(m) && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, m) || L.tagNameCheck instanceof Function && L.tagNameCheck(m)))
        return !1;
      if (Nt && !se[m]) {
        const E = pe(r) || r.parentNode, z = ot(r) || r.childNodes;
        if (z && E) {
          const O = z.length;
          for (let j = O - 1; j >= 0; --j) {
            const X = Y(z[j], !0);
            E.insertBefore(X, rt(r));
          }
        }
      }
      return J(r), !0;
    }
    return r instanceof c && !Vs(r) || (m === "noscript" || m === "noembed" || m === "noframes") && U(/<\/no(script|embed|frames)/i, r.innerHTML) ? (J(r), !0) : (he && r.nodeType === Ie.text && (u = r.textContent, Ae([at, lt, ct], (E) => {
      u = Re(u, E, " ");
    }), r.textContent !== u && (Se(t.removed, {
      element: r.cloneNode()
    }), r.textContent = u)), ae(B.afterSanitizeElements, r, null), !1);
  }, Pn = function(r, u, m) {
    if (ut[u] || Sn && (u === "id" || u === "name") && (m in e || m in Xs))
      return !1;
    const E = F[u] || le.attributeCheck instanceof Function && le.attributeCheck(u, r);
    if (!(Lt && !ut[u] && U(Bs, u))) {
      if (!(En && U(Hs, u))) {
        if (!E || ut[u]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(Fn(r) && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, r) || L.tagNameCheck instanceof Function && L.tagNameCheck(r)) && (L.attributeNameCheck instanceof RegExp && U(L.attributeNameCheck, u) || L.attributeNameCheck instanceof Function && L.attributeNameCheck(u, r)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            u === "is" && L.allowCustomizedBuiltInElements && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, m) || L.tagNameCheck instanceof Function && L.tagNameCheck(m)))
          ) return !1;
        } else if (!Mt[u]) {
          if (!U(wn, Re(m, kn, ""))) {
            if (!((u === "src" || u === "xlink:href" || u === "href") && r !== "script" && Jn(m, "data:") === 0 && vn[r])) {
              if (!(_n && !U(Gs, Re(m, kn, "")))) {
                if (m)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Qs = T({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]), Fn = function(r) {
    return !Qs[We(r)] && U(js, r);
  }, Un = function(r) {
    ae(B.beforeSanitizeAttributes, r, null);
    const u = r.attributes;
    if (!u || Bt(r))
      return;
    const m = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: F,
      forceKeepAttr: void 0
    };
    let E = u.length;
    for (; E--; ) {
      const z = u[E], O = z.name, j = z.namespaceURI, X = z.value, ee = D(O), jt = X;
      let $ = O === "value" ? jt : ji(jt);
      if (m.attrName = ee, m.attrValue = $, m.keepAttr = !0, m.forceKeepAttr = void 0, ae(B.uponSanitizeAttribute, r, m), $ = m.attrValue, Rn && (ee === "id" || ee === "name") && Jn($, In) !== 0 && (de(O, r), $ = In + $), Fe && U(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, $)) {
        de(O, r);
        continue;
      }
      if (ee === "attributename" && Kn($, "href")) {
        de(O, r);
        continue;
      }
      if (m.forceKeepAttr)
        continue;
      if (!m.keepAttr) {
        de(O, r);
        continue;
      }
      if (!An && U(/\/>/i, $)) {
        de(O, r);
        continue;
      }
      he && Ae([at, lt, ct], (Hn) => {
        $ = Re($, Hn, " ");
      });
      const Bn = D(r.nodeName);
      if (!Pn(Bn, ee, $)) {
        de(O, r);
        continue;
      }
      if (P && typeof y == "object" && typeof y.getAttributeType == "function" && !j)
        switch (y.getAttributeType(Bn, ee)) {
          case "TrustedHTML": {
            $ = P.createHTML($);
            break;
          }
          case "TrustedScriptURL": {
            $ = P.createScriptURL($);
            break;
          }
        }
      if ($ !== jt)
        try {
          j ? r.setAttributeNS(j, O, $) : r.setAttribute(O, $), Bt(r) ? J(r) : Qn(t.removed);
        } catch {
          de(O, r);
        }
    }
    ae(B.afterSanitizeAttributes, r, null);
  }, Gt = function(r) {
    let u = null;
    const m = zn(r);
    for (ae(B.beforeSanitizeShadowDOM, r, null); u = m.nextNode(); )
      ae(B.uponSanitizeShadowNode, u, null), $n(u), Un(u), u.content instanceof i && Gt(u.content);
    ae(B.afterSanitizeShadowDOM, r, null);
  }, mt = function(r) {
    if (r.nodeType === Ie.element && r.shadowRoot instanceof i) {
      const E = r.shadowRoot;
      mt(E), Gt(E);
    }
    const u = r.childNodes;
    if (!u)
      return;
    const m = [];
    Ae(u, (E) => {
      Se(m, E);
    });
    for (const E of m)
      mt(E);
  };
  return t.sanitize = function(b) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, u = null, m = null, E = null, z = null;
    if (zt = !b, zt && (b = "<!-->"), typeof b != "string" && !Ht(b) && (b = Xi(b), typeof b != "string"))
      throw bt("dirty is not a string, aborting");
    if (!t.isSupported)
      return b;
    if (Ct || Ut(r), t.removed = [], typeof b == "string" && (Ue = !1), Ue) {
      const X = b.nodeName;
      if (typeof X == "string") {
        const ee = D(X);
        if (!M[ee] || Pe[ee])
          throw bt("root node is forbidden and cannot be sanitized in-place");
      }
      mt(b);
    } else if (b instanceof l)
      u = Mn("<!---->"), m = u.ownerDocument.importNode(b, !0), m.nodeType === Ie.element && m.nodeName === "BODY" || m.nodeName === "HTML" ? u = m : u.appendChild(m), mt(m);
    else {
      if (!Te && !he && !fe && // eslint-disable-next-line unicorn/prefer-includes
      b.indexOf("<") === -1)
        return P && ht ? P.createHTML(b) : b;
      if (u = Mn(b), !u)
        return Te ? null : ht ? oe : "";
    }
    u && Ot && J(u.firstChild);
    const O = zn(Ue ? b : u);
    for (; E = O.nextNode(); )
      $n(E), Un(E), E.content instanceof i && Gt(E.content);
    if (Ue)
      return b;
    if (Te) {
      if (he) {
        u.normalize();
        let X = u.innerHTML;
        Ae([at, lt, ct], (ee) => {
          X = Re(X, ee, " ");
        }), u.innerHTML = X;
      }
      if (pt)
        for (z = Ps.call(u.ownerDocument); u.firstChild; )
          z.appendChild(u.firstChild);
      else
        z = u;
      return (F.shadowroot || F.shadowrootmode) && (z = Us.call(n, z, !0)), z;
    }
    let j = fe ? u.outerHTML : u.innerHTML;
    return fe && M["!doctype"] && u.ownerDocument && u.ownerDocument.doctype && u.ownerDocument.doctype.name && U(or, u.ownerDocument.doctype.name) && (j = "<!DOCTYPE " + u.ownerDocument.doctype.name + `>
` + j), he && Ae([at, lt, ct], (X) => {
      j = Re(j, X, " ");
    }), P && ht ? P.createHTML(j) : j;
  }, t.setConfig = function() {
    let b = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Ut(b), Ct = !0;
  }, t.clearConfig = function() {
    _e = null, Ct = !1;
  }, t.isValidAttribute = function(b, r, u) {
    _e || Ut({});
    const m = D(b), E = D(r);
    return Pn(m, E, u);
  }, t.addHook = function(b, r) {
    typeof r == "function" && Se(B[b], r);
  }, t.removeHook = function(b, r) {
    if (r !== void 0) {
      const u = Hi(B[b], r);
      return u === -1 ? void 0 : Gi(B[b], u, 1)[0];
    }
    return Qn(B[b]);
  }, t.removeHooks = function(b) {
    B[b] = [];
  }, t.removeAllHooks = function() {
    B = as();
  }, t;
}
var ur = ys(), De;
class pr {
  constructor() {
    C(this, De);
    R(this, De, ur), x(this, De).addHook("afterSanitizeAttributes", (t) => {
      t.tagName === "A" && (t.setAttribute("rel", "noopener noreferrer"), t.setAttribute("target", "_blank"));
    });
  }
  render(t) {
    const e = _.parse(t, { async: !1 });
    return x(this, De).sanitize(e, {
      ALLOWED_TAGS: [
        "p",
        "br",
        "strong",
        "em",
        "code",
        "pre",
        "blockquote",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "a",
        "hr",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td"
      ],
      ALLOWED_ATTR: ["href", "rel", "target"],
      ALLOW_DATA_ATTR: !1
    });
  }
}
De = new WeakMap();
const ls = (a) => `chatbot_open_${a}`, qe = (a) => `chatbot_conversation_${a}`, hr = `
:host {
  --chatbot-primary: #6366f1;
  --chatbot-on-primary: #ffffff;
  --chatbot-surface: #ffffff;
  --chatbot-on-surface: #1f2937;
  --chatbot-radius: 12px;
  --chatbot-font: system-ui, sans-serif;
  --chatbot-shadow: 0 8px 32px rgba(0,0,0,0.16);
  --chatbot-z-index: 9999;
  font-family: var(--chatbot-font);
}
.launcher {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
  border: none;
  cursor: pointer;
  box-shadow: var(--chatbot-shadow);
  z-index: var(--chatbot-z-index);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.launcher.bottom-left { right: auto; left: 24px; }
.panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 380px;
  max-height: 560px;
  border-radius: var(--chatbot-radius);
  background: var(--chatbot-surface);
  color: var(--chatbot-on-surface);
  box-shadow: var(--chatbot-shadow);
  z-index: var(--chatbot-z-index);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel.bottom-left { right: auto; left: 24px; }
.panel.inline {
  position: static;
  width: 100%;
  max-height: 560px;
  border-radius: var(--chatbot-radius);
  box-shadow: var(--chatbot-shadow);
}
.panel[hidden] { display: none !important; }
.header {
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
.new-chat {
  background: none;
  border: 1px solid var(--chatbot-on-primary);
  color: var(--chatbot-on-primary);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.message { padding: 8px 12px; border-radius: 8px; max-width: 85%; }
.message-user {
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
  align-self: flex-end;
}
.message-assistant {
  background: #f3f4f6;
  align-self: flex-start;
}
.context-summary {
  font-size: 11px;
  color: #6b7280;
  padding: 2px 0 4px;
  align-self: flex-start;
}
.extractor-chip {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 9999px;
  padding: 2px 10px;
  align-self: flex-end;
  max-width: fit-content;
}
.tool-status {
  font-size: 12px;
  color: #374151;
  background: #e5e7eb;
  border-radius: 9999px;
  padding: 4px 12px;
  align-self: flex-start;
  max-width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tool-status[hidden] {
  display: none;
}
.tool-status-spinner {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #6b7280;
  animation: tool-status-pulse 1s ease-in-out infinite;
}
@keyframes tool-status-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
}
.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #6b7280;
  animation: tool-status-pulse 1s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  align-self: flex-start;
}
.action-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 11px;
  color: #6b7280;
}
.action-btn:hover { background: #f3f4f6; }
.error-msg {
  background: #fee2e2;
  color: #991b1b;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.retry-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.quota-msg { background: #fef3c7; color: #92400e; align-self: stretch; }
.input-row {
  display: flex;
  padding: 8px;
  gap: 8px;
  border-top: 1px solid #e5e7eb;
}
.input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px;
  font-family: var(--chatbot-font);
  font-size: 14px;
  resize: none;
  min-height: 36px;
  max-height: 120px;
}
.send-button {
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 14px;
}
.send-button:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 480px) {
  .panel {
    position: fixed;
    inset: 0;
    width: 100%;
    max-height: 100%;
    border-radius: 0;
    bottom: 0;
    right: 0;
  }
  .launcher { bottom: 16px; right: 16px; }
}
`;
var W, et, re, Me, ge, tt, ce, te, be, xe, ze, ue, nt, p, tn, Es, _s, nn, sn, Ce, Ze, rn, As, Ss, Ye, Rs, Is, Xe, on, kt, vs, Ls, an, ln, Cs, cn, wt, un, Os, pn, Ns, Tt, yt, Ds, Ms, zs, Et;
const Oe = class Oe extends HTMLElement {
  constructor() {
    super();
    C(this, p);
    C(this, W);
    C(this, et, new pr());
    C(this, re, !1);
    C(this, Me, !1);
    C(this, ge, null);
    C(this, tt, null);
    C(this, ce, null);
    C(this, te, null);
    C(this, be, null);
    C(this, xe, null);
    C(this, ze, null);
    C(this, ue, /* @__PURE__ */ new Map());
    R(this, W, this.attachShadow({ mode: "open" }));
  }
  registerClientExtractor(e, n, s = {}) {
    if (x(Oe, nt).includes(e))
      throw new Error(
        `Client extractor name '${e}' is reserved and cannot be registered by hosts.`
      );
    d(this, p, tn).call(this, e, n, s);
  }
  get channel() {
    return this.getAttribute("channel") || "default";
  }
  get position() {
    return this.getAttribute("position") || "bottom-right";
  }
  get title() {
    return this.getAttribute("title") || "Chat";
  }
  connectedCallback() {
    d(this, p, nn).call(this), d(this, p, Ss).call(this), d(this, p, Rs).call(this), this.addEventListener("tool_started", (e) => d(this, p, Cs).call(this, e.detail.name)), this.addEventListener("tool_finished", () => d(this, p, un).call(this)), this.addEventListener("tool_failed", () => d(this, p, un).call(this)), queueMicrotask(() => {
      this._registerBuiltinExtractors(), d(this, p, _s).call(this);
    });
  }
  _registerBuiltinExtractors() {
    d(this, p, Tt).call(this, this.getAttribute("signed-context")).includes("blade-snapshot") && !x(this, ue).has("blade-snapshot") && d(this, p, tn).call(this, "blade-snapshot", () => d(this, p, Es).call(this), { description: "Page snapshot" });
  }
  attributeChangedCallback() {
    x(this, W).innerHTML && d(this, p, nn).call(this);
  }
};
W = new WeakMap(), et = new WeakMap(), re = new WeakMap(), Me = new WeakMap(), ge = new WeakMap(), tt = new WeakMap(), ce = new WeakMap(), te = new WeakMap(), be = new WeakMap(), xe = new WeakMap(), ze = new WeakMap(), ue = new WeakMap(), nt = new WeakMap(), p = new WeakSet(), tn = function(e, n, s = {}) {
  x(this, ue).set(e, { fn: n, description: s.description });
}, Es = function() {
  const e = document.querySelectorAll("[data-chatbot-snapshot]");
  if (e.length === 0) return "";
  const n = /* @__PURE__ */ new Map(), s = [], i = /^[a-z][a-z0-9_-]*$/;
  for (const l of e) {
    const c = l.getAttribute("data-chatbot-snapshot") ?? "";
    if (!i.test(c)) {
      console.warn(`@chatbotSnapshot label '${c}' is invalid; section dropped.`);
      continue;
    }
    const h = (l.innerText ?? l.textContent ?? "").trim();
    h && (n.has(c) || (n.set(c, []), s.push(c)), n.get(c).push(h));
  }
  return s.map((l) => `## ${l}

${n.get(l).join(`

`)}`).join(`

`);
}, _s = function() {
  const e = d(this, p, Tt).call(this, this.getAttribute("signed-context"));
  for (const n of e)
    if (!x(this, ue).has(n)) {
      if (x(Oe, nt).includes(n)) {
        console.error(
          `Built-in client extractor '${n}' is in the signed allowlist but was not registered at boot — likely a widget bundle mismatch after an upgrade. Page content for '${n}' will not be sent.`
        );
        continue;
      }
      console.error(
        `Client extractor '${n}' is in the signed allowlist but has no matching JS registration on the widget.`
      );
    }
}, nn = function() {
  const e = document.createElement("style");
  e.textContent = hr;
  const n = this.position === "inline";
  if (x(this, W).innerHTML = "", x(this, W).appendChild(e), !n) {
    const k = document.createElement("button");
    k.className = `launcher ${this.position}`, k.part = "launcher", k.innerHTML = "💬", k.setAttribute("aria-label", "Open chat"), k.addEventListener("click", () => d(this, p, As).call(this)), x(this, W).appendChild(k);
  }
  const s = document.createElement("div");
  s.className = `panel ${n ? "inline" : this.position}`, s.part = "panel", !n && !x(this, re) && (s.hidden = !0);
  const i = document.createElement("div");
  i.className = "header", i.part = "header", i.innerHTML = `<span>${this.title}</span>`;
  const o = document.createElement("button");
  o.className = "new-chat", o.textContent = "New chat", o.addEventListener("click", () => d(this, p, Is).call(this)), i.appendChild(o), s.appendChild(i);
  const l = document.createElement("div");
  l.className = "messages", l.part = "messages", s.appendChild(l);
  const c = document.createElement("div");
  c.className = "tool-status", c.setAttribute("part", "tool-status"), c.hidden = !0, s.appendChild(c), R(this, te, c);
  const h = document.createElement("div");
  h.className = "input-row";
  const f = document.createElement("textarea");
  f.className = "input", f.part = "input", f.placeholder = "Ask a question…", f.rows = 1, f.addEventListener("keydown", (k) => {
    k.key === "Enter" && !k.shiftKey && (k.preventDefault(), d(this, p, Xe).call(this));
  }), h.appendChild(f);
  const g = document.createElement("button");
  g.className = "send-button", g.part = "send-button", g.textContent = "Send", g.addEventListener("click", () => d(this, p, Xe).call(this)), h.appendChild(g), s.appendChild(h), x(this, W).appendChild(s);
}, sn = function() {
  return x(this, W).querySelector(".panel");
}, Ce = function() {
  return x(this, W).querySelector(".messages");
}, Ze = function() {
  return x(this, W).querySelector(".input");
}, rn = function() {
  return x(this, W).querySelector(".send-button");
}, As = function() {
  var n;
  R(this, re, !x(this, re));
  const e = d(this, p, sn).call(this);
  e && (e.hidden = !x(this, re)), localStorage.setItem(ls(this.channel), x(this, re) ? "1" : "0"), x(this, re) && ((n = d(this, p, Ze).call(this)) == null || n.focus());
}, Ss = function() {
  if (localStorage.getItem(ls(this.channel)) === "1") {
    R(this, re, !0);
    const n = d(this, p, sn).call(this);
    n && (n.hidden = !1);
  }
}, Ye = function() {
  const e = d(this, p, yt).call(this, this.getAttribute("signed-context")).g;
  typeof e == "string" && e && d(this, p, kt).call(this, e);
}, Rs = async function() {
  const e = localStorage.getItem(qe(this.channel));
  if (!e) {
    d(this, p, Ye).call(this);
    return;
  }
  try {
    const n = await fetch(`/chatbot/conversations/${e}/messages`);
    if (!n.ok) {
      localStorage.removeItem(qe(this.channel)), d(this, p, Ye).call(this);
      return;
    }
    const { messages: s } = await n.json();
    for (const i of s)
      i.role === "user" ? d(this, p, on).call(this, i.content) : i.role === "assistant" && d(this, p, kt).call(this, i.content);
  } catch {
    d(this, p, Ye).call(this);
  }
}, Is = function() {
  localStorage.removeItem(qe(this.channel));
  const e = d(this, p, Ce).call(this);
  e && (e.innerHTML = ""), R(this, ge, null), R(this, tt, null), R(this, ce, null), d(this, p, Ye).call(this);
}, Xe = async function(e = null) {
  var k;
  if (x(this, Me)) return;
  const n = d(this, p, Ze).call(this), s = e ?? (n == null ? void 0 : n.value.trim());
  if (!s) return;
  e === null && (n.value = ""), d(this, p, on).call(this, s);
  const i = this.getAttribute("signed-context"), o = localStorage.getItem(qe(this.channel)), l = await d(this, p, Ds).call(this, i);
  d(this, p, Ms).call(this), d(this, p, zs).call(this, l), R(this, Me, !0);
  const c = d(this, p, rn).call(this);
  c && (c.disabled = !0);
  const h = d(this, p, kt).call(this, "");
  d(this, p, Os).call(this, h), R(this, tt, h), R(this, ce, null);
  const f = new ei();
  f.addEventListener("chunk", (w) => {
    d(this, p, pn).call(this, h), h.dataset.raw = (h.dataset.raw ?? "") + w.detail.text, h.innerHTML = x(this, et).render(h.dataset.raw);
  }), f.addEventListener("context_summary", (w) => {
    const y = d(this, p, vs).call(this, h);
    y.textContent = w.detail.text;
  }), f.addEventListener("done", (w) => {
    var y;
    d(this, p, pn).call(this, h), (y = w.detail) != null && y.conversationId && localStorage.setItem(qe(this.channel), w.detail.conversationId), d(this, p, Ls).call(this, h), d(this, p, Et).call(this);
  }), f.addEventListener("tool_started", (w) => this.dispatchEvent(new CustomEvent("tool_started", { detail: w.detail }))), f.addEventListener("tool_finished", (w) => this.dispatchEvent(new CustomEvent("tool_finished", { detail: w.detail }))), f.addEventListener("tool_failed", (w) => this.dispatchEvent(new CustomEvent("tool_failed", { detail: w.detail }))), f.addEventListener("error", (w) => {
    d(this, p, ln).call(this, w.detail, h, s, i, o), d(this, p, Et).call(this);
  });
  const g = (k = document.querySelector('meta[name="csrf-token"]')) == null ? void 0 : k.content;
  try {
    await f.connect("/chatbot/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...g ? { "X-CSRF-TOKEN": g } : {}
      },
      body: JSON.stringify({
        message: s,
        signed_context: i,
        ...o ? { conversation_id: o } : {},
        ...l.length ? { extractor_blocks: l } : {}
      })
    });
  } catch {
    d(this, p, ln).call(this, { code: "network_error", message: "Connection failed.", retryable: !0 }, h, s, i, o), d(this, p, Et).call(this);
  }
}, on = function(e) {
  const n = d(this, p, Ce).call(this), s = document.createElement("div");
  return s.className = "message message-user", s.part = "message-user", s.textContent = e, n == null || n.appendChild(s), s.scrollIntoView({ behavior: "smooth" }), R(this, ge, e), s;
}, kt = function(e) {
  const n = d(this, p, Ce).call(this), s = document.createElement("div");
  return s.className = "message message-assistant", s.part = "message-assistant", s.dataset.raw = e, e && (s.innerHTML = x(this, et).render(e)), n == null || n.appendChild(s), s.scrollIntoView({ behavior: "smooth" }), s;
}, vs = function(e) {
  var s;
  if (x(this, ce)) return x(this, ce);
  const n = document.createElement("div");
  return n.className = "context-summary", (s = e.parentElement) == null || s.insertBefore(n, e), R(this, ce, n), n;
}, Ls = function(e) {
  var c;
  const n = document.createElement("div");
  n.className = "message-actions";
  const s = document.createElement("button");
  s.className = "action-btn", s.textContent = "📋 Copy", s.addEventListener("click", () => navigator.clipboard.writeText(e.dataset.raw ?? ""));
  const i = document.createElement("button");
  i.className = "action-btn", i.textContent = "🔄 Regenerate", i.addEventListener("click", () => {
    e.dataset.raw = "", e.innerHTML = "", n.remove(), x(this, ge) && d(this, p, Xe).call(this, x(this, ge));
  });
  const o = document.createElement("button");
  o.className = "action-btn", o.textContent = "👍", o.addEventListener("click", () => d(this, p, an).call(this, e, 1, o, l));
  const l = document.createElement("button");
  l.className = "action-btn", l.textContent = "👎", l.addEventListener("click", () => d(this, p, an).call(this, e, -1, o, l)), n.append(s, i, o, l), (c = e.parentElement) == null || c.insertBefore(n, e.nextSibling);
}, an = async function(e, n, s, i) {
  var c;
  const o = e.dataset.messageId;
  if (!o) return;
  const l = (c = document.querySelector('meta[name="csrf-token"]')) == null ? void 0 : c.content;
  await fetch("/chatbot/messages/" + o + "/rate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...l ? { "X-CSRF-TOKEN": l } : {}
    },
    body: JSON.stringify({ value: n })
  }), s.disabled = !0, i.disabled = !0;
}, ln = function(e, n, s, i, o) {
  const l = d(this, p, Ce).call(this);
  n.remove();
  const c = document.createElement("div");
  if (c.className = "message error-msg", e.code === "quota_exceeded" || e.code === "token_cap_exceeded")
    c.className = "message quota-msg", c.textContent = e.message || "Daily limit reached. Try again later.";
  else if (e.code === "content_blocked")
    c.textContent = e.message || "This message was blocked by content policy.";
  else if (c.textContent = e.message || "Something went wrong.", e.retryable) {
    const h = document.createElement("button");
    h.className = "retry-btn", h.textContent = "Retry", h.addEventListener("click", () => {
      c.remove(), d(this, p, Ze).call(this) && (d(this, p, Ze).call(this).value = s), d(this, p, Xe).call(this);
    }), c.appendChild(h);
  }
  l == null || l.appendChild(c), c.scrollIntoView({ behavior: "smooth" });
}, Cs = function(e) {
  if (!x(this, te)) return;
  d(this, p, wt).call(this), x(this, te).textContent = "";
  const n = document.createElement("span");
  n.className = "tool-status-spinner", n.setAttribute("aria-hidden", "true");
  const s = document.createElement("span");
  s.className = "tool-status-label", x(this, te).appendChild(n), x(this, te).appendChild(s), R(this, ze, s), R(this, xe, Date.now()), d(this, p, cn).call(this, e), R(this, be, setInterval(() => d(this, p, cn).call(this, e), 1e3)), x(this, te).removeAttribute("hidden");
}, cn = function(e) {
  if (!x(this, ze) || x(this, xe) === null) return;
  const n = Math.floor((Date.now() - x(this, xe)) / 1e3), s = Math.floor(n / 60), i = String(n % 60).padStart(2, "0");
  x(this, ze).textContent = `Running ${e}… ${s}:${i}`;
}, wt = function() {
  x(this, be) !== null && (clearInterval(x(this, be)), R(this, be, null));
}, un = function() {
  d(this, p, wt).call(this);
}, Os = function(e) {
  const n = document.createElement("span");
  n.className = "typing-dots", n.setAttribute("part", "typing-dots"), n.setAttribute("aria-label", "Assistant is typing");
  for (let s = 0; s < 3; s++) {
    const i = document.createElement("span");
    i.className = "typing-dot", n.appendChild(i);
  }
  e.appendChild(n);
}, pn = function(e) {
  var n;
  (n = e == null ? void 0 : e.querySelector(".typing-dots")) == null || n.remove();
}, Ns = function() {
  x(this, te) && (d(this, p, wt).call(this), R(this, xe, null), x(this, te).setAttribute("hidden", ""));
}, Tt = function(e) {
  const n = d(this, p, yt).call(this, e).x;
  return Array.isArray(n) ? n : [];
}, // The minted token is `base64url(body).base64url(signature)` — the body is
// the first segment, base64url-encoded with compact keys (g, x, xt, xc, …).
yt = function(e) {
  if (!e) return {};
  const n = e.split(".")[0];
  if (!n) return {};
  try {
    let s = n.replace(/-/g, "+").replace(/_/g, "/");
    s += "=".repeat((4 - s.length % 4) % 4);
    const i = JSON.parse(atob(s));
    return i && typeof i == "object" ? i : {};
  } catch {
    return {};
  }
}, Ds = async function(e) {
  const n = d(this, p, Tt).call(this, e);
  if (n.length === 0) return [];
  this._registerBuiltinExtractors();
  const s = d(this, p, yt).call(this, e), i = Number.isInteger(s.xt) && s.xt > 0 ? s.xt : 250, o = Number.isInteger(s.xc) && s.xc > 0 ? s.xc : 8192;
  return (await Promise.all(n.map(async (c) => {
    const h = x(this, ue).get(c);
    if (!h) return null;
    const f = h.fn;
    try {
      const g = await Promise.race([
        Promise.resolve().then(() => f()),
        new Promise((y, I) => setTimeout(() => I(new Error("__extractor_timeout__")), i))
      ]);
      if (g == null || g === "")
        return console.warn(`Client extractor '${c}' returned empty output; block omitted.`), null;
      let k = String(g);
      const w = new TextEncoder().encode(k);
      if (w.byteLength > o) {
        const y = " [truncated]", I = w.slice(0, Math.max(0, o - y.length));
        k = new TextDecoder("utf-8", { fatal: !1 }).decode(I) + y;
      }
      return { name: c, output: k };
    } catch (g) {
      return g && g.message === "__extractor_timeout__" ? console.warn(`Client extractor '${c}' exceeded ${i}ms timeout; block omitted.`) : console.error(`Client extractor '${c}' threw; block omitted.`, g), null;
    }
  }))).filter((c) => c !== null);
}, Ms = function() {
  x(this, W).querySelectorAll('[part="extractor-chip"]').forEach((e) => e.remove());
}, zs = function(e) {
  if (!e.length) return;
  const n = d(this, p, Ce).call(this);
  if (!n) return;
  const s = e.map((o) => {
    var l;
    return ((l = x(this, ue).get(o.name)) == null ? void 0 : l.description) ?? o.name;
  }), i = document.createElement("div");
  i.className = "extractor-chip", i.setAttribute("part", "extractor-chip"), i.textContent = `Read from page: ${s.join(", ")}`, n.appendChild(i);
}, Et = function() {
  R(this, Me, !1), setTimeout(() => d(this, p, Ns).call(this), 500);
  const e = d(this, p, rn).call(this);
  e && (e.disabled = !1);
}, A(Oe, "observedAttributes", ["channel", "position", "title"]), C(Oe, nt, ["blade-snapshot"]);
let en = Oe;
customElements.define("chatbot-widget", en);
export {
  en as ChatbotWidget
};
