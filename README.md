
# Browser Extension Project

A modern browser extension built with React, TypeScript, and Tailwind CSS.

## Features

- 🎨 Beautiful, modern popup interface
- ⚡ Built with React and TypeScript for type safety
- 🎯 Manifest V3 compliance
- 🔧 Background and content scripts included
- 📱 Responsive design optimized for extension popup
- 🌈 Gradient design with smooth animations

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Extension Installation

1. Build the project: `npm run build`
2. Open Chrome/Edge and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `dist` folder
5. The extension will appear in your browser toolbar

## Project Structure

```
├── public/
│   ├── manifest.json     # Extension manifest
│   ├── background.js     # Background service worker
│   ├── content.js        # Content script
│   └── icons/           # Extension icons
├── src/
│   ├── components/
│   │   └── ExtensionPopup.tsx  # Main popup component
│   └── pages/
│       └── Index.tsx     # Main page
```

## Customization

- Edit `public/manifest.json` to change extension metadata and permissions
- Modify `src/components/ExtensionPopup.tsx` to customize the popup interface
- Update `public/background.js` for background functionality
- Customize `public/content.js` for page interaction features

## Permissions

The extension currently requests:
- `activeTab` - Access to the current active tab
- `storage` - Local storage for extension data

Add more permissions in `manifest.json` as needed for your specific use case.
