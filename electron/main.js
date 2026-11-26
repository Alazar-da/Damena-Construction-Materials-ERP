/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, shell, Menu } = require('electron');
const path = require('path');

// Single instance lock to prevent duplicate windows
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

let mainWindow = null;

const TARGET_URL = process.env.ELECTRON_START_URL || 'https://damena-construction-materials-erp.vercel.app';

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: 'ዳመና የኮንስትራክሽን ዕቃዎች - Damena ERP',
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    show: false, // Show once ready-to-show to prevent flicker
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });

  // Remove default menu bar, keep custom shortcuts
  Menu.setApplicationMenu(null);

  // Show window smoothly once DOM is rendered
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the web application
  mainWindow.loadURL(TARGET_URL, {
    userAgent: `${mainWindow.webContents.getUserAgent()} DamenaERP-Desktop/1.0`,
  });

  // Handle navigation & external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === 'about:blank' || url.startsWith('blob:')) {
      return { action: 'allow' };
    }
    // If external link, open in default system browser
    if (!url.startsWith('https://damena-construction-materials-erp.vercel.app') && !url.startsWith('http://localhost:3000')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Elegant offline fallback screen with Amharic retry
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    // -3 is aborted (e.g. redirected), don't show error for that
    if (errorCode === -3) return;

    const offlineHtml = `
      <!DOCTYPE html>
      <html lang="am">
      <head>
        <meta charset="UTF-8">
        <title>የግንኙነት ችግር - ዳመና ERP</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 24px;
          }
          .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 20px;
            padding: 40px;
            max-width: 480px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
          }
          .icon {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            background: #f59e0b15;
            border: 1px solid #f59e0b40;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
          }
          h1 { font-size: 20px; font-weight: 800; margin-bottom: 10px; color: #f8fafc; }
          p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .btn {
            background: #f59e0b;
            color: #0f172a;
            border: none;
            padding: 12px 28px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn:hover { background: #fbbf24; transform: translateY(-1px); }
          .error-code { margin-top: 16px; font-size: 10px; color: #64748b; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">📡</div>
          <h1>የኢንተርኔት ግንኙነት አልተገኘም</h1>
          <p>እባክዎ የኮምፒውተርዎን የዋይፋይ (Wi-Fi) ወይም የኬብል ኢንተርኔት ግንኙነት ያረጋግጡና እንደገና ይሞክሩ።</p>
          <button class="btn" onclick="window.location.reload()">🔄 እንደገና ሞክር</button>
          <div class="error-code">${errorDescription} (${errorCode})</div>
        </div>
      </body>
      </html>
    `;
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(offlineHtml)}`);
  });

  // Keyboard Shortcuts: Ctrl+R (Reload), F11 (Fullscreen)
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;

    // F5 or Ctrl+R -> Reload
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) {
      mainWindow.loadURL(TARGET_URL);
      event.preventDefault();
    }

    // F11 -> Toggle Fullscreen
    if (input.key === 'F11') {
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      event.preventDefault();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Second instance focus
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
