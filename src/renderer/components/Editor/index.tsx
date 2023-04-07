import React, { useState } from 'react';
import './Editor.css';
import { Link } from 'react-router-dom';
import { compareStrings, ChangeObj } from '../../tracking/utils';

export default function Editor() {
  const restoreText = window.electron.store.get('poem');
  const restoreHistory = JSON.parse(window.electron.store.get('history'));
  const [text, setText] = useState(restoreText);
  const [history, setHistory] = useState<ChangeObj[]>(restoreHistory);

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    const newChange = compareStrings(text, event.target.value);
    const newHistory = [...history, newChange];
    setHistory(newHistory);
    window.electron.store.set('poem', event.target.value);
    window.electron.store.set('history', JSON.stringify(newHistory));
  };

  window.electron.ipcRenderer.on('open-file', (savedPoem, savedHistory) => {
    const strPoem = savedPoem as string;
    const strHistory = savedHistory as ChangeObj[];
    setText(strPoem);
    setHistory(strHistory);
  });

  return (
    <>
      <div className="EditContainer">
        <textarea
          className="TextEditor"
          rows={20}
          placeholder="Type Poem Here"
          value={text}
          onChange={handleTextChange}
        />
      </div>
      <Link to="/replay">Replay</Link>
    </>
  );
}
