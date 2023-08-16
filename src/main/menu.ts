import {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
  dialog,
} from 'electron';

import fs from 'fs';
import store from './store';

const handleUnsavedChanges = (mainWindow: BrowserWindow) => {
  if (store.get('edited') === 'false') {
    return false;
  }

  const choice = dialog.showMessageBoxSync(mainWindow, {
    type: 'warning',
    title: 'Unsaved changes',
    message:
      'Current document contains unsaved changes. Are you sure you want to proceed?',
    buttons: ['Proceed', 'Cancel'],
    // Sets the first option as the default option
    // if the user hits the Return key
    defaultId: 0,
    // Sets the second button as the button selected
    // if the user dismisses the message box.
    cancelId: 1,
  });

  if (choice === 0) {
    return false;
  }
  return true;
};

const save = async (mainWindow: BrowserWindow, darwin: boolean) => {
  let filename: string | undefined = store.get('filename') as string;
  if (!filename) {
    filename = dialog.showSaveDialogSync(mainWindow, {
      title: 'Save File…',
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'json', extensions: ['json'] },
      ],
    });
  }
  if (filename) {
    store.set('filename', filename);
    const text: string = store.get('poem') as string;
    const history: string = store.get('history') as string;
    const fullContents = JSON.stringify({
      text,
      history: JSON.parse(history),
    });
    if (darwin) {
      mainWindow.setDocumentEdited(false);
      mainWindow.setRepresentedFilename(filename);
    }
    mainWindow.setTitle(filename);
    mainWindow.webContents.send('set-filename', filename);

    fs.writeFile(filename, fullContents, () => {});
    store.set('edited', JSON.stringify(false));
  }
};

export const newFile = (mainWindow: BrowserWindow, darwin: boolean) => {
  const cancel = handleUnsavedChanges(mainWindow);
  if (cancel) {
    return;
  }
  store.set('poem', '');
  store.set('history', JSON.stringify([]));
  store.set('filename', '');
  store.set('edited', JSON.stringify(false));
  mainWindow.webContents.send('open-file', '', [], '');
  if (darwin) {
    mainWindow.setRepresentedFilename('Untitled');
    mainWindow.setTitle('Untitled');
  }
};

export const openFile = async (mainWindow: BrowserWindow, darwin: boolean) => {
  const cancel = handleUnsavedChanges(mainWindow);
  if (cancel) {
    return;
  }
  const filename = dialog.showOpenDialogSync(mainWindow, {
    title: 'Open...',
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'json', extensions: ['json'] },
    ],
  });

  if (filename?.length) {
    fs.readFile(filename[0], 'utf8', (_err, data) => {
      try {
        const { text, history } = JSON.parse(data);
        store.set('poem', text);
        store.set('history', JSON.stringify(history));
        store.set('filename', filename[0]);
        mainWindow.webContents.send('open-file', text, history, filename[0]);
        if (darwin) {
          mainWindow.setDocumentEdited(false);
          mainWindow.setRepresentedFilename(filename[0]);
        }
        mainWindow.setTitle(filename[0]);
        store.set('edited', JSON.stringify(false));
      } catch {
        dialog.showMessageBoxSync(mainWindow, {
          message: 'oops, bad file',
        });
      }
    });
  }
};

interface DarwinMenuItemConstructorOptions extends MenuItemConstructorOptions {
  selector?: string;
  submenu?: DarwinMenuItemConstructorOptions[] | Menu;
}

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu(): Menu {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment(): void {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): MenuItemConstructorOptions[] {
    const subMenuAbout: DarwinMenuItemConstructorOptions = {
      label: 'Midst',
      submenu: [
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide Midst',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuFile: DarwinMenuItemConstructorOptions = {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'Command+N',
          click: () => newFile(this.mainWindow, true),
        },
        {
          label: 'Save',
          accelerator: 'Command+S',
          click: () => save(this.mainWindow, true),
        },
        {
          label: 'Open',
          accelerator: 'Command+O',
          click: () => openFile(this.mainWindow, true),
        },
      ],
    };
    const subMenuEdit: DarwinMenuItemConstructorOptions = {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'Command+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'Command+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'Command+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: 'Select All',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuViewDev: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuViewProd: MenuItemConstructorOptions = {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow: DarwinMenuItemConstructorOptions = {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp: MenuItemConstructorOptions = {
      label: 'Help',
      submenu: [
        {
          label: 'Learn More',
          click() {
            shell.openExternal('https://midst.press');
          },
        },
        {
          label: 'Documentation',
          click() {
            shell.openExternal('https://github.com/jshafto/midst-demo');
          },
        },
      ],
    };

    const subMenuView =
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
        ? subMenuViewDev
        : subMenuViewProd;

    return [
      subMenuAbout,
      subMenuFile,
      subMenuEdit,
      subMenuView,
      subMenuWindow,
      subMenuHelp,
    ];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: '&File',
        submenu: [
          {
            label: '&Save',
            accelerator: 'Ctrl+S',
            click: () => save(this.mainWindow, false),
          },
          {
            label: '&New',
            accelerator: 'Ctrl+N',
            click: () => newFile(this.mainWindow, false),
          },
          {
            label: '&Open',
            accelerator: 'Ctrl+O',
            click: () => openFile(this.mainWindow, false),
          },
          {
            label: '&Close',
            accelerator: 'Ctrl+W',
            click: () => {
              this.mainWindow.close();
            },
          },
        ],
      },
      {
        label: '&View',
        submenu:
          process.env.NODE_ENV === 'development' ||
          process.env.DEBUG_PROD === 'true'
            ? [
                {
                  label: '&Reload',
                  accelerator: 'Ctrl+R',
                  click: () => {
                    this.mainWindow.webContents.reload();
                  },
                },
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  },
                },
                {
                  label: 'Toggle &Developer Tools',
                  accelerator: 'Alt+Ctrl+I',
                  click: () => {
                    this.mainWindow.webContents.toggleDevTools();
                  },
                },
              ]
            : [
                {
                  label: 'Toggle &Full Screen',
                  accelerator: 'F11',
                  click: () => {
                    this.mainWindow.setFullScreen(
                      !this.mainWindow.isFullScreen()
                    );
                  },
                },
              ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Learn More',
            click() {
              shell.openExternal('https://midst.press');
            },
          },
          {
            label: 'Documentation',
            click() {
              shell.openExternal('https://github.com/jshafto/midst-demo');
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}
