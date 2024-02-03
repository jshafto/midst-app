import FormatBoldIcon from '@mui/icons-material/FormatBoldOutlined';
import FormatItalicIcon from '@mui/icons-material/FormatItalicOutlined';
import HistoryIcon from '@mui/icons-material/History';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrixEditor } from 'react-trix';
import 'trix/dist/trix';
import { ChangeObj, compareStrings } from '../../tracking/utils';
import './Editor.css';

export default function Editor() {
  const theme = useTheme();
  const navigate = useNavigate();
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
    window.electron.store.set('edited', JSON.stringify(true));
  };
  const handleEditorReady = (editor: any) => {
    editor.element.focus();
    editor.element.addEventListener('blur', () => {
      editor.element.focus();
    });
    editor.element.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        editor.insertString('        ');
      }
    });
  };

  window.electron.ipcRenderer.on('open-file', (savedPoem, savedHistory) => {
    const strPoem = savedPoem as string;
    const strHistory = savedHistory as ChangeObj[];
    setHtmlString(strPoem);
    setPoemHistory(strHistory);
    window.location.reload();
  });

  window.electron.ipcRenderer.on('toggle-edit-mode', () => {
    navigate('/replay');
  });

  return (
    <div style={{ backgroundColor: theme.palette.background.default }}>
      <div className="TopButtons">
        <div id="toolbar-dom-id">
          <div className="trix-button-row">
            <span data-trix-button-group="text-tools">
              <Tooltip
                title="Bold"
                TransitionComponent={Zoom}
                enterDelay={1000}
                arrow
              >
                <button
                  type="button"
                  data-trix-attribute="bold"
                  data-trix-key="b"
                  className="icon-button"
                >
                  <FormatBoldIcon fontSize="small" />
                </button>
              </Tooltip>
              <Tooltip
                title="Italic"
                TransitionComponent={Zoom}
                enterDelay={1000}
                arrow
              >
                <button
                  type="button"
                  data-trix-attribute="italic"
                  data-trix-key="i"
                  className="icon-button"
                >
                  <FormatItalicIcon fontSize="small" />
                </button>
              </Tooltip>
            </span>
          </div>
        </div>
      </div>
      <TrixEditor
        className="TextEditor"
        toolbar="toolbar-dom-id"
        onEditorReady={handleEditorReady}
        onChange={handleChange}
        mergeTags={[]}
        value={htmlString}
      />
      <div className="Spacer">
        <Tooltip
          title="Replay"
          TransitionComponent={Zoom}
          enterDelay={1000}
          arrow
          placement="top-start"
        >
          <Link to="/replay">
            <button type="button" className="icon-button">
              <HistoryIcon fontSize="small" />
            </button>
          </Link>
        </Tooltip>
      </div>
    </div>
  );
}
