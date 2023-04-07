import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Editor from './components/Editor';
import './App.css';

function Hello() {
  return (
    <div className="thing">
      <h1>Demo Text Tracker</h1>
      <Editor />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
