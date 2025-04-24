// content.ts
// Injects a minimalist UI and executes macros on the current page

interface MacroAction {
  action: 'click' | 'scroll' | 'print';
  selector: string;
  delay: number;
}

const isMacroAction = (obj: unknown): obj is MacroAction => {
  if (!obj || typeof obj !== 'object') return false;
  const a = obj as Partial<MacroAction>;
  return (
    (a.action === 'click' || a.action === 'scroll' || a.action === 'print') &&
    typeof a.selector === 'string' &&
    typeof a.delay === 'number' &&
    Number.isFinite(a.delay)
  );
};

const getElement = <T extends HTMLElement>(id: string): T | null => {
  try {
    const el = document.getElementById(id);
    if (!el) setStatus(`Element #${id} not found`, true);
    return el instanceof HTMLElement ? (el as T) : null;
  } catch (err) {
    setStatus(`Error accessing element #${id}: ${(err as Error).message}`, true);
    return null;
  }
};

const renderJson = (json: unknown, container: HTMLElement): void => {
  container.innerHTML = '';
  const render = (value: unknown, depth = 0): HTMLElement => {
    const type = typeof value;
    if (value === null) {
      const span = document.createElement('span');
      span.textContent = 'null';
      span.style.color = '#b00';
      return span;
    }
    if (Array.isArray(value)) {
      const div = document.createElement('div');
      div.style.marginLeft = `${depth * 16}px`;
      div.textContent = '[\n';
      value.forEach((v, i) => {
        div.appendChild(render(v, depth + 1));
        if (i < value.length - 1) div.appendChild(document.createTextNode(','));
        div.appendChild(document.createElement('br'));
      });
      div.appendChild(document.createTextNode(']'));
      return div;
    }
    if (type === 'object') {
      const div = document.createElement('div');
      div.style.marginLeft = `${depth * 16}px`;
      div.textContent = '{\n';
      Object.entries(value as Record<string, unknown>).forEach(([k, v], i, arr) => {
        const keySpan = document.createElement('span');
        keySpan.textContent = `  "${k}": `;
        keySpan.style.color = '#1a1a7a';
        div.appendChild(keySpan);
        div.appendChild(render(v, depth + 1));
        if (i < arr.length - 1) div.appendChild(document.createTextNode(','));
        div.appendChild(document.createElement('br'));
      });
      div.appendChild(document.createTextNode('}'));
      return div;
    }
    const span = document.createElement('span');
    span.textContent =
      type === 'string' ? `"${value as string}"` : String(value);
    span.style.color = type === 'string' ? '#0a0' : '#333';
    return span;
  };
  container.appendChild(render(json));
};

