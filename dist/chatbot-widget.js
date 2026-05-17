var Ni = Object.defineProperty;
var Ln = (a) => {
  throw TypeError(a);
};
var Di = (a, t, e) => t in a ? Ni(a, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : a[t] = e;
var _ = (a, t, e) => Di(a, typeof t != "symbol" ? t + "" : t, e), zt = (a, t, e) => t.has(a) || Ln("Cannot " + e);
var w = (a, t, e) => (zt(a, t, "read from private field"), e ? e.call(a) : t.get(a)), U = (a, t, e) => t.has(a) ? Ln("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(a) : t.set(a, e), L = (a, t, e, n) => (zt(a, t, "write to private field"), n ? n.call(a, e) : t.set(a, e), e), x = (a, t, e) => (zt(a, t, "access private method"), e);
var Ze, de, Ye, Re, xt, Xn;
class Mi extends EventTarget {
  constructor(e = globalThis.fetch.bind(globalThis)) {
    super();
    U(this, xt);
    U(this, Ze);
    U(this, de, !1);
    U(this, Ye, null);
    U(this, Re, null);
    L(this, Ze, e);
  }
  abort() {
    var e;
    L(this, de, !0), (e = w(this, Ye)) == null || e.cancel();
  }
  async connect(e, n = {}) {
    L(this, de, !1);
    const s = (await w(this, Ze).call(this, e, n)).body.getReader();
    L(this, Ye, s);
    const o = new TextDecoder();
    let l = "";
    for (; !w(this, de); ) {
      const { done: c, value: h } = await s.read();
      if (c) break;
      l += o.decode(h, { stream: !0 });
      const p = l.split(`
`);
      l = p.pop() ?? "";
      for (const d of p) {
        if (w(this, de)) break;
        d === "" ? L(this, Re, null) : x(this, xt, Xn).call(this, d);
      }
    }
    s.cancel();
  }
}
Ze = new WeakMap(), de = new WeakMap(), Ye = new WeakMap(), Re = new WeakMap(), xt = new WeakSet(), Xn = function(e) {
  if (e.startsWith("event: ")) {
    L(this, Re, e.slice(7).trim());
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
  const s = w(this, Re) ?? i.type;
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
function Qt() {
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
let ge = Qt();
function Vn(a) {
  ge = a;
}
const Qn = /[&<>"']/, zi = new RegExp(Qn.source, "g"), Kn = /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, $i = new RegExp(Kn.source, "g"), Pi = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}, vn = (a) => Pi[a];
function Z(a, t) {
  if (t) {
    if (Qn.test(a))
      return a.replace(zi, vn);
  } else if (Kn.test(a))
    return a.replace($i, vn);
  return a;
}
const Fi = /(^|[^\[])\^/g;
function A(a, t) {
  let e = typeof a == "string" ? a : a.source;
  t = t || "";
  const n = {
    replace: (i, s) => {
      let o = typeof s == "string" ? s : s.source;
      return o = o.replace(Fi, "$1"), e = e.replace(i, o), n;
    },
    getRegex: () => new RegExp(e, t)
  };
  return n;
}
function Cn(a) {
  try {
    a = encodeURI(a).replace(/%25/g, "%");
  } catch {
    return null;
  }
  return a;
}
const je = { exec: () => null };
function On(a, t) {
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
function ze(a, t, e) {
  const n = a.length;
  if (n === 0)
    return "";
  let i = 0;
  for (; i < n && a.charAt(n - i - 1) === t; )
    i++;
  return a.slice(0, n - i);
}
function Ui(a, t) {
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
function Nn(a, t, e, n) {
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
function Hi(a, t) {
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
class mt {
  // set by the lexer
  constructor(t) {
    _(this, "options");
    _(this, "rules");
    // set by the lexer
    _(this, "lexer");
    this.options = t || ge;
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
        text: this.options.pedantic ? n : ze(n, `
`)
      };
    }
  }
  fences(t) {
    const e = this.rules.block.fences.exec(t);
    if (e) {
      const n = e[0], i = Hi(n, e[3] || "");
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
        const i = ze(n, "#");
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
        raw: ze(e[0], `
`)
      };
  }
  blockquote(t) {
    const e = this.rules.block.blockquote.exec(t);
    if (e) {
      let n = ze(e[0], `
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
        const b = this.lexer.state.top;
        if (this.lexer.state.top = !0, this.lexer.blockTokens(d, o, !0), this.lexer.state.top = b, n.length === 0)
          break;
        const S = o[o.length - 1];
        if ((S == null ? void 0 : S.type) === "code")
          break;
        if ((S == null ? void 0 : S.type) === "blockquote") {
          const y = S, N = y.raw + `
` + n.join(`
`), Y = this.blockquote(N);
          o[o.length - 1] = Y, i = i.substring(0, i.length - y.raw.length) + Y.raw, s = s.substring(0, s.length - y.text.length) + Y.text;
          break;
        } else if ((S == null ? void 0 : S.type) === "list") {
          const y = S, N = y.raw + `
` + n.join(`
`), Y = this.list(N);
          o[o.length - 1] = Y, i = i.substring(0, i.length - S.raw.length) + Y.raw, s = s.substring(0, s.length - y.raw.length) + Y.raw, n = N.substring(o[o.length - 1].raw.length).split(`
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
`, 1)[0].replace(/^\t+/, (Ce) => " ".repeat(3 * Ce.length)), b = t.split(`
`, 1)[0], S = !d.trim(), y = 0;
        if (this.options.pedantic ? (y = 2, p = d.trimStart()) : S ? y = e[1].length + 1 : (y = e[2].search(/[^ ]/), y = y > 4 ? 1 : y, p = d.slice(y), y += e[1].length), S && /^[ \t]*$/.test(b) && (h += b + `
`, t = t.substring(b.length + 1), c = !0), !c) {
          const Ce = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), Je = new RegExp(`^ {0,${Math.min(3, y - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), et = new RegExp(`^ {0,${Math.min(3, y - 1)}}(?:\`\`\`|~~~)`), ue = new RegExp(`^ {0,${Math.min(3, y - 1)}}#`), $ = new RegExp(`^ {0,${Math.min(3, y - 1)}}<(?:[a-z].*>|!--)`, "i");
          for (; t; ) {
            const re = t.split(`
`, 1)[0];
            let te;
            if (b = re, this.options.pedantic ? (b = b.replace(/^ {1,4}(?=( {4})*[^ ])/g, "  "), te = b) : te = b.replace(/\t/g, "    "), et.test(b) || ue.test(b) || $.test(b) || Ce.test(b) || Je.test(b))
              break;
            if (te.search(/[^ ]/) >= y || !b.trim())
              p += `
` + te.slice(y);
            else {
              if (S || d.replace(/\t/g, "    ").search(/[^ ]/) >= 4 || et.test(d) || ue.test(d) || Je.test(d))
                break;
              p += `
` + b;
            }
            !S && !b.trim() && (S = !0), h += re + `
`, t = t.substring(re.length + 1), d = te.slice(y);
          }
        }
        s.loose || (l ? s.loose = !0 : /\n[ \t]*\n[ \t]*$/.test(h) && (l = !0));
        let N = null, Y;
        this.options.gfm && (N = /^\[[ xX]\] /.exec(p), N && (Y = N[0] !== "[ ] ", p = p.replace(/^\[[ xX]\] +/, ""))), s.items.push({
          type: "list_item",
          raw: h,
          task: !!N,
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
    const n = On(e[1]), i = e[2].replace(/^\||\| *$/g, "").split("|"), s = e[3] && e[3].trim() ? e[3].replace(/\n[ \t]*$/, "").split(`
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
        o.rows.push(On(l, o.header.length).map((c, h) => ({
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
        const o = ze(n.slice(0, -1), "\\");
        if ((n.length - o.length) % 2 === 0)
          return;
      } else {
        const o = Ui(e[2], "()");
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
      return i = i.trim(), /^</.test(i) && (this.options.pedantic && !/>$/.test(n) ? i = i.slice(1) : i = i.slice(1, -1)), Nn(e, {
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
      return Nn(n, s, n[0], this.lexer);
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
        const b = [...i[0]][0].length, S = t.slice(0, o + i.index + b + c);
        if (Math.min(o, c) % 2) {
          const N = S.slice(1, -1);
          return {
            type: "em",
            raw: S,
            text: N,
            tokens: this.lexer.inlineTokens(N)
          };
        }
        const y = S.slice(2, -2);
        return {
          type: "strong",
          raw: S,
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
const Bi = /^(?:[ \t]*(?:\n|$))+/, Gi = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/, Wi = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/, Qe = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/, ji = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/, Jn = /(?:[*+-]|\d{1,9}[.)])/, ei = A(/^(?!bull |blockCode|fences|blockquote|heading|html)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html))+?)\n {0,3}(=+|-+) *(?:\n+|$)/).replace(/bull/g, Jn).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).getRegex(), Kt = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/, qi = /^[^\n]+/, Jt = /(?!\s*\])(?:\\.|[^\[\]\\])+/, Zi = A(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", Jt).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex(), Yi = A(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, Jn).getRegex(), kt = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul", en = /<!--(?:-?>|[\s\S]*?(?:-->|$))/, Xi = A("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))", "i").replace("comment", en).replace("tag", kt).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(), ti = A(Kt).replace("hr", Qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", kt).getRegex(), Vi = A(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ti).getRegex(), tn = {
  blockquote: Vi,
  code: Gi,
  def: Zi,
  fences: Wi,
  heading: ji,
  hr: Qe,
  html: Xi,
  lheading: ei,
  list: Yi,
  newline: Bi,
  paragraph: ti,
  table: je,
  text: qi
}, Dn = A("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", Qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}	)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", kt).getRegex(), Qi = {
  ...tn,
  table: Dn,
  paragraph: A(Kt).replace("hr", Qe).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", Dn).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", kt).getRegex()
}, Ki = {
  ...tn,
  html: A(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", en).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
  heading: /^(#{1,6})(.*)(?:\n+|$)/,
  fences: je,
  // fences not supported
  lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  paragraph: A(Kt).replace("hr", Qe).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", ei).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex()
}, ni = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/, Ji = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/, ii = /^( {2,}|\\)\n(?!\s*$)/, es = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/, Ke = "\\p{P}\\p{S}", ts = A(/^((?![*_])[\spunctuation])/, "u").replace(/punctuation/g, Ke).getRegex(), ns = /\[[^[\]]*?\]\((?:\\.|[^\\\(\)]|\((?:\\.|[^\\\(\)])*\))*\)|`[^`]*?`|<[^<>]*?>/g, is = A(/^(?:\*+(?:((?!\*)[punct])|[^\s*]))|^_+(?:((?!_)[punct])|([^\s_]))/, "u").replace(/punct/g, Ke).getRegex(), ss = A("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)[punct](\\*+)(?=[\\s]|$)|[^punct\\s](\\*+)(?!\\*)(?=[punct\\s]|$)|(?!\\*)[punct\\s](\\*+)(?=[^punct\\s])|[\\s](\\*+)(?!\\*)(?=[punct])|(?!\\*)[punct](\\*+)(?!\\*)(?=[punct])|[^punct\\s](\\*+)(?=[^punct\\s])", "gu").replace(/punct/g, Ke).getRegex(), rs = A("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)[punct](_+)(?=[\\s]|$)|[^punct\\s](_+)(?!_)(?=[punct\\s]|$)|(?!_)[punct\\s](_+)(?=[^punct\\s])|[\\s](_+)(?!_)(?=[punct])|(?!_)[punct](_+)(?!_)(?=[punct])", "gu").replace(/punct/g, Ke).getRegex(), os = A(/\\([punct])/, "gu").replace(/punct/g, Ke).getRegex(), as = A(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(), ls = A(en).replace("(?:-->|$)", "-->").getRegex(), cs = A("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", ls).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(), gt = /(?:\[(?:\\.|[^\[\]\\])*\]|\\.|`[^`]*`|[^\[\]\\`])*?/, us = A(/^!?\[(label)\]\(\s*(href)(?:\s+(title))?\s*\)/).replace("label", gt).replace("href", /<(?:\\.|[^\n<>\\])+>|[^\s\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex(), si = A(/^!?\[(label)\]\[(ref)\]/).replace("label", gt).replace("ref", Jt).getRegex(), ri = A(/^!?\[(ref)\](?:\[\])?/).replace("ref", Jt).getRegex(), ps = A("reflink|nolink(?!\\()", "g").replace("reflink", si).replace("nolink", ri).getRegex(), nn = {
  _backpedal: je,
  // only used for GFM url
  anyPunctuation: os,
  autolink: as,
  blockSkip: ns,
  br: ii,
  code: Ji,
  del: je,
  emStrongLDelim: is,
  emStrongRDelimAst: ss,
  emStrongRDelimUnd: rs,
  escape: ni,
  link: us,
  nolink: ri,
  punctuation: ts,
  reflink: si,
  reflinkSearch: ps,
  tag: cs,
  text: es,
  url: je
}, hs = {
  ...nn,
  link: A(/^!?\[(label)\]\((.*?)\)/).replace("label", gt).getRegex(),
  reflink: A(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", gt).getRegex()
}, Bt = {
  ...nn,
  escape: A(ni).replace("])", "~|])").getRegex(),
  url: A(/^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/, "i").replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(),
  _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
  del: /^(~~?)(?=[^\s~])((?:\\.|[^\\])*?(?:\\.|[^\s~\\]))\1(?=[^~]|$)/,
  text: /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/
}, fs = {
  ...Bt,
  br: A(ii).replace("{2,}", "*").getRegex(),
  text: A(Bt.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex()
}, ut = {
  normal: tn,
  gfm: Qi,
  pedantic: Ki
}, $e = {
  normal: nn,
  gfm: Bt,
  breaks: fs,
  pedantic: hs
};
class V {
  constructor(t) {
    _(this, "tokens");
    _(this, "options");
    _(this, "state");
    _(this, "tokenizer");
    _(this, "inlineQueue");
    this.tokens = [], this.tokens.links = /* @__PURE__ */ Object.create(null), this.options = t || ge, this.options.tokenizer = this.options.tokenizer || new mt(), this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = {
      inLink: !1,
      inRawBlock: !1,
      top: !0
    };
    const e = {
      block: ut.normal,
      inline: $e.normal
    };
    this.options.pedantic ? (e.block = ut.pedantic, e.inline = $e.pedantic) : this.options.gfm && (e.block = ut.gfm, this.options.breaks ? e.inline = $e.breaks : e.inline = $e.gfm), this.tokenizer.rules = e;
  }
  /**
   * Expose Rules
   */
  static get rules() {
    return {
      block: ut,
      inline: $e
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
          let b;
          this.options.extensions.startInline.forEach((S) => {
            b = S.call({ lexer: this }, d), typeof b == "number" && b >= 0 && (p = Math.min(p, b));
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
class bt {
  // set by the parser
  constructor(t) {
    _(this, "options");
    _(this, "parser");
    this.options = t || ge;
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
    const i = this.parser.parseInline(n), s = Cn(t);
    if (s === null)
      return i;
    t = s;
    let o = '<a href="' + t + '"';
    return e && (o += ' title="' + e + '"'), o += ">" + i + "</a>", o;
  }
  image({ href: t, title: e, text: n }) {
    const i = Cn(t);
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
class sn {
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
    this.options = t || ge, this.options.renderer = this.options.renderer || new bt(), this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new sn();
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
class qe {
  constructor(t) {
    _(this, "options");
    _(this, "block");
    this.options = t || ge;
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
_(qe, "passThroughHooks", /* @__PURE__ */ new Set([
  "preprocess",
  "postprocess",
  "processAllTokens"
]));
class ds {
  constructor(...t) {
    _(this, "defaults", Qt());
    _(this, "options", this.setOptions);
    _(this, "parse", this.parseMarkdown(!0));
    _(this, "parseInline", this.parseMarkdown(!1));
    _(this, "Parser", Q);
    _(this, "Renderer", bt);
    _(this, "TextRenderer", sn);
    _(this, "Lexer", V);
    _(this, "Tokenizer", mt);
    _(this, "Hooks", qe);
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
        const s = this.defaults.renderer || new bt(this.defaults);
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
        const s = this.defaults.tokenizer || new mt(this.defaults);
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
        const s = this.defaults.hooks || new qe();
        for (const o in n.hooks) {
          if (!(o in s))
            throw new Error(`hook '${o}' does not exist`);
          if (["options", "block"].includes(o))
            continue;
          const l = o, c = n.hooks[l], h = s[l];
          qe.passThroughHooks.has(o) ? s[l] = (p) => {
            if (this.defaults.async)
              return Promise.resolve(c.call(s, p)).then((b) => h.call(s, b));
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
const me = new ds();
function E(a, t) {
  return me.parse(a, t);
}
E.options = E.setOptions = function(a) {
  return me.setOptions(a), E.defaults = me.defaults, Vn(E.defaults), E;
};
E.getDefaults = Qt;
E.defaults = ge;
E.use = function(...a) {
  return me.use(...a), E.defaults = me.defaults, Vn(E.defaults), E;
};
E.walkTokens = function(a, t) {
  return me.walkTokens(a, t);
};
E.parseInline = me.parseInline;
E.Parser = Q;
E.parser = Q.parse;
E.Renderer = bt;
E.TextRenderer = sn;
E.Lexer = V;
E.lexer = V.lex;
E.Tokenizer = mt;
E.Hooks = qe;
E.parse = E;
E.options;
E.setOptions;
E.use;
E.walkTokens;
E.parseInline;
Q.parse;
V.lex;
/*! @license DOMPurify 3.4.3 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/3.4.3/LICENSE */
function Mn(a, t) {
  (t == null || t > a.length) && (t = a.length);
  for (var e = 0, n = Array(t); e < t; e++) n[e] = a[e];
  return n;
}
function ms(a) {
  if (Array.isArray(a)) return a;
}
function gs(a, t) {
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
function bs() {
  throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`);
}
function xs(a, t) {
  return ms(a) || gs(a, t) || ks(a, t) || bs();
}
function ks(a, t) {
  if (a) {
    if (typeof a == "string") return Mn(a, t);
    var e = {}.toString.call(a).slice(8, -1);
    return e === "Object" && a.constructor && (e = a.constructor.name), e === "Map" || e === "Set" ? Array.from(a) : e === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e) ? Mn(a, t) : void 0;
  }
}
const oi = Object.entries, zn = Object.setPrototypeOf, Ts = Object.isFrozen, ws = Object.getPrototypeOf, ys = Object.getOwnPropertyDescriptor;
let G = Object.freeze, K = Object.seal, Ae = Object.create, ai = typeof Reflect < "u" && Reflect, Gt = ai.apply, Wt = ai.construct;
G || (G = function(t) {
  return t;
});
K || (K = function(t) {
  return t;
});
Gt || (Gt = function(t, e) {
  for (var n = arguments.length, i = new Array(n > 2 ? n - 2 : 0), s = 2; s < n; s++)
    i[s - 2] = arguments[s];
  return t.apply(e, i);
});
Wt || (Wt = function(t) {
  for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), i = 1; i < e; i++)
    n[i - 1] = arguments[i];
  return new t(...n);
});
const we = C(Array.prototype.forEach), Es = C(Array.prototype.lastIndexOf), $n = C(Array.prototype.pop), ye = C(Array.prototype.push), _s = C(Array.prototype.splice), B = Array.isArray, Ue = C(String.prototype.toLowerCase), $t = C(String.prototype.toString), Pn = C(String.prototype.match), Ee = C(String.prototype.replace), Fn = C(String.prototype.indexOf), As = C(String.prototype.trim), Ss = C(Number.prototype.toString), Rs = C(Boolean.prototype.toString), Un = typeof BigInt > "u" ? null : C(BigInt.prototype.toString), Hn = typeof Symbol > "u" ? null : C(Symbol.prototype.toString), R = C(Object.prototype.hasOwnProperty), Pe = C(Object.prototype.toString), F = C(RegExp.prototype.test), pt = Is(TypeError);
function C(a) {
  return function(t) {
    t instanceof RegExp && (t.lastIndex = 0);
    for (var e = arguments.length, n = new Array(e > 1 ? e - 1 : 0), i = 1; i < e; i++)
      n[i - 1] = arguments[i];
    return Gt(a, t, n);
  };
}
function Is(a) {
  return function() {
    for (var t = arguments.length, e = new Array(t), n = 0; n < t; n++)
      e[n] = arguments[n];
    return Wt(a, e);
  };
}
function k(a, t) {
  let e = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : Ue;
  if (zn && zn(a, null), !B(t))
    return a;
  let n = t.length;
  for (; n--; ) {
    let i = t[n];
    if (typeof i == "string") {
      const s = e(i);
      s !== i && (Ts(t) || (t[n] = s), i = s);
    }
    a[i] = !0;
  }
  return a;
}
function Ls(a) {
  for (let t = 0; t < a.length; t++)
    R(a, t) || (a[t] = null);
  return a;
}
function j(a) {
  const t = Ae(null);
  for (const n of oi(a)) {
    var e = xs(n, 2);
    const i = e[0], s = e[1];
    R(a, i) && (B(s) ? t[i] = Ls(s) : s && typeof s == "object" && s.constructor === Object ? t[i] = j(s) : t[i] = s);
  }
  return t;
}
function vs(a) {
  switch (typeof a) {
    case "string":
      return a;
    case "number":
      return Ss(a);
    case "boolean":
      return Rs(a);
    case "bigint":
      return Un ? Un(a) : "0";
    case "symbol":
      return Hn ? Hn(a) : "Symbol()";
    case "undefined":
      return Pe(a);
    case "function":
    case "object": {
      if (a === null)
        return Pe(a);
      const t = a, e = Se(t, "toString");
      if (typeof e == "function") {
        const n = e(t);
        return typeof n == "string" ? n : Pe(n);
      }
      return Pe(a);
    }
    default:
      return Pe(a);
  }
}
function Se(a, t) {
  for (; a !== null; ) {
    const n = ys(a, t);
    if (n) {
      if (n.get)
        return C(n.get);
      if (typeof n.value == "function")
        return C(n.value);
    }
    a = ws(a);
  }
  function e() {
    return null;
  }
  return e;
}
function Cs(a) {
  try {
    return F(a, ""), !0;
  } catch {
    return !1;
  }
}
const Bn = G(["a", "abbr", "acronym", "address", "area", "article", "aside", "audio", "b", "bdi", "bdo", "big", "blink", "blockquote", "body", "br", "button", "canvas", "caption", "center", "cite", "code", "col", "colgroup", "content", "data", "datalist", "dd", "decorator", "del", "details", "dfn", "dialog", "dir", "div", "dl", "dt", "element", "em", "fieldset", "figcaption", "figure", "font", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "hr", "html", "i", "img", "input", "ins", "kbd", "label", "legend", "li", "main", "map", "mark", "marquee", "menu", "menuitem", "meter", "nav", "nobr", "ol", "optgroup", "option", "output", "p", "picture", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "search", "section", "select", "shadow", "slot", "small", "source", "spacer", "span", "strike", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "template", "textarea", "tfoot", "th", "thead", "time", "tr", "track", "tt", "u", "ul", "var", "video", "wbr"]), Pt = G(["svg", "a", "altglyph", "altglyphdef", "altglyphitem", "animatecolor", "animatemotion", "animatetransform", "circle", "clippath", "defs", "desc", "ellipse", "enterkeyhint", "exportparts", "filter", "font", "g", "glyph", "glyphref", "hkern", "image", "inputmode", "line", "lineargradient", "marker", "mask", "metadata", "mpath", "part", "path", "pattern", "polygon", "polyline", "radialgradient", "rect", "stop", "style", "switch", "symbol", "text", "textpath", "title", "tref", "tspan", "view", "vkern"]), Ft = G(["feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence"]), Os = G(["animate", "color-profile", "cursor", "discard", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignobject", "hatch", "hatchpath", "mesh", "meshgradient", "meshpatch", "meshrow", "missing-glyph", "script", "set", "solidcolor", "unknown", "use"]), Ut = G(["math", "menclose", "merror", "mfenced", "mfrac", "mglyph", "mi", "mlabeledtr", "mmultiscripts", "mn", "mo", "mover", "mpadded", "mphantom", "mroot", "mrow", "ms", "mspace", "msqrt", "mstyle", "msub", "msup", "msubsup", "mtable", "mtd", "mtext", "mtr", "munder", "munderover", "mprescripts"]), Ns = G(["maction", "maligngroup", "malignmark", "mlongdiv", "mscarries", "mscarry", "msgroup", "mstack", "msline", "msrow", "semantics", "annotation", "annotation-xml", "mprescripts", "none"]), Gn = G(["#text"]), Wn = G(["accept", "action", "align", "alt", "autocapitalize", "autocomplete", "autopictureinpicture", "autoplay", "background", "bgcolor", "border", "capture", "cellpadding", "cellspacing", "checked", "cite", "class", "clear", "color", "cols", "colspan", "controls", "controlslist", "coords", "crossorigin", "datetime", "decoding", "default", "dir", "disabled", "disablepictureinpicture", "disableremoteplayback", "download", "draggable", "enctype", "enterkeyhint", "exportparts", "face", "for", "headers", "height", "hidden", "high", "href", "hreflang", "id", "inert", "inputmode", "integrity", "ismap", "kind", "label", "lang", "list", "loading", "loop", "low", "max", "maxlength", "media", "method", "min", "minlength", "multiple", "muted", "name", "nonce", "noshade", "novalidate", "nowrap", "open", "optimum", "part", "pattern", "placeholder", "playsinline", "popover", "popovertarget", "popovertargetaction", "poster", "preload", "pubdate", "radiogroup", "readonly", "rel", "required", "rev", "reversed", "role", "rows", "rowspan", "spellcheck", "scope", "selected", "shape", "size", "sizes", "slot", "span", "srclang", "start", "src", "srcset", "step", "style", "summary", "tabindex", "title", "translate", "type", "usemap", "valign", "value", "width", "wrap", "xmlns"]), Ht = G(["accent-height", "accumulate", "additive", "alignment-baseline", "amplitude", "ascent", "attributename", "attributetype", "azimuth", "basefrequency", "baseline-shift", "begin", "bias", "by", "class", "clip", "clippathunits", "clip-path", "clip-rule", "color", "color-interpolation", "color-interpolation-filters", "color-profile", "color-rendering", "cx", "cy", "d", "dx", "dy", "diffuseconstant", "direction", "display", "divisor", "dur", "edgemode", "elevation", "end", "exponent", "fill", "fill-opacity", "fill-rule", "filter", "filterunits", "flood-color", "flood-opacity", "font-family", "font-size", "font-size-adjust", "font-stretch", "font-style", "font-variant", "font-weight", "fx", "fy", "g1", "g2", "glyph-name", "glyphref", "gradientunits", "gradienttransform", "height", "href", "id", "image-rendering", "in", "in2", "intercept", "k", "k1", "k2", "k3", "k4", "kerning", "keypoints", "keysplines", "keytimes", "lang", "lengthadjust", "letter-spacing", "kernelmatrix", "kernelunitlength", "lighting-color", "local", "marker-end", "marker-mid", "marker-start", "markerheight", "markerunits", "markerwidth", "maskcontentunits", "maskunits", "max", "mask", "mask-type", "media", "method", "mode", "min", "name", "numoctaves", "offset", "operator", "opacity", "order", "orient", "orientation", "origin", "overflow", "paint-order", "path", "pathlength", "patterncontentunits", "patterntransform", "patternunits", "points", "preservealpha", "preserveaspectratio", "primitiveunits", "r", "rx", "ry", "radius", "refx", "refy", "repeatcount", "repeatdur", "restart", "result", "rotate", "scale", "seed", "shape-rendering", "slope", "specularconstant", "specularexponent", "spreadmethod", "startoffset", "stddeviation", "stitchtiles", "stop-color", "stop-opacity", "stroke-dasharray", "stroke-dashoffset", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-opacity", "stroke", "stroke-width", "style", "surfacescale", "systemlanguage", "tabindex", "tablevalues", "targetx", "targety", "transform", "transform-origin", "text-anchor", "text-decoration", "text-rendering", "textlength", "type", "u1", "u2", "unicode", "values", "viewbox", "visibility", "version", "vert-adv-y", "vert-origin-x", "vert-origin-y", "width", "word-spacing", "wrap", "writing-mode", "xchannelselector", "ychannelselector", "x", "x1", "x2", "xmlns", "y", "y1", "y2", "z", "zoomandpan"]), jn = G(["accent", "accentunder", "align", "bevelled", "close", "columnalign", "columnlines", "columnspacing", "columnspan", "denomalign", "depth", "dir", "display", "displaystyle", "encoding", "fence", "frame", "height", "href", "id", "largeop", "length", "linethickness", "lquote", "lspace", "mathbackground", "mathcolor", "mathsize", "mathvariant", "maxsize", "minsize", "movablelimits", "notation", "numalign", "open", "rowalign", "rowlines", "rowspacing", "rowspan", "rspace", "rquote", "scriptlevel", "scriptminsize", "scriptsizemultiplier", "selection", "separator", "separators", "stretchy", "subscriptshift", "supscriptshift", "symmetric", "voffset", "width", "xmlns"]), ht = G(["xlink:href", "xml:id", "xlink:title", "xml:space", "xmlns:xlink"]), Ds = K(/{{[\w\W]*|^[\w\W]*}}/g), Ms = K(/<%[\w\W]*|^[\w\W]*%>/g), zs = K(/\${[\w\W]*/g), $s = K(/^data-[\-\w.\u00B7-\uFFFF]+$/), Ps = K(/^aria-[\-\w]+$/), qn = K(
  /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  // eslint-disable-line no-useless-escape
), Fs = K(/^(?:\w+script|data):/i), Us = K(
  /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g
  // eslint-disable-line no-control-regex
), Hs = K(/^html$/i), Bs = K(/^[a-z][.\w]*(-[.\w]+)+$/i), _e = {
  element: 1,
  text: 3,
  // Deprecated
  progressingInstruction: 7,
  comment: 8,
  document: 9
}, Gs = function() {
  return typeof window > "u" ? null : window;
}, Ws = function(t, e) {
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
}, Zn = function() {
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
function li() {
  let a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : Gs();
  const t = (g) => li(g);
  if (t.version = "3.4.3", t.removed = [], !a || !a.document || a.document.nodeType !== _e.document || !a.Element)
    return t.isSupported = !1, t;
  let e = a.document;
  const n = e, i = n.currentScript, s = a.DocumentFragment, o = a.HTMLTemplateElement, l = a.Node, c = a.Element, h = a.NodeFilter, p = a.NamedNodeMap, d = p === void 0 ? a.NamedNodeMap || a.MozNamedAttrMap : p, b = a.HTMLFormElement, S = a.DOMParser, y = a.trustedTypes, N = c.prototype, Y = Se(N, "cloneNode"), Ce = Se(N, "remove"), Je = Se(N, "nextSibling"), et = Se(N, "childNodes"), ue = Se(N, "parentNode");
  if (typeof o == "function") {
    const g = e.createElement("template");
    g.content && g.content.ownerDocument && (e = g.content.ownerDocument);
  }
  let $, re = "";
  const te = e, Tt = te.implementation, xi = te.createNodeIterator, ki = te.createDocumentFragment, Ti = te.getElementsByTagName, wi = n.importNode;
  let H = Zn();
  t.isSupported = typeof oi == "function" && typeof ue == "function" && Tt && Tt.createHTMLDocument !== void 0;
  const tt = Ds, nt = Ms, it = zs, yi = $s, Ei = Ps, _i = Fs, rn = Us, Ai = Bs;
  let on = qn, D = null;
  const an = k({}, [...Bn, ...Pt, ...Ft, ...Ut, ...Gn]);
  let P = null;
  const ln = k({}, [...Wn, ...Ht, ...jn, ...ht]);
  let I = Object.seal(Ae(null, {
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
  })), Oe = null, st = null;
  const le = Object.seal(Ae(null, {
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
  let cn = !0, wt = !0, un = !1, pn = !0, pe = !1, Ne = !0, he = !1, yt = !1, Et = !1, be = !1, rt = !1, ot = !1, hn = !0, fn = !1;
  const dn = "user-content-";
  let _t = !0, De = !1, xe = {}, ne = null;
  const At = k({}, ["annotation-xml", "audio", "colgroup", "desc", "foreignobject", "head", "iframe", "math", "mi", "mn", "mo", "ms", "mtext", "noembed", "noframes", "noscript", "plaintext", "script", "style", "svg", "template", "thead", "title", "video", "xmp"]);
  let mn = null;
  const gn = k({}, ["audio", "video", "img", "source", "image", "track"]);
  let St = null;
  const bn = k({}, ["alt", "class", "for", "id", "label", "name", "pattern", "placeholder", "role", "summary", "title", "value", "style", "xmlns"]), at = "http://www.w3.org/1998/Math/MathML", lt = "http://www.w3.org/2000/svg", ie = "http://www.w3.org/1999/xhtml";
  let ke = ie, Rt = !1, It = null;
  const Si = k({}, [at, lt, ie], $t);
  let Lt = k({}, ["mi", "mo", "mn", "ms", "mtext"]), vt = k({}, ["annotation-xml"]);
  const Ri = k({}, ["title", "style", "font", "a", "script"]);
  let Me = null;
  const Ii = ["application/xhtml+xml", "text/html"], Li = "text/html";
  let O = null, Te = null;
  const vi = e.createElement("form"), xn = function(r) {
    return r instanceof RegExp || r instanceof Function;
  }, Ct = function() {
    let r = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (Te && Te === r)
      return;
    (!r || typeof r != "object") && (r = {}), r = j(r), Me = // eslint-disable-next-line unicorn/prefer-includes
    Ii.indexOf(r.PARSER_MEDIA_TYPE) === -1 ? Li : r.PARSER_MEDIA_TYPE, O = Me === "application/xhtml+xml" ? $t : Ue, D = R(r, "ALLOWED_TAGS") && B(r.ALLOWED_TAGS) ? k({}, r.ALLOWED_TAGS, O) : an, P = R(r, "ALLOWED_ATTR") && B(r.ALLOWED_ATTR) ? k({}, r.ALLOWED_ATTR, O) : ln, It = R(r, "ALLOWED_NAMESPACES") && B(r.ALLOWED_NAMESPACES) ? k({}, r.ALLOWED_NAMESPACES, $t) : Si, St = R(r, "ADD_URI_SAFE_ATTR") && B(r.ADD_URI_SAFE_ATTR) ? k(j(bn), r.ADD_URI_SAFE_ATTR, O) : bn, mn = R(r, "ADD_DATA_URI_TAGS") && B(r.ADD_DATA_URI_TAGS) ? k(j(gn), r.ADD_DATA_URI_TAGS, O) : gn, ne = R(r, "FORBID_CONTENTS") && B(r.FORBID_CONTENTS) ? k({}, r.FORBID_CONTENTS, O) : At, Oe = R(r, "FORBID_TAGS") && B(r.FORBID_TAGS) ? k({}, r.FORBID_TAGS, O) : j({}), st = R(r, "FORBID_ATTR") && B(r.FORBID_ATTR) ? k({}, r.FORBID_ATTR, O) : j({}), xe = R(r, "USE_PROFILES") ? r.USE_PROFILES && typeof r.USE_PROFILES == "object" ? j(r.USE_PROFILES) : r.USE_PROFILES : !1, cn = r.ALLOW_ARIA_ATTR !== !1, wt = r.ALLOW_DATA_ATTR !== !1, un = r.ALLOW_UNKNOWN_PROTOCOLS || !1, pn = r.ALLOW_SELF_CLOSE_IN_ATTR !== !1, pe = r.SAFE_FOR_TEMPLATES || !1, Ne = r.SAFE_FOR_XML !== !1, he = r.WHOLE_DOCUMENT || !1, be = r.RETURN_DOM || !1, rt = r.RETURN_DOM_FRAGMENT || !1, ot = r.RETURN_TRUSTED_TYPE || !1, Et = r.FORCE_BODY || !1, hn = r.SANITIZE_DOM !== !1, fn = r.SANITIZE_NAMED_PROPS || !1, _t = r.KEEP_CONTENT !== !1, De = r.IN_PLACE || !1, on = Cs(r.ALLOWED_URI_REGEXP) ? r.ALLOWED_URI_REGEXP : qn, ke = typeof r.NAMESPACE == "string" ? r.NAMESPACE : ie, Lt = R(r, "MATHML_TEXT_INTEGRATION_POINTS") && r.MATHML_TEXT_INTEGRATION_POINTS && typeof r.MATHML_TEXT_INTEGRATION_POINTS == "object" ? j(r.MATHML_TEXT_INTEGRATION_POINTS) : k({}, ["mi", "mo", "mn", "ms", "mtext"]), vt = R(r, "HTML_INTEGRATION_POINTS") && r.HTML_INTEGRATION_POINTS && typeof r.HTML_INTEGRATION_POINTS == "object" ? j(r.HTML_INTEGRATION_POINTS) : k({}, ["annotation-xml"]);
    const u = R(r, "CUSTOM_ELEMENT_HANDLING") && r.CUSTOM_ELEMENT_HANDLING && typeof r.CUSTOM_ELEMENT_HANDLING == "object" ? j(r.CUSTOM_ELEMENT_HANDLING) : Ae(null);
    if (I = Ae(null), R(u, "tagNameCheck") && xn(u.tagNameCheck) && (I.tagNameCheck = u.tagNameCheck), R(u, "attributeNameCheck") && xn(u.attributeNameCheck) && (I.attributeNameCheck = u.attributeNameCheck), R(u, "allowCustomizedBuiltInElements") && typeof u.allowCustomizedBuiltInElements == "boolean" && (I.allowCustomizedBuiltInElements = u.allowCustomizedBuiltInElements), pe && (wt = !1), rt && (be = !0), xe && (D = k({}, Gn), P = Ae(null), xe.html === !0 && (k(D, Bn), k(P, Wn)), xe.svg === !0 && (k(D, Pt), k(P, Ht), k(P, ht)), xe.svgFilters === !0 && (k(D, Ft), k(P, Ht), k(P, ht)), xe.mathMl === !0 && (k(D, Ut), k(P, jn), k(P, ht))), le.tagCheck = null, le.attributeCheck = null, R(r, "ADD_TAGS") && (typeof r.ADD_TAGS == "function" ? le.tagCheck = r.ADD_TAGS : B(r.ADD_TAGS) && (D === an && (D = j(D)), k(D, r.ADD_TAGS, O))), R(r, "ADD_ATTR") && (typeof r.ADD_ATTR == "function" ? le.attributeCheck = r.ADD_ATTR : B(r.ADD_ATTR) && (P === ln && (P = j(P)), k(P, r.ADD_ATTR, O))), R(r, "ADD_URI_SAFE_ATTR") && B(r.ADD_URI_SAFE_ATTR) && k(St, r.ADD_URI_SAFE_ATTR, O), R(r, "FORBID_CONTENTS") && B(r.FORBID_CONTENTS) && (ne === At && (ne = j(ne)), k(ne, r.FORBID_CONTENTS, O)), R(r, "ADD_FORBID_CONTENTS") && B(r.ADD_FORBID_CONTENTS) && (ne === At && (ne = j(ne)), k(ne, r.ADD_FORBID_CONTENTS, O)), _t && (D["#text"] = !0), he && k(D, ["html", "head", "body"]), D.table && (k(D, ["tbody"]), delete Oe.tbody), r.TRUSTED_TYPES_POLICY) {
      if (typeof r.TRUSTED_TYPES_POLICY.createHTML != "function")
        throw pt('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');
      if (typeof r.TRUSTED_TYPES_POLICY.createScriptURL != "function")
        throw pt('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');
      $ = r.TRUSTED_TYPES_POLICY, re = $.createHTML("");
    } else
      $ === void 0 && ($ = Ws(y, i)), $ !== null && typeof re == "string" && (re = $.createHTML(""));
    G && G(r), Te = r;
  }, kn = k({}, [...Pt, ...Ft, ...Os]), Tn = k({}, [...Ut, ...Ns]), Ci = function(r) {
    let u = ue(r);
    (!u || !u.tagName) && (u = {
      namespaceURI: ke,
      tagName: "template"
    });
    const f = Ue(r.tagName), T = Ue(u.tagName);
    return It[r.namespaceURI] ? r.namespaceURI === lt ? u.namespaceURI === ie ? f === "svg" : u.namespaceURI === at ? f === "svg" && (T === "annotation-xml" || Lt[T]) : !!kn[f] : r.namespaceURI === at ? u.namespaceURI === ie ? f === "math" : u.namespaceURI === lt ? f === "math" && vt[T] : !!Tn[f] : r.namespaceURI === ie ? u.namespaceURI === lt && !vt[T] || u.namespaceURI === at && !Lt[T] ? !1 : !Tn[f] && (Ri[f] || !kn[f]) : !!(Me === "application/xhtml+xml" && It[r.namespaceURI]) : !1;
  }, J = function(r) {
    ye(t.removed, {
      element: r
    });
    try {
      ue(r).removeChild(r);
    } catch {
      Ce(r);
    }
  }, fe = function(r, u) {
    try {
      ye(t.removed, {
        attribute: u.getAttributeNode(r),
        from: u
      });
    } catch {
      ye(t.removed, {
        attribute: null,
        from: u
      });
    }
    if (u.removeAttribute(r), r === "is")
      if (be || rt)
        try {
          J(u);
        } catch {
        }
      else
        try {
          u.setAttribute(r, "");
        } catch {
        }
  }, wn = function(r) {
    let u = null, f = null;
    if (Et)
      r = "<remove></remove>" + r;
    else {
      const v = Pn(r, /^[\r\n\t ]+/);
      f = v && v[0];
    }
    Me === "application/xhtml+xml" && ke === ie && (r = '<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>' + r + "</body></html>");
    const T = $ ? $.createHTML(r) : r;
    if (ke === ie)
      try {
        u = new S().parseFromString(T, Me);
      } catch {
      }
    if (!u || !u.documentElement) {
      u = Tt.createDocument(ke, "template", null);
      try {
        u.documentElement.innerHTML = Rt ? re : T;
      } catch {
      }
    }
    const M = u.body || u.documentElement;
    return r && f && M.insertBefore(e.createTextNode(f), M.childNodes[0] || null), ke === ie ? Ti.call(u, he ? "html" : "body")[0] : he ? u.documentElement : M;
  }, yn = function(r) {
    return xi.call(
      r.ownerDocument || r,
      r,
      // eslint-disable-next-line no-bitwise
      h.SHOW_ELEMENT | h.SHOW_COMMENT | h.SHOW_TEXT | h.SHOW_PROCESSING_INSTRUCTION | h.SHOW_CDATA_SECTION,
      null
    );
  }, Ot = function(r) {
    return r instanceof b && (typeof r.nodeName != "string" || typeof r.textContent != "string" || typeof r.removeChild != "function" || !(r.attributes instanceof d) || typeof r.removeAttribute != "function" || typeof r.setAttribute != "function" || typeof r.namespaceURI != "string" || typeof r.insertBefore != "function" || typeof r.hasChildNodes != "function");
  }, Nt = function(r) {
    return typeof l == "function" && r instanceof l;
  };
  function oe(g, r, u) {
    we(g, (f) => {
      f.call(t, r, u, Te);
    });
  }
  const En = function(r) {
    let u = null;
    if (oe(H.beforeSanitizeElements, r, null), Ot(r))
      return J(r), !0;
    const f = O(r.nodeName);
    if (oe(H.uponSanitizeElement, r, {
      tagName: f,
      allowedTags: D
    }), Ne && r.hasChildNodes() && !Nt(r.firstElementChild) && F(/<[/\w!]/g, r.innerHTML) && F(/<[/\w!]/g, r.textContent) || Ne && r.namespaceURI === ie && f === "style" && Nt(r.firstElementChild) || r.nodeType === _e.progressingInstruction || Ne && r.nodeType === _e.comment && F(/<[/\w]/g, r.data))
      return J(r), !0;
    if (Oe[f] || !(le.tagCheck instanceof Function && le.tagCheck(f)) && !D[f]) {
      if (!Oe[f] && An(f) && (I.tagNameCheck instanceof RegExp && F(I.tagNameCheck, f) || I.tagNameCheck instanceof Function && I.tagNameCheck(f)))
        return !1;
      if (_t && !ne[f]) {
        const T = ue(r) || r.parentNode, M = et(r) || r.childNodes;
        if (M && T) {
          const v = M.length;
          for (let W = v - 1; W >= 0; --W) {
            const X = Y(M[W], !0);
            T.insertBefore(X, Je(r));
          }
        }
      }
      return J(r), !0;
    }
    return r instanceof c && !Ci(r) || (f === "noscript" || f === "noembed" || f === "noframes") && F(/<\/no(script|embed|frames)/i, r.innerHTML) ? (J(r), !0) : (pe && r.nodeType === _e.text && (u = r.textContent, we([tt, nt, it], (T) => {
      u = Ee(u, T, " ");
    }), r.textContent !== u && (ye(t.removed, {
      element: r.cloneNode()
    }), r.textContent = u)), oe(H.afterSanitizeElements, r, null), !1);
  }, _n = function(r, u, f) {
    if (st[u] || hn && (u === "id" || u === "name") && (f in e || f in vi))
      return !1;
    const T = P[u] || le.attributeCheck instanceof Function && le.attributeCheck(u, r);
    if (!(wt && !st[u] && F(yi, u))) {
      if (!(cn && F(Ei, u))) {
        if (!T || st[u]) {
          if (
            // First condition does a very basic check if a) it's basically a valid custom element tagname AND
            // b) if the tagName passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            // and c) if the attribute name passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.attributeNameCheck
            !(An(r) && (I.tagNameCheck instanceof RegExp && F(I.tagNameCheck, r) || I.tagNameCheck instanceof Function && I.tagNameCheck(r)) && (I.attributeNameCheck instanceof RegExp && F(I.attributeNameCheck, u) || I.attributeNameCheck instanceof Function && I.attributeNameCheck(u, r)) || // Alternative, second condition checks if it's an `is`-attribute, AND
            // the value passes whatever the user has configured for CUSTOM_ELEMENT_HANDLING.tagNameCheck
            u === "is" && I.allowCustomizedBuiltInElements && (I.tagNameCheck instanceof RegExp && F(I.tagNameCheck, f) || I.tagNameCheck instanceof Function && I.tagNameCheck(f)))
          ) return !1;
        } else if (!St[u]) {
          if (!F(on, Ee(f, rn, ""))) {
            if (!((u === "src" || u === "xlink:href" || u === "href") && r !== "script" && Fn(f, "data:") === 0 && mn[r])) {
              if (!(un && !F(_i, Ee(f, rn, "")))) {
                if (f)
                  return !1;
              }
            }
          }
        }
      }
    }
    return !0;
  }, Oi = k({}, ["annotation-xml", "color-profile", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "missing-glyph"]), An = function(r) {
    return !Oi[Ue(r)] && F(Ai, r);
  }, Sn = function(r) {
    oe(H.beforeSanitizeAttributes, r, null);
    const u = r.attributes;
    if (!u || Ot(r))
      return;
    const f = {
      attrName: "",
      attrValue: "",
      keepAttr: !0,
      allowedAttributes: P,
      forceKeepAttr: void 0
    };
    let T = u.length;
    for (; T--; ) {
      const M = u[T], v = M.name, W = M.namespaceURI, X = M.value, ee = O(v), Mt = X;
      let z = v === "value" ? Mt : As(Mt);
      if (f.attrName = ee, f.attrValue = z, f.keepAttr = !0, f.forceKeepAttr = void 0, oe(H.uponSanitizeAttribute, r, f), z = f.attrValue, fn && (ee === "id" || ee === "name") && Fn(z, dn) !== 0 && (fe(v, r), z = dn + z), Ne && F(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i, z)) {
        fe(v, r);
        continue;
      }
      if (ee === "attributename" && Pn(z, "href")) {
        fe(v, r);
        continue;
      }
      if (f.forceKeepAttr)
        continue;
      if (!f.keepAttr) {
        fe(v, r);
        continue;
      }
      if (!pn && F(/\/>/i, z)) {
        fe(v, r);
        continue;
      }
      pe && we([tt, nt, it], (In) => {
        z = Ee(z, In, " ");
      });
      const Rn = O(r.nodeName);
      if (!_n(Rn, ee, z)) {
        fe(v, r);
        continue;
      }
      if ($ && typeof y == "object" && typeof y.getAttributeType == "function" && !W)
        switch (y.getAttributeType(Rn, ee)) {
          case "TrustedHTML": {
            z = $.createHTML(z);
            break;
          }
          case "TrustedScriptURL": {
            z = $.createScriptURL(z);
            break;
          }
        }
      if (z !== Mt)
        try {
          W ? r.setAttributeNS(W, v, z) : r.setAttribute(v, z), Ot(r) ? J(r) : $n(t.removed);
        } catch {
          fe(v, r);
        }
    }
    oe(H.afterSanitizeAttributes, r, null);
  }, Dt = function(r) {
    let u = null;
    const f = yn(r);
    for (oe(H.beforeSanitizeShadowDOM, r, null); u = f.nextNode(); )
      oe(H.uponSanitizeShadowNode, u, null), En(u), Sn(u), u.content instanceof s && Dt(u.content);
    oe(H.afterSanitizeShadowDOM, r, null);
  }, ct = function(r) {
    if (r.nodeType === _e.element && r.shadowRoot instanceof s) {
      const T = r.shadowRoot;
      ct(T), Dt(T);
    }
    const u = r.childNodes;
    if (!u)
      return;
    const f = [];
    we(u, (T) => {
      ye(f, T);
    });
    for (const T of f)
      ct(T);
  };
  return t.sanitize = function(g) {
    let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, u = null, f = null, T = null, M = null;
    if (Rt = !g, Rt && (g = "<!-->"), typeof g != "string" && !Nt(g) && (g = vs(g), typeof g != "string"))
      throw pt("dirty is not a string, aborting");
    if (!t.isSupported)
      return g;
    if (yt || Ct(r), t.removed = [], typeof g == "string" && (De = !1), De) {
      const X = g.nodeName;
      if (typeof X == "string") {
        const ee = O(X);
        if (!D[ee] || Oe[ee])
          throw pt("root node is forbidden and cannot be sanitized in-place");
      }
      ct(g);
    } else if (g instanceof l)
      u = wn("<!---->"), f = u.ownerDocument.importNode(g, !0), f.nodeType === _e.element && f.nodeName === "BODY" || f.nodeName === "HTML" ? u = f : u.appendChild(f), ct(f);
    else {
      if (!be && !pe && !he && // eslint-disable-next-line unicorn/prefer-includes
      g.indexOf("<") === -1)
        return $ && ot ? $.createHTML(g) : g;
      if (u = wn(g), !u)
        return be ? null : ot ? re : "";
    }
    u && Et && J(u.firstChild);
    const v = yn(De ? g : u);
    for (; T = v.nextNode(); )
      En(T), Sn(T), T.content instanceof s && Dt(T.content);
    if (De)
      return g;
    if (be) {
      if (pe) {
        u.normalize();
        let X = u.innerHTML;
        we([tt, nt, it], (ee) => {
          X = Ee(X, ee, " ");
        }), u.innerHTML = X;
      }
      if (rt)
        for (M = ki.call(u.ownerDocument); u.firstChild; )
          M.appendChild(u.firstChild);
      else
        M = u;
      return (P.shadowroot || P.shadowrootmode) && (M = wi.call(n, M, !0)), M;
    }
    let W = he ? u.outerHTML : u.innerHTML;
    return he && D["!doctype"] && u.ownerDocument && u.ownerDocument.doctype && u.ownerDocument.doctype.name && F(Hs, u.ownerDocument.doctype.name) && (W = "<!DOCTYPE " + u.ownerDocument.doctype.name + `>
` + W), pe && we([tt, nt, it], (X) => {
      W = Ee(W, X, " ");
    }), $ && ot ? $.createHTML(W) : W;
  }, t.setConfig = function() {
    let g = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    Ct(g), yt = !0;
  }, t.clearConfig = function() {
    Te = null, yt = !1;
  }, t.isValidAttribute = function(g, r, u) {
    Te || Ct({});
    const f = O(g), T = O(r);
    return _n(f, T, u);
  }, t.addHook = function(g, r) {
    typeof r == "function" && ye(H[g], r);
  }, t.removeHook = function(g, r) {
    if (r !== void 0) {
      const u = Es(H[g], r);
      return u === -1 ? void 0 : _s(H[g], u, 1)[0];
    }
    return $n(H[g]);
  }, t.removeHooks = function(g) {
    H[g] = [];
  }, t.removeAllHooks = function() {
    H = Zn();
  }, t;
}
var js = li(), Ie;
class qs {
  constructor() {
    U(this, Ie);
    L(this, Ie, js), w(this, Ie).addHook("afterSanitizeAttributes", (t) => {
      t.tagName === "A" && (t.setAttribute("rel", "noopener noreferrer"), t.setAttribute("target", "_blank"));
    });
  }
  render(t) {
    const e = E.parse(t, { async: !1 });
    return w(this, Ie).sanitize(e, {
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
Ie = new WeakMap();
const Yn = (a) => `chatbot_open_${a}`, Fe = (a) => `chatbot_conversation_${a}`, Zs = `
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
var q, Xe, se, Le, ve, Ve, ce, ae, m, jt, qt, He, Be, Zt, ui, pi, Ge, hi, fi, We, Yt, ft, di, mi, Xt, Vt, gi, bi, dt;
class ci extends HTMLElement {
  constructor() {
    super();
    U(this, m);
    U(this, q);
    U(this, Xe, new qs());
    U(this, se, !1);
    U(this, Le, !1);
    U(this, ve, null);
    U(this, Ve, null);
    U(this, ce, null);
    U(this, ae, null);
    L(this, q, this.attachShadow({ mode: "open" }));
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
    x(this, m, jt).call(this), x(this, m, pi).call(this), x(this, m, hi).call(this), this.addEventListener("tool_started", (e) => x(this, m, gi).call(this, e.detail.name));
  }
  attributeChangedCallback() {
    w(this, q).innerHTML && x(this, m, jt).call(this);
  }
}
q = new WeakMap(), Xe = new WeakMap(), se = new WeakMap(), Le = new WeakMap(), ve = new WeakMap(), Ve = new WeakMap(), ce = new WeakMap(), ae = new WeakMap(), m = new WeakSet(), jt = function() {
  const e = document.createElement("style");
  e.textContent = Zs;
  const n = this.position === "inline";
  if (w(this, q).innerHTML = "", w(this, q).appendChild(e), !n) {
    const b = document.createElement("button");
    b.className = `launcher ${this.position}`, b.part = "launcher", b.innerHTML = "💬", b.setAttribute("aria-label", "Open chat"), b.addEventListener("click", () => x(this, m, ui).call(this)), w(this, q).appendChild(b);
  }
  const i = document.createElement("div");
  i.className = `panel ${n ? "inline" : this.position}`, i.part = "panel", !n && !w(this, se) && (i.hidden = !0);
  const s = document.createElement("div");
  s.className = "header", s.part = "header", s.innerHTML = `<span>${this.title}</span>`;
  const o = document.createElement("button");
  o.className = "new-chat", o.textContent = "New chat", o.addEventListener("click", () => x(this, m, fi).call(this)), s.appendChild(o), i.appendChild(s);
  const l = document.createElement("div");
  l.className = "messages", l.part = "messages", i.appendChild(l);
  const c = document.createElement("div");
  c.className = "tool-status", c.setAttribute("part", "tool-status"), c.hidden = !0, i.appendChild(c), L(this, ae, c);
  const h = document.createElement("div");
  h.className = "input-row";
  const p = document.createElement("textarea");
  p.className = "input", p.part = "input", p.placeholder = "Ask a question…", p.rows = 1, p.addEventListener("keydown", (b) => {
    b.key === "Enter" && !b.shiftKey && (b.preventDefault(), x(this, m, We).call(this));
  }), h.appendChild(p);
  const d = document.createElement("button");
  d.className = "send-button", d.part = "send-button", d.textContent = "Send", d.addEventListener("click", () => x(this, m, We).call(this)), h.appendChild(d), i.appendChild(h), w(this, q).appendChild(i);
}, qt = function() {
  return w(this, q).querySelector(".panel");
}, He = function() {
  return w(this, q).querySelector(".messages");
}, Be = function() {
  return w(this, q).querySelector(".input");
}, Zt = function() {
  return w(this, q).querySelector(".send-button");
}, ui = function() {
  var n;
  L(this, se, !w(this, se));
  const e = x(this, m, qt).call(this);
  e && (e.hidden = !w(this, se)), localStorage.setItem(Yn(this.channel), w(this, se) ? "1" : "0"), w(this, se) && ((n = x(this, m, Be).call(this)) == null || n.focus());
}, pi = function() {
  if (localStorage.getItem(Yn(this.channel)) === "1") {
    L(this, se, !0);
    const n = x(this, m, qt).call(this);
    n && (n.hidden = !1);
  }
}, Ge = function() {
  const e = this.getAttribute("signed-context");
  if (e)
    try {
      const n = JSON.parse(atob(e.split(".")[1] ?? ""));
      n.greeting && x(this, m, ft).call(this, n.greeting);
    } catch {
    }
}, hi = async function() {
  const e = localStorage.getItem(Fe(this.channel));
  if (!e) {
    x(this, m, Ge).call(this);
    return;
  }
  try {
    const n = await fetch(`/chatbot/conversations/${e}/messages`);
    if (!n.ok) {
      localStorage.removeItem(Fe(this.channel)), x(this, m, Ge).call(this);
      return;
    }
    const { messages: i } = await n.json();
    for (const s of i)
      s.role === "user" ? x(this, m, Yt).call(this, s.content) : s.role === "assistant" && x(this, m, ft).call(this, s.content);
  } catch {
    x(this, m, Ge).call(this);
  }
}, fi = function() {
  localStorage.removeItem(Fe(this.channel));
  const e = x(this, m, He).call(this);
  e && (e.innerHTML = ""), L(this, ve, null), L(this, Ve, null), L(this, ce, null), x(this, m, Ge).call(this);
}, We = async function() {
  var p;
  if (w(this, Le)) return;
  const e = x(this, m, Be).call(this), n = e == null ? void 0 : e.value.trim();
  if (!n) return;
  e.value = "", x(this, m, Yt).call(this, n);
  const i = this.getAttribute("signed-context"), s = localStorage.getItem(Fe(this.channel));
  L(this, Le, !0);
  const o = x(this, m, Zt).call(this);
  o && (o.disabled = !0);
  const l = x(this, m, ft).call(this, "");
  L(this, Ve, l), L(this, ce, null);
  const c = new Mi();
  c.addEventListener("chunk", (d) => {
    l.dataset.raw = (l.dataset.raw ?? "") + d.detail.text, l.innerHTML = w(this, Xe).render(l.dataset.raw);
  }), c.addEventListener("context_summary", (d) => {
    const b = x(this, m, di).call(this, l);
    b.textContent = d.detail.text;
  }), c.addEventListener("done", (d) => {
    var b;
    (b = d.detail) != null && b.conversationId && localStorage.setItem(Fe(this.channel), d.detail.conversationId), x(this, m, mi).call(this, l), x(this, m, dt).call(this);
  }), c.addEventListener("tool_started", (d) => this.dispatchEvent(new CustomEvent("tool_started", { detail: d.detail }))), c.addEventListener("tool_finished", (d) => this.dispatchEvent(new CustomEvent("tool_finished", { detail: d.detail }))), c.addEventListener("tool_failed", (d) => this.dispatchEvent(new CustomEvent("tool_failed", { detail: d.detail }))), c.addEventListener("error", (d) => {
    x(this, m, Vt).call(this, d.detail, l, n, i, s), x(this, m, dt).call(this);
  });
  const h = (p = document.querySelector('meta[name="csrf-token"]')) == null ? void 0 : p.content;
  try {
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
  } catch {
    x(this, m, Vt).call(this, { code: "network_error", message: "Connection failed.", retryable: !0 }, l, n, i, s), x(this, m, dt).call(this);
  }
}, Yt = function(e) {
  const n = x(this, m, He).call(this), i = document.createElement("div");
  return i.className = "message message-user", i.part = "message-user", i.textContent = e, n == null || n.appendChild(i), i.scrollIntoView({ behavior: "smooth" }), L(this, ve, e), i;
}, ft = function(e) {
  const n = x(this, m, He).call(this), i = document.createElement("div");
  return i.className = "message message-assistant", i.part = "message-assistant", i.dataset.raw = e, e && (i.innerHTML = w(this, Xe).render(e)), n == null || n.appendChild(i), i.scrollIntoView({ behavior: "smooth" }), i;
}, di = function(e) {
  var i;
  if (w(this, ce)) return w(this, ce);
  const n = document.createElement("div");
  return n.className = "context-summary", (i = e.parentElement) == null || i.insertBefore(n, e), L(this, ce, n), n;
}, mi = function(e) {
  var c;
  const n = document.createElement("div");
  n.className = "message-actions";
  const i = document.createElement("button");
  i.className = "action-btn", i.textContent = "📋 Copy", i.addEventListener("click", () => navigator.clipboard.writeText(e.dataset.raw ?? ""));
  const s = document.createElement("button");
  s.className = "action-btn", s.textContent = "🔄 Regenerate", s.addEventListener("click", () => {
    e.dataset.raw = "", e.innerHTML = "", n.remove(), w(this, ve) && x(this, m, We).call(this);
  });
  const o = document.createElement("button");
  o.className = "action-btn", o.textContent = "👍", o.addEventListener("click", () => x(this, m, Xt).call(this, e, 1, o, l));
  const l = document.createElement("button");
  l.className = "action-btn", l.textContent = "👎", l.addEventListener("click", () => x(this, m, Xt).call(this, e, -1, o, l)), n.append(i, s, o, l), (c = e.parentElement) == null || c.insertBefore(n, e.nextSibling);
}, Xt = async function(e, n, i, s) {
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
}, Vt = function(e, n, i, s, o) {
  const l = x(this, m, He).call(this);
  n.remove();
  const c = document.createElement("div");
  if (c.className = "message error-msg", e.code === "quota_exceeded" || e.code === "token_cap_exceeded")
    c.className = "message quota-msg", c.textContent = e.message || "Daily limit reached. Try again later.";
  else if (e.code === "content_blocked")
    c.textContent = e.message || "This message was blocked by content policy.";
  else if (c.textContent = e.message || "Something went wrong.", e.retryable) {
    const h = document.createElement("button");
    h.className = "retry-btn", h.textContent = "Retry", h.addEventListener("click", () => {
      c.remove(), x(this, m, Be).call(this) && (x(this, m, Be).call(this).value = i), x(this, m, We).call(this);
    }), c.appendChild(h);
  }
  l == null || l.appendChild(c), c.scrollIntoView({ behavior: "smooth" });
}, gi = function(e) {
  w(this, ae) && (w(this, ae).textContent = `Working: ${e}…`, w(this, ae).removeAttribute("hidden"));
}, bi = function() {
  w(this, ae) && w(this, ae).setAttribute("hidden", "");
}, dt = function() {
  L(this, Le, !1), setTimeout(() => x(this, m, bi).call(this), 500);
  const e = x(this, m, Zt).call(this);
  e && (e.disabled = !1);
}, _(ci, "observedAttributes", ["channel", "position", "title"]);
customElements.define("chatbot-widget", ci);
export {
  ci as ChatbotWidget
};
