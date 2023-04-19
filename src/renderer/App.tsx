import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Editor from './components/Editor';
import Replay from './components/Replay';
import themeObj from './theme';
import './App.css';

const theme = createTheme(themeObj);

export default function App() {
  return (
    <>
      <CssBaseline />
      <ThemeProvider theme={theme}>
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
