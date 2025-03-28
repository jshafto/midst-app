import HistoryIcon from '@mui/icons-material/History';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import { useTheme } from '@mui/material/styles';
import { Editor as EditorType } from '@tiptap/core';
import { EditorProvider } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HandleTab } from '../../HandleTab';
import { ChangeObj, compareStrings } from '../../tracking/utils';
import './Editor.css';
import MenuBar from './MenuBar';

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
    strike: false,
  }),
  HandleTab,
];

export default function Editor() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [edited, setEdited] = useState<Boolean>(false);

  const [autosaveTimeout, setAutostateTimeout] = useState<
    NodeJS.Timeout | number | undefined
  >(undefined); // create interval for autosaving

  const restoreSpellcheckSetting = window.electron.store.get('spellcheck');
  const [spellcheckOn, setSpellcheckOn] = useState<boolean>(
    restoreSpellcheckSetting === 'true'
  );
  const heightClass = window.electron.versions.isMac
    ? 'editor-height-tall'
    : 'editor-height-short';

  const saveFileAndUpdateStore = () => {
    window.electron.store.set('poem', htmlString);
    window.electron.store.set('history', JSON.stringify(poemHistory));
    window.electron.ipcRenderer.sendMessage('save-file', []);
    setEdited(false);
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
    if (edited === false) {
      setEdited(true);
      window.electron.store.set('edited', JSON.stringify(true));
    }

    // cancel current autosave interval and set new one
    clearTimeout(autosaveTimeout);
    const newTimeout = setTimeout(saveFileAndUpdateStore, 1000);
    setAutostateTimeout(newTimeout);
  };
  const onBlur = ({ editor }: { editor: EditorType }) => {
    if (window.electron.versions.isMac) {
      editor.commands.focus();
    }
  };

  useEffect(() => {
    const removeOpen = window.electron.ipcRenderer.on(
      'open-file',
      (savedPoem, savedHistory) => {
        const strPoem = savedPoem as string;
        const strHistory = savedHistory as ChangeObj[];
        setHtmlString(strPoem);
        setPoemHistory(strHistory);
        window.location.reload();
      }
    );

    const removeToggleSpellcheck = window.electron.ipcRenderer.on(
      'toggle-spellcheck',
      () => {
        setSpellcheckOn(!spellcheckOn);
        window.electron.store.set('spellcheck', (!spellcheckOn).toString());
        window.location.reload();
      }
    );
    return () => {
      removeOpen();
      removeToggleSpellcheck();
    };
  }, []);

  useEffect(() => {
    const removeToggleEdit = window.electron.ipcRenderer.on(
      'toggle-edit-mode',
      () => {
        saveFileAndUpdateStore();
        navigate('/replay');
      }
    );
    return () => {
      removeToggleEdit();
      clearTimeout(autosaveTimeout);
    };
  }, [htmlString, poemHistory, autosaveTimeout]);

  const onCreate = ({ editor }: { editor: EditorType }) => {
    editor.commands.focus();
  };

  const restoreSizeClassSetting = window.electron.store.get('font-size')
    ? Number(window.electron.store.get('font-size'))
    : 2;

  const [sizeClass, _setSizeClass] = useState<number>(
    [0, 1, 2, 3, 4].includes(restoreSizeClassSetting)
      ? restoreSizeClassSetting
      : 2
  );

  return (
    <div
      style={{
        backgroundColor: theme.palette.background.default,
      }}
    >
      <EditorProvider
        slotBefore={<MenuBar />}
        extensions={extensions}
        content={restoreText}
        onUpdate={onUpdate}
        onBlur={onBlur}
        editorProps={{
          attributes: {
            class: `TextEditor ${heightClass} size-${sizeClass}`,
            spellcheck: spellcheckOn.toString(),
          },
        }}
        parseOptions={{ preserveWhitespace: true }}
        onCreate={onCreate}
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
