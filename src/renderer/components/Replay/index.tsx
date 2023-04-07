import './Replay.css';
import React, { useState } from 'react';
import { reconstruct, ChangeObj } from 'renderer/tracking/utils';
import { Link } from 'react-router-dom';

export default function Replay() {
  const restoreHistory = window.electron.store.get('history')
    ? JSON.parse(window.electron.store.get('history'))
    : [];
  const [history, setHistory] = useState<ChangeObj[]>(restoreHistory);

  const maxStep = history.length;
  const [step, setStep] = useState(maxStep - 1);

  const handleStepChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newStep: number = parseInt(event.target.value, 10) - 1;
      if (newStep >= maxStep || newStep < 0) {
        return;
      }
      setStep(newStep);
    } catch {
      setStep(step);
    }
  };

  window.electron.ipcRenderer.on('open-file', (savedPoem, savedHistory) => {
    const strHistory = savedHistory as ChangeObj[];
    setHistory(strHistory);
  });

  return (
    <>
      <div className="ReplayContainer">
        {/* <div>{[step, history]}</div> */}
        <div className="history">{reconstruct('', history, step)}</div>
        <input
          type="number"
          min={1}
          max={maxStep}
          onChange={handleStepChange}
          value={step + 1}
        />
      </div>
      <Link to="/">Editor</Link>
    </>
  );
}
