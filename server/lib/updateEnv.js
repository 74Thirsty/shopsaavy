const fs = require('fs');
const os = require('os');
const dotenv = require('dotenv');
const { resolveFromRoot } = require('./paths');

function normalizeValue(value) {
  const stringValue = String(value ?? '').replace(/\r?\n/g, ' ').trim();
  if (stringValue === '') {
    return '';
  }
  if (/\s/.test(stringValue) || stringValue.includes('#')) {
    const escaped = stringValue.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return stringValue;
}

function updateEnvVariable(key, value) {
  const envPath = resolveFromRoot('.env');
  let envLines = [];

  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, 'utf-8');
    envLines = existing.split(/\r?\n/);
  }

  const entry = `${key}=`;
  const normalizedValue = normalizeValue(value);
  const lineValue = `${entry}${normalizedValue}`;
  const index = envLines.findIndex((line) => line.startsWith(entry));

  if (index >= 0) {
    envLines[index] = lineValue;
  } else {
    envLines.push(lineValue);
  }

  const output = envLines.filter((line, idx) => !(line.trim() === '' && idx === envLines.length - 1)).join(os.EOL);
  fs.writeFileSync(envPath, output.endsWith(os.EOL) ? output : `${output}${os.EOL}`);
  dotenv.config({ path: envPath, override: true });
}

module.exports = {
  updateEnvVariable
};

