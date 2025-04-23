# MacroWeb – DOM Macro Extension for Automated Clicks & Scrolls

**MacroWeb** is a browser extension that lets you automate DOM interactions like clicks and scrolls using a list of CSS selectors and delays. Ideal for repetitive tasks, testing UI flows, or automating browser workflows.

## 🚀 Features

- Run a sequence of DOM actions (click, scroll, etc.)
- Use CSS selectors to target elements
- Add delays between actions
- Simple JSON-based input
- Lightweight and easy to use

## 🧠 Example Macro

```json
[
  { "action": "click", "selector": "#start-button", "delay": 1000 },
  { "action": "scroll", "selector": "#section-3", "delay": 500 },
  { "action": "click", "selector": ".submit-form", "delay": 1500 }
]
```

## 📦 Installation

> Currently in development. Clone this repo and load as an unpacked extension.

1. Clone the repo
2. Open Chrome/Edge and go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the project folder

## 🛠️ Usage

1. Open the extension popup
2. Paste your JSON macro
3. Hit "Run Macro"
4. Watch the magic happen

## 📄 Roadmap

- Macro recording (optional)
- Looping and conditional logic
- Storage for saved macros
- Import/export macros

## 🧑‍💻 Contributing

Pull requests welcome. For major changes, open an issue first to discuss what you’d like to change.

## 📃 License

MIT
