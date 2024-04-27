/* eslint import/prefer-default-export: off */
import { BrowserWindow } from 'electron';
import { parse } from 'node-html-parser';
import path from 'path';
import { ChangeObj } from 'renderer/tracking/utils';
import { URL } from 'url';
import store from './store';

interface OldMidstTimelineFrame {
  content: string;
  lineNumber: string;
  timestamp: number;
}

interface NewFrames {
  content: string;
  t: Date;
}

const compareStrings = (str: string, next: string, t: Date): ChangeObj => {
  // fix to use position
  let inserted = '';
  let front = 0;
  let end = 0;

  //   if (str === next) return { inserted, front, end, t };
  while (str[front] === next[front] && front < str.length) {
    front += 1;
  }

  // you could definitely do this just by shortening the while loop but okay
  const choppedStr = str.slice(front);
  const choppedNext = next.slice(front);
  while (
    choppedStr[choppedStr.length - end - 1] ===
      choppedNext[choppedNext.length - end - 1] &&
    end < choppedStr.length
  ) {
    end += 1;
  }

  inserted = next.slice(front, next.length - end);
  return { inserted, front, end, t };
};

export function resolveHtmlPath(htmlFileName: string) {
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.PORT || 1212;
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  }
  return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
}

export const CURRENT_VERSION = 'v0.0.1';

export const checkFileVersion = (data: String) => {
  try {
    const rows = data.split('\n');
    return rows[0].split(': ')[1];
  } catch {
    return null;
  }
};

export const stripVersionInfo = (data: string) => {
  return data.split('\n')[1];
};
export const includeVersionInfo = (data: string) => {
  return `midstVersion: ${CURRENT_VERSION}\n${data}`;
};

export const convertMidstFile = (oldMidst: string) => {
  const oldMidstJSON = JSON.parse(oldMidst);
  const frames = oldMidstJSON.editorTimelineFrames;

  const newFrames = frames.map((el: OldMidstTimelineFrame) => {
    const root = parse(el.content);

    root.getElementsByTagName('b').forEach((bold) => {
      bold.tagName = 'strong';
    });
    root.getElementsByTagName('i').forEach((italics) => {
      italics.tagName = 'em';
    });
    const lines = root.getElementsByTagName('p');

    return {
      content: `<div><!--block-->${lines
        .map((p) => {
          return p.innerHTML.includes('<br>')
            ? p.innerHTML
            : `${p.innerHTML}<br>`;
        })
        .join('')}</div>`,
      t: new Date(el.timestamp),
    };
  });
  const history = newFrames.map((el: NewFrames, ind: number) => {
    if (ind === 0) {
      // fix
      return compareStrings('', el.content, el.t);
    }
    return compareStrings(newFrames[ind - 1].content, el.content, el.t);
  });
  const text = newFrames[newFrames.length - 1].content;

  const fullContents = JSON.stringify({
    text,
    history,
  });
  return fullContents;
};

export const loadDataIntoWorkspace = (
  filename: string,
  data: string,
  mainWindow: BrowserWindow,
  darwin: boolean
) => {
  const { text, history } = JSON.parse(stripVersionInfo(data));
  store.set('poem', text);
  store.set('history', JSON.stringify(history));
  store.set('filename', filename);
  store.set('baseFilename', path.basename(filename));
  mainWindow.webContents.send(
    'open-file',
    text,
    history,
    path.basename(filename)
  );
  if (darwin) {
    mainWindow.setDocumentEdited(false);
    mainWindow.setRepresentedFilename(path.basename(filename));
  }
  store.set('edited', JSON.stringify(false));
};

export const getNewMidstFilename = (oldFilename: string) => {
  if (oldFilename.endsWith('.midst')) {
    return `${oldFilename.slice(0, -6)}-converted.midst`;
  }
  return `${oldFilename}-converted.midst`;
};
