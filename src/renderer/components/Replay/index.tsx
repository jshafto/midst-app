import './Replay.css';
import { useState, useEffect, useRef } from 'react';
import { reconstructArray, ChangeObj } from 'renderer/tracking/utils';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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

  const currentChange = useRef<HTMLDivElement>(null);
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
  }, [playingInterval, maxStep, step]);

  useEffect(() => {
    return () => {
      if (playingInterval) {
        clearInterval(playingInterval);
      }
    };
  }, [playingInterval]);

  const handleClickPlay = () => {
    clearInterval(playingInterval);
    setPlaying(true);
    if (step >= maxStep) {
      setStep(0);
    }
    const interval = setInterval(() => {
      setStep((val) => val + 1);
    }, 50);
    setPlayingInterval(interval);
  };

  useEffect(() => {
    if (currentChange.current) {
      currentChange.current.scrollIntoView();
    }
  }, [step, currentChange]);
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

  return (
    <div style={{ backgroundColor: theme.palette.background.default }}>
      <div className="TopButtons">
        <Link to="/">
          <IconButton size="small">
            <EditIcon />
          </IconButton>
        </Link>
      </div>
      <div className="ReplayContainer">
        <div className="HistoryDisplay">
          {reconstructArray('', history, step).map((el) => (
            <span key={el.key} ref={el.isInsertRow ? currentChange : null}>
              {el.text}
              <br />
            </span>
          ))}
        </div>
      </div>
      <div
        className="ControlBar"
        style={{
          backgroundColor: theme.palette.primary.dark,
        }}
      >
        <IconButton
          size="small"
          sx={{ color: theme.palette.secondary.contrastText }}
          onClick={playing ? handleClickPause : handleClickPlay}
          disabled={!history.length}
        >
          {playing ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
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
      </div>
    </div>
  );
}
