import mermaid from 'mermaid';

// Initialize Mermaid for the Web UI
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans", sans-serif'
});

/**
 * Custom NodeView for Mermaid diagram blocks in TipTap.
 * Matches the PDF rendering seamlessly (clean centered diagram without bulky borders),
 * while providing an unobtrusive floating button on hover to edit the diagram source.
 */
export class MermaidNodeView {
  constructor(node, view, getPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // Card wrapper (transparent, matches PDF flow)
    this.dom = document.createElement('div');
    this.dom.className = 'mermaid-editor-card';

    // Unobtrusive floating action button (visible on hover)
    const header = document.createElement('div');
    header.className = 'mermaid-card-header';
    header.innerHTML = `
      <button type="button" class="mermaid-card-toggle" title="展开/收起图表源码 (Toggle Diagram Source)">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        <span class="btn-text">编辑源码</span>
      </button>
    `;

    // Preview container for rendered SVG (clean vector display)
    this.preview = document.createElement('div');
    this.preview.className = 'mermaid-card-preview';

    // Code container for ProseMirror content editable
    this.codeContainer = document.createElement('pre');
    this.codeContainer.className = 'mermaid-card-code';
    this.codeContainer.style.display = 'none';
    this.codeContainer.setAttribute('spellcheck', 'false');

    this.contentDOM = document.createElement('code');
    this.contentDOM.className = 'language-mermaid';
    this.contentDOM.setAttribute('spellcheck', 'false');
    this.codeContainer.appendChild(this.contentDOM);

    this.dom.appendChild(header);
    this.dom.appendChild(this.preview);
    this.dom.appendChild(this.codeContainer);

    let isCodeVisible = false;
    const toggleBtn = header.querySelector('.mermaid-card-toggle');
    const btnText = toggleBtn.querySelector('.btn-text');
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isCodeVisible = !isCodeVisible;
      this.codeContainer.style.display = isCodeVisible ? 'block' : 'none';
      toggleBtn.classList.toggle('active', isCodeVisible);
      this.dom.classList.toggle('is-editing', isCodeVisible);
      btnText.textContent = isCodeVisible ? '收起源码' : '编辑源码';
    });

    this.debounceTimer = null;
    this.renderedCode = null;
    setTimeout(() => {
      this.renderDiagram();
    }, 50);
  }

  update(updatedNode) {
    if (updatedNode.type !== this.node.type) return false;
    if (updatedNode.attrs.language !== 'mermaid') return false;

    const oldText = this.node.textContent;
    this.node = updatedNode;

    if (updatedNode.textContent !== oldText && updatedNode.textContent !== this.renderedCode) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.renderDiagram();
      }, 300);
    }

    return true;
  }

  async renderDiagram() {
    const rawCode = this.node.textContent || this.contentDOM?.textContent || '';
    const code = rawCode.trim();
    if (!code || code === this.renderedCode) {
      return;
    }

    const uniqueId = 'm' + Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 8) + Date.now().toString(36);
    try {
      const { svg } = await mermaid.render(uniqueId, code);
      this.preview.innerHTML = svg;
      this.renderedCode = code;
    } catch (err) {
      console.warn('[MermaidNodeView] Render error:', err);
      const tempEl = document.getElementById(uniqueId) || document.getElementById('d' + uniqueId);
      if (tempEl) tempEl.remove();
      this.preview.innerHTML = `<div class="mermaid-card-error"><small>⚠️ Mermaid 渲染提示:</small><br><code>${err.message || '请检查图表语法'}</code></div>`;
    }
  }

  ignoreMutation(mutation) {
    // If the mutation happens inside contentDOM (user typing in source code), let ProseMirror handle it.
    // If outside contentDOM (e.g. preview svg update or header click), ignore it so ProseMirror doesn't recreate node.
    if (this.contentDOM && this.contentDOM.contains(mutation.target)) {
      return false;
    }
    return true;
  }

  stopEvent(event) {
    if (this.contentDOM && this.contentDOM.contains(event.target)) {
      return false;
    }
    return true;
  }

  destroy() {
    clearTimeout(this.debounceTimer);
  }
}

/**
 * Standard CodeBlock NodeView with language badge & disabled spellcheck
 */
export class StandardCodeBlockNodeView {
  constructor(node, view, getPos) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    this.dom = document.createElement('pre');
    this.dom.setAttribute('spellcheck', 'false');
    if (node.attrs.language) {
      this.dom.setAttribute('data-language', node.attrs.language);
    }

    this.contentDOM = document.createElement('code');
    this.contentDOM.setAttribute('spellcheck', 'false');
    if (node.attrs.language) {
      this.contentDOM.className = `language-${node.attrs.language}`;
    }
    this.dom.appendChild(this.contentDOM);
  }

  update(updatedNode) {
    if (updatedNode.type !== this.node.type) return false;
    if (updatedNode.attrs.language === 'mermaid') return false; // Switch to mermaid

    this.node = updatedNode;
    if (updatedNode.attrs.language) {
      this.dom.setAttribute('data-language', updatedNode.attrs.language);
      this.contentDOM.className = `language-${updatedNode.attrs.language}`;
    } else {
      this.dom.removeAttribute('data-language');
      this.contentDOM.className = '';
    }
    return true;
  }
}