const injectUI = (): void => {
  try {
    if (document.getElementById('macro-web-ui')) return;
    const container = document.createElement('div');
    container.id = 'macro-web-ui';
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.zIndex = '99999';
    container.style.background = '#f8fafc';
    container.style.border = '1px solid #b6c2d1';
    container.style.borderRadius = '6px';
    container.style.padding = '8px 10px 10px 10px';
    container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)';
    container.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    container.style.width = '480px';
    container.style.fontSize = '13px';

    container.innerHTML = `
      <div id="macro-web-header" style="font-weight:bold;margin-bottom: 12px; display: flex;justify-content: space-between;">
        <div>Macro Web</div>
        <button id="macro-web-close" style="background:transparent;color:#b00;font-size:16px;border:none;cursor:pointer;line-height:1;">✕</button>
      </div>
      <p>
        Automate DOM interactions like clicks and scrolls using a list of CSS selectors and delays.
      </p>
      <div style="display:flex;gap:4px;margin-bottom:6px;align-items:center;">
        <select id="macro-web-action" style="flex:1;padding:2px 4px;border-radius:3px;border:1px solid #b6c2d1;font-size:12px;">
          <option value="click">Click</option>
          <option value="scroll">Scroll</option>
          <option value="print">Print</option>
        </select>
        <input id="macro-web-selector" type="text" placeholder="CSS Selector" style="flex:2;padding:2px 4px;border-radius:3px;border:1px solid #b6c2d1;font-size:12px;" />
        <input id="macro-web-delay" type="number" min="0" value="0" style="width:40px;padding:2px 4px;border-radius:3px;border:1px solid #b6c2d1;font-size:12px;" title="Delay (ms)" />
        <button id="macro-web-add" style="background:#2563eb;color:#fff;border:none;border-radius:3px;padding:2px 6px;cursor:pointer;font-size:12px;">+</button>
      </div>
      <div style="display:flex;gap:4px;align-items:center;">
        <textarea id="macro-web-input" rows="8" style="width:75%;resize:vertical;box-sizing:border-box;padding:3px 4px;border-radius:3px;border:1px solid #b6c2d1;font-family:monospace;font-size:12px;"></textarea>
        <div id="macro-web-jsonview" style="width:25%;max-height:60px;overflow:auto;background:#f3f6fa;border-radius:3px;border:1px solid #d1d5db;padding:3px 4px;font-family:monospace;font-size:12px;"></div>
      </div>
      <div style="margin-top:6px;display:flex;gap:4px;align-items:right;flex-wrap:wrap;">
        <button id="macro-web-save" style="background:#6366f1;color:#fff;border:none;border-radius:3px;padding:8px 8px;cursor:pointer;font-size:12px;">Save</button>
        <button id="macro-web-load" style="background:#f59e42;color:#fff;border:none;border-radius:3px;padding:8px 8px;cursor:pointer;font-size:12px;">Load</button>
        <button id="macro-web-export" style="background:#64748b;color:#fff;border:none;border-radius:3px;padding:8px 8px;cursor:pointer;font-size:12px;">Export</button>
        <button id="macro-web-run" style="background:#059669;color:#fff;border:none;border-radius:3px;padding:8px 24px;cursor:pointer;font-size:12px; min-width: 96px;">Run</button>
      </div>
      <select id="macro-web-load-list" style="display:none;width:100%;margin-top:6px;padding:3px 4px;border-radius:3px;border:1px solid #b6c2d1;font-size:12px;"></select>
      <div id="macro-web-status" style="margin-top:6px;font-size:11px;color:#333;"></div>
      <div id="macro-web-debug" style="margin-top:4px;font-size:11px;color:#444;background:#eef2fa;border-radius:3px;padding:3px 4px;max-height:80px;overflow:auto;white-space:pre-line;display:none;"></div>
    `;
    document.body.appendChild(container);

    // Debug log clear on open
    const debugEl = getElement<HTMLDivElement>('macro-web-debug');
    if (debugEl) debugEl.textContent = '';

    const inputEl = getElement<HTMLTextAreaElement>('macro-web-input');
    const jsonView = getElement<HTMLDivElement>('macro-web-jsonview');
    if (inputEl && jsonView) {
      const updateJsonView = (): void => {
        try {
          const val = inputEl.value;
          const parsed = val ? JSON.parse(val) : [];
          renderJson(parsed, jsonView);
        } catch {
          jsonView.textContent = 'Invalid JSON';
          jsonView.style.color = '#b00';
        }
      };
      inputEl.addEventListener('input', updateJsonView);
      updateJsonView();
    }

    getElement<HTMLButtonElement>('macro-web-close')?.addEventListener('click', () => {
      try {
        container.remove();
      } catch (err) {
        setStatus('Failed to close UI: ' + (err as Error).message, true);
      }
    });

    getElement<HTMLButtonElement>('macro-web-add')?.addEventListener('click', () => {
      try {
        const action = getElement<HTMLSelectElement>('macro-web-action')?.value as MacroAction['action'];
        const selector = getElement<HTMLInputElement>('macro-web-selector')?.value || '';
        const delayStr = getElement<HTMLInputElement>('macro-web-delay')?.value || '0';
        const delay = Number(delayStr);
        if (!['click', 'scroll', 'print'].includes(action) || !selector || !Number.isFinite(delay)) {
          setStatus('Invalid macro step', true);
          return;
        }
        if (!inputEl) return;
        let arr: MacroAction[] = [];
        try {
          arr = inputEl.value ? JSON.parse(inputEl.value) : [];
          if (!Array.isArray(arr)) arr = [];
        } catch { arr = []; }
        arr.push({ action, selector, delay });
        inputEl.value = JSON.stringify(arr, null, 2);
        setStatus('Step added.');
      } catch (err) {
        setStatus('Failed to add step: ' + (err as Error).message, true);
      }
    });

    getElement<HTMLButtonElement>('macro-web-run')?.addEventListener('click', async () => {
      try {
        const input = inputEl?.value;
        if (typeof input !== 'string') {
          setStatus('Input not found', true);
          return;
        }
        let macro: MacroAction[];
        try {
          const parsed = JSON.parse(input);
          if (!Array.isArray(parsed) || !parsed.every(isMacroAction)) throw new Error();
          macro = parsed;
        } catch {
          setStatus('Invalid macro JSON', true);
          return;
        }
        setStatus('Running macro...');
        await runMacro(macro);
        setStatus('Macro complete!');
      } catch (err) {
        setStatus('Failed to run macro: ' + (err as Error).message, true);
      }
    });

    getElement<HTMLButtonElement>('macro-web-save')?.addEventListener('click', () => {
      try {
        const name = prompt('Macro name?');
        const input = inputEl?.value;
        if (!name || !input) return;
        chrome.runtime.sendMessage({ type: 'saveMacro', name, macro: input }, (resp) => {
          if (chrome.runtime.lastError) {
            setStatus('Save failed: ' + chrome.runtime.lastError.message, true);
            return;
          }
          setStatus(resp?.success ? 'Saved.' : 'Save failed', !resp?.success);
        });
      } catch (err) {
        setStatus('Failed to save macro: ' + (err as Error).message, true);
      }
    });
    getElement<HTMLButtonElement>('macro-web-load')?.addEventListener('click', () => {
      try {
        const loadList = getElement<HTMLSelectElement>('macro-web-load-list');
        if (!loadList) return;
        chrome.runtime.sendMessage({ type: 'loadMacros' }, (resp) => {
          if (chrome.runtime.lastError) {
            setStatus('Load failed: ' + chrome.runtime.lastError.message, true);
            return;
          }
          if (!resp?.macros) {
            setStatus('No macros found', true);
            return;
          }
          const names = Object.keys(resp.macros);
          if (names.length === 0) {
            setStatus('No macros found', true);
            return;
          }
          loadList.innerHTML = '';
          const defaultOpt = document.createElement('option');
          defaultOpt.value = '';
          defaultOpt.textContent = '-- Select macro to load --';
          loadList.appendChild(defaultOpt);
          names.forEach((name) => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            loadList.appendChild(opt);
          });
          loadList.style.display = 'block';
          loadList.onchange = () => {
            const selected = loadList.value;
            if (!selected || !(selected in resp.macros)) {
              loadList.style.display = 'none';
              return;
            }
            if (inputEl) inputEl.value = resp.macros[selected];
            setStatus('Loaded macro: ' + selected);
            loadList.style.display = 'none';
          };
        });
      } catch (err) {
        setStatus('Failed to load macros: ' + (err as Error).message, true);
      }
    });
    getElement<HTMLButtonElement>('macro-web-export')?.addEventListener('click', () => {
      try {
        const input = inputEl?.value;
        if (!input) return;
        const blob = new Blob([input], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'macro.json';
        a.click();
        URL.revokeObjectURL(url);
        setStatus('Exported macro.');
      } catch (err) {
        setStatus('Failed to export macro: ' + (err as Error).message, true);
      }
    });
  } catch (err) {
    setStatus('Failed to inject UI: ' + (err as Error).message, true);
  }
};

