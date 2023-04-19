import Store from 'electron-store';

// const schema = {
//   filename: {
//     type: 'string',
//     default: '',
//   },
//   poem: {
//     type: 'string',
//     default: '',
//   },
//   history: {
//     type: 'string',
//     default: '[]',
//   },
// };

const store = new Store();
export default store;
