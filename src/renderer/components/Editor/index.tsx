import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import HistoryIcon from '@mui/icons-material/History';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TrixEditor } from 'react-trix';
import 'trix/dist/trix';
import { ChangeObj, compareStrings } from '../../tracking/utils';
import './Editor.css';

export default function Editor() {
  const theme = useTheme();
  const restoreText = window.electron.store.get('poem') || '';
  const restoreHistory = window.electron.store.get('history')
    ? JSON.parse(window.electron.store.get('history'))
    : [];
  const [htmlString, setHtmlString] = useState(restoreText);
  const [poemHistory, setPoemHistory] = useState<ChangeObj[]>(restoreHistory);
  const handleChange = (newHtml: string) => {
    const newChange = compareStrings(htmlString, newHtml);
    const newHistory = [...poemHistory, newChange];
    setPoemHistory(newHistory);

    setHtmlString(newHtml);
    window.electron.store.set('poem', newHtml);
    window.electron.store.set('history', JSON.stringify(newHistory));
  };
  const handleEditorReady = (editor: any) => {
    editor.element.focus();
    editor.element.addEventListener('blur', () => {
      editor.element.focus();
    });
  };

  window.electron.ipcRenderer.on('open-file', (savedPoem, savedHistory) => {
    const strPoem = savedPoem as string;
    const strHistory = savedHistory as ChangeObj[];
    setHtmlString(strPoem);
    setPoemHistory(strHistory);
    window.location.reload();
  });

  return (
    <div style={{ backgroundColor: theme.palette.background.default }}>
      <div className="TopButtons">
        <div id="toolbar-dom-id">
          <div className="trix-button-row">
            <span data-trix-button-group="text-tools">
              <IconButton
                size="small"
                data-trix-attribute="bold"
                data-trix-key="b"
                title="bold"
              >
                <FormatBoldIcon />
              </IconButton>
              <IconButton
                size="small"
                data-trix-attribute="italic"
                data-trix-key="i"
                title="italic"
              >
                <FormatItalicIcon />
              </IconButton>
            </span>
          </div>
        </div>
        <Link to="/replay">
          <IconButton size="small">
            <HistoryIcon />
          </IconButton>
        </Link>
      </div>
      <TrixEditor
        className="TextEditor"
        toolbar="toolbar-dom-id"
        onEditorReady={handleEditorReady}
        onChange={handleChange}
        mergeTags={[]}
        value={htmlString}
      />
      <div className="Spacer" />
    </div>
  );
}
