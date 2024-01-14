import {
  BrowserWindow,
  Menu,
  MenuItemConstructorOptions,
  app,
  dialog,
  shell,
} from 'electron';

import fs from 'fs';
import store from './store';
import {
  checkFileVersion,
  convertMidstFile,
  includeVersionInfo,
  loadDataIntoWorkspace,
  getNewMidstFilename,
} from './util';

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

const toggleEditMode = (mainWindow: BrowserWindow) => {
  mainWindow.webContents.send('toggle-edit-mode');
};
const save = async (mainWindow: BrowserWindow, darwin: boolean) => {
  let filename: string | undefined = store.get('filename') as string;
  if (!filename) {
    filename = dialog.showSaveDialogSync(mainWindow, {
      title: 'Save File…',
      filters: [
        { name: 'Midst', extensions: ['midst'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
  }
  if (filename) {
    store.set('filename', filename);
    const text: string = store.get('poem') as string;
    const history: string = store.get('history') as string;
    const fullContents = includeVersionInfo(
      JSON.stringify({
        text,
        history: JSON.parse(history),
      })
    );
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
      { name: 'Midst', extensions: ['midst'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (filename?.length) {
    fs.readFile(filename[0], 'utf8', (_err, data) => {
      if (checkFileVersion(data) === 'v0.0.1') {
        try {
          loadDataIntoWorkspace(filename[0], data, mainWindow, darwin);
        } catch {
          dialog.showMessageBoxSync(mainWindow, {
            title: `Error`,
            type: 'error',
            message: `The file ${filename[0]} could not be opened. File may be corrupted. Please select another file and try again.`,
          });
        }
      } else {
        const response = dialog.showMessageBoxSync(mainWindow, {
          type: 'warning',
          message: `Version not recognized. If this file is from an
           older version of Midst, it may be possible to convert it. 
           This will create a new file. Would you like to proceed?`,
          buttons: ['Cancel', 'Convert File'],
          defaultId: 1,
          cancelId: 0,
        });
        if (response === 1) {
          const newFileContents = convertMidstFile(data);
          const newFilename = getNewMidstFilename(filename[0]);
          fs.writeFileSync(newFilename, includeVersionInfo(newFileContents));
          loadDataIntoWorkspace(
            newFilename,
            includeVersionInfo(newFileContents),
            mainWindow,
            darwin
          );
        }
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
          click: () => {
            if (this.mainWindow.isDestroyed()) {
              store.set('poem', '');
              store.set('history', JSON.stringify([]));
              store.set('filename', '');
              store.set('edited', JSON.stringify(false));
              app.emit('activate', false);
            } else {
              newFile(this.mainWindow, true);
            }
          },
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
        {
          label: 'Toggle Edit Mode',
          accelerator: 'Command+E',
          click: () => toggleEditMode(this.mainWindow),
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
