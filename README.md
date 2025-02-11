# Midst Redux

This is a cross-platform reimplementation of the [Midst](https://midst.press) poetry editing software.

It is based on the [Electron React Boilerplate](https://electron-react-boilerplate.js.org/), used under the [MIT license](https://github.com/electron-react-boilerplate/electron-react-boilerplate/blob/main/LICENSE).

## Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/jshafto/midst-app.git midst-app
cd midst-app
npm install
```

## Starting Development

Start the app in the `dev` environment:

```bash
npm start
```

## Packaging for Production

To package apps for the local platform:

```bash
npm run package
```

## Current Issue Tracker

### Developer

#### Tests

- [x] write basic tests
- [ ] do some manual testing of limits on dev and production version of app to figure out what limits are
- [ ] write specific tests for size limits/change history limits

#### Code changes/refactoring

- [x] change reconstruct function so it's not just a string... divs need keys and also need to be able to track where the change was
- [x] factor out save/open functions in menu
- [x] do versioning (also include version in the metadata for the saved files)
- [ ] refactor styles to something more maintainable
- [ ] go through all dependencies and ensure that you haven't added any packages to the production dependencies that should only be development dependencies

#### Workflow

- [ ] move this out of the readme into github's issue boards or something

### Electron

- [x] get react dev tools working
- [x] figure out how to change the icon for the built package
- [x] have filename display on topbar
- [x] launch midst by opening a `.midst` file, and that file should then be loaded correctly
- [x] keep track of whether file has been changed since last save
- [x] open a dialog to require the user to confirm when they try to switch away from a file with unsaved changes
- [x] "save as" menu option/functionality
- [ ] only allow users to open files with `.midst` extension
- [x] default extension for saving files should be `.midst`
- [x] should start with a blank page when app is launched, rather than preserving the last opened file
- [x] default program for opening a `.midst` file should be midst
- possible: allow multiple windows to be open, and have that all function correctly
  - [ ] creating a new file/opening an existing file opens a new window instead of replacing the old one
  - [ ] test to make sure having many windows open doesn't lead to performance issues

### User-facing

- [x] add "play"/"pause" functionality for replay mode
- [x] tooltip on slider that shows date/time
- [x] when you switch to edit mode, have focus in text box
- [x] scroll during replay to the place where text was added
- [x] smooth scrolling
- [x] button tooltips
- [x] menu option to switch between edit mode and replay mode (with keyboard shortcut)
- [x] hitting "enter" or "space" should toggle play/pause
- [x] replace the midst icon
- allow user to customize/change appearance
  - [ ] choose dark or light theme (blocked by refactoring styles)
  - [ ] the ability to select a display font from the ones on their system (or even just from a few set fonts)
  - [x] change font size
  - [ ] all these formatting options should probably get menu shortcuts as well
- [ ] turn autoscroll on and off
- [ ] allow user to adjust replay speed (website only, low priority)
- [ ] explore "quiet mode" options
  - [ ] do you need a button, or can tools disappear automatically while typing? (do some ui testing there)
- [ ] export most recent frame to rich text file (dot doc?)
- [ ] wait for scroll to finish before replay continues
- [ ] additional rich text features (indentation, underline, strikethrough)
- [ ] restore cursor to most recent position when you switch back from replay mode (and scroll to that position)
- [ ] find in text? probably without a replace feature, just the find parts
- [ ] toggle autosave off
- [x] instead of inferring cursor position from the location of the change, actually include the position of the cursor in what gets saved at each point
- [x] rewrite the midst converter to keep the position information and to use the new editor's approach
- [ ] **add an empty frame at the beginning. like right now frame 0 is always the first letter (cause what would the timestamp be for when nothing had been typed. like, is it worth tracking document creation as one frame? idk). there is like a warning in the console when you click play when there is only one character, cause there is nothing to replay. maybe it would be better to have an initial frame 0 where the timestamp is when the document was created.**
- [ ] change "toggle edit mode" to "toggle timeline" and change shortcut to command+t

#### Major Features

- [x] edit mode
- [x] replay mode
- [x] rich text (as a tracked feature, not just visually)
- [x] autosave
- [x] converter for existing midst files
- [ ] website
- [ ] restore from point history
- [ ] revert history to a timepoint (permanently erasing all history of changes past that point)
- [ ] draft markers

### Bugs

- [x] scrolling doesn't respect empty line/carriage returns
- [x] using bold/italic shortcuts darkens buttons weirdly
- [ ] whitespace issues with the converter
- [ ] when you switch back from replay mode, the cursor should probably be in the same spot where you left it
- [ ] linux only: icon doesn't work
- [ ] find a way to get spellcheck mode to toggle without reloading page

#### Small Fixes

- [x] fix slider values (maxStep is off by 1)
- [x] should switch to edit mode when you are in replay mode and make a new file
- [x] start of slider overlaps with play button
- [x] tab button doesn't work in edit mode—feels like it should just add a set number of spaces
- [x] remove links! yikes!
- [x] remove any formatting in pasted content but don't store that as part of edit history
- [x] fix tab button again since fixing those other things broke it but it should work all the way now
- [x] check whether there would be a way to allow users to selectively toggle spell check/underlining misspelled words off
- [x] escape leaves timeline

### Style

- [x] make the step label white and rounded
- [x] style top bars
- [x] test out appearance on linux (and windows as well)
- [x] add squiggle to top of screen
- [x] add more empty space to top
- [x] position squiggle
- [ ] restyle bold/italic buttons?
- [ ] package some fonts with it
- [x] once the app is closer to ready, seek styling feedback and ticket out remaining issues (probably many of them)
- [x] move button to bottom
- [x] check on why the shadow on mac seems darker than it should be?
- [x] have a minimum window size and fix the default window size

### thoughts that may or may not actually be issues

- i set this up with a router between two pages for edit and replay mode, but really i'm thinking it might not make sense to have a router with separate pages, just have the component it displays depend on state or whatever
- [x] switch to tiptap editor
  - [x] i need to doublecheck on how tiptap sanitizes. i think it's good but i should look into it
