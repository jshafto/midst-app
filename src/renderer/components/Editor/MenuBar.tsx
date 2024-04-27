import { useCurrentEditor } from '@tiptap/react';
import FormatBoldIcon from '@mui/icons-material/FormatBoldOutlined';
import FormatItalicIcon from '@mui/icons-material/FormatItalicOutlined';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';

const MenuBar = () => {
  const { editor } = useCurrentEditor();

  if (!editor) {
    return null;
  }

  return (
    <div className="TopButtons">
      <Tooltip title="Bold" TransitionComponent={Zoom} enterDelay={1000} arrow>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={
            editor.isActive('bold') ? 'is-active icon-button' : 'icon-button'
          }
        >
          <FormatBoldIcon fontSize="small" />
        </button>
      </Tooltip>
      <Tooltip
        title="Italic"
        TransitionComponent={Zoom}
        enterDelay={1000}
        arrow
      >
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={
            editor.isActive('italic') ? 'is-active icon-button' : 'icon-button'
          }
        >
          <FormatItalicIcon fontSize="small" />
        </button>
      </Tooltip>
    </div>
  );
};
export default MenuBar;
