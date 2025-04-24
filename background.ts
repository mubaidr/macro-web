// background.ts
// Handles macro storage and messaging between popup/content scripts

type MacroMessage =
  | { type: 'saveMacro'; name: string; macro: string }
  | { type: 'loadMacros' }
  | { type: 'deleteMacro'; name: string };

type MacroResponse =
  | { success: true }
  | { error: string }
  | { macros: Record<string, string> };

type MacroKeypressRelay = { type: 'macro-keypress'; key: string; data?: unknown };

const isMacroMessage = (msg: unknown): msg is MacroMessage => {
  if (!msg || typeof msg !== 'object' || !('type' in msg)) return false;
  const m = msg as Partial<MacroMessage>;
  if (m.type === 'saveMacro') return typeof m.name === 'string' && typeof m.macro === 'string';
  if (m.type === 'loadMacros') return true;
  if (m.type === 'deleteMacro') return typeof m.name === 'string';
  return false;
};

const isMacroKeypressRelay = (msg: unknown): msg is MacroKeypressRelay => {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as { type?: unknown; key?: unknown };
  return m.type === 'macro-keypress' && typeof m.key === 'string';
};

const macroHandlers: Record<string, (message: MacroMessage, sendResponse: (resp: MacroResponse) => void) => void> = {
  saveMacro: (message, sendResponse) => {
    const { name, macro } = message as Extract<MacroMessage, { type: 'saveMacro' }>;
    if (typeof name !== 'string' || typeof macro !== 'string') {
      sendResponse({ error: 'Invalid macro data' });
      return;
    }
    chrome.storage.local.set({ [name]: macro }, () => {
      sendResponse({ success: true });
    });
  },
  loadMacros: (_message, sendResponse) => {
    chrome.storage.local.get(null, (items) => {
      sendResponse({ macros: items });
    });
  },
  deleteMacro: (message, sendResponse) => {
    const { name } = message as Extract<MacroMessage, { type: 'deleteMacro' }>;
    if (typeof name !== 'string') {
      sendResponse({ error: 'Invalid macro name' });
      return;
    }
    chrome.storage.local.remove(name, () => {
      sendResponse({ success: true });
    });
  },
};

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (isMacroKeypressRelay(message)) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
    // No response needed for relay
    return;
  }
  if (!isMacroMessage(message)) {
    sendResponse({ error: 'Invalid message' });
    return false;
  }
  const handler = macroHandlers[message.type];
  if (!handler) {
    sendResponse({ error: 'Unknown message type' });
    return false;
  }
  handler(message, sendResponse);
  return true;
});
