import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap PageBreak Node Extension.
 *
 * Provides visual rendering of page breaks in the WYSIWYG editor
 * and serializes cleanly to <!-- pagebreak --> in Markdown.
 */
export const PageBreak = Node.create({
  name: 'pageBreak',

  group: 'block',

  atom: true,

  draggable: true,

  selectable: true,

  parseHTML() {
    return [
      { tag: 'div.page-break' },
      { tag: 'div[data-type="page-break"]' },
      { tag: 'hr.page-break' },
      { tag: 'div.page' }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'page-break-node page-break',
        'data-type': 'page-break',
        contenteditable: 'false'
      }),
      [
        'div',
        { class: 'page-break-pill' },
        [
          'svg',
          {
            width: '14',
            height: '14',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2'
          },
          ['rect', { x: '5', y: '2', width: '14', height: '20', rx: '2' }],
          ['line', { x1: '9', y1: '7', x2: '15', y2: '7' }],
          ['line', { x1: '9', y1: '11', x2: '15', y2: '11' }]
        ],
        ['span', { class: 'page-break-title' }, 'Page Break · 改ページ']
      ]
    ];
  },

  addCommands() {
    return {
      setPageBreak: () => ({ chain }) => {
        return chain().insertContent({ type: this.name }).run();
      }
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          state.write('\n\n<!-- pagebreak -->\n\n');
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit) {
            // Recognize and convert standalone pagebreak comments
            markdownit.core.ruler.before('normalize', 'page_break_comment', (state) => {
              if (!state.src) return;
              const codeTokens = [];
              const codeRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`+[^`\n]+`+)/g;
              const masked = state.src.replace(codeRegex, (match) => {
                const token = `__CODE_PROTECT_${codeTokens.length}__`;
                codeTokens.push(match);
                return token;
              });

              let processed = masked.replace(
                /<!--\s*page[-_]?break\s*-->/gi,
                '<div class="page-break" data-type="page-break"></div>'
              );
              processed = processed.replace(
                /^---pagebreak---\s*$/gim,
                '<div class="page-break" data-type="page-break"></div>'
              );

              state.src = processed.replace(/__CODE_PROTECT_(\d+)__/g, (_, idx) => codeTokens[Number(idx)]);
            });
          }
        }
      }
    };
  }
});

export default PageBreak;
