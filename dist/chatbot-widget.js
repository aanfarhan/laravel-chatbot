var Ui = Object.defineProperty;
var vn = (a) => {
  throw TypeError(a);
};
var Hi = (a, t, e) => t in a ? Ui(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var A = (a, t, e) => Hi(a, typeof t != "symbol" ? t + "" : t, e), $t = (a, t, e) => t.has(a) || vn("Cannot " + e);
var T = (a, t, e) => ($t(a, t, "read from private field"), e ? e.call(a) : t.get(a)), F = (a, t, e) => t.has(a) ? vn("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(a) : t.set(a, e), C = (a, t, e, n) => ($t(a, t, "write to private field"), n ? n.call(a, e) : t.set(a, e), e), x = (a, t, e) => ($t(a, t, "access private method"), e);
var Ye, de, Xe, Le, kt, Qn;
class Bi extends EventTarget {
  constructor(e = globalThis.fetch.bind(globalThis)) {
    super();
    F(this, kt);
    F(this, Ye);
    F(this, de, !1);
    F(this, Xe, null);
    F(this, Le, null);
    C(this, Ye, e);
  }
  abort() {
    var e;
    C(this, de, !0), (e = T(this, Xe)) == null || e.cancel();
  }
  async connect(e, n = {}) {
    C(this, de, !1);
    const s = (await T(this, Ye).call(this, e, n)).body.getReader();
    C(this, Xe, s);
    const o = new TextDecoder();
    let l = "";
    for (; !T(this, de); ) {
      const { done: c, value: h } = await s.read();
      if (c) break;
      l += o.decode(h, { stream: !0 });
      const p = l.split(`
`);
      l = p.pop() ?? "";
      for (const m of p) {
        if (T(this, de)) break;
        m === "" ? C(this, Le, null) : x(this, kt, Qn).call(this, m);
      }
    }
    s.cancel();
  }
}
Ye = new WeakMap(), de = new WeakMap(), Xe = new WeakMap(), Le = new WeakMap(), kt = new WeakSet(), Qn = function(e) {
  if (e.startsWith("event: ")) {
    C(this, Le, e.slice(7).trim());
    return;
  }
  if (!e.startsWith("data: ")) return;
  const n = e.slice(6);
  let i;
  try {
    i = JSON.parse(n);
  } catch {
    return;
  }
  const s = T(this, Le) ?? i.type;
  switch (s) {
    case "token":
      this.dispatchEvent(new CustomEvent("chunk", { detail: { text: i.content ?? i.text } }));
      break;
    case "done":
      this.dispatchEvent(new CustomEvent("done", { detail: { conversationId: i.conversation_id, usage: i.usage } }));
      break;
    case "error":
      this.dispatchEvent(new CustomEvent("error", {
        detail: { code: i.code, message: i.message, retryable: i.retryable }
      }));
      break;
    case "context_summary":
      this.dispatchEvent(new CustomEvent("context_summary", { detail: { text: i.summary ?? i.text } }));
      break;
    case "tool_started":
    case "tool_finished":
    case "tool_failed":
      this.dispatchEvent(new CustomEvent(s, { detail: { name: i.name, phase: i.phase } }));
      break;
  }
};
function Jt() {
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
let be = Jt();
function Kn(a) {
  be = a;
}
const Jn = /[&<>"']/, Gi = new RegExp(Jn.source, "g"), ei = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, Wi = new RegExp(ei.source, "g"), ji = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, On = (a) => ji[a];
function Z(a, t) {
  if (t) {
    if (Jn.test(a))
      return a.replace(Gi, On);
  } else if (ei.test(a))
    return a.replace(Wi, On);
  return a;
}
const qi = /(^|[^\[])\^/g;
function S(a, t) {
  let e = typeof a == "string" ? a : a.source;
  t = t || "";
  const n = {
    replace: (i, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(qi, "$1"), e = e.replace(i, o), n;
    },
    getRegex: () => new RegExp(e, t)
  };
  return n;
}
function Nn(a) {
  try {
    a = encodeURI(a).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return a;
}
const qe = { exec: () => null };
function Dn(a, t) {
  const e = a.replace(/\|/g, (s, o, l) => {
    let c = !1, h = o;
    for (; --h >= 0 && l[h] === "\\"; )
      c = !c;
    return c ? "|" : " |";
  }), n = e.split(/ \|/);
  let i = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n[n.length - 1].trim() && n.pop(), t)
    if (n.length > t)
      n.splice(t);
    else
      for (; n.length < t; )
        n.push("");
  for (; i < n.length; i++)
    n[i] = n[i].trim().replace(/\\\|/g, "|");
  return n;
}
function Pe(a, t, e) {
  const n = a.length;
  if (n === 0)
    return "";
  let i = 0;
  for (; i < n && a.charAt(n - i - 1) === t; )
    i++;
  return a.slice(0, n - i);
}
function Zi(a, t) {
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
function Mn(a, t, e, n) {
  const i = t.href, s = t.title ? Z(t.title) : null, o = a[1].replace(/\\([\[\]])/g, "$1");
  if (a[0].charAt(0) !== "!") {
    n.state.inLink = !0;
    const l = {
      type: "link",
      raw: e,
      href: i,
      title: s,
      text: o,
      tokens: n.inlineTokens(o)
    };
    return n.state.inLink = !1, l;
  }
  return {
    type: "image",
    raw: e,
    href: i,
    title: s,
    text: Z(o)
  };
}
function Yi(a, t) {
  const e = a.match(/^(\s+)(?:```)/);
  if (e === null)
    return t;
  const n = e[1];
  return t.split(`
`).map((i) => {
    const s = i.match(/^\s+/);
    if (s === null)
      return i;
    const [o] = s;
    return o.length >= n.length ? i.slice(n.length) : i;
  }).join(`
`);
}
class gt {
  // set by the lexer
  constructor(t) {
    A(this, "options");
    A(this, "rules");
    // set by the lexer
    A(this, "lexer");
    this.options = t || be;
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
        text: this.options.pedantic ? n : Pe(n, `
`)
      };
    }
  }
  fences(t) {
    const e = this.rules.block.fences.exec(t);
    if (e) {
      const n = e[0], i = Yi(n, e[3] || "");
      return {
        type: "code",
        raw: n,
        lang: e[2] ? e[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : e[2],
        text: i
      };
    }
  }
  heading(t) {
    const e = this.rules.block.heading.exec(t);
    if (e) {
      let n = e[2].trim();
      if (/#$/.test(n)) {
        const i = Pe(n, "#");
        (this.options.pedantic || !i || / $/.test(i)) && (n = i.trim());
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
        raw: Pe(e[0], `
`)
      };
  }
  blockquote(t) {
    const e = this.rules.block.blockquote.exec(t);
    if (e) {
      let n = Pe(e[0], `
`).split(`
`), i = "", s = "";
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
        const p = c.join(`
`), m = p.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`).replace(/^ {0,3}>[ \t]?/gm, "");
        i = i ? `${i}
${p}` : p, s = s ? `${s}
${m}` : m;
        const g = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(m, o, !0), this.lexer.state.top = g, n.length === 0)
          break;
        const w = o[o.length - 1];
        if ((w == null ? void 0 : w.type) === "code")
          break;
        if ((w == null ? void 0 : w.type) === "blockquote") {
          const y = w, R = y.raw + `
` + n.join(`
`), Y = this.blockquote(R);
          o[o.length - 1] = Y, i = i.substring(0, i.length - y.raw.length) + Y.raw, s = s.substring(0, s.length - y.text.length) + Y.text;
          break;
        } else if ((w == null ? void 0 : w.type) === "list") {
          const y = w, R = y.raw + `
` + n.join(`
`), Y = this.list(R);
          o[o.length - 1] = Y, i = i.substring(0, i.length - w.raw.length) + Y.raw, s = s.substring(0, s.length - y.raw.length) + Y.raw, n = R.substring(o[o.length - 1].raw.length).split(`
`);
          continue;
        }
      }
      return {
        type: "blockquote",
        raw: i,
        tokens: o,
        text: s
      };
    }
  }
  list(t) {
    let e = this.rules.block.list.exec(t);
    if (e) {
      let n = e[1].trim();
      const i = n.length > 1, s = {
        type: "list",
        raw: "",
        ordered: i,
        start: i ? +n.slice(0, -1) : "",
        loose: !1,
        items: []
      };
      n = i ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = i ? n : "[*+-]");
      const o = new RegExp(`^( {0,3}${n})((?:[	 ][^\\n]*)?(?:\\n|$))`);
      let l = !1;
      for (; t; ) {
        let c = !1, h = "", p = "";
        if (!(e = o.exec(t)) || this.rules.block.hr.test(t))
          break;
        h = e[0], t = t.substring(h.length);
        let m = e[2].split(`
`, 1)[0].replace(/^\t+/, (Ne) => " ".repeat(3 * Ne.length)), g = t.split(`
`, 1)[0], w = !m.trim(), y = 0;
        if (this.options.pedantic ? (y = 2, p = m.trimStart()) : w ? y = e[1].length + 1 : (y = e[2].search(/[^ ]/), y = y > 4 ? 1 : y, p = m.slice(y), y += e[1].length), w && /^[ \t]*$/.test(g) && (h += g + `
`, t = t.substring(g.length + 1), c = !0), !c) {
          const Ne = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), et = new RegExp(`^ {0,${Math.min(3, y - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), tt = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:\`\`\`|~~~)`), ue = new RegExp(`^ {0,${Math.min(3, y - 1)}}#`), $ = new RegExp(`^ {0,${Math.min(3, y - 1)}}<(?:[a-z].*>|!--)`, "i");
          for (; t; ) {
            const re = t.split(`
`, 1)[0];
            let te;
            if (g = re, this.options.pedantic ? (g = g.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  "), te = g) : te = g.replace(/\t/g, "    "), tt.test(g) || ue.test(g) || $.test(g) || Ne.test(g) || et.test(g))
              break;
            if (te.search(/[^ ]/) >= y || !g.trim())
              p += `
` + te.slice(y);
            else {
              if (w || m.replace(/\t/g, "    ").search(/[^ ]/) >= 4 || tt.test(m) || ue.test(m) || et.test(m))
                break;
              p += `
` + g;
            }
            !w && !g.trim() && (w = !0), h += re + `
`, t = t.substring(re.length + 1), m = te.slice(y);
          }
        }
        s.loose || (l ? s.loose = !0 : /\n[ \t]*\n[ \t]*$/.test(h) && (l = !0));
        let R = null, Y;
        this.options.gfm && (R = /^\[[ xX]\] /.exec(p), R && (Y = R[0] !== "[ ] ", p = p.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: h,
          task: !!R,
          checked: Y,
          loose: !1,
          text: p,
          tokens: []
        }), s.raw += h;
      }
      s.items[s.items.length - 1].raw = s.items[s.items.length - 1].raw.trimEnd(), s.items[s.items.length - 1].text = s.items[s.items.length - 1].text.trimEnd(), s.raw = s.raw.trimEnd();
      for (let c = 0; c < s.items.length; c++)
        if (this.lexer.state.top = !1, s.items[c].tokens = this.lexer.blockTokens(s.items[c].text, []), !s.loose) {
          const h = s.items[c].tokens.filter((m) => m.type === "space"), p = h.length > 0 && h.some((m) => /\n.*\n/.test(m.raw));
          s.loose = p;
        }
      if (s.loose)
        for (let c = 0; c < s.items.length; c++)
          s.items[c].loose = !0;
      return s;
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
      const n = e[1].toLowerCase().replace(/\s+/g, " "), i = e[2] ? e[2].replace(/^<(.*)>$/, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", s = e[3] ? e[3].substring(1, e[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : e[3];
      return {
        type: "def",
        tag: n,
        raw: e[0],
        href: i,
        title: s
      };
    }
  }
  table(t) {
    const e = this.rules.block.table.exec(t);
    if (!e || !/[:|]/.test(e[2]))
      return;
    const n = Dn(e[1]), i = e[2].replace(/^\||\| *$/g, "").split("|"), s = e[3] && e[3].trim() ? e[3].replace(/\n[ \t]*$/, "").split(`
`) : [], o = {
      type: "table",
      raw: e[0],
      header: [],
      align: [],
      rows: []
    };
    if (n.length === i.length) {
      for (const l of i)
        /^ *-+: *$/.test(l) ? o.align.push("right") : /^ *:-+: *$/.test(l) ? o.align.push("center") : /^ *:-+ *$/.test(l) ? o.align.push("left") : o.align.push(null);
      for (let l = 0; l < n.length; l++)
        o.header.push({
          text: n[l],
          tokens: this.lexer.inline(n[l]),
          header: !0,
          align: o.align[l]
        });
      for (const l of s)
        o.rows.push(Dn(l, o.header.length).map((c, h) => ({
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
        const o = Pe(n.slice(0, -1), "\\");
        if ((n.length - o.length) % 2 === 0)
          return;
      } else {
        const o = Zi(e[2], "()");
        if (o > -1) {
          const c = (e[0].indexOf("!") === 0 ? 5 : 4) + e[1].length + o;
          e[2] = e[2].substring(0, o), e[0] = e[0].substring(0, c).trim(), e[3] = "";
        }
      }
      let i = e[2], s = "";
      if (this.options.pedantic) {
        const o = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(i);
        o && (i = o[1], s = o[3]);
      } else
        s = e[3] ? e[3].slice(1, -1) : "";
      return i = i.trim(), /^</.test(i) && (this.options.pedantic && !/>$/.test(n) ? i = i.slice(1) : i = i.slice(1, -1)), Mn(e, {
        href: i && i.replace(this.rules.inline.anyPunctuation, "$1"),
        title: s && s.replace(this.rules.inline.anyPunctuation, "$1")
      }, e[0], this.lexer);
    }
  }
  reflink(t, e) {
    let n;
    if ((n = this.rules.inline.reflink.exec(t)) || (n = this.rules.inline.nolink.exec(t))) {
      const i = (n[2] || n[1]).replace(/\s+/g, " "), s = e[i.toLowerCase()];
      if (!s) {
        const o = n[0].charAt(0);
        return {
          type: "text",
          raw: o,
          text: o
        };
      }
      return Mn(n, s, n[0], this.lexer);
    }
  }
  emStrong(t, e, n = "") {
    let i = this.rules.inline.emStrongLDelim.exec(t);
    if (!i || i[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(i[1] || i[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const o = [...i[0]].length - 1;
      let l, c, h = o, p = 0;
      const m = i[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (m.lastIndex = 0, e = e.slice(-1 * t.length + o); (i = m.exec(e)) != null; ) {
        if (l = i[1] || i[2] || i[3] || i[4] || i[5] || i[6], !l)
          continue;
        if (c = [...l].length, i[3] || i[4]) {
          h += c;
          continue;
        } else if ((i[5] || i[6]) && o % 3 && !((o + c) % 3)) {
          p += c;
          continue;
        }
        if (h -= c, h > 0)
          continue;
        c = Math.min(c, c + h + p);
        const g = [...i[0]][0].length, w = t.slice(0, o + i.index + g + c);
        if (Math.min(o, c) % 2) {
          const R = w.slice(1, -1);
          return {
            type: "em",
            raw: w,
            text: R,
            tokens: this.lexer.inlineTokens(R)
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
      const i = /[^ ]/.test(n), s = /^ /.test(n) && / $/.test(n);
      return i && s && (n = n.substring(1, n.length - 1)), n = Z(n, !0), {
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
      let n, i;
      return e[2] === "@" ? (n = Z(e[1]), i = "mailto:" + n) : (n = Z(e[1]), i = n), {
        type: "link",
        raw: e[0],
        text: n,
        href: i,
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
      let i, s;
      if (e[2] === "@")
        i = Z(e[0]), s = "mailto:" + i;
      else {
        let o;
        do
          o = e[0], e[0] = ((n = this.rules.inline._backpedal.exec(e[0])) == null ? void 0 : n[0]) ?? "";
        while (o !== e[0]);
        i = Z(e[0]), e[1] === "www." ? s = "http://" + e[0] : s = e[0];
      }
      return {
        type: "link",
        raw: e[0],
        text: i,
        href: s,
        tokens: [
          {
            type: "text",
            raw: i,
            text: i
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
const Xi = /^(?:[ \t]*(?:\n|$))+/, Vi = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Qi = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Ke = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Ki = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, ti = /(?:[*+-]|\d{1,9}[.)])/, ni = S(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, ti).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), en = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Ji = /^[^\n]+/, tn = /(?!\s*\])(?:\\.|[^\[\]\\])+/, es = S(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", tn).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), ts = S(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, ti).getRegex(), Tt = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", nn = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, ns = S("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", nn).replace("tag", Tt).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ii = S(en).replace("hr", Ke).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Tt).getRegex(), is = S(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ii).getRegex(), sn = {
  blockquote: is,
  code: Vi,
  def: es,
  fences: Qi,
  heading: Ki,
  hr: Ke,
  html: ns,
  lheading: ni,
  list: ts,
  newline: Xi,
  paragraph: ii,
  table: qe,
  text: Ji
}, zn = S("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Ke).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Tt).getRegex(), ss = {
  ...sn,
  table: zn,
  paragraph: S(en).replace("hr", Ke).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", zn).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Tt).getRegex()
}, rs = {
  ...sn,
  html: S(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", nn).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: qe,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: S(en).replace("hr", Ke).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ni).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, si = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, os = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, ri = /^( {2,}|\\)\n(?!\s*$)/, as = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Je = "\\p{P}\\p{S}", ls = S(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Je).getRegex(), cs = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, us = S(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Je).getRegex(), ps = S("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Je).getRegex(), hs = S("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Je).getRegex(), fs = S(/\\([punct])/, "gu").replace(/punct/g, Je).getRegex(), ds = S(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), ms = S(nn).replace("(?:-->|$)", "-->").getRegex(), gs = S("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ms).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), bt = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, bs = S(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", bt).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), oi = S(/^!?\[(label)\]\[(ref)\]/).replace("label", bt).replace("ref", tn).getRegex(), ai = S(/^!?\[(ref)\](?:\[\])?/).replace("ref", tn).getRegex(), xs = S("reflink|nolink(?!\\()", "g").replace("reflink", oi).replace("nolink", ai).getRegex(), rn = {
  _backpedal: qe,
  // only used for GFM url
  anyPunctuation: fs,
  autolink: ds,
  blockSkip: cs,
  br: ri,
  code: os,
  del: qe,
  emStrongLDelim: us,
  emStrongRDelimAst: ps,
  emStrongRDelimUnd: hs,
  escape: si,
  link: bs,
  nolink: ai,
  punctuation: ls,
  reflink: oi,
  reflinkSearch: xs,
  tag: gs,
  text: as,
  url: qe
}, ks = {
  ...rn,
  link: S(/^!?\[(label)\]\((.*?)\)/).replace("label", bt).getRegex(),
  reflink: S(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", bt).getRegex()
}, Gt = {
  ...rn,
  escape: S(si).replace("])", "~|])").getRegex(),
  url: S(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, Ts = {
  ...Gt,
  br: S(ri).replace("{2,}", "*").getRegex(),
  text: S(Gt.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, pt = {
  normal: sn,
  gfm: ss,
  pedantic: rs
}, Fe = {
  normal: rn,
  gfm: Gt,
  breaks: Ts,
  pedantic: ks
};
class V {
  constructor(t) {
    A(this, "tokens");
    A(this, "options");
    A(this, "state");
    A(this, "tokenizer");
    A(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || be, this.options.tokenizer = this.options.tokenizer || new gt(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const e = {
      block: pt.normal,
      inline: Fe.normal
    };
    this.options.pedantic ? (e.block = pt.pedantic, e.inline = Fe.pedantic) : this.options.gfm && (e.block = pt.gfm, this.options.breaks ? e.inline = Fe.breaks : e.inline = Fe.gfm), this.tokenizer.rules = e;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: pt,
      inline: Fe
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
    let i, s, o;
    for (; t; )
      if (!(this.options.extensions && this.options.extensions.block && this.options.extensions.block.some((l) => (i = l.call({ lexer: this }, t, e)) ? (t = t.substring(i.raw.length), e.push(i), !0) : !1))) {
        if (i = this.tokenizer.space(t)) {
          t = t.substring(i.raw.length), i.raw.length === 1 && e.length > 0 ? e[e.length - 1].raw += `
` : e.push(i);
          continue;
        }
        if (i = this.tokenizer.code(t)) {
          t = t.substring(i.raw.length), s = e[e.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + i.raw, s.text += `
` + i.text, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : e.push(i);
          continue;
        }
        if (i = this.tokenizer.fences(t)) {
          t = t.substring(i.raw.length), e.push(i);
          continue;
        }
        if (i = this.tokenizer.heading(t)) {
          t = t.substring(i.raw.length), e.push(i);
          continue;
        }
        if (i = this.tokenizer.hr(t)) {
          t = t.substring(i.raw.length), e.push(i);
          continue;
        }
        if (i = this.tokenizer.blockquote(t)) {
          t = t.substring(i.raw.length), e.push(i);
          continue;
        }
        if (i = this.tokenizer.list(t)) {
          t = t.substring(i.raw.length), e.push(i);
          continue;
        }
        if (i = this.tokenizer.html(t)) {
          t = t.substring(i.raw.length), e.push(i);
          continue;
        }
        if (i = this.tokenizer.def(t)) {
          t = t.substring(i.raw.length), s = e[e.length - 1], s && (s.type === "paragraph" || s.type === "text") ? (s.raw += `
` + i.raw, s.text += `
` + i.raw, this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : this.tokens.links[i.tag] || (this.tokens.links[i.tag] = {
            href: i.href,
            title: i.title
          });
          continue;
        }
        if (i = this.tokenizer.table(t)) {
          t = t.substring(i.raw.length), e.push(i);
          continue;
        }
        if (i = this.tokenizer.lheading(t)) {
          t = t.substring(i.raw.length), e.push(i);
          continue;
        }
        if (o = t, this.options.extensions && this.options.extensions.startBlock) {
          let l = 1 / 0;
          const c = t.slice(1);
          let h;
          this.options.extensions.startBlock.forEach((p) => {
            h = p.call({ lexer: this }, c), typeof h == "number" && h >= 0 && (l = Math.min(l, h));
          }), l < 1 / 0 && l >= 0 && (o = t.substring(0, l + 1));
        }
        if (this.state.top && (i = this.tokenizer.paragraph(o))) {
          s = e[e.length - 1], n && (s == null ? void 0 : s.type) === "paragraph" ? (s.raw += `
` + i.raw, s.text += `
` + i.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : e.push(i), n = o.length !== t.length, t = t.substring(i.raw.length);
          continue;
        }
        if (i = this.tokenizer.text(t)) {
          t = t.substring(i.raw.length), s = e[e.length - 1], s && s.type === "text" ? (s.raw += `
` + i.raw, s.text += `
` + i.text, this.inlineQueue.pop(), this.inlineQueue[this.inlineQueue.length - 1].src = s.text) : e.push(i);
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
    let n, i, s, o = t, l, c, h;
    if (this.tokens.links) {
      const p = Object.keys(this.tokens.links);
      if (p.length > 0)
        for (; (l = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          p.includes(l[0].slice(l[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, l.index) + "[" + "a".repeat(l[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (l = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, l.index) + "[" + "a".repeat(l[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (l = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, l.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; t; )
      if (c || (h = ""), c = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((p) => (n = p.call({ lexer: this }, t, e)) ? (t = t.substring(n.raw.length), e.push(n), !0) : !1))) {
        if (n = this.tokenizer.escape(t)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (n = this.tokenizer.tag(t)) {
          t = t.substring(n.raw.length), i = e[e.length - 1], i && n.type === "text" && i.type === "text" ? (i.raw += n.raw, i.text += n.text) : e.push(n);
          continue;
        }
        if (n = this.tokenizer.link(t)) {
          t = t.substring(n.raw.length), e.push(n);
          continue;
        }
        if (n = this.tokenizer.reflink(t, this.tokens.links)) {
          t = t.substring(n.raw.length), i = e[e.length - 1], i && n.type === "text" && i.type === "text" ? (i.raw += n.raw, i.text += n.text) : e.push(n);
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
        if (s = t, this.options.extensions && this.options.extensions.startInline) {
          let p = 1 / 0;
          const m = t.slice(1);
          let g;
          this.options.extensions.startInline.forEach((w) => {
            g = w.call({ lexer: this }, m), typeof g == "number" && g >= 0 && (p = Math.min(p, g));
          }), p < 1 / 0 && p >= 0 && (s = t.substring(0, p + 1));
        }
        if (n = this.tokenizer.inlineText(s)) {
          t = t.substring(n.raw.length), n.raw.slice(-1) !== "_" && (h = n.raw.slice(-1)), c = !0, i = e[e.length - 1], i && i.type === "text" ? (i.raw += n.raw, i.text += n.text) : e.push(n);
          continue;
        }
        if (t) {
          const p = "Infinite loop on byte: " + t.charCodeAt(0);
          if (this.options.silent) {
            console.error(p);
            break;
          } else
            throw new Error(p);
        }
      }
    return e;
  }
}
class xt {
  // set by the parser
  constructor(t) {
    A(this, "options");
    A(this, "parser");
    this.options = t || be;
  }
  space(t) {
    return "";
  }
  code({ text: t, lang: e, escaped: n }) {
    var o;
    const i = (o = (e || "").match(/^\S*/)) == null ? void 0 : o[0], s = t.replace(/\n$/, "") + `
`;
    return i ? '<pre><code class="language-' + Z(i) + '">' + (n ? s : Z(s, !0)) + `</code></pre>
` : "<pre><code>" + (n ? s : Z(s, !0)) + `</code></pre>
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
    let i = "";
    for (let l = 0; l < t.items.length; l++) {
      const c = t.items[l];
      i += this.listitem(c);
    }
    const s = e ? "ol" : "ul", o = e && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + s + o + `>
` + i + "</" + s + `>
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
    for (let s = 0; s < t.header.length; s++)
      n += this.tablecell(t.header[s]);
    e += this.tablerow({ text: n });
    let i = "";
    for (let s = 0; s < t.rows.length; s++) {
      const o = t.rows[s];
      n = "";
      for (let l = 0; l < o.length; l++)
        n += this.tablecell(o[l]);
      i += this.tablerow({ text: n });
    }
    return i && (i = `<tbody>${i}</tbody>`), `<table>
<thead>
` + e + `</thead>
` + i + `</table>
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
    const i = this.parser.parseInline(n), s = Nn(t);
    if (s === null)
      return i;
    t = s;
    let o = '<a href="' + t + '"';
    return e && (o += ' title="' + e + '"'), o += ">" + i + "</a>", o;
  }
  image({ href: t, title: e, text: n }) {
    const i = Nn(t);
    if (i === null)
      return n;
    t = i;
    let s = `<img src="${t}" alt="${n}"`;
    return e && (s += ` title="${e}"`), s += ">", s;
  }
  text(t) {
    return "tokens" in t && t.tokens ? this.parser.parseInline(t.tokens) : t.text;
  }
}
class on {
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
    this.options = t || be, this.options.renderer = this.options.renderer || new xt(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new on();
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
    for (let i = 0; i < t.length; i++) {
      const s = t[i];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const l = s, c = this.options.extensions.renderers[l.type].call({ parser: this }, l);
        if (c !== !1 || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "paragraph", "text"].includes(l.type)) {
          n += c || "";
          continue;
        }
      }
      const o = s;
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
          for (; i + 1 < t.length && t[i + 1].type === "text"; )
            l = t[++i], c += `
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
    for (let i = 0; i < t.length; i++) {
      const s = t[i];
      if (this.options.extensions && this.options.extensions.renderers && this.options.extensions.renderers[s.type]) {
        const l = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (l !== !1 || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(s.type)) {
          n += l || "";
          continue;
        }
      }
      const o = s;
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
class Ze {
  constructor(t) {
    A(this, "options");
    A(this, "block");
    this.options = t || be;
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
A(Ze, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
class ws {
  constructor(...t) {
    A(this, "defaults", Jt());
    A(this, "options", this.setOptions);
    A(this, "parse", this.parseMarkdown(!0));
    A(this, "parseInline", this.parseMarkdown(!1));
    A(this, "Parser", Q);
    A(this, "Renderer", xt);
    A(this, "TextRenderer", on);
    A(this, "Lexer", V);
    A(this, "Tokenizer", gt);
    A(this, "Hooks", Ze);
    this.use(...t);
  }
  /**
   * Run callback for every token
   */
  walkTokens(t, e) {
    var i, s;
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
          (s = (i = this.defaults.extensions) == null ? void 0 : i.childTokens) != null && s[l.type] ? this.defaults.extensions.childTokens[l.type].forEach((c) => {
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
      const i = { ...n };
      if (i.async = this.defaults.async || i.async || !1, n.extensions && (n.extensions.forEach((s) => {
        if (!s.name)
          throw new Error("extension name required");
        if ("renderer" in s) {
          const o = e.renderers[s.name];
          o ? e.renderers[s.name] = function(...l) {
            let c = s.renderer.apply(this, l);
            return c === !1 && (c = o.apply(this, l)), c;
          } : e.renderers[s.name] = s.renderer;
        }
        if ("tokenizer" in s) {
          if (!s.level || s.level !== "block" && s.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          const o = e[s.level];
          o ? o.unshift(s.tokenizer) : e[s.level] = [s.tokenizer], s.start && (s.level === "block" ? e.startBlock ? e.startBlock.push(s.start) : e.startBlock = [s.start] : s.level === "inline" && (e.startInline ? e.startInline.push(s.start) : e.startInline = [s.start]));
        }
        "childTokens" in s && s.childTokens && (e.childTokens[s.name] = s.childTokens);
      }), i.extensions = e), n.renderer) {
        const s = this.defaults.renderer || new xt(this.defaults);
        for (const o in n.renderer) {
          if (!(o in s))
            throw new Error(`renderer '${o}' does not exist`);
          if (["options", "parser"].includes(o))
            continue;
          const l = o, c = n.renderer[l], h = s[l];
          s[l] = (...p) => {
            let m = c.apply(s, p);
            return m === !1 && (m = h.apply(s, p)), m || "";
          };
        }
        i.renderer = s;
      }
      if (n.tokenizer) {
        const s = this.defaults.tokenizer || new gt(this.defaults);
        for (const o in n.tokenizer) {
          if (!(o in s))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const l = o, c = n.tokenizer[l], h = s[l];
          s[l] = (...p) => {
            let m = c.apply(s, p);
            return m === !1 && (m = h.apply(s, p)), m;
          };
        }
        i.tokenizer = s;
      }
      if (n.hooks) {
        const s = this.defaults.hooks || new Ze();
        for (const o in n.hooks) {
          if (!(o in s))
            throw new Error(`hook '${o}' does not exist`);
          if (["options", "block"].includes(o))
            continue;
          const l = o, c = n.hooks[l], h = s[l];
          Ze.passThroughHooks.has(o) ? s[l] = (p) => {
            if (this.defaults.async)
              return Promise.resolve(c.call(s, p)).then((g) => h.call(s, g));
            const m = c.call(s, p);
            return h.call(s, m);
          } : s[l] = (...p) => {
            let m = c.apply(s, p);
            return m === !1 && (m = h.apply(s, p)), m;
          };
        }
        i.hooks = s;
      }
      if (n.walkTokens) {
        const s = this.defaults.walkTokens, o = n.walkTokens;
        i.walkTokens = function(l) {
          let c = [];
          return c.push(o.call(this, l)), s && (c = c.concat(s.call(this, l))), c;
        };
      }
      this.defaults = { ...this.defaults, ...i };
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
    return (n, i) => {
      const s = { ...i }, o = { ...this.defaults, ...s }, l = this.onError(!!o.silent, !!o.async);
      if (this.defaults.async === !0 && s.async === !1)
        return l(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null)
        return l(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string")
        return l(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      o.hooks && (o.hooks.options = o, o.hooks.block = t);
      const c = o.hooks ? o.hooks.provideLexer() : t ? V.lex : V.lexInline, h = o.hooks ? o.hooks.provideParser() : t ? Q.parse : Q.parseInline;
      if (o.async)
        return Promise.resolve(o.hooks ? o.hooks.preprocess(n) : n).then((p) => c(p, o)).then((p) => o.hooks ? o.hooks.processAllTokens(p) : p).then((p) => o.walkTokens ? Promise.all(this.walkTokens(p, o.walkTokens)).then(() => p) : p).then((p) => h(p, o)).then((p) => o.hooks ? o.hooks.postprocess(p) : p).catch(l);
      try {
        o.hooks && (n = o.hooks.preprocess(n));
        let p = c(n, o);
        o.hooks && (p = o.hooks.processAllTokens(p)), o.walkTokens && this.walkTokens(p, o.walkTokens);
        let m = h(p, o);
        return o.hooks && (m = o.hooks.postprocess(m)), m;
      } catch (p) {
        return l(p);
      }
    };
  }
  onError(t, e) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, t) {
        const i = "<p>An error occurred:</p><pre>" + Z(n.message + "", !0) + "</pre>";
        return e ? Promise.resolve(i) : i;
      }
      if (e)
        return Promise.reject(n);
      throw n;
    };
  }
}
const ge = new ws();
function _(a, t) {
  return ge.parse(a, t);
}
_.options = _.setOptions = function(a) {
  return ge.setOptions(a), _.defaults = ge.defaults, Kn(_.defaults), _;
};
_.getDefaults = Jt;
_.defaults = be;
_.use = function(...a) {
  return ge.use(...a), _.defaults = ge.defaults, Kn(_.defaults), _;
};
_.walkTokens = function(a, t) {
  return ge.walkTokens(a, t);
};
_.parseInline = ge.parseInline;
_.Parser = Q;
_.parser = Q.parse;
_.Renderer = xt;
_.TextRenderer = on;
_.Lexer = V;
_.lexer = V.lex;
_.Tokenizer = gt;
_.Hooks = Ze;
_.parse = _;
_.options;
_.setOptions;
_.use;
_.walkTokens;
_.parseInline;
Q.parse;
V.lex;
/*! @license DOMPurify 3.4.3 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.3/LICENSE */
function $n(a, t) {
  (t == null || t > a.length) && (t = a.length);
  for (var e = 0, n = Array(t); e < t; e++) n[e] = a[e];
  return n;
}
function ys(a) {
  if (Array.isArray(a)) return a;
}
function Es(a, t) {
  var e = a == null ? null : typeof Symbol < "u" && a[Symbol.iterator] || a["@@iterator"];
  if (e != null) {
    var n, i, s, o, l = [], c = !0, h = !1;
    try {
      if (s = (e = e.call(a)).next, t !== 0) for (; !(c = (n = s.call(e)).done) && (l.push(n.value), l.length !== t); c = !0) ;
    } catch (p) {
      h = !0, i = p;
    } finally {
      try {
        if (!c && e.return != null && (o = e.return(), Object(o) !== o)) return;
      } finally {
        if (h) throw i;
      }
    }
    return l;
  }
}
function _s() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function As(a, t) {
  return ys(a) || Es(a, t) || Ss(a, t) || _s();
}
function Ss(a, t) {
  if (a) {
    if (typeof a == "string") return $n(a, t);
    var e = {}.toString.call(a).slice(8, -1);
    return e === "Object" && a.constructor && (e = a.constructor.name), e === "Map" || e === "Set" ? Array.from(a) : e === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e) ? $n(a, t) : void 0;
  }
}
const li = Object.entries, Pn = Object.setPrototypeOf, Rs = Object.isFrozen, Is = Object.getPrototypeOf, Ls = Object.getOwnPropertyDescriptor;
let G = Object.freeze, K = Object.seal, Se = Object.create, ci = typeof Reflect < "u" && Reflect, Wt = ci.apply, jt = ci.construct;
G || (G = function(t) {
  return t;
});
K || (K = function(t) {
  return t;
});
Wt || (Wt = function(t, e) {
  for (var n = arguments.length, i = new Array(n > 2 ? n - 2 : 0), s = 2; s < n; s++)
    i[s - 2] = arguments[s];
  return t.apply(e, i);
});
jt || (jt = function(t) {
  for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), i = 1; i < e; i++)
    n[i - 1] = arguments[i];
  return new t(...n);
});
const ye = O(Array.prototype.forEach), Cs = O(Array.prototype.lastIndexOf), Fn = O(Array.prototype.pop), Ee = O(Array.prototype.push), vs = O(Array.prototype.splice), B = Array.isArray, Be = O(String.prototype.toLowerCase), Pt = O(String.prototype.toString), Un = O(String.prototype.match), _e = O(String.prototype.replace), Hn = O(String.prototype.indexOf), Os = O(String.prototype.trim), Ns = O(Number.prototype.toString), Ds = O(Boolean.prototype.toString), Bn = typeof BigInt > "u" ? null : O(BigInt.prototype.toString), Gn = typeof Symbol > "u" ? null : O(Symbol.prototype.toString), I = O(Object.prototype.hasOwnProperty), Ue = O(Object.prototype.toString), U = O(RegExp.prototype.test), ht = Ms(TypeError);
function O(a) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), i = 1; i < e; i++)
      n[i - 1] = arguments[i];
    return Wt(a, t, n);
  };
}
function Ms(a) {
  return function() {
    for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
      e[n] = arguments[n];
    return jt(a, e);
  };
}
function k(a, t) {
  let e = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : Be;
  if (Pn && Pn(a, null), !B(t))
    return a;
  let n = t.length;
  for (; n--; ) {
    let i = t[n];
    if (typeof i == "string") {
      const s = e(i);
      s !== i && (Rs(t) || (t[n] = s), i = s);
    }
    a[i] = !0;
  }
  return a;
}
function zs(a) {
  for (let t = 0; t < a.length; t++)
    I(a, t) || (a[t] = null);
  return a;
}
function j(a) {
  const t = Se(null);
  for (const n of li(a)) {
    var e = As(n, 2);
    const i = e[0], s = e[1];
    I(a, i) && (B(s) ? t[i] = zs(s) : s && typeof s == "object" && s.constructor === Object ? t[i] = j(s) : t[i] = s);
  }
  return t;
}
function $s(a) {
  switch (typeof a) {
    case "string":
      return a;
    case "number":
      return Ns(a);
    case "boolean":
      return Ds(a);
    case "bigint":
      return Bn ? Bn(a) : "0";
    case "symbol":
      return Gn ? Gn(a) : "Symbol()";
    case "undefined":
      return Ue(a);
    case "function":
    case "object": {
      if (a === null)
        return Ue(a);
      const t = a, e = Re(t, "toString");
      if (typeof e == "function") {
        const n = e(t);
        return typeof n == "string" ? n : Ue(n);
      }
      return Ue(a);
    }
    default:
      return Ue(a);
  }
}
function Re(a, t) {
  for (; a !== null; ) {
    const n = Ls(a, t);
    if (n) {
      if (n.get)
        return O(n.get);
      if (typeof n.value == "function")
        return O(n.value);
    }
    a = Is(a);
  }
  function e() {
    return null;
  }
  return e;
}
function Ps(a) {
  try {
    return U(a, ""), !0;
  } catch {
    return !1;
  }
}
const Wn = G(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), Ft = G(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), Ut = G(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Fs = G(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), Ht = G(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Us = G(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), jn = G(["#text"]), qn = G(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]), Bt = G(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Zn = G(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), ft = G(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Hs = K(/{{[\w\W]*|^[\w\W]*}}/g), Bs = K(/<%[\w\W]*|^[\w\W]*%>/g), Gs = K(/\${[\w\W]*/g), Ws = K(/^data-[\-\w.\u00B7-\uFFFF]+$/), js = K(/^aria-[\-\w]+$/), Yn = K(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), qs = K(/^(?:\w+script|data):/i), Zs = K(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), Ys = K(/^html$/i), Xs = K(/^[a-z][.\w]*(-[.\w]+)+$/i), Ae = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, Vs = function() {
  return typeof window > "u" ? null : window;
}, Qs = function(t, e) {
  if (typeof t != "object" || typeof t.createPolicy != "function")
    return null;
  let n = null;
  const i = "data-tt-policy-suffix";
  e && e.hasAttribute(i) && (n = e.getAttribute(i));
  const s = "dompurify" + (n ? "#" + n : "");
  try {
    return t.createPolicy(s, {
      createHTML(o) {
        return o;
      },
      createScriptURL(o) {
        return o;
      }
    });
  } catch {
    return console.warn("TrustedTypes policy " + s + " could not be created."), null;
  }
}, Xn = function() {
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
function ui() {
  let a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Vs();
  const t = (b) => ui(b);
  if (t.version = "3.4.3", t.removed = [], !a || !a.document || a.document.nodeType !== Ae.document || !a.Element)
    return t.isSupported = !1, t;
  let e = a.document;
  const n = e, i = n.currentScript, s = a.DocumentFragment, o = a.HTMLTemplateElement, l = a.Node, c = a.Element, h = a.NodeFilter, p = a.NamedNodeMap, m = p === void 0 ? a.NamedNodeMap || a.MozNamedAttrMap : p, g = a.HTMLFormElement, w = a.DOMParser, y = a.trustedTypes, R = c.prototype, Y = Re(R, "cloneNode"), Ne = Re(R, "remove"), et = Re(R, "nextSibling"), tt = Re(R, "childNodes"), ue = Re(R, "parentNode");
  if (typeof o == "function") {
    const b = e.createElement("template");
    b.content && b.content.ownerDocument && (e = b.content.ownerDocument);
  }
  let $, re = "";
  const te = e, wt = te.implementation, Ai = te.createNodeIterator, Si = te.createDocumentFragment, Ri = te.getElementsByTagName, Ii = n.importNode;
  let H = Xn();
  t.isSupported = typeof li == "function" && typeof ue == "function" && wt && wt.createHTMLDocument !== void 0;
  const nt = Hs, it = Bs, st = Gs, Li = Ws, Ci = js, vi = qs, an = Zs, Oi = Xs;
  let ln = Yn, D = null;
  const cn = k({}, [...Wn, ...Ft, ...Ut, ...Ht, ...jn]);
  let P = null;
  const un = k({}, [...qn, ...Bt, ...Zn, ...ft]);
  let L = Object.seal(Se(null, {
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
  })), De = null, rt = null;
  const le = Object.seal(Se(null, {
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
  let pn = !0, yt = !0, hn = !1, fn = !0, pe = !1, Me = !0, he = !1, Et = !1, _t = !1, xe = !1, ot = !1, at = !1, dn = !0, mn = !1;
  const gn = "user-content-";
  let At = !0, ze = !1, ke = {}, ne = null;
  const St = k({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let bn = null;
  const xn = k({}, ["audio", "video", "img", "source", "image", "track"]);
  let Rt = null;
  const kn = k({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), lt = "http://www.w3.org/1998/Math/MathML", ct = "http://www.w3.org/2000/svg", ie = "http://www.w3.org/1999/xhtml";
  let Te = ie, It = !1, Lt = null;
  const Ni = k({}, [lt, ct, ie], Pt);
  let Ct = k({}, ["mi", "mo", "mn", "ms", "mtext"]), vt = k({}, ["annotation-xml"]);
  const Di = k({}, ["title", "style", "font", "a", "script"]);
  let $e = null;
  const Mi = ["application/xhtml+xml", "text/html"], zi = "text/html";
  let N = null, we = null;
  const $i = e.createElement("form"), Tn = function(r) {
    return r instanceof RegExp || r instanceof Function;
  }, Ot = function() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (we && we === r)
      return;
    (!r || typeof r != "object") && (r = {}), r = j(r), $e = // eslint-disable-next-line unicorn/prefer-includes
    Mi.indexOf(r.PARSER_MEDIA_TYPE) === -1 ? zi : r.PARSER_MEDIA_TYPE, N = $e === "application/xhtml+xml" ? Pt : Be, D = I(r, "ALLOWED_TAGS") && B(r.ALLOWED_TAGS) ? k({}, r.ALLOWED_TAGS, N) : cn, P = I(r, "ALLOWED_ATTR") && B(r.ALLOWED_ATTR) ? k({}, r.ALLOWED_ATTR, N) : un, Lt = I(r, "ALLOWED_NAMESPACES") && B(r.ALLOWED_NAMESPACES) ? k({}, r.ALLOWED_NAMESPACES, Pt) : Ni, Rt = I(r, "ADD_URI_SAFE_ATTR") && B(r.ADD_URI_SAFE_ATTR) ? k(j(kn), r.ADD_URI_SAFE_ATTR, N) : kn, bn = I(r, "ADD_DATA_URI_TAGS") && B(r.ADD_DATA_URI_TAGS) ? k(j(xn), r.ADD_DATA_URI_TAGS, N) : xn, ne = I(r, "FORBID_CONTENTS") && B(r.FORBID_CONTENTS) ? k({}, r.FORBID_CONTENTS, N) : St, De = I(r, "FORBID_TAGS") && B(r.FORBID_TAGS) ? k({}, r.FORBID_TAGS, N) : j({}), rt = I(r, "FORBID_ATTR") && B(r.FORBID_ATTR) ? k({}, r.FORBID_ATTR, N) : j({}), ke = I(r, "USE_PROFILES") ? r.USE_PROFILES && typeof r.USE_PROFILES == "object" ? j(r.USE_PROFILES) : r.USE_PROFILES : !1, pn = r.ALLOW_ARIA_ATTR !== !1, yt = r.ALLOW_DATA_ATTR !== !1, hn = r.ALLOW_UNKNOWN_PROTOCOLS || !1, fn = r.ALLOW_SELF_CLOSE_IN_ATTR !== !1, pe = r.SAFE_FOR_TEMPLATES || !1, Me = r.SAFE_FOR_XML !== !1, he = r.WHOLE_DOCUMENT || !1, xe = r.RETURN_DOM || !1, ot = r.RETURN_DOM_FRAGMENT || !1, at = r.RETURN_TRUSTED_TYPE || !1, _t = r.FORCE_BODY || !1, dn = r.SANITIZE_DOM !== !1, mn = r.SANITIZE_NAMED_PROPS || !1, At = r.KEEP_CONTENT !== !1, ze = r.IN_PLACE || !1, ln = Ps(r.ALLOWED_URI_REGEXP) ? r.ALLOWED_URI_REGEXP : Yn, Te = typeof r.NAMESPACE == "string" ? r.NAMESPACE : ie, Ct = I(r, "MATHML_TEXT_INTEGRATION_POINTS") && r.MATHML_TEXT_INTEGRATION_POINTS && typeof r.MATHML_TEXT_INTEGRATION_POINTS == "object" ? j(r.MATHML_TEXT_INTEGRATION_POINTS) : k({}, ["mi", "mo", "mn", "ms", "mtext"]), vt = I(r, "HTML_INTEGRATION_POINTS") && r.HTML_INTEGRATION_POINTS && typeof r.HTML_INTEGRATION_POINTS == "object" ? j(r.HTML_INTEGRATION_POINTS) : k({}, ["annotation-xml"]);
    const u = I(r, "CUSTOM_ELEMENT_HANDLING") && r.CUSTOM_ELEMENT_HANDLING && typeof r.CUSTOM_ELEMENT_HANDLING == "object" ? j(r.CUSTOM_ELEMENT_HANDLING) : Se(null);
    if (L = Se(null), I(u, "tagNameCheck") && Tn(u.tagNameCheck) && (L.tagNameCheck = u.tagNameCheck), I(u, "attributeNameCheck") && Tn(u.attributeNameCheck) && (L.attributeNameCheck = u.attributeNameCheck), I(u, "allowCustomizedBuiltInElements") && typeof u.allowCustomizedBuiltInElements == "boolean" && (L.allowCustomizedBuiltInElements = u.allowCustomizedBuiltInElements), pe && (yt = !1), ot && (xe = !0), ke && (D = k({}, jn), P = Se(null), ke.html === !0 && (k(D, Wn), k(P, qn)), ke.svg === !0 && (k(D, Ft), k(P, Bt), k(P, ft)), ke.svgFilters === !0 && (k(D, Ut), k(P, Bt), k(P, ft)), ke.mathMl === !0 && (k(D, Ht), k(P, Zn), k(P, ft))), le.tagCheck = null, le.attributeCheck = null, I(r, "ADD_TAGS") && (typeof r.ADD_TAGS == "function" ? le.tagCheck = r.ADD_TAGS : B(r.ADD_TAGS) && (D === cn && (D = j(D)), k(D, r.ADD_TAGS, N))), I(r, "ADD_ATTR") && (typeof r.ADD_ATTR == "function" ? le.attributeCheck = r.ADD_ATTR : B(r.ADD_ATTR) && (P === un && (P = j(P)), k(P, r.ADD_ATTR, N))), I(r, "ADD_URI_SAFE_ATTR") && B(r.ADD_URI_SAFE_ATTR) && k(Rt, r.ADD_URI_SAFE_ATTR, N), I(r, "FORBID_CONTENTS") && B(r.FORBID_CONTENTS) && (ne === St && (ne = j(ne)), k(ne, r.FORBID_CONTENTS, N)), I(r, "ADD_FORBID_CONTENTS") && B(r.ADD_FORBID_CONTENTS) && (ne === St && (ne = j(ne)), k(ne, r.ADD_FORBID_CONTENTS, N)), At && (D["#text"] = !0), he && k(D, ["html", "head", "body"]), D.table && (k(D, ["tbody"]), delete De.tbody), r.TRUSTED_TYPES_POLICY) {
      if (typeof r.TRUSTED_TYPES_POLICY.createHTML != "function")
        throw ht('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      if (typeof r.TRUSTED_TYPES_POLICY.createScriptURL != "function")
        throw ht('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      $ = r.TRUSTED_TYPES_POLICY, re = $.createHTML("");
    } else
      $ === void 0 && ($ = Qs(y, i)), $ !== null && typeof re == "string" && (re = $.createHTML(""));
    G && G(r), we = r;
  }, wn = k({}, [...Ft, ...Ut, ...Fs]), yn = k({}, [...Ht, ...Us]), Pi = function(r) {
    let u = ue(r);
    (!u || !u.tagName) && (u = {
      namespaceURI: Te,
      tagName: "template"
    });
    const d = Be(r.tagName), E = Be(u.tagName);
    return Lt[r.namespaceURI] ? r.namespaceURI === ct ? u.namespaceURI === ie ? d === "svg" : u.namespaceURI === lt ? d === "svg" && (E === "annotation-xml" || Ct[E]) : !!wn[d] : r.namespaceURI === lt ? u.namespaceURI === ie ? d === "math" : u.namespaceURI === ct ? d === "math" && vt[E] : !!yn[d] : r.namespaceURI === ie ? u.namespaceURI === ct && !vt[E] || u.namespaceURI === lt && !Ct[E] ? !1 : !yn[d] && (Di[d] || !wn[d]) : !!($e === "application/xhtml+xml" && Lt[r.namespaceURI]) : !1;
  }, J = function(r) {
    Ee(t.removed, {
      element: r
    });
    try {
      ue(r).removeChild(r);
    } catch {
      Ne(r);
    }
  }, fe = function(r, u) {
    try {
      Ee(t.removed, {
        attribute: u.getAttributeNode(r),
        from: u
      });
    } catch {
      Ee(t.removed, {
        attribute: null,
        from: u
      });
    }
    if (u.removeAttribute(r), r === "is")
      if (xe || ot)
        try {
          J(u);
        } catch {
        }
      else
        try {
          u.setAttribute(r, "");
        } catch {
        }
  }, En = function(r) {
    let u = null, d = null;
    if (_t)
      r = "<remove></remove>" + r;
    else {
      const v = Un(r, /^[\r\n\t ]+/);
      d = v && v[0];
    }
    $e === "application/xhtml+xml" && Te === ie && (r = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + r + "</body></html>");
    const E = $ ? $.createHTML(r) : r;
    if (Te === ie)
      try {
        u = new w().parseFromString(E, $e);
      } catch {
      }
    if (!u || !u.documentElement) {
      u = wt.createDocument(Te, "template", null);
      try {
        u.documentElement.innerHTML = It ? re : E;
      } catch {
      }
    }
    const M = u.body || u.documentElement;
    return r && d && M.insertBefore(e.createTextNode(d), M.childNodes[0] || null), Te === ie ? Ri.call(u, he ? "html" : "body")[0] : he ? u.documentElement : M;
  }, _n = function(r) {
    return Ai.call(
      r.ownerDocument || r,
      r,
      // eslint-disable-next-line no-bitwise
      h.SHOW_ELEMENT | h.SHOW_COMMENT | h.SHOW_TEXT | h.SHOW_PROCESSING_INSTRUCTION | h.SHOW_CDATA_SECTION,
      null
    );
  }, Nt = function(r) {
    return r instanceof g && (typeof r.nodeName != "string" || typeof r.textContent != "string" || typeof r.removeChild != "function" || !(r.attributes instanceof m) || typeof r.removeAttribute != "function" || typeof r.setAttribute != "function" || typeof r.namespaceURI != "string" || typeof r.insertBefore != "function" || typeof r.hasChildNodes != "function");
  }, Dt = function(r) {
    return typeof l == "function" && r instanceof l;
  };
  function oe(b, r, u) {
    ye(b, (d) => {
      d.call(t, r, u, we);
    });
  }
  const An = function(r) {
    let u = null;
    if (oe(H.beforeSanitizeElements, r, null), Nt(r))
      return J(r), !0;
    const d = N(r.nodeName);
    if (oe(H.uponSanitizeElement, r, {
      tagName: d,
      allowedTags: D
    }), Me && r.hasChildNodes() && !Dt(r.firstElementChild) && U(/<[/\w!]/g, r.innerHTML) && U(/<[/\w!]/g, r.textContent) || Me && r.namespaceURI === ie && d === "style" && Dt(r.firstElementChild) || r.nodeType === Ae.progressingInstruction || Me && r.nodeType === Ae.comment && U(/<[/\w]/g, r.data))
      return J(r), !0;
    if (De[d] || !(le.tagCheck instanceof Function && le.tagCheck(d)) && !D[d]) {
      if (!De[d] && Rn(d) && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, d) || L.tagNameCheck instanceof Function && L.tagNameCheck(d)))
        return !1;
      if (At && !ne[d]) {
        const E = ue(r) || r.parentNode, M = tt(r) || r.childNodes;
        if (M && E) {
          const v = M.length;
          for (let W = v - 1; W >= 0; --W) {
            const X = Y(M[W], !0);
            E.insertBefore(X, et(r));
          }
        }
      }
      return J(r), !0;
    }
    return r instanceof c && !Pi(r) || (d === "noscript" || d === "noembed" || d === "noframes") && U(/<\/no(script|embed|frames)/i, r.innerHTML) ? (J(r), !0) : (pe && r.nodeType === Ae.text && (u = r.textContent, ye([nt, it, st], (E) => {
      u = _e(u, E, " ");
    }), r.textContent !== u && (Ee(t.removed, {
      element: r.cloneNode()
    }), r.textContent = u)), oe(H.afterSanitizeElements, r, null), !1);
  }, Sn = function(r, u, d) {
    if (rt[u] || dn && (u === "id" || u === "name") && (d in e || d in $i))
      return !1;
    const E = P[u] || le.attributeCheck instanceof Function && le.attributeCheck(u, r);
    if (!(yt && !rt[u] && U(Li, u))) {
      if (!(pn && U(Ci, u))) {
        if (!E || rt[u]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(Rn(r) && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, r) || L.tagNameCheck instanceof Function && L.tagNameCheck(r)) && (L.attributeNameCheck instanceof RegExp && U(L.attributeNameCheck, u) || L.attributeNameCheck instanceof Function && L.attributeNameCheck(u, r)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            u === "is" && L.allowCustomizedBuiltInElements && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, d) || L.tagNameCheck instanceof Function && L.tagNameCheck(d)))
          ) return !1;
        } else if (!Rt[u]) {
          if (!U(ln, _e(d, an, ""))) {
            if (!((u === "src" || u === "xlink:href" || u === "href") && r !== "script" && Hn(d, "data:") === 0 && bn[r])) {
              if (!(hn && !U(vi, _e(d, an, "")))) {
                if (d)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Fi = k({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]), Rn = function(r) {
    return !Fi[Be(r)] && U(Oi, r);
  }, In = function(r) {
    oe(H.beforeSanitizeAttributes, r, null);
    const u = r.attributes;
    if (!u || Nt(r))
      return;
    const d = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: P,
      forceKeepAttr: void 0
    };
    let E = u.length;
    for (; E--; ) {
      const M = u[E], v = M.name, W = M.namespaceURI, X = M.value, ee = N(v), zt = X;
      let z = v === "value" ? zt : Os(zt);
      if (d.attrName = ee, d.attrValue = z, d.keepAttr = !0, d.forceKeepAttr = void 0, oe(H.uponSanitizeAttribute, r, d), z = d.attrValue, mn && (ee === "id" || ee === "name") && Hn(z, gn) !== 0 && (fe(v, r), z = gn + z), Me && U(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, z)) {
        fe(v, r);
        continue;
      }
      if (ee === "attributename" && Un(z, "href")) {
        fe(v, r);
        continue;
      }
      if (d.forceKeepAttr)
        continue;
      if (!d.keepAttr) {
        fe(v, r);
        continue;
      }
      if (!fn && U(/\/>/i, z)) {
        fe(v, r);
        continue;
      }
      pe && ye([nt, it, st], (Cn) => {
        z = _e(z, Cn, " ");
      });
      const Ln = N(r.nodeName);
      if (!Sn(Ln, ee, z)) {
        fe(v, r);
        continue;
      }
      if ($ && typeof y == "object" && typeof y.getAttributeType == "function" && !W)
        switch (y.getAttributeType(Ln, ee)) {
          case "TrustedHTML": {
            z = $.createHTML(z);
            break;
          }
          case "TrustedScriptURL": {
            z = $.createScriptURL(z);
            break;
          }
        }
      if (z !== zt)
        try {
          W ? r.setAttributeNS(W, v, z) : r.setAttribute(v, z), Nt(r) ? J(r) : Fn(t.removed);
        } catch {
          fe(v, r);
        }
    }
    oe(H.afterSanitizeAttributes, r, null);
  }, Mt = function(r) {
    let u = null;
    const d = _n(r);
    for (oe(H.beforeSanitizeShadowDOM, r, null); u = d.nextNode(); )
      oe(H.uponSanitizeShadowNode, u, null), An(u), In(u), u.content instanceof s && Mt(u.content);
    oe(H.afterSanitizeShadowDOM, r, null);
  }, ut = function(r) {
    if (r.nodeType === Ae.element && r.shadowRoot instanceof s) {
      const E = r.shadowRoot;
      ut(E), Mt(E);
    }
    const u = r.childNodes;
    if (!u)
      return;
    const d = [];
    ye(u, (E) => {
      Ee(d, E);
    });
    for (const E of d)
      ut(E);
  };
  return t.sanitize = function(b) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, u = null, d = null, E = null, M = null;
    if (It = !b, It && (b = "<!-->"), typeof b != "string" && !Dt(b) && (b = $s(b), typeof b != "string"))
      throw ht("dirty is not a string, aborting");
    if (!t.isSupported)
      return b;
    if (Et || Ot(r), t.removed = [], typeof b == "string" && (ze = !1), ze) {
      const X = b.nodeName;
      if (typeof X == "string") {
        const ee = N(X);
        if (!D[ee] || De[ee])
          throw ht("root node is forbidden and cannot be sanitized in-place");
      }
      ut(b);
    } else if (b instanceof l)
      u = En("<!---->"), d = u.ownerDocument.importNode(b, !0), d.nodeType === Ae.element && d.nodeName === "BODY" || d.nodeName === "HTML" ? u = d : u.appendChild(d), ut(d);
    else {
      if (!xe && !pe && !he && // eslint-disable-next-line unicorn/prefer-includes
      b.indexOf("<") === -1)
        return $ && at ? $.createHTML(b) : b;
      if (u = En(b), !u)
        return xe ? null : at ? re : "";
    }
    u && _t && J(u.firstChild);
    const v = _n(ze ? b : u);
    for (; E = v.nextNode(); )
      An(E), In(E), E.content instanceof s && Mt(E.content);
    if (ze)
      return b;
    if (xe) {
      if (pe) {
        u.normalize();
        let X = u.innerHTML;
        ye([nt, it, st], (ee) => {
          X = _e(X, ee, " ");
        }), u.innerHTML = X;
      }
      if (ot)
        for (M = Si.call(u.ownerDocument); u.firstChild; )
          M.appendChild(u.firstChild);
      else
        M = u;
      return (P.shadowroot || P.shadowrootmode) && (M = Ii.call(n, M, !0)), M;
    }
    let W = he ? u.outerHTML : u.innerHTML;
    return he && D["!doctype"] && u.ownerDocument && u.ownerDocument.doctype && u.ownerDocument.doctype.name && U(Ys, u.ownerDocument.doctype.name) && (W = "<!DOCTYPE " + u.ownerDocument.doctype.name + `>
` + W), pe && ye([nt, it, st], (X) => {
      W = _e(W, X, " ");
    }), $ && at ? $.createHTML(W) : W;
  }, t.setConfig = function() {
    let b = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Ot(b), Et = !0;
  }, t.clearConfig = function() {
    we = null, Et = !1;
  }, t.isValidAttribute = function(b, r, u) {
    we || Ot({});
    const d = N(b), E = N(r);
    return Sn(d, E, u);
  }, t.addHook = function(b, r) {
    typeof r == "function" && Ee(H[b], r);
  }, t.removeHook = function(b, r) {
    if (r !== void 0) {
      const u = Cs(H[b], r);
      return u === -1 ? void 0 : vs(H[b], u, 1)[0];
    }
    return Fn(H[b]);
  }, t.removeHooks = function(b) {
    H[b] = [];
  }, t.removeAllHooks = function() {
    H = Xn();
  }, t;
}
var Ks = ui(), Ce;
class Js {
  constructor() {
    F(this, Ce);
    C(this, Ce, Ks), T(this, Ce).addHook("afterSanitizeAttributes", (t) => {
      t.tagName === "A" && (t.setAttribute("rel", "noopener noreferrer"), t.setAttribute("target", "_blank"));
    });
  }
  render(t) {
    const e = _.parse(t, { async: !1 });
    return T(this, Ce).sanitize(e, {
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
Ce = new WeakMap();
const Vn = (a) => `chatbot_open_${a}`, He = (a) => `chatbot_conversation_${a}`, er = `
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
}
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
var q, Ve, se, ve, Oe, Qe, ce, ae, me, f, hi, qt, Zt, Ie, Ge, Yt, fi, di, We, mi, gi, je, Xt, dt, bi, xi, Vt, Qt, ki, Ti, Kt, wi, yi, Ei, _i, mt;
class pi extends HTMLElement {
  constructor() {
    super();
    F(this, f);
    F(this, q);
    F(this, Ve, new Js());
    F(this, se, !1);
    F(this, ve, !1);
    F(this, Oe, null);
    F(this, Qe, null);
    F(this, ce, null);
    F(this, ae, null);
    F(this, me, /* @__PURE__ */ new Map());
    C(this, q, this.attachShadow({ mode: "open" }));
  }
  registerClientExtractor(e, n, i = {}) {
    T(this, me).set(e, { fn: n, description: i.description });
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
    x(this, f, qt).call(this), x(this, f, di).call(this), x(this, f, mi).call(this), this.addEventListener("tool_started", (e) => x(this, f, ki).call(this, e.detail.name)), queueMicrotask(() => x(this, f, hi).call(this));
  }
  attributeChangedCallback() {
    T(this, q).innerHTML && x(this, f, qt).call(this);
  }
}
q = new WeakMap(), Ve = new WeakMap(), se = new WeakMap(), ve = new WeakMap(), Oe = new WeakMap(), Qe = new WeakMap(), ce = new WeakMap(), ae = new WeakMap(), me = new WeakMap(), f = new WeakSet(), hi = function() {
  const e = x(this, f, Kt).call(this, this.getAttribute("signed-context"));
  for (const n of e)
    T(this, me).has(n) || console.error(
      `Client extractor '${n}' is in the signed allowlist but has no matching JS registration on the widget.`
    );
}, qt = function() {
  const e = document.createElement("style");
  e.textContent = er;
  const n = this.position === "inline";
  if (T(this, q).innerHTML = "", T(this, q).appendChild(e), !n) {
    const g = document.createElement("button");
    g.className = `launcher ${this.position}`, g.part = "launcher", g.innerHTML = "💬", g.setAttribute("aria-label", "Open chat"), g.addEventListener("click", () => x(this, f, fi).call(this)), T(this, q).appendChild(g);
  }
  const i = document.createElement("div");
  i.className = `panel ${n ? "inline" : this.position}`, i.part = "panel", !n && !T(this, se) && (i.hidden = !0);
  const s = document.createElement("div");
  s.className = "header", s.part = "header", s.innerHTML = `<span>${this.title}</span>`;
  const o = document.createElement("button");
  o.className = "new-chat", o.textContent = "New chat", o.addEventListener("click", () => x(this, f, gi).call(this)), s.appendChild(o), i.appendChild(s);
  const l = document.createElement("div");
  l.className = "messages", l.part = "messages", i.appendChild(l);
  const c = document.createElement("div");
  c.className = "tool-status", c.setAttribute("part", "tool-status"), c.hidden = !0, i.appendChild(c), C(this, ae, c);
  const h = document.createElement("div");
  h.className = "input-row";
  const p = document.createElement("textarea");
  p.className = "input", p.part = "input", p.placeholder = "Ask a question…", p.rows = 1, p.addEventListener("keydown", (g) => {
    g.key === "Enter" && !g.shiftKey && (g.preventDefault(), x(this, f, je).call(this));
  }), h.appendChild(p);
  const m = document.createElement("button");
  m.className = "send-button", m.part = "send-button", m.textContent = "Send", m.addEventListener("click", () => x(this, f, je).call(this)), h.appendChild(m), i.appendChild(h), T(this, q).appendChild(i);
}, Zt = function() {
  return T(this, q).querySelector(".panel");
}, Ie = function() {
  return T(this, q).querySelector(".messages");
}, Ge = function() {
  return T(this, q).querySelector(".input");
}, Yt = function() {
  return T(this, q).querySelector(".send-button");
}, fi = function() {
  var n;
  C(this, se, !T(this, se));
  const e = x(this, f, Zt).call(this);
  e && (e.hidden = !T(this, se)), localStorage.setItem(Vn(this.channel), T(this, se) ? "1" : "0"), T(this, se) && ((n = x(this, f, Ge).call(this)) == null || n.focus());
}, di = function() {
  if (localStorage.getItem(Vn(this.channel)) === "1") {
    C(this, se, !0);
    const n = x(this, f, Zt).call(this);
    n && (n.hidden = !1);
  }
}, We = function() {
  const e = this.getAttribute("signed-context");
  if (e)
    try {
      const n = JSON.parse(atob(e.split(".")[1] ?? ""));
      n.greeting && x(this, f, dt).call(this, n.greeting);
    } catch {
    }
}, mi = async function() {
  const e = localStorage.getItem(He(this.channel));
  if (!e) {
    x(this, f, We).call(this);
    return;
  }
  try {
    const n = await fetch(`/chatbot/conversations/${e}/messages`);
    if (!n.ok) {
      localStorage.removeItem(He(this.channel)), x(this, f, We).call(this);
      return;
    }
    const { messages: i } = await n.json();
    for (const s of i)
      s.role === "user" ? x(this, f, Xt).call(this, s.content) : s.role === "assistant" && x(this, f, dt).call(this, s.content);
  } catch {
    x(this, f, We).call(this);
  }
}, gi = function() {
  localStorage.removeItem(He(this.channel));
  const e = x(this, f, Ie).call(this);
  e && (e.innerHTML = ""), C(this, Oe, null), C(this, Qe, null), C(this, ce, null), x(this, f, We).call(this);
}, je = async function() {
  var m;
  if (T(this, ve)) return;
  const e = x(this, f, Ge).call(this), n = e == null ? void 0 : e.value.trim();
  if (!n) return;
  e.value = "", x(this, f, Xt).call(this, n);
  const i = this.getAttribute("signed-context"), s = localStorage.getItem(He(this.channel)), o = await x(this, f, yi).call(this, i);
  x(this, f, Ei).call(this), x(this, f, _i).call(this, o), C(this, ve, !0);
  const l = x(this, f, Yt).call(this);
  l && (l.disabled = !0);
  const c = x(this, f, dt).call(this, "");
  C(this, Qe, c), C(this, ce, null);
  const h = new Bi();
  h.addEventListener("chunk", (g) => {
    c.dataset.raw = (c.dataset.raw ?? "") + g.detail.text, c.innerHTML = T(this, Ve).render(c.dataset.raw);
  }), h.addEventListener("context_summary", (g) => {
    const w = x(this, f, bi).call(this, c);
    w.textContent = g.detail.text;
  }), h.addEventListener("done", (g) => {
    var w;
    (w = g.detail) != null && w.conversationId && localStorage.setItem(He(this.channel), g.detail.conversationId), x(this, f, xi).call(this, c), x(this, f, mt).call(this);
  }), h.addEventListener("tool_started", (g) => this.dispatchEvent(new CustomEvent("tool_started", { detail: g.detail }))), h.addEventListener("tool_finished", (g) => this.dispatchEvent(new CustomEvent("tool_finished", { detail: g.detail }))), h.addEventListener("tool_failed", (g) => this.dispatchEvent(new CustomEvent("tool_failed", { detail: g.detail }))), h.addEventListener("error", (g) => {
    x(this, f, Qt).call(this, g.detail, c, n, i, s), x(this, f, mt).call(this);
  });
  const p = (m = document.querySelector('meta[name="csrf-token"]')) == null ? void 0 : m.content;
  try {
    await h.connect("/chatbot/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...p ? { "X-CSRF-TOKEN": p } : {}
      },
      body: JSON.stringify({
        message: n,
        signed_context: i,
        ...s ? { conversation_id: s } : {},
        ...o.length ? { extractor_blocks: o } : {}
      })
    });
  } catch {
    x(this, f, Qt).call(this, { code: "network_error", message: "Connection failed.", retryable: !0 }, c, n, i, s), x(this, f, mt).call(this);
  }
}, Xt = function(e) {
  const n = x(this, f, Ie).call(this), i = document.createElement("div");
  return i.className = "message message-user", i.part = "message-user", i.textContent = e, n == null || n.appendChild(i), i.scrollIntoView({ behavior: "smooth" }), C(this, Oe, e), i;
}, dt = function(e) {
  const n = x(this, f, Ie).call(this), i = document.createElement("div");
  return i.className = "message message-assistant", i.part = "message-assistant", i.dataset.raw = e, e && (i.innerHTML = T(this, Ve).render(e)), n == null || n.appendChild(i), i.scrollIntoView({ behavior: "smooth" }), i;
}, bi = function(e) {
  var i;
  if (T(this, ce)) return T(this, ce);
  const n = document.createElement("div");
  return n.className = "context-summary", (i = e.parentElement) == null || i.insertBefore(n, e), C(this, ce, n), n;
}, xi = function(e) {
  var c;
  const n = document.createElement("div");
  n.className = "message-actions";
  const i = document.createElement("button");
  i.className = "action-btn", i.textContent = "📋 Copy", i.addEventListener("click", () => navigator.clipboard.writeText(e.dataset.raw ?? ""));
  const s = document.createElement("button");
  s.className = "action-btn", s.textContent = "🔄 Regenerate", s.addEventListener("click", () => {
    e.dataset.raw = "", e.innerHTML = "", n.remove(), T(this, Oe) && x(this, f, je).call(this);
  });
  const o = document.createElement("button");
  o.className = "action-btn", o.textContent = "👍", o.addEventListener("click", () => x(this, f, Vt).call(this, e, 1, o, l));
  const l = document.createElement("button");
  l.className = "action-btn", l.textContent = "👎", l.addEventListener("click", () => x(this, f, Vt).call(this, e, -1, o, l)), n.append(i, s, o, l), (c = e.parentElement) == null || c.insertBefore(n, e.nextSibling);
}, Vt = async function(e, n, i, s) {
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
  }), i.disabled = !0, s.disabled = !0;
}, Qt = function(e, n, i, s, o) {
  const l = x(this, f, Ie).call(this);
  n.remove();
  const c = document.createElement("div");
  if (c.className = "message error-msg", e.code === "quota_exceeded" || e.code === "token_cap_exceeded")
    c.className = "message quota-msg", c.textContent = e.message || "Daily limit reached. Try again later.";
  else if (e.code === "content_blocked")
    c.textContent = e.message || "This message was blocked by content policy.";
  else if (c.textContent = e.message || "Something went wrong.", e.retryable) {
    const h = document.createElement("button");
    h.className = "retry-btn", h.textContent = "Retry", h.addEventListener("click", () => {
      c.remove(), x(this, f, Ge).call(this) && (x(this, f, Ge).call(this).value = i), x(this, f, je).call(this);
    }), c.appendChild(h);
  }
  l == null || l.appendChild(c), c.scrollIntoView({ behavior: "smooth" });
}, ki = function(e) {
  T(this, ae) && (T(this, ae).textContent = `Working: ${e}…`, T(this, ae).removeAttribute("hidden"));
}, Ti = function() {
  T(this, ae) && T(this, ae).setAttribute("hidden", "");
}, Kt = function(e) {
  if (!e) return [];
  try {
    const n = JSON.parse(atob(e.split(".")[1] ?? ""));
    return Array.isArray(n.x) ? n.x : [];
  } catch {
    return [];
  }
}, wi = function(e) {
  if (!e) return {};
  try {
    return JSON.parse(atob(e.split(".")[1] ?? ""));
  } catch {
    return {};
  }
}, yi = async function(e) {
  const n = x(this, f, Kt).call(this, e);
  if (n.length === 0) return [];
  const i = x(this, f, wi).call(this, e), s = Number.isInteger(i.xt) && i.xt > 0 ? i.xt : 250, o = Number.isInteger(i.xc) && i.xc > 0 ? i.xc : 8192;
  return (await Promise.all(n.map(async (c) => {
    const h = T(this, me).get(c);
    if (!h) return null;
    const p = h.fn;
    try {
      const m = await Promise.race([
        Promise.resolve().then(() => p()),
        new Promise((y, R) => setTimeout(() => R(new Error("__extractor_timeout__")), s))
      ]);
      if (m == null || m === "")
        return console.warn(`Client extractor '${c}' returned empty output; block omitted.`), null;
      let g = String(m);
      const w = new TextEncoder().encode(g);
      if (w.byteLength > o) {
        const y = " [truncated]", R = w.slice(0, Math.max(0, o - y.length));
        g = new TextDecoder("utf-8", { fatal: !1 }).decode(R) + y;
      }
      return { name: c, output: g };
    } catch (m) {
      return m && m.message === "__extractor_timeout__" ? console.warn(`Client extractor '${c}' exceeded ${s}ms timeout; block omitted.`) : console.error(`Client extractor '${c}' threw; block omitted.`, m), null;
    }
  }))).filter((c) => c !== null);
}, Ei = function() {
  T(this, q).querySelectorAll('[part="extractor-chip"]').forEach((e) => e.remove());
}, _i = function(e) {
  if (!e.length) return;
  const n = x(this, f, Ie).call(this);
  if (!n) return;
  const i = e.map((o) => {
    var l;
    return ((l = T(this, me).get(o.name)) == null ? void 0 : l.description) ?? o.name;
  }), s = document.createElement("div");
  s.className = "extractor-chip", s.setAttribute("part", "extractor-chip"), s.textContent = `Read from page: ${i.join(", ")}`, n.appendChild(s);
}, mt = function() {
  C(this, ve, !1), setTimeout(() => x(this, f, Ti).call(this), 500);
  const e = x(this, f, Yt).call(this);
  e && (e.disabled = !1);
}, A(pi, "observedAttributes", ["channel", "position", "title"]);
customElements.define("chatbot-widget", pi);
export {
  pi as ChatbotWidget
};
