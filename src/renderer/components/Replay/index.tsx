import './Replay.css';
import { useState, useEffect } from 'react';
import { reconstructHTML, ChangeObj } from 'renderer/tracking/utils';
import Slider from '@mui/material/Slider';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import Grow from '@mui/material/Grow';
import Box from '@mui/material/Box';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

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
];

export default function Replay() {
  const theme = useTheme();
  const navigate = useNavigate();
  const restoreHistory = window.electron.store.get('history')
    ? JSON.parse(window.electron.store.get('history'))
    : [];
  const [history, setHistory] = useState<ChangeObj[]>(restoreHistory);
  const [maxStep, setMaxStep] = useState(
    history.length ? history.length - 1 : 0
  );

  const [step, setStep] = useState(maxStep);
  const [playing, setPlaying] = useState(false);
  const [playingInterval, setPlayingInterval] = useState<
    ReturnType<typeof setInterval> | undefined
  >(undefined);
  const heightClass = window.electron.versions.isMac
    ? 'history-height-tall'
    : 'history-height-short';

  const editor = useEditor({
    extensions,
    content: reconstructHTML('', history, step),
    editable: false,
    parseOptions: {
      preserveWhitespace: true,
    },
    editorProps: {
      attributes: {
        class: `HistoryDisplay ${heightClass}`,
      },
    },
  });
  const handleStepChange = (_event: Event, value: number | number[]) => {
    const newStep = Array.isArray(value) ? value[0] : value;
    if (newStep > maxStep || newStep < 0) {
      return;
    }
    setStep(newStep);
  };
  useEffect(() => {
    if (step >= maxStep) {
      clearInterval(playingInterval);
      setPlaying(false);
    }
    if (!editor) return;
    const newContent = reconstructHTML('', history, step);
    editor.commands.setContent(newContent, false, { preserveWhitespace: true });
    const pos = history[step].pos;
    const { node } = editor.view.domAtPos(pos !== undefined ? pos : 0);
    if (node) {
      (node as any).scrollIntoView?.({ block: 'center' });
    }
  }, [playingInterval, maxStep, step]);

  useEffect(() => {
    // this clean up function runs when unmounted, clearing the interval
    editor?.commands.focus();
    return () => {
      if (playingInterval) {
        clearInterval(playingInterval);
      }
    };
  }, [playingInterval]);

  const handleClickPlay = async () => {
    clearInterval(playingInterval);
    setPlaying(true);
    if (step >= maxStep) {
      setStep(0);
      // the slider needs time to move back to 0
      // so there is a 250ms delay
      // there might be a more elegant way to do this with async/await
      setTimeout(() => {
        const interval = setInterval(() => {
          setStep((val) => val + 1);
        }, 60);
        setPlayingInterval(interval);
      }, 250);
    } else {
      const interval = setInterval(() => {
        setStep((val) => val + 1);
      }, 60);
      setPlayingInterval(interval);
    }
  };

  const labelFormatter = (x: number) => {
    if (x > maxStep) return '';
    return history[x] ? format(new Date(history[x].t), 'p\n MM/dd/yy') : '';
  };
  const handleClickPause = () => {
    clearInterval(playingInterval);
    setPlaying(false);
  };
  window.electron.ipcRenderer.on('open-file', (_savedPoem, savedHistory) => {
    clearInterval(playingInterval);
    setPlaying(false);
    const strHistory = savedHistory as ChangeObj[];
    setHistory(strHistory);
    setMaxStep(strHistory.length ? strHistory.length - 1 : 0);
    setStep(strHistory.length ? strHistory.length - 1 : 0);
    if (!strHistory.length) {
      navigate('/');
    }
  });
  window.electron.ipcRenderer.on('toggle-edit-mode', () => {
    navigate('/');
  });

  // if ()

  return (
    <div style={{ backgroundColor: theme.palette.background.default }}>
      <div className="TopButtons" />
      <div className="ReplayContainer">
        <EditorContent editor={editor}>
          <></>
        </EditorContent>
      </div>
      <Grow mountOnEnter in>
        <Box
          component="div"
          className="ControlBar"
          style={{
            backgroundColor: theme.palette.primary.dark,
          }}
        >
          <button
            type="button"
            style={{ color: theme.palette.secondary.contrastText }}
            onClick={playing ? handleClickPause : handleClickPlay}
            disabled={!history.length}
            className="control-bar-icon control-icon-gap"
          >
            {playing ? (
              <PauseIcon fontSize="small" />
            ) : (
              <PlayArrowIcon fontSize="small" />
            )}
          </button>
          <Slider
            min={0}
            max={maxStep}
            value={step}
            step={1}
            size="small"
            valueLabelFormat={labelFormatter}
            valueLabelDisplay={history.length ? 'auto' : undefined}
            sx={{
              color: theme.palette.secondary.contrastText,
              marginRight: '15px',
              cursor: history.length ? undefined : 'not-allowed',
            }}
            onChange={handleStepChange}
          />
          <Tooltip
            title="Edit"
            TransitionComponent={Zoom}
            enterDelay={1000}
            arrow
            placement="top-end"
            classes={{ arrow: 'custom-arrow', tooltip: 'custom' }}
          >
            <Link to="/">
              <button
                type="button"
                className="control-bar-icon"
                style={{
                  color: theme.palette.secondary.contrastText,
                }}
              >
                <EditIcon fontSize="small" />
              </button>
            </Link>
          </Tooltip>
        </Box>
      </Grow>
    </div>
  );
}
