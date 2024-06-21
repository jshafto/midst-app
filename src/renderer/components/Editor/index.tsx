import HistoryIcon from '@mui/icons-material/History';
import Zoom from '@mui/material/Zoom';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChangeObj, compareStrings } from '../../tracking/utils';
import './Editor.css';
import { EditorProvider } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import MenuBar from './MenuBar';
import Tooltip from '@mui/material/Tooltip';
import { Editor as EditorType } from '@tiptap/core';
import { HandleTab } from '../../HandleTab';

const extensions = [
  StarterKit.configure({
    bulletList: false,
    orderedList: false,
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    listItem: false,
  }),
  HandleTab,
];

export default function Editor() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [autosaveTimeout, setAutostateTimeout] = useState<
    NodeJS.Timeout | number | undefined
  >(undefined); // create interval for autosaving

  const saveFile = () => {
    window.electron.ipcRenderer.sendMessage('save-file', []);
  };

  const restoreText = window.electron.store.get('poem') || '';
  const restoreHistory = window.electron.store.get('history')
    ? JSON.parse(window.electron.store.get('history'))
    : [];
  const [htmlString, setHtmlString] = useState(restoreText);
  const [poemHistory, setPoemHistory] = useState<ChangeObj[]>(restoreHistory);
  const onUpdate = ({ editor }: { editor: EditorType }) => {
    const newHtml = editor.getHTML();
    const pos = editor.state.selection.$anchor.pos;
    if (htmlString === newHtml) {
      return;
    }
    const newChange = compareStrings(htmlString, newHtml, pos);
    const newHistory = [...poemHistory, newChange];
    setPoemHistory(newHistory);
    setHtmlString(newHtml);
    window.electron.store.set('poem', newHtml);
    window.electron.store.set('history', JSON.stringify(newHistory));
    window.electron.store.set('edited', JSON.stringify(true));

    // cancel current autosave interval and set new one
    clearTimeout(autosaveTimeout);
    const newTimeout = setTimeout(saveFile, 1000);
    setAutostateTimeout(newTimeout);
  };
  const onBlur = ({ editor }: { editor: EditorType }) => {
    editor.commands.focus();
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
  const heightClass = window.electron.versions.isMac
    ? 'editor-height-tall'
    : 'editor-height-short';

  return (
    <div style={{ backgroundColor: theme.palette.background.default }}>
      <EditorProvider
        slotBefore={<MenuBar />}
        extensions={extensions}
        content={restoreText}
        onUpdate={onUpdate}
        onBlur={onBlur}
        editorProps={{
          attributes: {
            class: `TextEditor ${heightClass}`,
          },
        }}
        parseOptions={{ preserveWhitespace: true }}
      >
        <></>
      </EditorProvider>

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
