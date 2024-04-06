// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { CustomTitlebar, TitlebarColor } from 'custom-electron-titlebar';

export type Channels =
  | 'ipc-example'
  | 'open-file'
  | 'set-filename'
  | 'toggle-edit-mode'
  | 'save-file';

let titlebar: CustomTitlebar | null = null;

window.addEventListener('DOMContentLoaded', () => {
  // Title bar implementation
  // eslint-disable-next-line no-new, no-import-assign
  titlebar = new CustomTitlebar({
    // itemBackgroundColor: TitlebarColor.fromHex('#FFF'),
    backgroundColor: TitlebarColor.fromHex('#FFF5EE'),
    unfocusEffect: false,
    menuPosition: 'left',
    titleHorizontalAlignment: 'center',
    shadow: false,
  });
  if (process.platform !== 'darwin') {
    titlebar.updateMenuPosition('bottom');
    titlebar.updateTitleAlignment('left');
  }
});

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  store: {
    get(key: string) {
      return ipcRenderer.sendSync('electron-store-get', key);
    },
    set(property: string, val: string) {
      ipcRenderer.send('electron-store-set', property, val);
    },
  },
  titlebar: {
    updateTitle: (newTitle: string) => {
      if (titlebar !== null) {
        titlebar.updateTitle(newTitle);
      }
    },
  },
  versions: { isMac: process.platform === 'darwin' },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
