/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import fs from 'fs';
import store from './store';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const {
    default: installExtension,
    // REDUX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS,
  } = await import('electron-devtools-assembler');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [REACT_DEVELOPER_TOOLS];

  return installExtension(extensions, {
    loadExtensionOptions: { allowFileAccess: true },
    forceDownload,
  }).catch((err) => console.log('An error occurred: ', err));
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#2f3241',
      symbolColor: '#74b1be',
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.on('close', (event) => {
    if (store.get('edited') === 'false') {
      return;
    }

    // If the window has unsaved changes, prevents it from closing
    event.preventDefault();

    if (mainWindow === null) return;
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'warning',
      title: 'Unsaved changes',
      message:
        'Current document contains unsaved changes. Are you sure you want to proceed?',
      buttons: ['Quit Anyway', 'Cancel'],
      // Sets the first option as the default option
      // if the user hits the Return key
      defaultId: 0,
      // Sets the second button as the button selected
      // if the user dismisses the message box.
      cancelId: 1,
    });

    if (choice === 0) {
      // If the user selects "Quit Anyway", forces the window to close
      // and removes the file from the store
      store.clear();
      if (mainWindow === null) return;
      mainWindow.destroy();
    }
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

// IPC listener
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = store.get(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  store.set(key, val);
});

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
    app.on('open-file', (_event, filename) => {
      fs.readFile(filename, 'utf8', (_err, data) => {
        try {
          const { text, history } = JSON.parse(data);
          store.set('poem', text);
          store.set('history', JSON.stringify(history));
          store.set('filename', filename);
          store.set('edited', JSON.stringify(false));
          if (mainWindow === null) return;
          mainWindow.webContents.send('open-file', text, history, filename);
          if (process.platform === 'darwin') {
            mainWindow.setDocumentEdited(false);
            mainWindow.setRepresentedFilename(filename[0]);
          }
          mainWindow.setTitle(filename[0]);
        } catch {
          // todo: is there a better way to handle mainWindow being null?
          if (mainWindow === null) return;
          dialog.showMessageBoxSync(mainWindow, {
            message: 'oops, bad file',
          });
        }
      });
    });
  })
  .catch(console.log);