const setStatus = (msg: string, error = false): void => {
  try {
    const el = getElement<HTMLDivElement>('macro-web-status');
    if (el) {
      el.textContent = msg;
      el.style.color = error ? '#b00' : '#333';
    }
  } catch {
    // Silent fail
  }
};

const logDebug = (msg: string): void => {
  const debugEl = getElement<HTMLDivElement>('macro-web-debug');
  if (!debugEl) return;
  debugEl.style.display = 'block';
  debugEl.textContent += `${msg}\n`;
  debugEl.scrollTop = debugEl.scrollHeight;
};

/**
 * Recursively searches for the first matching element by selector in the given document and all accessible iframes.
 * Returns the first match found, or null if not found.
 */
const findElementInAllFrames = <T extends Element>(selector: string, rootDoc: Document = document): T | null => {
  const el = rootDoc.querySelector(selector) as T | null;
  if (el) return el;
  const iframes = Array.from(rootDoc.getElementsByTagName('iframe'));
  for (const iframe of iframes) {
    try {
      const childDoc = iframe.contentDocument;
      if (childDoc) {
        const found = findElementInAllFrames<T>(selector, childDoc);
        if (found) return found;
      }
    } catch {
      // Cross-origin iframe, skip
      continue;
    }
  }
  return null;
};

