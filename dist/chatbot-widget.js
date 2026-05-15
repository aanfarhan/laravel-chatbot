var Ii = Object.defineProperty;
var An = (a) => {
  throw TypeError(a);
};
var Li = (a, t, e) => t in a ? Ii(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var _ = (a, t, e) => Li(a, typeof t != "symbol" ? t + "" : t, e), Ot = (a, t, e) => t.has(a) || An("Cannot " + e);
var S = (a, t, e) => (Ot(a, t, "read from private field"), e ? e.call(a) : t.get(a)), W = (a, t, e) => t.has(a) ? An("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(a) : t.set(a, e), z = (a, t, e, n) => (Ot(a, t, "write to private field"), n ? n.call(a, e) : t.set(a, e), e), k = (a, t, e) => (Ot(a, t, "access private method"), e);
var Be, fe, Ge, ht, jn;
class Oi extends EventTarget {
  constructor(e = globalThis.fetch) {
    super();
    W(this, ht);
    W(this, Be);
    W(this, fe, !1);
    W(this, Ge, null);
    z(this, Be, e);
  }
  abort() {
    var e;
    z(this, fe, !0), (e = S(this, Ge)) == null || e.cancel();
  }
  async connect(e, n = {}) {
    z(this, fe, !1);
    const s = (await S(this, Be).call(this, e, n)).body.getReader();
    z(this, Ge, s);
    const o = new TextDecoder();
    let l = "";
    for (; !S(this, fe); ) {
      const { done: c, value: h } = await s.read();
      if (c) break;
      l += o.decode(h, { stream: !0 });
      const p = l.split(`
`);
      l = p.pop() ?? "";
      for (const d of p) {
        if (S(this, fe)) break;
        k(this, ht, jn).call(this, d);
      }
    }
    s.cancel();
  }
}
Be = new WeakMap(), fe = new WeakMap(), Ge = new WeakMap(), ht = new WeakSet(), jn = function(e) {
  if (!e.startsWith("data: ")) return;
  const n = e.slice(6);
  let i;
  try {
    i = JSON.parse(n);
  } catch {
    return;
  }
  switch (i.type) {
    case "token":
      this.dispatchEvent(new CustomEvent("chunk", { detail: { text: i.text } }));
      break;
    case "done":
      this.dispatchEvent(new CustomEvent("done", { detail: { usage: i.usage } }));
      break;
    case "error":
      this.dispatchEvent(new CustomEvent("error", {
        detail: { code: i.code, message: i.message, retryable: i.retryable }
      }));
      break;
    case "context_summary":
      this.dispatchEvent(new CustomEvent("context_summary", { detail: { text: i.text } }));
      break;
  }
};
function Zt() {
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
let me = Zt();
function qn(a) {
  me = a;
}
const Zn = /[&<>"']/, Ci = new RegExp(Zn.source, "g"), Yn = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, vi = new RegExp(Yn.source, "g"), Ni = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, Sn = (a) => Ni[a];
function Z(a, t) {
  if (t) {
    if (Zn.test(a))
      return a.replace(Ci, Sn);
  } else if (Yn.test(a))
    return a.replace(vi, Sn);
  return a;
}
const Di = /(^|[^\[])\^/g;
function A(a, t) {
  let e = typeof a == "string" ? a : a.source;
  t = t || "";
  const n = {
    replace: (i, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(Di, "$1"), e = e.replace(i, o), n;
    },
    getRegex: () => new RegExp(e, t)
  };
  return n;
}
function Rn(a) {
  try {
    a = encodeURI(a).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return a;
}
const Ue = { exec: () => null };
function In(a, t) {
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
function De(a, t, e) {
  const n = a.length;
  if (n === 0)
    return "";
  let i = 0;
  for (; i < n && a.charAt(n - i - 1) === t; )
    i++;
  return a.slice(0, n - i);
}
function Mi(a, t) {
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
function Ln(a, t, e, n) {
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
function zi(a, t) {
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
class ct {
  // set by the lexer
  constructor(t) {
    _(this, "options");
    _(this, "rules");
    // set by the lexer
    _(this, "lexer");
    this.options = t || me;
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
        text: this.options.pedantic ? n : De(n, `
`)
      };
    }
  }
  fences(t) {
    const e = this.rules.block.fences.exec(t);
    if (e) {
      const n = e[0], i = zi(n, e[3] || "");
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
        const i = De(n, "#");
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
        raw: De(e[0], `
`)
      };
  }
  blockquote(t) {
    const e = this.rules.block.blockquote.exec(t);
    if (e) {
      let n = De(e[0], `
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
`), d = p.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`).replace(/^ {0,3}>[ \t]?/gm, "");
        i = i ? `${i}
${p}` : p, s = s ? `${s}
${d}` : d;
        const x = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(d, o, !0), this.lexer.state.top = x, n.length === 0)
          break;
        const w = o[o.length - 1];
        if ((w == null ? void 0 : w.type) === "code")
          break;
        if ((w == null ? void 0 : w.type) === "blockquote") {
          const y = w, v = y.raw + `
` + n.join(`
`), Y = this.blockquote(v);
          o[o.length - 1] = Y, i = i.substring(0, i.length - y.raw.length) + Y.raw, s = s.substring(0, s.length - y.text.length) + Y.text;
          break;
        } else if ((w == null ? void 0 : w.type) === "list") {
          const y = w, v = y.raw + `
` + n.join(`
`), Y = this.list(v);
          o[o.length - 1] = Y, i = i.substring(0, i.length - w.raw.length) + Y.raw, s = s.substring(0, s.length - y.raw.length) + Y.raw, n = v.substring(o[o.length - 1].raw.length).split(`
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
        let d = e[2].split(`
`, 1)[0].replace(/^\t+/, (Le) => " ".repeat(3 * Le.length)), x = t.split(`
`, 1)[0], w = !d.trim(), y = 0;
        if (this.options.pedantic ? (y = 2, p = d.trimStart()) : w ? y = e[1].length + 1 : (y = e[2].search(/[^ ]/), y = y > 4 ? 1 : y, p = d.slice(y), y += e[1].length), w && /^[ \t]*$/.test(x) && (h += x + `
`, t = t.substring(x.length + 1), c = !0), !c) {
          const Le = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), Ye = new RegExp(`^ {0,${Math.min(3, y - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), Xe = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:\`\`\`|~~~)`), ce = new RegExp(`^ {0,${Math.min(3, y - 1)}}#`), P = new RegExp(`^ {0,${Math.min(3, y - 1)}}<(?:[a-z].*>|!--)`, "i");
          for (; t; ) {
            const se = t.split(`
`, 1)[0];
            let te;
            if (x = se, this.options.pedantic ? (x = x.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  "), te = x) : te = x.replace(/\t/g, "    "), Xe.test(x) || ce.test(x) || P.test(x) || Le.test(x) || Ye.test(x))
              break;
            if (te.search(/[^ ]/) >= y || !x.trim())
              p += `
` + te.slice(y);
            else {
              if (w || d.replace(/\t/g, "    ").search(/[^ ]/) >= 4 || Xe.test(d) || ce.test(d) || Ye.test(d))
                break;
              p += `
` + x;
            }
            !w && !x.trim() && (w = !0), h += se + `
`, t = t.substring(se.length + 1), d = te.slice(y);
          }
        }
        s.loose || (l ? s.loose = !0 : /\n[ \t]*\n[ \t]*$/.test(h) && (l = !0));
        let v = null, Y;
        this.options.gfm && (v = /^\[[ xX]\] /.exec(p), v && (Y = v[0] !== "[ ] ", p = p.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: h,
          task: !!v,
          checked: Y,
          loose: !1,
          text: p,
          tokens: []
        }), s.raw += h;
      }
      s.items[s.items.length - 1].raw = s.items[s.items.length - 1].raw.trimEnd(), s.items[s.items.length - 1].text = s.items[s.items.length - 1].text.trimEnd(), s.raw = s.raw.trimEnd();
      for (let c = 0; c < s.items.length; c++)
        if (this.lexer.state.top = !1, s.items[c].tokens = this.lexer.blockTokens(s.items[c].text, []), !s.loose) {
          const h = s.items[c].tokens.filter((d) => d.type === "space"), p = h.length > 0 && h.some((d) => /\n.*\n/.test(d.raw));
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
    const n = In(e[1]), i = e[2].replace(/^\||\| *$/g, "").split("|"), s = e[3] && e[3].trim() ? e[3].replace(/\n[ \t]*$/, "").split(`
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
        o.rows.push(In(l, o.header.length).map((c, h) => ({
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
        const o = De(n.slice(0, -1), "\\");
        if ((n.length - o.length) % 2 === 0)
          return;
      } else {
        const o = Mi(e[2], "()");
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
      return i = i.trim(), /^</.test(i) && (this.options.pedantic && !/>$/.test(n) ? i = i.slice(1) : i = i.slice(1, -1)), Ln(e, {
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
      return Ln(n, s, n[0], this.lexer);
    }
  }
  emStrong(t, e, n = "") {
    let i = this.rules.inline.emStrongLDelim.exec(t);
    if (!i || i[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(i[1] || i[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const o = [...i[0]].length - 1;
      let l, c, h = o, p = 0;
      const d = i[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (d.lastIndex = 0, e = e.slice(-1 * t.length + o); (i = d.exec(e)) != null; ) {
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
        const x = [...i[0]][0].length, w = t.slice(0, o + i.index + x + c);
        if (Math.min(o, c) % 2) {
          const v = w.slice(1, -1);
          return {
            type: "em",
            raw: w,
            text: v,
            tokens: this.lexer.inlineTokens(v)
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
const Pi = /^(?:[ \t]*(?:\n|$))+/, $i = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Fi = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, qe = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, Ui = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Xn = /(?:[*+-]|\d{1,9}[.)])/, Vn = A(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Xn).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), Yt = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, Hi = /^[^\n]+/, Xt = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Bi = A(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Xt).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Gi = A(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Xn).getRegex(), ft = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", Vt = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Wi = A("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", Vt).replace("tag", ft).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), Qn = A(Yt).replace("hr", qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ft).getRegex(), ji = A(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", Qn).getRegex(), Qt = {
  blockquote: ji,
  code: $i,
  def: Bi,
  fences: Fi,
  heading: Ui,
  hr: qe,
  html: Wi,
  lheading: Vn,
  list: Gi,
  newline: Pi,
  paragraph: Qn,
  table: Ue,
  text: Hi
}, On = A("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ft).getRegex(), qi = {
  ...Qt,
  table: On,
  paragraph: A(Yt).replace("hr", qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", On).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", ft).getRegex()
}, Zi = {
  ...Qt,
  html: A(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", Vt).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Ue,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: A(Yt).replace("hr", qe).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", Vn).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, Kn = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Yi = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, Jn = /^( {2,}|\\)\n(?!\s*$)/, Xi = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Ze = "\\p{P}\\p{S}", Vi = A(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Ze).getRegex(), Qi = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, Ki = A(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Ze).getRegex(), Ji = A("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Ze).getRegex(), es = A("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Ze).getRegex(), ts = A(/\\([punct])/, "gu").replace(/punct/g, Ze).getRegex(), ns = A(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), is = A(Vt).replace("(?:-->|$)", "-->").getRegex(), ss = A("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", is).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), ut = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, rs = A(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", ut).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), ei = A(/^!?\[(label)\]\[(ref)\]/).replace("label", ut).replace("ref", Xt).getRegex(), ti = A(/^!?\[(ref)\](?:\[\])?/).replace("ref", Xt).getRegex(), os = A("reflink|nolink(?!\\()", "g").replace("reflink", ei).replace("nolink", ti).getRegex(), Kt = {
  _backpedal: Ue,
  // only used for GFM url
  anyPunctuation: ts,
  autolink: ns,
  blockSkip: Qi,
  br: Jn,
  code: Yi,
  del: Ue,
  emStrongLDelim: Ki,
  emStrongRDelimAst: Ji,
  emStrongRDelimUnd: es,
  escape: Kn,
  link: rs,
  nolink: ti,
  punctuation: Vi,
  reflink: ei,
  reflinkSearch: os,
  tag: ss,
  text: Xi,
  url: Ue
}, as = {
  ...Kt,
  link: A(/^!?\[(label)\]\((.*?)\)/).replace("label", ut).getRegex(),
  reflink: A(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", ut).getRegex()
}, Pt = {
  ...Kt,
  escape: A(Kn).replace("])", "~|])").getRegex(),
  url: A(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, ls = {
  ...Pt,
  br: A(Jn).replace("{2,}", "*").getRegex(),
  text: A(Pt.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, rt = {
  normal: Qt,
  gfm: qi,
  pedantic: Zi
}, Me = {
  normal: Kt,
  gfm: Pt,
  breaks: ls,
  pedantic: as
};
class V {
  constructor(t) {
    _(this, "tokens");
    _(this, "options");
    _(this, "state");
    _(this, "tokenizer");
    _(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || me, this.options.tokenizer = this.options.tokenizer || new ct(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const e = {
      block: rt.normal,
      inline: Me.normal
    };
    this.options.pedantic ? (e.block = rt.pedantic, e.inline = Me.pedantic) : this.options.gfm && (e.block = rt.gfm, this.options.breaks ? e.inline = Me.breaks : e.inline = Me.gfm), this.tokenizer.rules = e;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: rt,
      inline: Me
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
          const d = t.slice(1);
          let x;
          this.options.extensions.startInline.forEach((w) => {
            x = w.call({ lexer: this }, d), typeof x == "number" && x >= 0 && (p = Math.min(p, x));
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
class pt {
  // set by the parser
  constructor(t) {
    _(this, "options");
    _(this, "parser");
    this.options = t || me;
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
    const i = this.parser.parseInline(n), s = Rn(t);
    if (s === null)
      return i;
    t = s;
    let o = '<a href="' + t + '"';
    return e && (o += ' title="' + e + '"'), o += ">" + i + "</a>", o;
  }
  image({ href: t, title: e, text: n }) {
    const i = Rn(t);
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
class Jt {
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
    _(this, "options");
    _(this, "renderer");
    _(this, "textRenderer");
    this.options = t || me, this.options.renderer = this.options.renderer || new pt(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new Jt();
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
class He {
  constructor(t) {
    _(this, "options");
    _(this, "block");
    this.options = t || me;
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
_(He, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
class cs {
  constructor(...t) {
    _(this, "defaults", Zt());
    _(this, "options", this.setOptions);
    _(this, "parse", this.parseMarkdown(!0));
    _(this, "parseInline", this.parseMarkdown(!1));
    _(this, "Parser", Q);
    _(this, "Renderer", pt);
    _(this, "TextRenderer", Jt);
    _(this, "Lexer", V);
    _(this, "Tokenizer", ct);
    _(this, "Hooks", He);
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
        const s = this.defaults.renderer || new pt(this.defaults);
        for (const o in n.renderer) {
          if (!(o in s))
            throw new Error(`renderer '${o}' does not exist`);
          if (["options", "parser"].includes(o))
            continue;
          const l = o, c = n.renderer[l], h = s[l];
          s[l] = (...p) => {
            let d = c.apply(s, p);
            return d === !1 && (d = h.apply(s, p)), d || "";
          };
        }
        i.renderer = s;
      }
      if (n.tokenizer) {
        const s = this.defaults.tokenizer || new ct(this.defaults);
        for (const o in n.tokenizer) {
          if (!(o in s))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const l = o, c = n.tokenizer[l], h = s[l];
          s[l] = (...p) => {
            let d = c.apply(s, p);
            return d === !1 && (d = h.apply(s, p)), d;
          };
        }
        i.tokenizer = s;
      }
      if (n.hooks) {
        const s = this.defaults.hooks || new He();
        for (const o in n.hooks) {
          if (!(o in s))
            throw new Error(`hook '${o}' does not exist`);
          if (["options", "block"].includes(o))
            continue;
          const l = o, c = n.hooks[l], h = s[l];
          He.passThroughHooks.has(o) ? s[l] = (p) => {
            if (this.defaults.async)
              return Promise.resolve(c.call(s, p)).then((x) => h.call(s, x));
            const d = c.call(s, p);
            return h.call(s, d);
          } : s[l] = (...p) => {
            let d = c.apply(s, p);
            return d === !1 && (d = h.apply(s, p)), d;
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
        let d = h(p, o);
        return o.hooks && (d = o.hooks.postprocess(d)), d;
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
const de = new cs();
function E(a, t) {
  return de.parse(a, t);
}
E.options = E.setOptions = function(a) {
  return de.setOptions(a), E.defaults = de.defaults, qn(E.defaults), E;
};
E.getDefaults = Zt;
E.defaults = me;
E.use = function(...a) {
  return de.use(...a), E.defaults = de.defaults, qn(E.defaults), E;
};
E.walkTokens = function(a, t) {
  return de.walkTokens(a, t);
};
E.parseInline = de.parseInline;
E.Parser = Q;
E.parser = Q.parse;
E.Renderer = pt;
E.TextRenderer = Jt;
E.Lexer = V;
E.lexer = V.lex;
E.Tokenizer = ct;
E.Hooks = He;
E.parse = E;
E.options;
E.setOptions;
E.use;
E.walkTokens;
E.parseInline;
Q.parse;
V.lex;
/*! @license DOMPurify 3.4.3 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.3/LICENSE */
function Cn(a, t) {
  (t == null || t > a.length) && (t = a.length);
  for (var e = 0, n = Array(t); e < t; e++) n[e] = a[e];
  return n;
}
function us(a) {
  if (Array.isArray(a)) return a;
}
function ps(a, t) {
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
function hs() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function fs(a, t) {
  return us(a) || ps(a, t) || ds(a, t) || hs();
}
function ds(a, t) {
  if (a) {
    if (typeof a == "string") return Cn(a, t);
    var e = {}.toString.call(a).slice(8, -1);
    return e === "Object" && a.constructor && (e = a.constructor.name), e === "Map" || e === "Set" ? Array.from(a) : e === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e) ? Cn(a, t) : void 0;
  }
}
const ni = Object.entries, vn = Object.setPrototypeOf, ms = Object.isFrozen, gs = Object.getPrototypeOf, bs = Object.getOwnPropertyDescriptor;
let B = Object.freeze, K = Object.seal, _e = Object.create, ii = typeof Reflect < "u" && Reflect, $t = ii.apply, Ft = ii.construct;
B || (B = function(t) {
  return t;
});
K || (K = function(t) {
  return t;
});
$t || ($t = function(t, e) {
  for (var n = arguments.length, i = new Array(n > 2 ? n - 2 : 0), s = 2; s < n; s++)
    i[s - 2] = arguments[s];
  return t.apply(e, i);
});
Ft || (Ft = function(t) {
  for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), i = 1; i < e; i++)
    n[i - 1] = arguments[i];
  return new t(...n);
});
const Te = O(Array.prototype.forEach), xs = O(Array.prototype.lastIndexOf), Nn = O(Array.prototype.pop), we = O(Array.prototype.push), ks = O(Array.prototype.splice), H = Array.isArray, Pe = O(String.prototype.toLowerCase), Ct = O(String.prototype.toString), Dn = O(String.prototype.match), ye = O(String.prototype.replace), Mn = O(String.prototype.indexOf), Ts = O(String.prototype.trim), ws = O(Number.prototype.toString), ys = O(Boolean.prototype.toString), zn = typeof BigInt > "u" ? null : O(BigInt.prototype.toString), Pn = typeof Symbol > "u" ? null : O(Symbol.prototype.toString), R = O(Object.prototype.hasOwnProperty), ze = O(Object.prototype.toString), F = O(RegExp.prototype.test), ot = Es(TypeError);
function O(a) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), i = 1; i < e; i++)
      n[i - 1] = arguments[i];
    return $t(a, t, n);
  };
}
function Es(a) {
  return function() {
    for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
      e[n] = arguments[n];
    return Ft(a, e);
  };
}
function b(a, t) {
  let e = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : Pe;
  if (vn && vn(a, null), !H(t))
    return a;
  let n = t.length;
  for (; n--; ) {
    let i = t[n];
    if (typeof i == "string") {
      const s = e(i);
      s !== i && (ms(t) || (t[n] = s), i = s);
    }
    a[i] = !0;
  }
  return a;
}
function _s(a) {
  for (let t = 0; t < a.length; t++)
    R(a, t) || (a[t] = null);
  return a;
}
function j(a) {
  const t = _e(null);
  for (const n of ni(a)) {
    var e = fs(n, 2);
    const i = e[0], s = e[1];
    R(a, i) && (H(s) ? t[i] = _s(s) : s && typeof s == "object" && s.constructor === Object ? t[i] = j(s) : t[i] = s);
  }
  return t;
}
function As(a) {
  switch (typeof a) {
    case "string":
      return a;
    case "number":
      return ws(a);
    case "boolean":
      return ys(a);
    case "bigint":
      return zn ? zn(a) : "0";
    case "symbol":
      return Pn ? Pn(a) : "Symbol()";
    case "undefined":
      return ze(a);
    case "function":
    case "object": {
      if (a === null)
        return ze(a);
      const t = a, e = Ae(t, "toString");
      if (typeof e == "function") {
        const n = e(t);
        return typeof n == "string" ? n : ze(n);
      }
      return ze(a);
    }
    default:
      return ze(a);
  }
}
function Ae(a, t) {
  for (; a !== null; ) {
    const n = bs(a, t);
    if (n) {
      if (n.get)
        return O(n.get);
      if (typeof n.value == "function")
        return O(n.value);
    }
    a = gs(a);
  }
  function e() {
    return null;
  }
  return e;
}
function Ss(a) {
  try {
    return F(a, ""), !0;
  } catch {
    return !1;
  }
}
const $n = B(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), vt = B(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), Nt = B(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Rs = B(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), Dt = B(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Is = B(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Fn = B(["#text"]), Un = B(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]), Mt = B(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Hn = B(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), at = B(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Ls = K(/{{[\w\W]*|^[\w\W]*}}/g), Os = K(/<%[\w\W]*|^[\w\W]*%>/g), Cs = K(/\${[\w\W]*/g), vs = K(/^data-[\-\w.\u00B7-\uFFFF]+$/), Ns = K(/^aria-[\-\w]+$/), Bn = K(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), Ds = K(/^(?:\w+script|data):/i), Ms = K(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), zs = K(/^html$/i), Ps = K(/^[a-z][.\w]*(-[.\w]+)+$/i), Ee = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, $s = function() {
  return typeof window > "u" ? null : window;
}, Fs = function(t, e) {
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
}, Gn = function() {
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
function si() {
  let a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : $s();
  const t = (m) => si(m);
  if (t.version = "3.4.3", t.removed = [], !a || !a.document || a.document.nodeType !== Ee.document || !a.Element)
    return t.isSupported = !1, t;
  let e = a.document;
  const n = e, i = n.currentScript, s = a.DocumentFragment, o = a.HTMLTemplateElement, l = a.Node, c = a.Element, h = a.NodeFilter, p = a.NamedNodeMap, d = p === void 0 ? a.NamedNodeMap || a.MozNamedAttrMap : p, x = a.HTMLFormElement, w = a.DOMParser, y = a.trustedTypes, v = c.prototype, Y = Ae(v, "cloneNode"), Le = Ae(v, "remove"), Ye = Ae(v, "nextSibling"), Xe = Ae(v, "childNodes"), ce = Ae(v, "parentNode");
  if (typeof o == "function") {
    const m = e.createElement("template");
    m.content && m.content.ownerDocument && (e = m.content.ownerDocument);
  }
  let P, se = "";
  const te = e, dt = te.implementation, fi = te.createNodeIterator, di = te.createDocumentFragment, mi = te.getElementsByTagName, gi = n.importNode;
  let U = Gn();
  t.isSupported = typeof ni == "function" && typeof ce == "function" && dt && dt.createHTMLDocument !== void 0;
  const Ve = Ls, Qe = Os, Ke = Cs, bi = vs, xi = Ns, ki = Ds, en = Ms, Ti = Ps;
  let tn = Bn, N = null;
  const nn = b({}, [...$n, ...vt, ...Nt, ...Dt, ...Fn]);
  let $ = null;
  const sn = b({}, [...Un, ...Mt, ...Hn, ...at]);
  let I = Object.seal(_e(null, {
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
  })), Oe = null, Je = null;
  const ae = Object.seal(_e(null, {
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
  let rn = !0, mt = !0, on = !1, an = !0, ue = !1, Ce = !0, pe = !1, gt = !1, bt = !1, ge = !1, et = !1, tt = !1, ln = !0, cn = !1;
  const un = "user-content-";
  let xt = !0, ve = !1, be = {}, ne = null;
  const kt = b({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let pn = null;
  const hn = b({}, ["audio", "video", "img", "source", "image", "track"]);
  let Tt = null;
  const fn = b({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), nt = "http://www.w3.org/1998/Math/MathML", it = "http://www.w3.org/2000/svg", ie = "http://www.w3.org/1999/xhtml";
  let xe = ie, wt = !1, yt = null;
  const wi = b({}, [nt, it, ie], Ct);
  let Et = b({}, ["mi", "mo", "mn", "ms", "mtext"]), _t = b({}, ["annotation-xml"]);
  const yi = b({}, ["title", "style", "font", "a", "script"]);
  let Ne = null;
  const Ei = ["application/xhtml+xml", "text/html"], _i = "text/html";
  let C = null, ke = null;
  const Ai = e.createElement("form"), dn = function(r) {
    return r instanceof RegExp || r instanceof Function;
  }, At = function() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (ke && ke === r)
      return;
    (!r || typeof r != "object") && (r = {}), r = j(r), Ne = // eslint-disable-next-line unicorn/prefer-includes
    Ei.indexOf(r.PARSER_MEDIA_TYPE) === -1 ? _i : r.PARSER_MEDIA_TYPE, C = Ne === "application/xhtml+xml" ? Ct : Pe, N = R(r, "ALLOWED_TAGS") && H(r.ALLOWED_TAGS) ? b({}, r.ALLOWED_TAGS, C) : nn, $ = R(r, "ALLOWED_ATTR") && H(r.ALLOWED_ATTR) ? b({}, r.ALLOWED_ATTR, C) : sn, yt = R(r, "ALLOWED_NAMESPACES") && H(r.ALLOWED_NAMESPACES) ? b({}, r.ALLOWED_NAMESPACES, Ct) : wi, Tt = R(r, "ADD_URI_SAFE_ATTR") && H(r.ADD_URI_SAFE_ATTR) ? b(j(fn), r.ADD_URI_SAFE_ATTR, C) : fn, pn = R(r, "ADD_DATA_URI_TAGS") && H(r.ADD_DATA_URI_TAGS) ? b(j(hn), r.ADD_DATA_URI_TAGS, C) : hn, ne = R(r, "FORBID_CONTENTS") && H(r.FORBID_CONTENTS) ? b({}, r.FORBID_CONTENTS, C) : kt, Oe = R(r, "FORBID_TAGS") && H(r.FORBID_TAGS) ? b({}, r.FORBID_TAGS, C) : j({}), Je = R(r, "FORBID_ATTR") && H(r.FORBID_ATTR) ? b({}, r.FORBID_ATTR, C) : j({}), be = R(r, "USE_PROFILES") ? r.USE_PROFILES && typeof r.USE_PROFILES == "object" ? j(r.USE_PROFILES) : r.USE_PROFILES : !1, rn = r.ALLOW_ARIA_ATTR !== !1, mt = r.ALLOW_DATA_ATTR !== !1, on = r.ALLOW_UNKNOWN_PROTOCOLS || !1, an = r.ALLOW_SELF_CLOSE_IN_ATTR !== !1, ue = r.SAFE_FOR_TEMPLATES || !1, Ce = r.SAFE_FOR_XML !== !1, pe = r.WHOLE_DOCUMENT || !1, ge = r.RETURN_DOM || !1, et = r.RETURN_DOM_FRAGMENT || !1, tt = r.RETURN_TRUSTED_TYPE || !1, bt = r.FORCE_BODY || !1, ln = r.SANITIZE_DOM !== !1, cn = r.SANITIZE_NAMED_PROPS || !1, xt = r.KEEP_CONTENT !== !1, ve = r.IN_PLACE || !1, tn = Ss(r.ALLOWED_URI_REGEXP) ? r.ALLOWED_URI_REGEXP : Bn, xe = typeof r.NAMESPACE == "string" ? r.NAMESPACE : ie, Et = R(r, "MATHML_TEXT_INTEGRATION_POINTS") && r.MATHML_TEXT_INTEGRATION_POINTS && typeof r.MATHML_TEXT_INTEGRATION_POINTS == "object" ? j(r.MATHML_TEXT_INTEGRATION_POINTS) : b({}, ["mi", "mo", "mn", "ms", "mtext"]), _t = R(r, "HTML_INTEGRATION_POINTS") && r.HTML_INTEGRATION_POINTS && typeof r.HTML_INTEGRATION_POINTS == "object" ? j(r.HTML_INTEGRATION_POINTS) : b({}, ["annotation-xml"]);
    const u = R(r, "CUSTOM_ELEMENT_HANDLING") && r.CUSTOM_ELEMENT_HANDLING && typeof r.CUSTOM_ELEMENT_HANDLING == "object" ? j(r.CUSTOM_ELEMENT_HANDLING) : _e(null);
    if (I = _e(null), R(u, "tagNameCheck") && dn(u.tagNameCheck) && (I.tagNameCheck = u.tagNameCheck), R(u, "attributeNameCheck") && dn(u.attributeNameCheck) && (I.attributeNameCheck = u.attributeNameCheck), R(u, "allowCustomizedBuiltInElements") && typeof u.allowCustomizedBuiltInElements == "boolean" && (I.allowCustomizedBuiltInElements = u.allowCustomizedBuiltInElements), ue && (mt = !1), et && (ge = !0), be && (N = b({}, Fn), $ = _e(null), be.html === !0 && (b(N, $n), b($, Un)), be.svg === !0 && (b(N, vt), b($, Mt), b($, at)), be.svgFilters === !0 && (b(N, Nt), b($, Mt), b($, at)), be.mathMl === !0 && (b(N, Dt), b($, Hn), b($, at))), ae.tagCheck = null, ae.attributeCheck = null, R(r, "ADD_TAGS") && (typeof r.ADD_TAGS == "function" ? ae.tagCheck = r.ADD_TAGS : H(r.ADD_TAGS) && (N === nn && (N = j(N)), b(N, r.ADD_TAGS, C))), R(r, "ADD_ATTR") && (typeof r.ADD_ATTR == "function" ? ae.attributeCheck = r.ADD_ATTR : H(r.ADD_ATTR) && ($ === sn && ($ = j($)), b($, r.ADD_ATTR, C))), R(r, "ADD_URI_SAFE_ATTR") && H(r.ADD_URI_SAFE_ATTR) && b(Tt, r.ADD_URI_SAFE_ATTR, C), R(r, "FORBID_CONTENTS") && H(r.FORBID_CONTENTS) && (ne === kt && (ne = j(ne)), b(ne, r.FORBID_CONTENTS, C)), R(r, "ADD_FORBID_CONTENTS") && H(r.ADD_FORBID_CONTENTS) && (ne === kt && (ne = j(ne)), b(ne, r.ADD_FORBID_CONTENTS, C)), xt && (N["#text"] = !0), pe && b(N, ["html", "head", "body"]), N.table && (b(N, ["tbody"]), delete Oe.tbody), r.TRUSTED_TYPES_POLICY) {
      if (typeof r.TRUSTED_TYPES_POLICY.createHTML != "function")
        throw ot('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      if (typeof r.TRUSTED_TYPES_POLICY.createScriptURL != "function")
        throw ot('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      P = r.TRUSTED_TYPES_POLICY, se = P.createHTML("");
    } else
      P === void 0 && (P = Fs(y, i)), P !== null && typeof se == "string" && (se = P.createHTML(""));
    B && B(r), ke = r;
  }, mn = b({}, [...vt, ...Nt, ...Rs]), gn = b({}, [...Dt, ...Is]), Si = function(r) {
    let u = ce(r);
    (!u || !u.tagName) && (u = {
      namespaceURI: xe,
      tagName: "template"
    });
    const f = Pe(r.tagName), T = Pe(u.tagName);
    return yt[r.namespaceURI] ? r.namespaceURI === it ? u.namespaceURI === ie ? f === "svg" : u.namespaceURI === nt ? f === "svg" && (T === "annotation-xml" || Et[T]) : !!mn[f] : r.namespaceURI === nt ? u.namespaceURI === ie ? f === "math" : u.namespaceURI === it ? f === "math" && _t[T] : !!gn[f] : r.namespaceURI === ie ? u.namespaceURI === it && !_t[T] || u.namespaceURI === nt && !Et[T] ? !1 : !gn[f] && (yi[f] || !mn[f]) : !!(Ne === "application/xhtml+xml" && yt[r.namespaceURI]) : !1;
  }, J = function(r) {
    we(t.removed, {
      element: r
    });
    try {
      ce(r).removeChild(r);
    } catch {
      Le(r);
    }
  }, he = function(r, u) {
    try {
      we(t.removed, {
        attribute: u.getAttributeNode(r),
        from: u
      });
    } catch {
      we(t.removed, {
        attribute: null,
        from: u
      });
    }
    if (u.removeAttribute(r), r === "is")
      if (ge || et)
        try {
          J(u);
        } catch {
        }
      else
        try {
          u.setAttribute(r, "");
        } catch {
        }
  }, bn = function(r) {
    let u = null, f = null;
    if (bt)
      r = "<remove></remove>" + r;
    else {
      const L = Dn(r, /^[\r\n\t ]+/);
      f = L && L[0];
    }
    Ne === "application/xhtml+xml" && xe === ie && (r = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + r + "</body></html>");
    const T = P ? P.createHTML(r) : r;
    if (xe === ie)
      try {
        u = new w().parseFromString(T, Ne);
      } catch {
      }
    if (!u || !u.documentElement) {
      u = dt.createDocument(xe, "template", null);
      try {
        u.documentElement.innerHTML = wt ? se : T;
      } catch {
      }
    }
    const D = u.body || u.documentElement;
    return r && f && D.insertBefore(e.createTextNode(f), D.childNodes[0] || null), xe === ie ? mi.call(u, pe ? "html" : "body")[0] : pe ? u.documentElement : D;
  }, xn = function(r) {
    return fi.call(
      r.ownerDocument || r,
      r,
      // eslint-disable-next-line no-bitwise
      h.SHOW_ELEMENT | h.SHOW_COMMENT | h.SHOW_TEXT | h.SHOW_PROCESSING_INSTRUCTION | h.SHOW_CDATA_SECTION,
      null
    );
  }, St = function(r) {
    return r instanceof x && (typeof r.nodeName != "string" || typeof r.textContent != "string" || typeof r.removeChild != "function" || !(r.attributes instanceof d) || typeof r.removeAttribute != "function" || typeof r.setAttribute != "function" || typeof r.namespaceURI != "string" || typeof r.insertBefore != "function" || typeof r.hasChildNodes != "function");
  }, Rt = function(r) {
    return typeof l == "function" && r instanceof l;
  };
  function re(m, r, u) {
    Te(m, (f) => {
      f.call(t, r, u, ke);
    });
  }
  const kn = function(r) {
    let u = null;
    if (re(U.beforeSanitizeElements, r, null), St(r))
      return J(r), !0;
    const f = C(r.nodeName);
    if (re(U.uponSanitizeElement, r, {
      tagName: f,
      allowedTags: N
    }), Ce && r.hasChildNodes() && !Rt(r.firstElementChild) && F(/<[/\w!]/g, r.innerHTML) && F(/<[/\w!]/g, r.textContent) || Ce && r.namespaceURI === ie && f === "style" && Rt(r.firstElementChild) || r.nodeType === Ee.progressingInstruction || Ce && r.nodeType === Ee.comment && F(/<[/\w]/g, r.data))
      return J(r), !0;
    if (Oe[f] || !(ae.tagCheck instanceof Function && ae.tagCheck(f)) && !N[f]) {
      if (!Oe[f] && wn(f) && (I.tagNameCheck instanceof RegExp && F(I.tagNameCheck, f) || I.tagNameCheck instanceof Function && I.tagNameCheck(f)))
        return !1;
      if (xt && !ne[f]) {
        const T = ce(r) || r.parentNode, D = Xe(r) || r.childNodes;
        if (D && T) {
          const L = D.length;
          for (let G = L - 1; G >= 0; --G) {
            const X = Y(D[G], !0);
            T.insertBefore(X, Ye(r));
          }
        }
      }
      return J(r), !0;
    }
    return r instanceof c && !Si(r) || (f === "noscript" || f === "noembed" || f === "noframes") && F(/<\/no(script|embed|frames)/i, r.innerHTML) ? (J(r), !0) : (ue && r.nodeType === Ee.text && (u = r.textContent, Te([Ve, Qe, Ke], (T) => {
      u = ye(u, T, " ");
    }), r.textContent !== u && (we(t.removed, {
      element: r.cloneNode()
    }), r.textContent = u)), re(U.afterSanitizeElements, r, null), !1);
  }, Tn = function(r, u, f) {
    if (Je[u] || ln && (u === "id" || u === "name") && (f in e || f in Ai))
      return !1;
    const T = $[u] || ae.attributeCheck instanceof Function && ae.attributeCheck(u, r);
    if (!(mt && !Je[u] && F(bi, u))) {
      if (!(rn && F(xi, u))) {
        if (!T || Je[u]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(wn(r) && (I.tagNameCheck instanceof RegExp && F(I.tagNameCheck, r) || I.tagNameCheck instanceof Function && I.tagNameCheck(r)) && (I.attributeNameCheck instanceof RegExp && F(I.attributeNameCheck, u) || I.attributeNameCheck instanceof Function && I.attributeNameCheck(u, r)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            u === "is" && I.allowCustomizedBuiltInElements && (I.tagNameCheck instanceof RegExp && F(I.tagNameCheck, f) || I.tagNameCheck instanceof Function && I.tagNameCheck(f)))
          ) return !1;
        } else if (!Tt[u]) {
          if (!F(tn, ye(f, en, ""))) {
            if (!((u === "src" || u === "xlink:href" || u === "href") && r !== "script" && Mn(f, "data:") === 0 && pn[r])) {
              if (!(on && !F(ki, ye(f, en, "")))) {
                if (f)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Ri = b({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]), wn = function(r) {
    return !Ri[Pe(r)] && F(Ti, r);
  }, yn = function(r) {
    re(U.beforeSanitizeAttributes, r, null);
    const u = r.attributes;
    if (!u || St(r))
      return;
    const f = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: $,
      forceKeepAttr: void 0
    };
    let T = u.length;
    for (; T--; ) {
      const D = u[T], L = D.name, G = D.namespaceURI, X = D.value, ee = C(L), Lt = X;
      let M = L === "value" ? Lt : Ts(Lt);
      if (f.attrName = ee, f.attrValue = M, f.keepAttr = !0, f.forceKeepAttr = void 0, re(U.uponSanitizeAttribute, r, f), M = f.attrValue, cn && (ee === "id" || ee === "name") && Mn(M, un) !== 0 && (he(L, r), M = un + M), Ce && F(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, M)) {
        he(L, r);
        continue;
      }
      if (ee === "attributename" && Dn(M, "href")) {
        he(L, r);
        continue;
      }
      if (f.forceKeepAttr)
        continue;
      if (!f.keepAttr) {
        he(L, r);
        continue;
      }
      if (!an && F(/\/>/i, M)) {
        he(L, r);
        continue;
      }
      ue && Te([Ve, Qe, Ke], (_n) => {
        M = ye(M, _n, " ");
      });
      const En = C(r.nodeName);
      if (!Tn(En, ee, M)) {
        he(L, r);
        continue;
      }
      if (P && typeof y == "object" && typeof y.getAttributeType == "function" && !G)
        switch (y.getAttributeType(En, ee)) {
          case "TrustedHTML": {
            M = P.createHTML(M);
            break;
          }
          case "TrustedScriptURL": {
            M = P.createScriptURL(M);
            break;
          }
        }
      if (M !== Lt)
        try {
          G ? r.setAttributeNS(G, L, M) : r.setAttribute(L, M), St(r) ? J(r) : Nn(t.removed);
        } catch {
          he(L, r);
        }
    }
    re(U.afterSanitizeAttributes, r, null);
  }, It = function(r) {
    let u = null;
    const f = xn(r);
    for (re(U.beforeSanitizeShadowDOM, r, null); u = f.nextNode(); )
      re(U.uponSanitizeShadowNode, u, null), kn(u), yn(u), u.content instanceof s && It(u.content);
    re(U.afterSanitizeShadowDOM, r, null);
  }, st = function(r) {
    if (r.nodeType === Ee.element && r.shadowRoot instanceof s) {
      const T = r.shadowRoot;
      st(T), It(T);
    }
    const u = r.childNodes;
    if (!u)
      return;
    const f = [];
    Te(u, (T) => {
      we(f, T);
    });
    for (const T of f)
      st(T);
  };
  return t.sanitize = function(m) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, u = null, f = null, T = null, D = null;
    if (wt = !m, wt && (m = "<!-->"), typeof m != "string" && !Rt(m) && (m = As(m), typeof m != "string"))
      throw ot("dirty is not a string, aborting");
    if (!t.isSupported)
      return m;
    if (gt || At(r), t.removed = [], typeof m == "string" && (ve = !1), ve) {
      const X = m.nodeName;
      if (typeof X == "string") {
        const ee = C(X);
        if (!N[ee] || Oe[ee])
          throw ot("root node is forbidden and cannot be sanitized in-place");
      }
      st(m);
    } else if (m instanceof l)
      u = bn("<!---->"), f = u.ownerDocument.importNode(m, !0), f.nodeType === Ee.element && f.nodeName === "BODY" || f.nodeName === "HTML" ? u = f : u.appendChild(f), st(f);
    else {
      if (!ge && !ue && !pe && // eslint-disable-next-line unicorn/prefer-includes
      m.indexOf("<") === -1)
        return P && tt ? P.createHTML(m) : m;
      if (u = bn(m), !u)
        return ge ? null : tt ? se : "";
    }
    u && bt && J(u.firstChild);
    const L = xn(ve ? m : u);
    for (; T = L.nextNode(); )
      kn(T), yn(T), T.content instanceof s && It(T.content);
    if (ve)
      return m;
    if (ge) {
      if (ue) {
        u.normalize();
        let X = u.innerHTML;
        Te([Ve, Qe, Ke], (ee) => {
          X = ye(X, ee, " ");
        }), u.innerHTML = X;
      }
      if (et)
        for (D = di.call(u.ownerDocument); u.firstChild; )
          D.appendChild(u.firstChild);
      else
        D = u;
      return ($.shadowroot || $.shadowrootmode) && (D = gi.call(n, D, !0)), D;
    }
    let G = pe ? u.outerHTML : u.innerHTML;
    return pe && N["!doctype"] && u.ownerDocument && u.ownerDocument.doctype && u.ownerDocument.doctype.name && F(zs, u.ownerDocument.doctype.name) && (G = "<!DOCTYPE " + u.ownerDocument.doctype.name + `>
` + G), ue && Te([Ve, Qe, Ke], (X) => {
      G = ye(G, X, " ");
    }), P && tt ? P.createHTML(G) : G;
  }, t.setConfig = function() {
    let m = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    At(m), gt = !0;
  }, t.clearConfig = function() {
    ke = null, gt = !1;
  }, t.isValidAttribute = function(m, r, u) {
    ke || At({});
    const f = C(m), T = C(r);
    return Tn(f, T, u);
  }, t.addHook = function(m, r) {
    typeof r == "function" && we(U[m], r);
  }, t.removeHook = function(m, r) {
    if (r !== void 0) {
      const u = xs(U[m], r);
      return u === -1 ? void 0 : ks(U[m], u, 1)[0];
    }
    return Nn(U[m]);
  }, t.removeHooks = function(m) {
    U[m] = [];
  }, t.removeAllHooks = function() {
    U = Gn();
  }, t;
}
var Us = si(), Se;
class Hs {
  constructor() {
    W(this, Se);
    z(this, Se, Us), S(this, Se).addHook("afterSanitizeAttributes", (t) => {
      t.tagName === "A" && (t.setAttribute("rel", "noopener noreferrer"), t.setAttribute("target", "_blank"));
    });
  }
  render(t) {
    const e = E.parse(t, { async: !1 });
    return S(this, Se).sanitize(e, {
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
Se = new WeakMap();
const Wn = (a) => `chatbot_open_${a}`, zt = (a) => `chatbot_conversation_${a}`, Bs = `
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
var q, We, oe, Re, Ie, je, le, g, Ut, Ht, $e, lt, Bt, oi, ai, Gt, li, Fe, ci, Wt, ui, pi, jt, hi, qt;
class ri extends HTMLElement {
  constructor() {
    super();
    W(this, g);
    W(this, q);
    W(this, We, new Hs());
    W(this, oe, !1);
    W(this, Re, !1);
    W(this, Ie, null);
    W(this, je, null);
    W(this, le, null);
    z(this, q, this.attachShadow({ mode: "open" }));
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
    k(this, g, Ut).call(this), k(this, g, ai).call(this), k(this, g, Gt).call(this);
  }
  attributeChangedCallback() {
    S(this, q).innerHTML && k(this, g, Ut).call(this);
  }
}
q = new WeakMap(), We = new WeakMap(), oe = new WeakMap(), Re = new WeakMap(), Ie = new WeakMap(), je = new WeakMap(), le = new WeakMap(), g = new WeakSet(), Ut = function() {
  const e = document.createElement("style");
  e.textContent = Bs;
  const n = this.position === "inline";
  if (S(this, q).innerHTML = "", S(this, q).appendChild(e), !n) {
    const d = document.createElement("button");
    d.className = `launcher ${this.position}`, d.part = "launcher", d.innerHTML = "💬", d.setAttribute("aria-label", "Open chat"), d.addEventListener("click", () => k(this, g, oi).call(this)), S(this, q).appendChild(d);
  }
  const i = document.createElement("div");
  i.className = `panel ${n ? "inline" : this.position}`, i.part = "panel", !n && !S(this, oe) && (i.hidden = !0);
  const s = document.createElement("div");
  s.className = "header", s.part = "header", s.innerHTML = `<span>${this.title}</span>`;
  const o = document.createElement("button");
  o.className = "new-chat", o.textContent = "New chat", o.addEventListener("click", () => k(this, g, li).call(this)), s.appendChild(o), i.appendChild(s);
  const l = document.createElement("div");
  l.className = "messages", l.part = "messages", i.appendChild(l);
  const c = document.createElement("div");
  c.className = "input-row";
  const h = document.createElement("textarea");
  h.className = "input", h.part = "input", h.placeholder = "Ask a question…", h.rows = 1, h.addEventListener("keydown", (d) => {
    d.key === "Enter" && !d.shiftKey && (d.preventDefault(), k(this, g, Fe).call(this));
  }), c.appendChild(h);
  const p = document.createElement("button");
  p.className = "send-button", p.part = "send-button", p.textContent = "Send", p.addEventListener("click", () => k(this, g, Fe).call(this)), c.appendChild(p), i.appendChild(c), S(this, q).appendChild(i);
}, Ht = function() {
  return S(this, q).querySelector(".panel");
}, $e = function() {
  return S(this, q).querySelector(".messages");
}, lt = function() {
  return S(this, q).querySelector(".input");
}, Bt = function() {
  return S(this, q).querySelector(".send-button");
}, oi = function() {
  z(this, oe, !S(this, oe));
  const e = k(this, g, Ht).call(this);
  e && (e.hidden = !S(this, oe)), localStorage.setItem(Wn(this.channel), S(this, oe) ? "1" : "0");
}, ai = function() {
  if (localStorage.getItem(Wn(this.channel)) === "1") {
    z(this, oe, !0);
    const n = k(this, g, Ht).call(this);
    n && (n.hidden = !1);
  }
}, Gt = function() {
  var n;
  const e = (n = document.querySelector('meta[name="chatbot-context"]')) == null ? void 0 : n.content;
  if (e)
    try {
      const i = JSON.parse(atob(e.split(".")[1] ?? ""));
      i.greeting && k(this, g, Wt).call(this, i.greeting);
    } catch {
    }
}, li = function() {
  localStorage.removeItem(zt(this.channel));
  const e = k(this, g, $e).call(this);
  e && (e.innerHTML = ""), z(this, Ie, null), z(this, je, null), z(this, le, null), k(this, g, Gt).call(this);
}, Fe = async function() {
  var p, d;
  if (S(this, Re)) return;
  const e = k(this, g, lt).call(this), n = e == null ? void 0 : e.value.trim();
  if (!n) return;
  e.value = "", k(this, g, ci).call(this, n);
  const i = (p = document.querySelector('meta[name="chatbot-context"]')) == null ? void 0 : p.content, s = localStorage.getItem(zt(this.channel));
  z(this, Re, !0);
  const o = k(this, g, Bt).call(this);
  o && (o.disabled = !0);
  const l = k(this, g, Wt).call(this, "");
  z(this, je, l), z(this, le, null);
  const c = new Oi();
  c.addEventListener("chunk", (x) => {
    l.dataset.raw = (l.dataset.raw ?? "") + x.detail.text, l.innerHTML = S(this, We).render(l.dataset.raw);
  }), c.addEventListener("context_summary", (x) => {
    const w = k(this, g, ui).call(this, l);
    w.textContent = x.detail.text;
  }), c.addEventListener("done", (x) => {
    var w;
    (w = x.detail) != null && w.conversationId && localStorage.setItem(zt(this.channel), x.detail.conversationId), k(this, g, pi).call(this, l), k(this, g, qt).call(this);
  }), c.addEventListener("error", (x) => {
    k(this, g, hi).call(this, x.detail, l, n, i, s), k(this, g, qt).call(this);
  });
  const h = (d = document.querySelector('meta[name="csrf-token"]')) == null ? void 0 : d.content;
  await c.connect("/chatbot/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...h ? { "X-CSRF-TOKEN": h } : {}
    },
    body: JSON.stringify({
      message: n,
      signed_context: i,
      ...s ? { conversation_id: s } : {}
    })
  });
}, ci = function(e) {
  const n = k(this, g, $e).call(this), i = document.createElement("div");
  return i.className = "message message-user", i.part = "message-user", i.textContent = e, n == null || n.appendChild(i), i.scrollIntoView({ behavior: "smooth" }), z(this, Ie, e), i;
}, Wt = function(e) {
  const n = k(this, g, $e).call(this), i = document.createElement("div");
  return i.className = "message message-assistant", i.part = "message-assistant", i.dataset.raw = e, e && (i.innerHTML = S(this, We).render(e)), n == null || n.appendChild(i), i.scrollIntoView({ behavior: "smooth" }), i;
}, ui = function(e) {
  var i;
  if (S(this, le)) return S(this, le);
  const n = document.createElement("div");
  return n.className = "context-summary", (i = e.parentElement) == null || i.insertBefore(n, e), z(this, le, n), n;
}, pi = function(e) {
  var c;
  const n = document.createElement("div");
  n.className = "message-actions";
  const i = document.createElement("button");
  i.className = "action-btn", i.textContent = "📋 Copy", i.addEventListener("click", () => navigator.clipboard.writeText(e.dataset.raw ?? ""));
  const s = document.createElement("button");
  s.className = "action-btn", s.textContent = "🔄 Regenerate", s.addEventListener("click", () => {
    e.dataset.raw = "", e.innerHTML = "", n.remove(), S(this, Ie) && k(this, g, Fe).call(this);
  });
  const o = document.createElement("button");
  o.className = "action-btn", o.textContent = "👍", o.addEventListener("click", () => k(this, g, jt).call(this, e, 1, o, l));
  const l = document.createElement("button");
  l.className = "action-btn", l.textContent = "👎", l.addEventListener("click", () => k(this, g, jt).call(this, e, -1, o, l)), n.append(i, s, o, l), (c = e.parentElement) == null || c.insertBefore(n, e.nextSibling);
}, jt = async function(e, n, i, s) {
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
}, hi = function(e, n, i, s, o) {
  const l = k(this, g, $e).call(this);
  n.remove();
  const c = document.createElement("div");
  if (c.className = "message error-msg", e.code === "quota_exceeded" || e.code === "token_cap_exceeded")
    c.className = "message quota-msg", c.textContent = e.message || "Daily limit reached. Try again later.";
  else if (e.code === "content_blocked")
    c.textContent = e.message || "This message was blocked by content policy.";
  else if (c.textContent = e.message || "Something went wrong.", e.retryable) {
    const h = document.createElement("button");
    h.className = "retry-btn", h.textContent = "Retry", h.addEventListener("click", () => {
      c.remove(), k(this, g, lt).call(this) && (k(this, g, lt).call(this).value = i), k(this, g, Fe).call(this);
    }), c.appendChild(h);
  }
  l == null || l.appendChild(c), c.scrollIntoView({ behavior: "smooth" });
}, qt = function() {
  z(this, Re, !1);
  const e = k(this, g, Bt).call(this);
  e && (e.disabled = !1);
}, _(ri, "observedAttributes", ["channel", "position", "title"]);
customElements.define("chatbot-widget", ri);
export {
  ri as ChatbotWidget
};
