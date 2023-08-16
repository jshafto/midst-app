import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useState } from 'react';
import Editor from './components/Editor';
import Replay from './components/Replay';
import themeObj from './theme';
import './App.css';

const theme = createTheme(themeObj);

export default function App() {
  const restoreFilename = window.electron.store.get('filename') || 'Untitled';
  const [filename, setFilename] = useState(
    restoreFilename.split('/').slice(-1).join()
  );
  window.electron.ipcRenderer.on('open-file', (_a, _b, savedFilename) => {
    setFilename(savedFilename);
  });
  window.electron.ipcRenderer.on('set-filename', (filepath) => {
    const filepathStr = filepath as string;
    setFilename(filepathStr.split('/').slice(-1));
  });

  return (
    <>
      <CssBaseline />
      <ThemeProvider theme={theme}>
        <div className="draggable" />
        <div className="filename">{filename}</div>
        <Router>
          <Routes>
            <Route path="/" element={<Editor />} />
            <Route path="/replay" element={<Replay />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </>
  );
}