/**
 * Recursively collects all elements matching selector in the given document and all accessible iframes.
 * Returns a flat array of all matches.
 */
const findAllElementsInAllFrames = <T extends Element>(selector: string, rootDoc: Document = document): T[] => {
  if (typeof selector !== 'string' || !rootDoc) return [];
  let results: T[] = Array.from(rootDoc.querySelectorAll(selector)) as T[];
  const iframes = Array.from(rootDoc.getElementsByTagName('iframe'));
  for (const iframe of iframes) {
    try {
      const childDoc = iframe.contentDocument;
      if (childDoc) {
        results = results.concat(findAllElementsInAllFrames<T>(selector, childDoc));
      }
    } catch {
      // Cross-origin iframe, skip
      continue;
    }
  }
  return results;
};

const waitForElement = async <T extends Element>(selector: string, timeout = 3000): Promise<T | null> => {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = (): void => {
      const el = findElementInAllFrames<T>(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start > timeout) {
        resolve(null);
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
};

const waitForElements = async <T extends Element>(selector: string, timeout = 3000): Promise<T[]> => {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = (): void => {
      const els = findAllElementsInAllFrames<T>(selector);
      if (els.length > 0) {
        resolve(els);
        return;
      }
      if (Date.now() - start > timeout) {
        resolve([]);
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
};

const runMacro = async (macro: MacroAction[]): Promise<void> => {
  logDebug('--- Macro run started ---');
  for (let i = 0; i < macro.length; i++) {
    const step = macro[i];
    logDebug(`Step ${i + 1}/${macro.length}: ${JSON.stringify(step)}`);
    try {
      await new Promise((res) => setTimeout(res, step.delay));
      if (step.action === 'click') {
        const els = await waitForElements<HTMLElement>(step.selector, 3000);
        if (els.length > 0) {
          els.forEach((el) => el.click());
          logDebug(`Clicked ${els.length} element(s): '${step.selector}'`);
        } else {
          setStatus(`Click failed: selector '${step.selector}' not found after waiting`, true);
          logDebug(`Click failed: selector '${step.selector}' not found after waiting. DOM snapshot: ${document.body.innerHTML.slice(0, 500)}...`);
        }
      } else if (step.action === 'scroll') {
        const els = await waitForElements<Element>(step.selector, 3000);
        if (els.length > 0) {
          els.forEach((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
          logDebug(`Scrolled to ${els.length} element(s): '${step.selector}'`);
        } else {
          setStatus(`Scroll failed: selector '${step.selector}' not found after waiting`, true);
          logDebug(`Scroll failed: selector '${step.selector}' not found after waiting.`);
        }
      } else if (step.action === 'print') {
        printElement(step.selector);
        logDebug(`Print triggered for: '${step.selector}'`);
      }
    } catch (err) {
      setStatus(`Macro step failed: ${(err as Error).message}`, true);
      logDebug(`Step error: ${(err as Error).message}`);
    }
  }
  logDebug('--- Macro run complete ---');
};

const printElement = (selector: string): void => {
  try {
    const el = findElementInAllFrames(selector);
    if (!el) {
      setStatus(`Print failed: selector '${selector}' not found`, true);
      return;
    }
    const win = window.open('', '_blank');
    if (!win) throw new Error('Popup blocked');
    win.document.write(`<html><head><title>Print</title></head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  } catch (err) {
    setStatus(`Print error: ${(err as Error).message}`, true);
  }
};

injectUI();
