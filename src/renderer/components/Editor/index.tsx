import React, { useEffect, useState, useRef } from 'react';
import './Editor.css';
import { Link } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import HistoryIcon from '@mui/icons-material/History';
import { useTheme } from '@mui/material/styles';
import { compareStrings, ChangeObj } from '../../tracking/utils';

export default function Editor() {
  const editor = useRef<HTMLTextAreaElement>(null);
  const theme = useTheme();
  const restoreText = window.electron.store.get('poem') || '';
  const restoreHistory = window.electron.store.get('history')
    ? JSON.parse(window.electron.store.get('history'))
    : [];
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

  const focusEditor = () => {
    if (editor.current) editor.current.focus();
  };

  useEffect(focusEditor, [editor]);

  return (
    <div style={{ backgroundColor: theme.palette.background.default }}>
      <div className="TopButtons">
        <Link to="/replay">
          <IconButton size="small">
            <HistoryIcon />
          </IconButton>
        </Link>
      </div>
      <div className="EditContainer">
        <textarea
          ref={editor}
          className="TextEditor"
          style={{
            letterSpacing: theme.typography.body1.letterSpacing,
            backgroundColor: theme.palette.background.default,
          }}
          autoFocus
          rows={20}
          value={text}
          onChange={handleTextChange}
          onBlur={focusEditor}
        />
      </div>
      <div className="Spacer" />
    </div>
  );
}
