import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import katex from 'katex';

export const mathPluginKey = new PluginKey('math-preview');

/**
 * 1:1 Mathematical formula rendering extension for md-to-pdf-lite Web Studio.
 *
 * Implements Obsidian / Typora style live-preview math rendering:
 * - Renders $$...$$ display math into centered KaTeX blocks.
 * - Renders $...$ inline math into crisp math typography.
 * - Clicking the rendered formula smoothly focuses raw LaTeX text for editing.
 * - Blurring/moving cursor away immediately recompiles to vector KaTeX.
 * - Preserves 100% clean Markdown storage with zero data loss or artificial tags.
 */
export const MathExtension = Extension.create({
  name: 'math',

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: mathPluginKey,
        props: {
          decorations(state) {
            const decorations = [];
            const { doc, selection } = state;
            const { from: selFrom, to: selTo } = selection;

            doc.descendants((node, pos) => {
              if (!node.isText) return;
              const text = node.text;
              if (!text) return;

              // 1. Block Math: $$...$$
              const blockRegex = /\$\$([\s\S]+?)\$\$/g;
              let match;
              while ((match = blockRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const formula = match[1].trim();

                // If cursor is touching or inside this formula, don't decorate (allow raw editing)
                const isCursorInside = (selFrom >= start && selTo <= end);
                if (!isCursorInside && formula) {
                  const widgetDom = document.createElement('div');
                  widgetDom.className = 'katex-block-widget';
                  widgetDom.setAttribute('data-latex', formula);
                  widgetDom.title = '数式ブロック（クリックで編集 / Click to edit LaTeX）';
                  
                  try {
                    widgetDom.innerHTML = katex.renderToString(formula, {
                      displayMode: true,
                      throwOnError: false
                    });
                  } catch (e) {
                    widgetDom.textContent = formula;
                  }

                  widgetDom.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (editor && editor.view) {
                      const targetPos = Math.min(start + 2, state.doc.content.size);
                      const tr = editor.view.state.tr.setSelection(
                        TextSelection.create(editor.view.state.doc, targetPos)
                      );
                      editor.view.dispatch(tr);
                      editor.view.focus();
                    }
                  });

                  // Hide the raw $$...$$ text
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'katex-source-hidden'
                    })
                  );
                  // Render the display KaTeX widget
                  decorations.push(
                    Decoration.widget(start, widgetDom, {
                      side: -1,
                      stopEvent: () => true
                    })
                  );
                }
              }

              // 2. Inline Math: $...$
              const inlineRegex = /(?<!\$)\$(?!\$)([^\$\n]+?)(?<!\$)\$(?!\$)/g;
              while ((match = inlineRegex.exec(text)) !== null) {
                const start = pos + match.index;
                const end = start + match[0].length;
                const formula = match[1].trim();

                const isCursorInside = (selFrom >= start && selTo <= end);
                if (!isCursorInside && formula) {
                  const widgetDom = document.createElement('span');
                  widgetDom.className = 'katex-inline-widget';
                  widgetDom.setAttribute('data-latex', formula);
                  widgetDom.title = 'インライン数式（クリックで編集 / Click to edit LaTeX）';

                  try {
                    widgetDom.innerHTML = katex.renderToString(formula, {
                      displayMode: false,
                      throwOnError: false
                    });
                  } catch (e) {
                    widgetDom.textContent = formula;
                  }

                  widgetDom.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (editor && editor.view) {
                      const targetPos = Math.min(start + 1, state.doc.content.size);
                      const tr = editor.view.state.tr.setSelection(
                        TextSelection.create(editor.view.state.doc, targetPos)
                      );
                      editor.view.dispatch(tr);
                      editor.view.focus();
                    }
                  });

                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'katex-source-hidden'
                    })
                  );
                  decorations.push(
                    Decoration.widget(start, widgetDom, {
                      side: -1,
                      stopEvent: () => true
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          }
        }
      })
    ];
  }
});
