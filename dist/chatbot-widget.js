var js = Object.defineProperty;
var Mn = (a) => {
  throw TypeError(a);
};
var Ws = (a, t, e) => t in a ? js(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var A = (a, t, e) => Ws(a, typeof t != "symbol" ? t + "" : t, e), Ut = (a, t, e) => t.has(a) || Mn("Cannot " + e);
var k = (a, t, e) => (Ut(a, t, "read from private field"), e ? e.call(a) : t.get(a)), $ = (a, t, e) => t.has(a) ? Mn("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(a) : t.set(a, e), C = (a, t, e, n) => (Ut(a, t, "write to private field"), n ? n.call(a, e) : t.set(a, e), e), b = (a, t, e) => (Ut(a, t, "access private method"), e);
var Xe, me, Ve, Ce, yt, ts;
class qs extends EventTarget {
  constructor(e = globalThis.fetch.bind(globalThis)) {
    super();
    $(this, yt);
    $(this, Xe);
    $(this, me, !1);
    $(this, Ve, null);
    $(this, Ce, null);
    C(this, Xe, e);
  }
  abort() {
    var e;
    C(this, me, !0), (e = k(this, Ve)) == null || e.cancel();
  }
  async connect(e, n = {}) {
    C(this, me, !1);
    const i = (await k(this, Xe).call(this, e, n)).body.getReader();
    C(this, Ve, i);
    const o = new TextDecoder();
    let l = "";
    for (; !k(this, me); ) {
      const { done: c, value: p } = await i.read();
      if (c) break;
      l += o.decode(p, { stream: !0 });
      const h = l.split(`
`);
      l = h.pop() ?? "";
      for (const m of h) {
        if (k(this, me)) break;
        m === "" ? C(this, Ce, null) : b(this, yt, ts).call(this, m);
      }
    }
    i.cancel();
  }
}
Xe = new WeakMap(), me = new WeakMap(), Ve = new WeakMap(), Ce = new WeakMap(), yt = new WeakSet(), ts = function(e) {
  if (e.startsWith("event: ")) {
    C(this, Ce, e.slice(7).trim());
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
  const i = k(this, Ce) ?? s.type;
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
function sn() {
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
let be = sn();
function ns(a) {
  be = a;
}
const ss = /[&<>"']/, Zs = new RegExp(ss.source, "g"), is = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, Ys = new RegExp(is.source, "g"), Xs = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, zn = (a) => Xs[a];
function Z(a, t) {
  if (t) {
    if (ss.test(a))
      return a.replace(Zs, zn);
  } else if (is.test(a))
    return a.replace(Ys, zn);
  return a;
}
const Vs = /(^|[^\[])\^/g;
function S(a, t) {
  let e = typeof a == "string" ? a : a.source;
  t = t || "";
  const n = {
    replace: (s, i) => {
      let o = typeof i == "string" ? i : i.source;
      return o = o.replace(Vs, "$1"), e = e.replace(s, o), n;
    },
    getRegex: () => new RegExp(e, t)
  };
  return n;
}
function $n(a) {
  try {
    a = encodeURI(a).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return a;
}
const Ze = { exec: () => null };
function Pn(a, t) {
  const e = a.replace(/\|/g, (i, o, l) => {
    let c = !1, p = o;
    for (; --p >= 0 && l[p] === "\\"; )
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
function Fe(a, t, e) {
  const n = a.length;
  if (n === 0)
    return "";
  let s = 0;
  for (; s < n && a.charAt(n - s - 1) === t; )
    s++;
  return a.slice(0, n - s);
}
function Qs(a, t) {
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
function Fn(a, t, e, n) {
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
function Ks(a, t) {
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
class kt {
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
        text: this.options.pedantic ? n : Fe(n, `
`)
      };
    }
  }
  fences(t) {
    const e = this.rules.block.fences.exec(t);
    if (e) {
      const n = e[0], s = Ks(n, e[3] || "");
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
        const s = Fe(n, "#");
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
        raw: Fe(e[0], `
`)
      };
  }
  blockquote(t) {
    const e = this.rules.block.blockquote.exec(t);
    if (e) {
      let n = Fe(e[0], `
`).split(`
`), s = "", i = "";
      const o = [];
      for (; n.length > 0; ) {
        let l = !1;
        const c = [];
        let p;
        for (p = 0; p < n.length; p++)
          if (/^ {0,3}>/.test(n[p]))
            c.push(n[p]), l = !0;
          else if (!l)
            c.push(n[p]);
          else
            break;
        n = n.slice(p);
        const h = c.join(`
`), m = h.replace(/\n {0,3}((?:=+|-+) *)(?=\n|$)/g, `
    $1`).replace(/^ {0,3}>[ \t]?/gm, "");
        s = s ? `${s}
${h}` : h, i = i ? `${i}
${m}` : m;
        const g = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(m, o, !0), this.lexer.state.top = g, n.length === 0)
          break;
        const T = o[o.length - 1];
        if ((T == null ? void 0 : T.type) === "code")
          break;
        if ((T == null ? void 0 : T.type) === "blockquote") {
          const y = T, R = y.raw + `
` + n.join(`
`), Y = this.blockquote(R);
          o[o.length - 1] = Y, s = s.substring(0, s.length - y.raw.length) + Y.raw, i = i.substring(0, i.length - y.text.length) + Y.text;
          break;
        } else if ((T == null ? void 0 : T.type) === "list") {
          const y = T, R = y.raw + `
` + n.join(`
`), Y = this.list(R);
          o[o.length - 1] = Y, s = s.substring(0, s.length - T.raw.length) + Y.raw, i = i.substring(0, i.length - y.raw.length) + Y.raw, n = R.substring(o[o.length - 1].raw.length).split(`
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
        let c = !1, p = "", h = "";
        if (!(e = o.exec(t)) || this.rules.block.hr.test(t))
          break;
        p = e[0], t = t.substring(p.length);
        let m = e[2].split(`
`, 1)[0].replace(/^\t+/, (De) => " ".repeat(3 * De.length)), g = t.split(`
`, 1)[0], T = !m.trim(), y = 0;
        if (this.options.pedantic ? (y = 2, h = m.trimStart()) : T ? y = e[1].length + 1 : (y = e[2].search(/[^ ]/), y = y > 4 ? 1 : y, h = m.slice(y), y += e[1].length), T && /^[ \t]*$/.test(g) && (p += g + `
`, t = t.substring(g.length + 1), c = !0), !c) {
          const De = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), nt = new RegExp(`^ {0,${Math.min(3, y - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), st = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:\`\`\`|~~~)`), pe = new RegExp(`^ {0,${Math.min(3, y - 1)}}#`), P = new RegExp(`^ {0,${Math.min(3, y - 1)}}<(?:[a-z].*>|!--)`, "i");
          for (; t; ) {
            const re = t.split(`
`, 1)[0];
            let te;
            if (g = re, this.options.pedantic ? (g = g.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  "), te = g) : te = g.replace(/\t/g, "    "), st.test(g) || pe.test(g) || P.test(g) || De.test(g) || nt.test(g))
              break;
            if (te.search(/[^ ]/) >= y || !g.trim())
              h += `
` + te.slice(y);
            else {
              if (T || m.replace(/\t/g, "    ").search(/[^ ]/) >= 4 || st.test(m) || pe.test(m) || nt.test(m))
                break;
              h += `
` + g;
            }
            !T && !g.trim() && (T = !0), p += re + `
`, t = t.substring(re.length + 1), m = te.slice(y);
          }
        }
        i.loose || (l ? i.loose = !0 : /\n[ \t]*\n[ \t]*$/.test(p) && (l = !0));
        let R = null, Y;
        this.options.gfm && (R = /^\[[ xX]\] /.exec(h), R && (Y = R[0] !== "[ ] ", h = h.replace(/^\[[ xX]\] +/, ""))), i.items.push({
          type: "list_item",
          raw: p,
          task: !!R,
          checked: Y,
          loose: !1,
          text: h,
          tokens: []
        }), i.raw += p;
      }
      i.items[i.items.length - 1].raw = i.items[i.items.length - 1].raw.trimEnd(), i.items[i.items.length - 1].text = i.items[i.items.length - 1].text.trimEnd(), i.raw = i.raw.trimEnd();
      for (let c = 0; c < i.items.length; c++)
        if (this.lexer.state.top = !1, i.items[c].tokens = this.lexer.blockTokens(i.items[c].text, []), !i.loose) {
          const p = i.items[c].tokens.filter((m) => m.type === "space"), h = p.length > 0 && p.some((m) => /\n.*\n/.test(m.raw));
          i.loose = h;
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
    const n = Pn(e[1]), s = e[2].replace(/^\||\| *$/g, "").split("|"), i = e[3] && e[3].trim() ? e[3].replace(/\n[ \t]*$/, "").split(`
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
        o.rows.push(Pn(l, o.header.length).map((c, p) => ({
          text: c,
          tokens: this.lexer.inline(c),
          header: !1,
          align: o.align[p]
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
        const o = Fe(n.slice(0, -1), "\\");
        if ((n.length - o.length) % 2 === 0)
          return;
      } else {
        const o = Qs(e[2], "()");
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
      return s = s.trim(), /^</.test(s) && (this.options.pedantic && !/>$/.test(n) ? s = s.slice(1) : s = s.slice(1, -1)), Fn(e, {
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
      return Fn(n, i, n[0], this.lexer);
    }
  }
  emStrong(t, e, n = "") {
    let s = this.rules.inline.emStrongLDelim.exec(t);
    if (!s || s[3] && n.match(/[\p{L}\p{N}]/u))
      return;
    if (!(s[1] || s[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      const o = [...s[0]].length - 1;
      let l, c, p = o, h = 0;
      const m = s[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (m.lastIndex = 0, e = e.slice(-1 * t.length + o); (s = m.exec(e)) != null; ) {
        if (l = s[1] || s[2] || s[3] || s[4] || s[5] || s[6], !l)
          continue;
        if (c = [...l].length, s[3] || s[4]) {
          p += c;
          continue;
        } else if ((s[5] || s[6]) && o % 3 && !((o + c) % 3)) {
          h += c;
          continue;
        }
        if (p -= c, p > 0)
          continue;
        c = Math.min(c, c + p + h);
        const g = [...s[0]][0].length, T = t.slice(0, o + s.index + g + c);
        if (Math.min(o, c) % 2) {
          const R = T.slice(1, -1);
          return {
            type: "em",
            raw: T,
            text: R,
            tokens: this.lexer.inlineTokens(R)
          };
        }
        const y = T.slice(2, -2);
        return {
          type: "strong",
          raw: T,
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
const Js = /^(?:[ \t]*(?:\n|$))+/, ei = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, ti = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, et = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ni = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, rs = /(?:[*+-]|\d{1,9}[.)])/, os = S(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, rs).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), rn = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, si = /^[^\n]+/, on = /(?!\s*\])(?:\\.|[^\[\]\\])+/, ii = S(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", on).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), ri = S(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, rs).getRegex(), Et = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", an = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, oi = S("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", an).replace("tag", Et).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), as = S(rn).replace("hr", et).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Et).getRegex(), ai = S(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", as).getRegex(), ln = {
  blockquote: ai,
  code: ei,
  def: ii,
  fences: ti,
  heading: ni,
  hr: et,
  html: oi,
  lheading: os,
  list: ri,
  newline: Js,
  paragraph: as,
  table: Ze,
  text: si
}, Un = S("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", et).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Et).getRegex(), li = {
  ...ln,
  table: Un,
  paragraph: S(rn).replace("hr", et).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Un).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", Et).getRegex()
}, ci = {
  ...ln,
  html: S(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", an).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: Ze,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: S(rn).replace("hr", et).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", os).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, ls = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, ui = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, cs = /^( {2,}|\\)\n(?!\s*$)/, pi = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, tt = "\\p{P}\\p{S}", hi = S(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, tt).getRegex(), fi = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, di = S(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, tt).getRegex(), mi = S("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, tt).getRegex(), gi = S("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, tt).getRegex(), bi = S(/\\([punct])/, "gu").replace(/punct/g, tt).getRegex(), xi = S(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), ki = S(an).replace("(?:-->|$)", "-->").getRegex(), wi = S("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ki).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), wt = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, Ti = S(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", wt).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), us = S(/^!?\[(label)\]\[(ref)\]/).replace("label", wt).replace("ref", on).getRegex(), ps = S(/^!?\[(ref)\](?:\[\])?/).replace("ref", on).getRegex(), yi = S("reflink|nolink(?!\\()", "g").replace("reflink", us).replace("nolink", ps).getRegex(), cn = {
  _backpedal: Ze,
  // only used for GFM url
  anyPunctuation: bi,
  autolink: xi,
  blockSkip: fi,
  br: cs,
  code: ui,
  del: Ze,
  emStrongLDelim: di,
  emStrongRDelimAst: mi,
  emStrongRDelimUnd: gi,
  escape: ls,
  link: Ti,
  nolink: ps,
  punctuation: hi,
  reflink: us,
  reflinkSearch: yi,
  tag: wi,
  text: pi,
  url: Ze
}, Ei = {
  ...cn,
  link: S(/^!?\[(label)\]\((.*?)\)/).replace("label", wt).getRegex(),
  reflink: S(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", wt).getRegex()
}, qt = {
  ...cn,
  escape: S(ls).replace("])", "~|])").getRegex(),
  url: S(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, _i = {
  ...qt,
  br: S(cs).replace("{2,}", "*").getRegex(),
  text: S(qt.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, ft = {
  normal: ln,
  gfm: li,
  pedantic: ci
}, Ue = {
  normal: cn,
  gfm: qt,
  breaks: _i,
  pedantic: Ei
};
class V {
  constructor(t) {
    A(this, "tokens");
    A(this, "options");
    A(this, "state");
    A(this, "tokenizer");
    A(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || be, this.options.tokenizer = this.options.tokenizer || new kt(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const e = {
      block: ft.normal,
      inline: Ue.normal
    };
    this.options.pedantic ? (e.block = ft.pedantic, e.inline = Ue.pedantic) : this.options.gfm && (e.block = ft.gfm, this.options.breaks ? e.inline = Ue.breaks : e.inline = Ue.gfm), this.tokenizer.rules = e;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: ft,
      inline: Ue
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
          let p;
          this.options.extensions.startBlock.forEach((h) => {
            p = h.call({ lexer: this }, c), typeof p == "number" && p >= 0 && (l = Math.min(l, p));
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
    let n, s, i, o = t, l, c, p;
    if (this.tokens.links) {
      const h = Object.keys(this.tokens.links);
      if (h.length > 0)
        for (; (l = this.tokenizer.rules.inline.reflinkSearch.exec(o)) != null; )
          h.includes(l[0].slice(l[0].lastIndexOf("[") + 1, -1)) && (o = o.slice(0, l.index) + "[" + "a".repeat(l[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (; (l = this.tokenizer.rules.inline.blockSkip.exec(o)) != null; )
      o = o.slice(0, l.index) + "[" + "a".repeat(l[0].length - 2) + "]" + o.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    for (; (l = this.tokenizer.rules.inline.anyPunctuation.exec(o)) != null; )
      o = o.slice(0, l.index) + "++" + o.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    for (; t; )
      if (c || (p = ""), c = !1, !(this.options.extensions && this.options.extensions.inline && this.options.extensions.inline.some((h) => (n = h.call({ lexer: this }, t, e)) ? (t = t.substring(n.raw.length), e.push(n), !0) : !1))) {
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
        if (n = this.tokenizer.emStrong(t, o, p)) {
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
          let h = 1 / 0;
          const m = t.slice(1);
          let g;
          this.options.extensions.startInline.forEach((T) => {
            g = T.call({ lexer: this }, m), typeof g == "number" && g >= 0 && (h = Math.min(h, g));
          }), h < 1 / 0 && h >= 0 && (i = t.substring(0, h + 1));
        }
        if (n = this.tokenizer.inlineText(i)) {
          t = t.substring(n.raw.length), n.raw.slice(-1) !== "_" && (p = n.raw.slice(-1)), c = !0, s = e[e.length - 1], s && s.type === "text" ? (s.raw += n.raw, s.text += n.text) : e.push(n);
          continue;
        }
        if (t) {
          const h = "Infinite loop on byte: " + t.charCodeAt(0);
          if (this.options.silent) {
            console.error(h);
            break;
          } else
            throw new Error(h);
        }
      }
    return e;
  }
}
class Tt {
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
    const s = this.parser.parseInline(n), i = $n(t);
    if (i === null)
      return s;
    t = i;
    let o = '<a href="' + t + '"';
    return e && (o += ' title="' + e + '"'), o += ">" + s + "</a>", o;
  }
  image({ href: t, title: e, text: n }) {
    const s = $n(t);
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
class un {
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
    this.options = t || be, this.options.renderer = this.options.renderer || new Tt(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new un();
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
class Ye {
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
A(Ye, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
class Ai {
  constructor(...t) {
    A(this, "defaults", sn());
    A(this, "options", this.setOptions);
    A(this, "parse", this.parseMarkdown(!0));
    A(this, "parseInline", this.parseMarkdown(!1));
    A(this, "Parser", Q);
    A(this, "Renderer", Tt);
    A(this, "TextRenderer", un);
    A(this, "Lexer", V);
    A(this, "Tokenizer", kt);
    A(this, "Hooks", Ye);
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
            for (const p of c)
              n = n.concat(this.walkTokens(p.tokens, e));
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
            const p = l[c].flat(1 / 0);
            n = n.concat(this.walkTokens(p, e));
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
        const i = this.defaults.renderer || new Tt(this.defaults);
        for (const o in n.renderer) {
          if (!(o in i))
            throw new Error(`renderer '${o}' does not exist`);
          if (["options", "parser"].includes(o))
            continue;
          const l = o, c = n.renderer[l], p = i[l];
          i[l] = (...h) => {
            let m = c.apply(i, h);
            return m === !1 && (m = p.apply(i, h)), m || "";
          };
        }
        s.renderer = i;
      }
      if (n.tokenizer) {
        const i = this.defaults.tokenizer || new kt(this.defaults);
        for (const o in n.tokenizer) {
          if (!(o in i))
            throw new Error(`tokenizer '${o}' does not exist`);
          if (["options", "rules", "lexer"].includes(o))
            continue;
          const l = o, c = n.tokenizer[l], p = i[l];
          i[l] = (...h) => {
            let m = c.apply(i, h);
            return m === !1 && (m = p.apply(i, h)), m;
          };
        }
        s.tokenizer = i;
      }
      if (n.hooks) {
        const i = this.defaults.hooks || new Ye();
        for (const o in n.hooks) {
          if (!(o in i))
            throw new Error(`hook '${o}' does not exist`);
          if (["options", "block"].includes(o))
            continue;
          const l = o, c = n.hooks[l], p = i[l];
          Ye.passThroughHooks.has(o) ? i[l] = (h) => {
            if (this.defaults.async)
              return Promise.resolve(c.call(i, h)).then((g) => p.call(i, g));
            const m = c.call(i, h);
            return p.call(i, m);
          } : i[l] = (...h) => {
            let m = c.apply(i, h);
            return m === !1 && (m = p.apply(i, h)), m;
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
      const c = o.hooks ? o.hooks.provideLexer() : t ? V.lex : V.lexInline, p = o.hooks ? o.hooks.provideParser() : t ? Q.parse : Q.parseInline;
      if (o.async)
        return Promise.resolve(o.hooks ? o.hooks.preprocess(n) : n).then((h) => c(h, o)).then((h) => o.hooks ? o.hooks.processAllTokens(h) : h).then((h) => o.walkTokens ? Promise.all(this.walkTokens(h, o.walkTokens)).then(() => h) : h).then((h) => p(h, o)).then((h) => o.hooks ? o.hooks.postprocess(h) : h).catch(l);
      try {
        o.hooks && (n = o.hooks.preprocess(n));
        let h = c(n, o);
        o.hooks && (h = o.hooks.processAllTokens(h)), o.walkTokens && this.walkTokens(h, o.walkTokens);
        let m = p(h, o);
        return o.hooks && (m = o.hooks.postprocess(m)), m;
      } catch (h) {
        return l(h);
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
const ge = new Ai();
function _(a, t) {
  return ge.parse(a, t);
}
_.options = _.setOptions = function(a) {
  return ge.setOptions(a), _.defaults = ge.defaults, ns(_.defaults), _;
};
_.getDefaults = sn;
_.defaults = be;
_.use = function(...a) {
  return ge.use(...a), _.defaults = ge.defaults, ns(_.defaults), _;
};
_.walkTokens = function(a, t) {
  return ge.walkTokens(a, t);
};
_.parseInline = ge.parseInline;
_.Parser = Q;
_.parser = Q.parse;
_.Renderer = Tt;
_.TextRenderer = un;
_.Lexer = V;
_.lexer = V.lex;
_.Tokenizer = kt;
_.Hooks = Ye;
_.parse = _;
_.options;
_.setOptions;
_.use;
_.walkTokens;
_.parseInline;
Q.parse;
V.lex;
/*! @license DOMPurify 3.4.3 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.3/LICENSE */
function Bn(a, t) {
  (t == null || t > a.length) && (t = a.length);
  for (var e = 0, n = Array(t); e < t; e++) n[e] = a[e];
  return n;
}
function Si(a) {
  if (Array.isArray(a)) return a;
}
function Ri(a, t) {
  var e = a == null ? null : typeof Symbol < "u" && a[Symbol.iterator] || a["@@iterator"];
  if (e != null) {
    var n, s, i, o, l = [], c = !0, p = !1;
    try {
      if (i = (e = e.call(a)).next, t !== 0) for (; !(c = (n = i.call(e)).done) && (l.push(n.value), l.length !== t); c = !0) ;
    } catch (h) {
      p = !0, s = h;
    } finally {
      try {
        if (!c && e.return != null && (o = e.return(), Object(o) !== o)) return;
      } finally {
        if (p) throw s;
      }
    }
    return l;
  }
}
function Ii() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function Li(a, t) {
  return Si(a) || Ri(a, t) || Ci(a, t) || Ii();
}
function Ci(a, t) {
  if (a) {
    if (typeof a == "string") return Bn(a, t);
    var e = {}.toString.call(a).slice(8, -1);
    return e === "Object" && a.constructor && (e = a.constructor.name), e === "Map" || e === "Set" ? Array.from(a) : e === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e) ? Bn(a, t) : void 0;
  }
}
const hs = Object.entries, Hn = Object.setPrototypeOf, vi = Object.isFrozen, Oi = Object.getPrototypeOf, Ni = Object.getOwnPropertyDescriptor;
let G = Object.freeze, K = Object.seal, Se = Object.create, fs = typeof Reflect < "u" && Reflect, Zt = fs.apply, Yt = fs.construct;
G || (G = function(t) {
  return t;
});
K || (K = function(t) {
  return t;
});
Zt || (Zt = function(t, e) {
  for (var n = arguments.length, s = new Array(n > 2 ? n - 2 : 0), i = 2; i < n; i++)
    s[i - 2] = arguments[i];
  return t.apply(e, s);
});
Yt || (Yt = function(t) {
  for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), s = 1; s < e; s++)
    n[s - 1] = arguments[s];
  return new t(...n);
});
const ye = O(Array.prototype.forEach), Di = O(Array.prototype.lastIndexOf), Gn = O(Array.prototype.pop), Ee = O(Array.prototype.push), Mi = O(Array.prototype.splice), H = Array.isArray, Ge = O(String.prototype.toLowerCase), Bt = O(String.prototype.toString), jn = O(String.prototype.match), _e = O(String.prototype.replace), Wn = O(String.prototype.indexOf), zi = O(String.prototype.trim), $i = O(Number.prototype.toString), Pi = O(Boolean.prototype.toString), qn = typeof BigInt > "u" ? null : O(BigInt.prototype.toString), Zn = typeof Symbol > "u" ? null : O(Symbol.prototype.toString), I = O(Object.prototype.hasOwnProperty), Be = O(Object.prototype.toString), U = O(RegExp.prototype.test), dt = Fi(TypeError);
function O(a) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), s = 1; s < e; s++)
      n[s - 1] = arguments[s];
    return Zt(a, t, n);
  };
}
function Fi(a) {
  return function() {
    for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
      e[n] = arguments[n];
    return Yt(a, e);
  };
}
function w(a, t) {
  let e = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : Ge;
  if (Hn && Hn(a, null), !H(t))
    return a;
  let n = t.length;
  for (; n--; ) {
    let s = t[n];
    if (typeof s == "string") {
      const i = e(s);
      i !== s && (vi(t) || (t[n] = i), s = i);
    }
    a[s] = !0;
  }
  return a;
}
function Ui(a) {
  for (let t = 0; t < a.length; t++)
    I(a, t) || (a[t] = null);
  return a;
}
function W(a) {
  const t = Se(null);
  for (const n of hs(a)) {
    var e = Li(n, 2);
    const s = e[0], i = e[1];
    I(a, s) && (H(i) ? t[s] = Ui(i) : i && typeof i == "object" && i.constructor === Object ? t[s] = W(i) : t[s] = i);
  }
  return t;
}
function Bi(a) {
  switch (typeof a) {
    case "string":
      return a;
    case "number":
      return $i(a);
    case "boolean":
      return Pi(a);
    case "bigint":
      return qn ? qn(a) : "0";
    case "symbol":
      return Zn ? Zn(a) : "Symbol()";
    case "undefined":
      return Be(a);
    case "function":
    case "object": {
      if (a === null)
        return Be(a);
      const t = a, e = Re(t, "toString");
      if (typeof e == "function") {
        const n = e(t);
        return typeof n == "string" ? n : Be(n);
      }
      return Be(a);
    }
    default:
      return Be(a);
  }
}
function Re(a, t) {
  for (; a !== null; ) {
    const n = Ni(a, t);
    if (n) {
      if (n.get)
        return O(n.get);
      if (typeof n.value == "function")
        return O(n.value);
    }
    a = Oi(a);
  }
  function e() {
    return null;
  }
  return e;
}
function Hi(a) {
  try {
    return U(a, ""), !0;
  } catch {
    return !1;
  }
}
const Yn = G(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), Ht = G(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), Gt = G(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Gi = G(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), jt = G(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), ji = G(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Xn = G(["#text"]), Vn = G(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]), Wt = G(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), Qn = G(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), mt = G(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Wi = K(/{{[\w\W]*|^[\w\W]*}}/g), qi = K(/<%[\w\W]*|^[\w\W]*%>/g), Zi = K(/\${[\w\W]*/g), Yi = K(/^data-[\-\w.\u00B7-\uFFFF]+$/), Xi = K(/^aria-[\-\w]+$/), Kn = K(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), Vi = K(/^(?:\w+script|data):/i), Qi = K(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), Ki = K(/^html$/i), Ji = K(/^[a-z][.\w]*(-[.\w]+)+$/i), Ae = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, er = function() {
  return typeof window > "u" ? null : window;
}, tr = function(t, e) {
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
}, Jn = function() {
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
function ds() {
  let a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : er();
  const t = (x) => ds(x);
  if (t.version = "3.4.3", t.removed = [], !a || !a.document || a.document.nodeType !== Ae.document || !a.Element)
    return t.isSupported = !1, t;
  let e = a.document;
  const n = e, s = n.currentScript, i = a.DocumentFragment, o = a.HTMLTemplateElement, l = a.Node, c = a.Element, p = a.NodeFilter, h = a.NamedNodeMap, m = h === void 0 ? a.NamedNodeMap || a.MozNamedAttrMap : h, g = a.HTMLFormElement, T = a.DOMParser, y = a.trustedTypes, R = c.prototype, Y = Re(R, "cloneNode"), De = Re(R, "remove"), nt = Re(R, "nextSibling"), st = Re(R, "childNodes"), pe = Re(R, "parentNode");
  if (typeof o == "function") {
    const x = e.createElement("template");
    x.content && x.content.ownerDocument && (e = x.content.ownerDocument);
  }
  let P, re = "";
  const te = e, _t = te.implementation, Ls = te.createNodeIterator, Cs = te.createDocumentFragment, vs = te.getElementsByTagName, Os = n.importNode;
  let B = Jn();
  t.isSupported = typeof hs == "function" && typeof pe == "function" && _t && _t.createHTMLDocument !== void 0;
  const it = Wi, rt = qi, ot = Zi, Ns = Yi, Ds = Xi, Ms = Vi, pn = Qi, zs = Ji;
  let hn = Kn, D = null;
  const fn = w({}, [...Yn, ...Ht, ...Gt, ...jt, ...Xn]);
  let F = null;
  const dn = w({}, [...Vn, ...Wt, ...Qn, ...mt]);
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
  })), Me = null, at = null;
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
  let mn = !0, At = !0, gn = !1, bn = !0, he = !1, ze = !0, fe = !1, St = !1, Rt = !1, xe = !1, lt = !1, ct = !1, xn = !0, kn = !1;
  const wn = "user-content-";
  let It = !0, $e = !1, ke = {}, ne = null;
  const Lt = w({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let Tn = null;
  const yn = w({}, ["audio", "video", "img", "source", "image", "track"]);
  let Ct = null;
  const En = w({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), ut = "http://www.w3.org/1998/Math/MathML", pt = "http://www.w3.org/2000/svg", se = "http://www.w3.org/1999/xhtml";
  let we = se, vt = !1, Ot = null;
  const $s = w({}, [ut, pt, se], Bt);
  let Nt = w({}, ["mi", "mo", "mn", "ms", "mtext"]), Dt = w({}, ["annotation-xml"]);
  const Ps = w({}, ["title", "style", "font", "a", "script"]);
  let Pe = null;
  const Fs = ["application/xhtml+xml", "text/html"], Us = "text/html";
  let N = null, Te = null;
  const Bs = e.createElement("form"), _n = function(r) {
    return r instanceof RegExp || r instanceof Function;
  }, Mt = function() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (Te && Te === r)
      return;
    (!r || typeof r != "object") && (r = {}), r = W(r), Pe = // eslint-disable-next-line unicorn/prefer-includes
    Fs.indexOf(r.PARSER_MEDIA_TYPE) === -1 ? Us : r.PARSER_MEDIA_TYPE, N = Pe === "application/xhtml+xml" ? Bt : Ge, D = I(r, "ALLOWED_TAGS") && H(r.ALLOWED_TAGS) ? w({}, r.ALLOWED_TAGS, N) : fn, F = I(r, "ALLOWED_ATTR") && H(r.ALLOWED_ATTR) ? w({}, r.ALLOWED_ATTR, N) : dn, Ot = I(r, "ALLOWED_NAMESPACES") && H(r.ALLOWED_NAMESPACES) ? w({}, r.ALLOWED_NAMESPACES, Bt) : $s, Ct = I(r, "ADD_URI_SAFE_ATTR") && H(r.ADD_URI_SAFE_ATTR) ? w(W(En), r.ADD_URI_SAFE_ATTR, N) : En, Tn = I(r, "ADD_DATA_URI_TAGS") && H(r.ADD_DATA_URI_TAGS) ? w(W(yn), r.ADD_DATA_URI_TAGS, N) : yn, ne = I(r, "FORBID_CONTENTS") && H(r.FORBID_CONTENTS) ? w({}, r.FORBID_CONTENTS, N) : Lt, Me = I(r, "FORBID_TAGS") && H(r.FORBID_TAGS) ? w({}, r.FORBID_TAGS, N) : W({}), at = I(r, "FORBID_ATTR") && H(r.FORBID_ATTR) ? w({}, r.FORBID_ATTR, N) : W({}), ke = I(r, "USE_PROFILES") ? r.USE_PROFILES && typeof r.USE_PROFILES == "object" ? W(r.USE_PROFILES) : r.USE_PROFILES : !1, mn = r.ALLOW_ARIA_ATTR !== !1, At = r.ALLOW_DATA_ATTR !== !1, gn = r.ALLOW_UNKNOWN_PROTOCOLS || !1, bn = r.ALLOW_SELF_CLOSE_IN_ATTR !== !1, he = r.SAFE_FOR_TEMPLATES || !1, ze = r.SAFE_FOR_XML !== !1, fe = r.WHOLE_DOCUMENT || !1, xe = r.RETURN_DOM || !1, lt = r.RETURN_DOM_FRAGMENT || !1, ct = r.RETURN_TRUSTED_TYPE || !1, Rt = r.FORCE_BODY || !1, xn = r.SANITIZE_DOM !== !1, kn = r.SANITIZE_NAMED_PROPS || !1, It = r.KEEP_CONTENT !== !1, $e = r.IN_PLACE || !1, hn = Hi(r.ALLOWED_URI_REGEXP) ? r.ALLOWED_URI_REGEXP : Kn, we = typeof r.NAMESPACE == "string" ? r.NAMESPACE : se, Nt = I(r, "MATHML_TEXT_INTEGRATION_POINTS") && r.MATHML_TEXT_INTEGRATION_POINTS && typeof r.MATHML_TEXT_INTEGRATION_POINTS == "object" ? W(r.MATHML_TEXT_INTEGRATION_POINTS) : w({}, ["mi", "mo", "mn", "ms", "mtext"]), Dt = I(r, "HTML_INTEGRATION_POINTS") && r.HTML_INTEGRATION_POINTS && typeof r.HTML_INTEGRATION_POINTS == "object" ? W(r.HTML_INTEGRATION_POINTS) : w({}, ["annotation-xml"]);
    const u = I(r, "CUSTOM_ELEMENT_HANDLING") && r.CUSTOM_ELEMENT_HANDLING && typeof r.CUSTOM_ELEMENT_HANDLING == "object" ? W(r.CUSTOM_ELEMENT_HANDLING) : Se(null);
    if (L = Se(null), I(u, "tagNameCheck") && _n(u.tagNameCheck) && (L.tagNameCheck = u.tagNameCheck), I(u, "attributeNameCheck") && _n(u.attributeNameCheck) && (L.attributeNameCheck = u.attributeNameCheck), I(u, "allowCustomizedBuiltInElements") && typeof u.allowCustomizedBuiltInElements == "boolean" && (L.allowCustomizedBuiltInElements = u.allowCustomizedBuiltInElements), he && (At = !1), lt && (xe = !0), ke && (D = w({}, Xn), F = Se(null), ke.html === !0 && (w(D, Yn), w(F, Vn)), ke.svg === !0 && (w(D, Ht), w(F, Wt), w(F, mt)), ke.svgFilters === !0 && (w(D, Gt), w(F, Wt), w(F, mt)), ke.mathMl === !0 && (w(D, jt), w(F, Qn), w(F, mt))), le.tagCheck = null, le.attributeCheck = null, I(r, "ADD_TAGS") && (typeof r.ADD_TAGS == "function" ? le.tagCheck = r.ADD_TAGS : H(r.ADD_TAGS) && (D === fn && (D = W(D)), w(D, r.ADD_TAGS, N))), I(r, "ADD_ATTR") && (typeof r.ADD_ATTR == "function" ? le.attributeCheck = r.ADD_ATTR : H(r.ADD_ATTR) && (F === dn && (F = W(F)), w(F, r.ADD_ATTR, N))), I(r, "ADD_URI_SAFE_ATTR") && H(r.ADD_URI_SAFE_ATTR) && w(Ct, r.ADD_URI_SAFE_ATTR, N), I(r, "FORBID_CONTENTS") && H(r.FORBID_CONTENTS) && (ne === Lt && (ne = W(ne)), w(ne, r.FORBID_CONTENTS, N)), I(r, "ADD_FORBID_CONTENTS") && H(r.ADD_FORBID_CONTENTS) && (ne === Lt && (ne = W(ne)), w(ne, r.ADD_FORBID_CONTENTS, N)), It && (D["#text"] = !0), fe && w(D, ["html", "head", "body"]), D.table && (w(D, ["tbody"]), delete Me.tbody), r.TRUSTED_TYPES_POLICY) {
      if (typeof r.TRUSTED_TYPES_POLICY.createHTML != "function")
        throw dt('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      if (typeof r.TRUSTED_TYPES_POLICY.createScriptURL != "function")
        throw dt('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      P = r.TRUSTED_TYPES_POLICY, re = P.createHTML("");
    } else
      P === void 0 && (P = tr(y, s)), P !== null && typeof re == "string" && (re = P.createHTML(""));
    G && G(r), Te = r;
  }, An = w({}, [...Ht, ...Gt, ...Gi]), Sn = w({}, [...jt, ...ji]), Hs = function(r) {
    let u = pe(r);
    (!u || !u.tagName) && (u = {
      namespaceURI: we,
      tagName: "template"
    });
    const d = Ge(r.tagName), E = Ge(u.tagName);
    return Ot[r.namespaceURI] ? r.namespaceURI === pt ? u.namespaceURI === se ? d === "svg" : u.namespaceURI === ut ? d === "svg" && (E === "annotation-xml" || Nt[E]) : !!An[d] : r.namespaceURI === ut ? u.namespaceURI === se ? d === "math" : u.namespaceURI === pt ? d === "math" && Dt[E] : !!Sn[d] : r.namespaceURI === se ? u.namespaceURI === pt && !Dt[E] || u.namespaceURI === ut && !Nt[E] ? !1 : !Sn[d] && (Ps[d] || !An[d]) : !!(Pe === "application/xhtml+xml" && Ot[r.namespaceURI]) : !1;
  }, J = function(r) {
    Ee(t.removed, {
      element: r
    });
    try {
      pe(r).removeChild(r);
    } catch {
      De(r);
    }
  }, de = function(r, u) {
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
      if (xe || lt)
        try {
          J(u);
        } catch {
        }
      else
        try {
          u.setAttribute(r, "");
        } catch {
        }
  }, Rn = function(r) {
    let u = null, d = null;
    if (Rt)
      r = "<remove></remove>" + r;
    else {
      const v = jn(r, /^[\r\n\t ]+/);
      d = v && v[0];
    }
    Pe === "application/xhtml+xml" && we === se && (r = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + r + "</body></html>");
    const E = P ? P.createHTML(r) : r;
    if (we === se)
      try {
        u = new T().parseFromString(E, Pe);
      } catch {
      }
    if (!u || !u.documentElement) {
      u = _t.createDocument(we, "template", null);
      try {
        u.documentElement.innerHTML = vt ? re : E;
      } catch {
      }
    }
    const M = u.body || u.documentElement;
    return r && d && M.insertBefore(e.createTextNode(d), M.childNodes[0] || null), we === se ? vs.call(u, fe ? "html" : "body")[0] : fe ? u.documentElement : M;
  }, In = function(r) {
    return Ls.call(
      r.ownerDocument || r,
      r,
      // eslint-disable-next-line no-bitwise
      p.SHOW_ELEMENT | p.SHOW_COMMENT | p.SHOW_TEXT | p.SHOW_PROCESSING_INSTRUCTION | p.SHOW_CDATA_SECTION,
      null
    );
  }, zt = function(r) {
    return r instanceof g && (typeof r.nodeName != "string" || typeof r.textContent != "string" || typeof r.removeChild != "function" || !(r.attributes instanceof m) || typeof r.removeAttribute != "function" || typeof r.setAttribute != "function" || typeof r.namespaceURI != "string" || typeof r.insertBefore != "function" || typeof r.hasChildNodes != "function");
  }, $t = function(r) {
    return typeof l == "function" && r instanceof l;
  };
  function oe(x, r, u) {
    ye(x, (d) => {
      d.call(t, r, u, Te);
    });
  }
  const Ln = function(r) {
    let u = null;
    if (oe(B.beforeSanitizeElements, r, null), zt(r))
      return J(r), !0;
    const d = N(r.nodeName);
    if (oe(B.uponSanitizeElement, r, {
      tagName: d,
      allowedTags: D
    }), ze && r.hasChildNodes() && !$t(r.firstElementChild) && U(/<[/\w!]/g, r.innerHTML) && U(/<[/\w!]/g, r.textContent) || ze && r.namespaceURI === se && d === "style" && $t(r.firstElementChild) || r.nodeType === Ae.progressingInstruction || ze && r.nodeType === Ae.comment && U(/<[/\w]/g, r.data))
      return J(r), !0;
    if (Me[d] || !(le.tagCheck instanceof Function && le.tagCheck(d)) && !D[d]) {
      if (!Me[d] && vn(d) && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, d) || L.tagNameCheck instanceof Function && L.tagNameCheck(d)))
        return !1;
      if (It && !ne[d]) {
        const E = pe(r) || r.parentNode, M = st(r) || r.childNodes;
        if (M && E) {
          const v = M.length;
          for (let j = v - 1; j >= 0; --j) {
            const X = Y(M[j], !0);
            E.insertBefore(X, nt(r));
          }
        }
      }
      return J(r), !0;
    }
    return r instanceof c && !Hs(r) || (d === "noscript" || d === "noembed" || d === "noframes") && U(/<\/no(script|embed|frames)/i, r.innerHTML) ? (J(r), !0) : (he && r.nodeType === Ae.text && (u = r.textContent, ye([it, rt, ot], (E) => {
      u = _e(u, E, " ");
    }), r.textContent !== u && (Ee(t.removed, {
      element: r.cloneNode()
    }), r.textContent = u)), oe(B.afterSanitizeElements, r, null), !1);
  }, Cn = function(r, u, d) {
    if (at[u] || xn && (u === "id" || u === "name") && (d in e || d in Bs))
      return !1;
    const E = F[u] || le.attributeCheck instanceof Function && le.attributeCheck(u, r);
    if (!(At && !at[u] && U(Ns, u))) {
      if (!(mn && U(Ds, u))) {
        if (!E || at[u]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(vn(r) && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, r) || L.tagNameCheck instanceof Function && L.tagNameCheck(r)) && (L.attributeNameCheck instanceof RegExp && U(L.attributeNameCheck, u) || L.attributeNameCheck instanceof Function && L.attributeNameCheck(u, r)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            u === "is" && L.allowCustomizedBuiltInElements && (L.tagNameCheck instanceof RegExp && U(L.tagNameCheck, d) || L.tagNameCheck instanceof Function && L.tagNameCheck(d)))
          ) return !1;
        } else if (!Ct[u]) {
          if (!U(hn, _e(d, pn, ""))) {
            if (!((u === "src" || u === "xlink:href" || u === "href") && r !== "script" && Wn(d, "data:") === 0 && Tn[r])) {
              if (!(gn && !U(Ms, _e(d, pn, "")))) {
                if (d)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Gs = w({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]), vn = function(r) {
    return !Gs[Ge(r)] && U(zs, r);
  }, On = function(r) {
    oe(B.beforeSanitizeAttributes, r, null);
    const u = r.attributes;
    if (!u || zt(r))
      return;
    const d = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: F,
      forceKeepAttr: void 0
    };
    let E = u.length;
    for (; E--; ) {
      const M = u[E], v = M.name, j = M.namespaceURI, X = M.value, ee = N(v), Ft = X;
      let z = v === "value" ? Ft : zi(Ft);
      if (d.attrName = ee, d.attrValue = z, d.keepAttr = !0, d.forceKeepAttr = void 0, oe(B.uponSanitizeAttribute, r, d), z = d.attrValue, kn && (ee === "id" || ee === "name") && Wn(z, wn) !== 0 && (de(v, r), z = wn + z), ze && U(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, z)) {
        de(v, r);
        continue;
      }
      if (ee === "attributename" && jn(z, "href")) {
        de(v, r);
        continue;
      }
      if (d.forceKeepAttr)
        continue;
      if (!d.keepAttr) {
        de(v, r);
        continue;
      }
      if (!bn && U(/\/>/i, z)) {
        de(v, r);
        continue;
      }
      he && ye([it, rt, ot], (Dn) => {
        z = _e(z, Dn, " ");
      });
      const Nn = N(r.nodeName);
      if (!Cn(Nn, ee, z)) {
        de(v, r);
        continue;
      }
      if (P && typeof y == "object" && typeof y.getAttributeType == "function" && !j)
        switch (y.getAttributeType(Nn, ee)) {
          case "TrustedHTML": {
            z = P.createHTML(z);
            break;
          }
          case "TrustedScriptURL": {
            z = P.createScriptURL(z);
            break;
          }
        }
      if (z !== Ft)
        try {
          j ? r.setAttributeNS(j, v, z) : r.setAttribute(v, z), zt(r) ? J(r) : Gn(t.removed);
        } catch {
          de(v, r);
        }
    }
    oe(B.afterSanitizeAttributes, r, null);
  }, Pt = function(r) {
    let u = null;
    const d = In(r);
    for (oe(B.beforeSanitizeShadowDOM, r, null); u = d.nextNode(); )
      oe(B.uponSanitizeShadowNode, u, null), Ln(u), On(u), u.content instanceof i && Pt(u.content);
    oe(B.afterSanitizeShadowDOM, r, null);
  }, ht = function(r) {
    if (r.nodeType === Ae.element && r.shadowRoot instanceof i) {
      const E = r.shadowRoot;
      ht(E), Pt(E);
    }
    const u = r.childNodes;
    if (!u)
      return;
    const d = [];
    ye(u, (E) => {
      Ee(d, E);
    });
    for (const E of d)
      ht(E);
  };
  return t.sanitize = function(x) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, u = null, d = null, E = null, M = null;
    if (vt = !x, vt && (x = "<!-->"), typeof x != "string" && !$t(x) && (x = Bi(x), typeof x != "string"))
      throw dt("dirty is not a string, aborting");
    if (!t.isSupported)
      return x;
    if (St || Mt(r), t.removed = [], typeof x == "string" && ($e = !1), $e) {
      const X = x.nodeName;
      if (typeof X == "string") {
        const ee = N(X);
        if (!D[ee] || Me[ee])
          throw dt("root node is forbidden and cannot be sanitized in-place");
      }
      ht(x);
    } else if (x instanceof l)
      u = Rn("<!---->"), d = u.ownerDocument.importNode(x, !0), d.nodeType === Ae.element && d.nodeName === "BODY" || d.nodeName === "HTML" ? u = d : u.appendChild(d), ht(d);
    else {
      if (!xe && !he && !fe && // eslint-disable-next-line unicorn/prefer-includes
      x.indexOf("<") === -1)
        return P && ct ? P.createHTML(x) : x;
      if (u = Rn(x), !u)
        return xe ? null : ct ? re : "";
    }
    u && Rt && J(u.firstChild);
    const v = In($e ? x : u);
    for (; E = v.nextNode(); )
      Ln(E), On(E), E.content instanceof i && Pt(E.content);
    if ($e)
      return x;
    if (xe) {
      if (he) {
        u.normalize();
        let X = u.innerHTML;
        ye([it, rt, ot], (ee) => {
          X = _e(X, ee, " ");
        }), u.innerHTML = X;
      }
      if (lt)
        for (M = Cs.call(u.ownerDocument); u.firstChild; )
          M.appendChild(u.firstChild);
      else
        M = u;
      return (F.shadowroot || F.shadowrootmode) && (M = Os.call(n, M, !0)), M;
    }
    let j = fe ? u.outerHTML : u.innerHTML;
    return fe && D["!doctype"] && u.ownerDocument && u.ownerDocument.doctype && u.ownerDocument.doctype.name && U(Ki, u.ownerDocument.doctype.name) && (j = "<!DOCTYPE " + u.ownerDocument.doctype.name + `>
` + j), he && ye([it, rt, ot], (X) => {
      j = _e(j, X, " ");
    }), P && ct ? P.createHTML(j) : j;
  }, t.setConfig = function() {
    let x = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Mt(x), St = !0;
  }, t.clearConfig = function() {
    Te = null, St = !1;
  }, t.isValidAttribute = function(x, r, u) {
    Te || Mt({});
    const d = N(x), E = N(r);
    return Cn(d, E, u);
  }, t.addHook = function(x, r) {
    typeof r == "function" && Ee(B[x], r);
  }, t.removeHook = function(x, r) {
    if (r !== void 0) {
      const u = Di(B[x], r);
      return u === -1 ? void 0 : Mi(B[x], u, 1)[0];
    }
    return Gn(B[x]);
  }, t.removeHooks = function(x) {
    B[x] = [];
  }, t.removeAllHooks = function() {
    B = Jn();
  }, t;
}
var nr = ds(), ve;
class sr {
  constructor() {
    $(this, ve);
    C(this, ve, nr), k(this, ve).addHook("afterSanitizeAttributes", (t) => {
      t.tagName === "A" && (t.setAttribute("rel", "noopener noreferrer"), t.setAttribute("target", "_blank"));
    });
  }
  render(t) {
    const e = _.parse(t, { async: !1 });
    return k(this, ve).sanitize(e, {
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
ve = new WeakMap();
const es = (a) => `chatbot_open_${a}`, He = (a) => `chatbot_conversation_${a}`, ir = `
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
var q, Qe, ie, Oe, Ne, Ke, ce, ae, ue, Je, f, Vt, ms, gs, Qt, Kt, Ie, je, Jt, bs, xs, We, ks, ws, qe, en, gt, Ts, ys, tn, nn, Es, _s, bt, As, Ss, Rs, Is, xt;
const Le = class Le extends HTMLElement {
  constructor() {
    super();
    $(this, f);
    $(this, q);
    $(this, Qe, new sr());
    $(this, ie, !1);
    $(this, Oe, !1);
    $(this, Ne, null);
    $(this, Ke, null);
    $(this, ce, null);
    $(this, ae, null);
    $(this, ue, /* @__PURE__ */ new Map());
    C(this, q, this.attachShadow({ mode: "open" }));
  }
  registerClientExtractor(e, n, s = {}) {
    if (k(Le, Je).includes(e))
      throw new Error(
        `Client extractor name '${e}' is reserved and cannot be registered by hosts.`
      );
    b(this, f, Vt).call(this, e, n, s);
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
    b(this, f, Qt).call(this), b(this, f, xs).call(this), b(this, f, ks).call(this), this.addEventListener("tool_started", (e) => b(this, f, Es).call(this, e.detail.name)), queueMicrotask(() => {
      this._registerBuiltinExtractors(), b(this, f, gs).call(this);
    });
  }
  _registerBuiltinExtractors() {
    b(this, f, bt).call(this, this.getAttribute("signed-context")).includes("blade-snapshot") && !k(this, ue).has("blade-snapshot") && b(this, f, Vt).call(this, "blade-snapshot", () => b(this, f, ms).call(this), { description: "Page snapshot" });
  }
  attributeChangedCallback() {
    k(this, q).innerHTML && b(this, f, Qt).call(this);
  }
};
q = new WeakMap(), Qe = new WeakMap(), ie = new WeakMap(), Oe = new WeakMap(), Ne = new WeakMap(), Ke = new WeakMap(), ce = new WeakMap(), ae = new WeakMap(), ue = new WeakMap(), Je = new WeakMap(), f = new WeakSet(), Vt = function(e, n, s = {}) {
  k(this, ue).set(e, { fn: n, description: s.description });
}, ms = function() {
  const e = document.querySelectorAll("[data-chatbot-snapshot]");
  if (e.length === 0) return "";
  const n = /* @__PURE__ */ new Map(), s = [], i = /^[a-z][a-z0-9_-]*$/;
  for (const l of e) {
    const c = l.getAttribute("data-chatbot-snapshot") ?? "";
    if (!i.test(c)) {
      console.warn(`@chatbotSnapshot label '${c}' is invalid; section dropped.`);
      continue;
    }
    const p = (l.innerText ?? l.textContent ?? "").trim();
    p && (n.has(c) || (n.set(c, []), s.push(c)), n.get(c).push(p));
  }
  return s.map((l) => `## ${l}

${n.get(l).join(`

`)}`).join(`

`);
}, gs = function() {
  const e = b(this, f, bt).call(this, this.getAttribute("signed-context"));
  for (const n of e)
    if (!k(this, ue).has(n)) {
      if (k(Le, Je).includes(n)) {
        console.error(
          `Built-in client extractor '${n}' is in the signed allowlist but was not registered at boot — likely a widget bundle mismatch after an upgrade. Page content for '${n}' will not be sent.`
        );
        continue;
      }
      console.error(
        `Client extractor '${n}' is in the signed allowlist but has no matching JS registration on the widget.`
      );
    }
}, Qt = function() {
  const e = document.createElement("style");
  e.textContent = ir;
  const n = this.position === "inline";
  if (k(this, q).innerHTML = "", k(this, q).appendChild(e), !n) {
    const g = document.createElement("button");
    g.className = `launcher ${this.position}`, g.part = "launcher", g.innerHTML = "💬", g.setAttribute("aria-label", "Open chat"), g.addEventListener("click", () => b(this, f, bs).call(this)), k(this, q).appendChild(g);
  }
  const s = document.createElement("div");
  s.className = `panel ${n ? "inline" : this.position}`, s.part = "panel", !n && !k(this, ie) && (s.hidden = !0);
  const i = document.createElement("div");
  i.className = "header", i.part = "header", i.innerHTML = `<span>${this.title}</span>`;
  const o = document.createElement("button");
  o.className = "new-chat", o.textContent = "New chat", o.addEventListener("click", () => b(this, f, ws).call(this)), i.appendChild(o), s.appendChild(i);
  const l = document.createElement("div");
  l.className = "messages", l.part = "messages", s.appendChild(l);
  const c = document.createElement("div");
  c.className = "tool-status", c.setAttribute("part", "tool-status"), c.hidden = !0, s.appendChild(c), C(this, ae, c);
  const p = document.createElement("div");
  p.className = "input-row";
  const h = document.createElement("textarea");
  h.className = "input", h.part = "input", h.placeholder = "Ask a question…", h.rows = 1, h.addEventListener("keydown", (g) => {
    g.key === "Enter" && !g.shiftKey && (g.preventDefault(), b(this, f, qe).call(this));
  }), p.appendChild(h);
  const m = document.createElement("button");
  m.className = "send-button", m.part = "send-button", m.textContent = "Send", m.addEventListener("click", () => b(this, f, qe).call(this)), p.appendChild(m), s.appendChild(p), k(this, q).appendChild(s);
}, Kt = function() {
  return k(this, q).querySelector(".panel");
}, Ie = function() {
  return k(this, q).querySelector(".messages");
}, je = function() {
  return k(this, q).querySelector(".input");
}, Jt = function() {
  return k(this, q).querySelector(".send-button");
}, bs = function() {
  var n;
  C(this, ie, !k(this, ie));
  const e = b(this, f, Kt).call(this);
  e && (e.hidden = !k(this, ie)), localStorage.setItem(es(this.channel), k(this, ie) ? "1" : "0"), k(this, ie) && ((n = b(this, f, je).call(this)) == null || n.focus());
}, xs = function() {
  if (localStorage.getItem(es(this.channel)) === "1") {
    C(this, ie, !0);
    const n = b(this, f, Kt).call(this);
    n && (n.hidden = !1);
  }
}, We = function() {
  const e = this.getAttribute("signed-context");
  if (e)
    try {
      const n = JSON.parse(atob(e.split(".")[1] ?? ""));
      n.greeting && b(this, f, gt).call(this, n.greeting);
    } catch {
    }
}, ks = async function() {
  const e = localStorage.getItem(He(this.channel));
  if (!e) {
    b(this, f, We).call(this);
    return;
  }
  try {
    const n = await fetch(`/chatbot/conversations/${e}/messages`);
    if (!n.ok) {
      localStorage.removeItem(He(this.channel)), b(this, f, We).call(this);
      return;
    }
    const { messages: s } = await n.json();
    for (const i of s)
      i.role === "user" ? b(this, f, en).call(this, i.content) : i.role === "assistant" && b(this, f, gt).call(this, i.content);
  } catch {
    b(this, f, We).call(this);
  }
}, ws = function() {
  localStorage.removeItem(He(this.channel));
  const e = b(this, f, Ie).call(this);
  e && (e.innerHTML = ""), C(this, Ne, null), C(this, Ke, null), C(this, ce, null), b(this, f, We).call(this);
}, qe = async function() {
  var m;
  if (k(this, Oe)) return;
  const e = b(this, f, je).call(this), n = e == null ? void 0 : e.value.trim();
  if (!n) return;
  e.value = "", b(this, f, en).call(this, n);
  const s = this.getAttribute("signed-context"), i = localStorage.getItem(He(this.channel)), o = await b(this, f, Ss).call(this, s);
  b(this, f, Rs).call(this), b(this, f, Is).call(this, o), C(this, Oe, !0);
  const l = b(this, f, Jt).call(this);
  l && (l.disabled = !0);
  const c = b(this, f, gt).call(this, "");
  C(this, Ke, c), C(this, ce, null);
  const p = new qs();
  p.addEventListener("chunk", (g) => {
    c.dataset.raw = (c.dataset.raw ?? "") + g.detail.text, c.innerHTML = k(this, Qe).render(c.dataset.raw);
  }), p.addEventListener("context_summary", (g) => {
    const T = b(this, f, Ts).call(this, c);
    T.textContent = g.detail.text;
  }), p.addEventListener("done", (g) => {
    var T;
    (T = g.detail) != null && T.conversationId && localStorage.setItem(He(this.channel), g.detail.conversationId), b(this, f, ys).call(this, c), b(this, f, xt).call(this);
  }), p.addEventListener("tool_started", (g) => this.dispatchEvent(new CustomEvent("tool_started", { detail: g.detail }))), p.addEventListener("tool_finished", (g) => this.dispatchEvent(new CustomEvent("tool_finished", { detail: g.detail }))), p.addEventListener("tool_failed", (g) => this.dispatchEvent(new CustomEvent("tool_failed", { detail: g.detail }))), p.addEventListener("error", (g) => {
    b(this, f, nn).call(this, g.detail, c, n, s, i), b(this, f, xt).call(this);
  });
  const h = (m = document.querySelector('meta[name="csrf-token"]')) == null ? void 0 : m.content;
  try {
    await p.connect("/chatbot/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...h ? { "X-CSRF-TOKEN": h } : {}
      },
      body: JSON.stringify({
        message: n,
        signed_context: s,
        ...i ? { conversation_id: i } : {},
        ...o.length ? { extractor_blocks: o } : {}
      })
    });
  } catch {
    b(this, f, nn).call(this, { code: "network_error", message: "Connection failed.", retryable: !0 }, c, n, s, i), b(this, f, xt).call(this);
  }
}, en = function(e) {
  const n = b(this, f, Ie).call(this), s = document.createElement("div");
  return s.className = "message message-user", s.part = "message-user", s.textContent = e, n == null || n.appendChild(s), s.scrollIntoView({ behavior: "smooth" }), C(this, Ne, e), s;
}, gt = function(e) {
  const n = b(this, f, Ie).call(this), s = document.createElement("div");
  return s.className = "message message-assistant", s.part = "message-assistant", s.dataset.raw = e, e && (s.innerHTML = k(this, Qe).render(e)), n == null || n.appendChild(s), s.scrollIntoView({ behavior: "smooth" }), s;
}, Ts = function(e) {
  var s;
  if (k(this, ce)) return k(this, ce);
  const n = document.createElement("div");
  return n.className = "context-summary", (s = e.parentElement) == null || s.insertBefore(n, e), C(this, ce, n), n;
}, ys = function(e) {
  var c;
  const n = document.createElement("div");
  n.className = "message-actions";
  const s = document.createElement("button");
  s.className = "action-btn", s.textContent = "📋 Copy", s.addEventListener("click", () => navigator.clipboard.writeText(e.dataset.raw ?? ""));
  const i = document.createElement("button");
  i.className = "action-btn", i.textContent = "🔄 Regenerate", i.addEventListener("click", () => {
    e.dataset.raw = "", e.innerHTML = "", n.remove(), k(this, Ne) && b(this, f, qe).call(this);
  });
  const o = document.createElement("button");
  o.className = "action-btn", o.textContent = "👍", o.addEventListener("click", () => b(this, f, tn).call(this, e, 1, o, l));
  const l = document.createElement("button");
  l.className = "action-btn", l.textContent = "👎", l.addEventListener("click", () => b(this, f, tn).call(this, e, -1, o, l)), n.append(s, i, o, l), (c = e.parentElement) == null || c.insertBefore(n, e.nextSibling);
}, tn = async function(e, n, s, i) {
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
}, nn = function(e, n, s, i, o) {
  const l = b(this, f, Ie).call(this);
  n.remove();
  const c = document.createElement("div");
  if (c.className = "message error-msg", e.code === "quota_exceeded" || e.code === "token_cap_exceeded")
    c.className = "message quota-msg", c.textContent = e.message || "Daily limit reached. Try again later.";
  else if (e.code === "content_blocked")
    c.textContent = e.message || "This message was blocked by content policy.";
  else if (c.textContent = e.message || "Something went wrong.", e.retryable) {
    const p = document.createElement("button");
    p.className = "retry-btn", p.textContent = "Retry", p.addEventListener("click", () => {
      c.remove(), b(this, f, je).call(this) && (b(this, f, je).call(this).value = s), b(this, f, qe).call(this);
    }), c.appendChild(p);
  }
  l == null || l.appendChild(c), c.scrollIntoView({ behavior: "smooth" });
}, Es = function(e) {
  k(this, ae) && (k(this, ae).textContent = `Working: ${e}…`, k(this, ae).removeAttribute("hidden"));
}, _s = function() {
  k(this, ae) && k(this, ae).setAttribute("hidden", "");
}, bt = function(e) {
  if (!e) return [];
  try {
    const n = JSON.parse(atob(e.split(".")[1] ?? ""));
    return Array.isArray(n.x) ? n.x : [];
  } catch {
    return [];
  }
}, As = function(e) {
  if (!e) return {};
  try {
    return JSON.parse(atob(e.split(".")[1] ?? ""));
  } catch {
    return {};
  }
}, Ss = async function(e) {
  const n = b(this, f, bt).call(this, e);
  if (n.length === 0) return [];
  this._registerBuiltinExtractors();
  const s = b(this, f, As).call(this, e), i = Number.isInteger(s.xt) && s.xt > 0 ? s.xt : 250, o = Number.isInteger(s.xc) && s.xc > 0 ? s.xc : 8192;
  return (await Promise.all(n.map(async (c) => {
    const p = k(this, ue).get(c);
    if (!p) return null;
    const h = p.fn;
    try {
      const m = await Promise.race([
        Promise.resolve().then(() => h()),
        new Promise((y, R) => setTimeout(() => R(new Error("__extractor_timeout__")), i))
      ]);
      if (m == null || m === "")
        return console.warn(`Client extractor '${c}' returned empty output; block omitted.`), null;
      let g = String(m);
      const T = new TextEncoder().encode(g);
      if (T.byteLength > o) {
        const y = " [truncated]", R = T.slice(0, Math.max(0, o - y.length));
        g = new TextDecoder("utf-8", { fatal: !1 }).decode(R) + y;
      }
      return { name: c, output: g };
    } catch (m) {
      return m && m.message === "__extractor_timeout__" ? console.warn(`Client extractor '${c}' exceeded ${i}ms timeout; block omitted.`) : console.error(`Client extractor '${c}' threw; block omitted.`, m), null;
    }
  }))).filter((c) => c !== null);
}, Rs = function() {
  k(this, q).querySelectorAll('[part="extractor-chip"]').forEach((e) => e.remove());
}, Is = function(e) {
  if (!e.length) return;
  const n = b(this, f, Ie).call(this);
  if (!n) return;
  const s = e.map((o) => {
    var l;
    return ((l = k(this, ue).get(o.name)) == null ? void 0 : l.description) ?? o.name;
  }), i = document.createElement("div");
  i.className = "extractor-chip", i.setAttribute("part", "extractor-chip"), i.textContent = `Read from page: ${s.join(", ")}`, n.appendChild(i);
}, xt = function() {
  C(this, Oe, !1), setTimeout(() => b(this, f, _s).call(this), 500);
  const e = b(this, f, Jt).call(this);
  e && (e.disabled = !1);
}, A(Le, "observedAttributes", ["channel", "position", "title"]), $(Le, Je, ["blade-snapshot"]);
let Xt = Le;
customElements.define("chatbot-widget", Xt);
export {
  Xt as ChatbotWidget
};
