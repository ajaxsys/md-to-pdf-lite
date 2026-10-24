import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom NodeView for PageBreak atom nodes in TipTap.
 * Guarantees in-flow document positioning, full pointer event support,
 * mobile touch dragging, and one-tap move up / move down / delete controls.
 */
export class PageBreakNodeView {
  constructor(node, view, getPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // Root wrapper in editor DOM
    this.dom = document.createElement('div');
    this.dom.className = 'page-break-node page-break page-guide-marker';
    this.dom.setAttribute('data-type', 'page-break');
    this.dom.setAttribute('contenteditable', 'false');

    // Central Pill Handle
    this.pill = document.createElement('div');
    this.pill.className = 'page-break-pill';
    this.pill.setAttribute('title', '改ページ (ドラッグまたは▲▼で移動)');

    this.pill.innerHTML = `
      <svg class="page-break-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="4" y="2" width="16" height="8" rx="1.5" stroke-dasharray="2 2"/>
        <rect x="4" y="14" width="16" height="8" rx="1.5"/>
        <line x1="2" y1="11" x2="22" y2="11" stroke-width="2"/>
      </svg>
      <span class="page-break-title">Page Break · 改ページ</span>
      <div class="page-break-actions">
        <button type="button" class="btn-break-act btn-break-up" title="上へ移動 (Move Up)">▲</button>
        <button type="button" class="btn-break-act btn-break-down" title="下へ移動 (Move Down)">▼</button>
        <button type="button" class="btn-break-act btn-break-del" title="削除 (Delete)">✕</button>
      </div>
    `;

    this.dom.appendChild(this.pill);
    this.setupInteractions();
  }

  move(direction) {
    const pos = typeof this.getPos === 'function' ? this.getPos() : null;
    if (pos === null) return;
    const { state, dispatch } = this.view;
    const $pos = state.doc.resolve(pos);
    const parent = $pos.parent;
    const index = $pos.index();

    if (direction < 0) {
      if (index <= 0) return;
      let targetPos = $pos.start();
      for (let i = 0; i < index - 1; i++) {
        targetPos += parent.child(i).nodeSize;
      }
      const tr = state.tr.delete(pos, pos + this.node.nodeSize);
      tr.insert(targetPos, this.node);
      dispatch(tr);
    } else {
      if (index >= parent.childCount - 1) return;
      const nextNode = parent.child(index + 1);
      const targetPos = pos + this.node.nodeSize + nextNode.nodeSize;
      const tr = state.tr.delete(pos, pos + this.node.nodeSize);
      tr.insert(targetPos - this.node.nodeSize, this.node);
      dispatch(tr);
    }
  }

  remove() {
    const pos = typeof this.getPos === 'function' ? this.getPos() : null;
    if (pos === null) return;
    const { state, dispatch } = this.view;
    const tr = state.tr.delete(pos, pos + this.node.nodeSize);
    dispatch(tr);
  }

  setupInteractions() {
    const btnUp = this.pill.querySelector('.btn-break-up');
    const btnDown = this.pill.querySelector('.btn-break-down');
    const btnDel = this.pill.querySelector('.btn-break-del');

    btnUp?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.move(-1);
    });

    btnDown?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.move(1);
    });

    btnDel?.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.remove();
    });

    // Touch Dragging on Mobile / Touch Screens
    let startY = 0;
    let isTouchDragging = false;

    this.pill.addEventListener('touchstart', (e) => {
      if (e.target.closest('.btn-break-act')) return;
      startY = e.touches[0].clientY;
      isTouchDragging = false;
    }, { passive: true });

    this.pill.addEventListener('touchmove', (e) => {
      if (e.target.closest('.btn-break-act')) return;
      const currentY = e.touches[0].clientY;
      if (Math.abs(currentY - startY) > 12) {
        isTouchDragging = true;
        this.dom.classList.add('is-touch-dragging');
      }
    }, { passive: true });

    this.pill.addEventListener('touchend', (e) => {
      if (isTouchDragging) {
        this.dom.classList.remove('is-touch-dragging');
        const endTouch = e.changedTouches[0];
        const coords = { left: endTouch.clientX, top: endTouch.clientY };
        const targetPosInfo = this.view.posAtCoords(coords);
        if (targetPosInfo && targetPosInfo.pos !== undefined) {
          const currentPos = typeof this.getPos === 'function' ? this.getPos() : null;
          if (currentPos !== null && Math.abs(targetPosInfo.pos - currentPos) > 2) {
            const { state, dispatch } = this.view;
            const tr = state.tr.delete(currentPos, currentPos + this.node.nodeSize);
            const safePos = Math.min(tr.doc.content.size, Math.max(0, targetPosInfo.pos));
            tr.insert(safePos, this.node);
            dispatch(tr);
          }
        }
      }
    });
  }

  stopEvent(event) {
    // Keep clicks and touch on actions within the NodeView
    return event.target.closest('.btn-break-act') !== null;
  }
}

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
        class: 'page-break-node page-break page-guide-marker',
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

  addNodeView() {
    return ({ node, view, getPos }) => new PageBreakNodeView(node, view, getPos);
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
