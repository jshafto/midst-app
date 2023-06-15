# Demo Text Tracker

This is an early proof of concept for a cross-platform reimplementation of [Midst](https://midst.press).

It uses [Electron React Boilerplate](https://electron-react-boilerplate.js.org/).

## Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/jshafto/demo-midst.git demo-text-tracker
cd demo-text-tracker
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

- [ ] write basic tests
- [ ] do some manual testing of limits on dev and production version of app to figure out what limits are
- [ ] write specific tests for size limits/change history limits

#### Code changes/refactoring

- [x] change reconstruct function so it's not just a string... divs need keys and also need to be able to track where the change was
- [x] factor out save/open functions in menu
- [ ] refactor styles to something more maintainable
- [ ] do versioning (also include version in the metadata for the saved files)
- [ ] go through all dependencies and ensure that you haven't added any packages to the production dependencies that should only be development dependencies

#### Workflow

- [ ] move this out of the readme into github's issue boards or something

### Electron

- [x] get react dev tools working
- [ ] have filename display on topbar
- [ ] figure out how to change the icon for the built package
- [ ] have a minimum window size and fix the default window size
- [ ] enforce file format to .midst when opening
- [ ] add .midst extension to files when saving
- [ ] open a dialog to require the user to confirm when they try to switch away from a file with unsaved changes
- [ ] should start with a blank page when app is launched, rather than preserving the last opened file

### User-facing

- [x] add "play"/"pause" functionality for replay mode
- [x] tooltip on slider that shows date/time
- [x] when you switch to edit mode, have focus in text box
- [x] scroll during replay to the place where text was added
- [ ] smooth scrolling
- [ ] menu option to switch between edit mode and replay mode (with keyboard shortcut)
- [ ] hitting "enter" or "space" should toggle play/pause
- [ ] specific rich text features (indentation, bold, italics, underline, strikethrough)
- allow user to customize/change appearance
  - [ ] choose dark or light theme (blocked by refactoring styles)
  - [ ] the ability to select a display font from the ones on their system (or even just from a few set fonts)
  - [ ] change font size
  - [ ] all these formatting options should probably get menu shortcuts as well
- [ ] turn autoscroll on and off
- [ ] allow user to adjust replay speed (website only, low priority)
- [ ] explore "quiet mode" options
  - [ ] do you need a button, or can tools disappear automatically while typing? (do some ui testing there)
- [ ] export most recent frame to rich text file (dot doc?)
- [ ] wait for scroll to finish before replay continues

#### Major Features

- [x] edit mode
- [x] replay mode
- [ ] rich text (as a tracked feature, not just visually)
- [ ] autosave
- [ ] converter for existing midst files
- [ ] website
- [ ] restore from point history
- [ ] draft markers

#### Small Fixes

- [x] fix slider values (maxStep is off by 1)
- [x] should switch to edit mode when you are in replay mode and make a new file

### Style

- [x] make the step label white and rounded
- [ ] test out appearance on mac (and windows as well)
- [ ] better visual indicator that you're in edit vs replay mode
- [ ] include a nice default font
- [ ] once the app is closer to ready, seek styling feedback and ticket out remaining issues (probably many of them)
- [ ] move button to bottom
