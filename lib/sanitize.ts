import sanitizeHtml from "sanitize-html";

const TEXT_ALIGN = [/^(left|right|center|justify)$/];
const CSS_COLOR = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i];
const CSS_PIXELS = [/^\d+(\.\d+)?px$/];

const SAFE_IMAGE_SRC = /^(https?:\/\/|\/(?!\/))[^\s]+$/i;

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "h2",
    "h3",
    "h4",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "ul",
    "ol",
    "li",
    "blockquote",
    "a",
    "hr",
    "pre",
    "code",
    "mark",
    "span",
    "img",
    "table",
    "colgroup",
    "col",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    code: ["class"],
    img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
    mark: ["style", "data-color"],
    span: ["style"],
    p: ["style"],
    h2: ["style"],
    h3: ["style"],
    h4: ["style"],
    th: ["colspan", "rowspan", "style"],
    td: ["colspan", "rowspan", "style"],
    table: ["style"],
    col: ["style"],
  },
  allowedStyles: {
    p: { "text-align": TEXT_ALIGN },
    h2: { "text-align": TEXT_ALIGN },
    h3: { "text-align": TEXT_ALIGN },
    h4: { "text-align": TEXT_ALIGN },
    th: { "text-align": TEXT_ALIGN },
    td: { "text-align": TEXT_ALIGN },
    span: { color: CSS_COLOR },
    mark: { color: CSS_COLOR, "background-color": CSS_COLOR },
    table: { width: CSS_PIXELS, "min-width": CSS_PIXELS },
    col: { width: CSS_PIXELS, "min-width": CSS_PIXELS },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const isExternal = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: {
          ...attribs,
          ...(isExternal
            ? { rel: "noopener noreferrer", target: "_blank" }
            : {}),
        },
      };
    },
    img: (tagName, attribs) => {
      const src = attribs.src ?? "";
      if (!SAFE_IMAGE_SRC.test(src)) {
        return { tagName, attribs: {} };
      }
      return {
        tagName,
        attribs: {
          ...attribs,
          loading: "lazy",
          decoding: "async",
        },
      };
    },
  },
  exclusiveFilter: (frame) => frame.tag === "img" && !frame.attribs.src,
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
