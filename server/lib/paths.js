const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function resolveFromRoot(...segments) {
  return path.join(ROOT_DIR, ...segments);
}

module.exports = {
  ROOT_DIR,
  resolveFromRoot
};
