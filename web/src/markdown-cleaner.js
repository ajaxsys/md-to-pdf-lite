/**
 * Markdown CJK Emphasis & Typography Normalizer
 *
 * Automatically normalizes whitespace around bold (**...**) and bold-italic (***...***) syntax
 * to overcome CommonMark punctuation-flanking delimiter limitations in CJK (e.g. 直前に**「重要」**).
 * Preserves code blocks, inline code, math expressions, and markdown links/images.
 */

export function normalizeBoldSpacing(markdown) {
  if (!markdown || typeof markdown !== 'string') return markdown;

  // 1. Mask code blocks, inline code, display math, inline math, HTML tags, and link destinations
  const tokens = [];
  const maskRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`+[^`\n]+`+|\$\$[\s\S]*?\$\$|\$[^\$\n]+\$|<[^>]+>|!?\[[^\]]*\]\([^)]+\))/g;

  const masked = markdown.replace(maskRegex, (match) => {
    const placeholder = `__MD2PDF_MASK_TOKEN_${tokens.length}__`;
    tokens.push(match);
    return placeholder;
  });

  // 2. Match pairs of ** or ***
  const boldRegex = /(\*{2,3})(?!\s)((?:[^\n*]|\*(?!\*))+?)(?<!\s)\1/g;

  const processed = masked.replace(boldRegex, (match, stars, content, offset, str) => {
    const before = offset > 0 ? str[offset - 1] : '';
    const after = offset + match.length < str.length ? str[offset + match.length] : '';

    // Add space before opening delimiter if preceded by non-whitespace and not an opening bracket/quote/delimiter
    const needSpaceBefore = before && !/\s/.test(before) && !/[#*_~`([{<「『【（《“‘]/.test(before);

    // Add space after closing delimiter if followed by non-whitespace and not a closing bracket/quote/punctuation
    const needSpaceAfter = after && !/\s/.test(after) && !/[*_~`.)}\]>」』】）》”’，。！？；：、,.:;!?]/.test(after);

    let res = '';
    if (needSpaceBefore) res += ' ';
    res += `${stars}${content}${stars}`;
    if (needSpaceAfter) res += ' ';
    return res;
  });

  // 3. Restore masked tokens
  return processed.replace(/__MD2PDF_MASK_TOKEN_(\d+)__/g, (_, idx) => tokens[Number(idx)]);
}
