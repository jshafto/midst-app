import React, { useState } from 'react';
import './Editor.css';

export default function Editor() {
  const [text, setText] = useState('');

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    window.electron.store.set('poem', event.target.value);
  };

  return (
    <div className="EditContainer">
      <textarea
        className="TextEditor"
        rows={20}
        placeholder="Type Poem Here"
        value={text}
        onChange={handleTextChange}
      />
    </div>
  );
}
