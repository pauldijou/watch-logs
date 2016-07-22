const { spy } = require('mobx');
const { state } = require('./state');

function print(event) {
  // console.log(event);
}

function init() {
  spy(event => {
    switch (event.type) {
      case 'action':
      case 'transaction':
      case 'reaction':
      case 'compute':
      case 'error':
      case 'update':
      case 'splice':
      case 'add':
      case 'delete':
        print(event);
        break;
      default:

    }
  });
}

module.exports = {
  init,
};
