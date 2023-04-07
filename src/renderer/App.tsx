import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Editor from './components/Editor';
import Replay from './components/Replay';
import './App.css';

function Hello() {
  return (
    <div className="thing">
      <h1>Demo Text Tracker</h1>
      <Editor />
    </div>
  );
}

function Other() {
  return (
    <div className="thing">
      <h1>Demo Text Tracker</h1>
      <Replay />
    </div>
  );
}
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
        <Route path="/replay" element={<Other />} />
      </Routes>
    </Router>
  );
}
