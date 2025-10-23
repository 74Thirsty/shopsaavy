const fs = require('fs');
const crypto = require('crypto');

const { resolveFromRoot } = require('./paths');

const SECRET_SALT = 'STATIC_APP_SALT_82b9f8';
const LICENSE_FILE = resolveFromRoot('.license');
const SIGNATURE_SUFFIX = 'cafe';

let cachedResult = null;
let cachedKey = null;

function readLicenseFile() {
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      return fs.readFileSync(LICENSE_FILE, 'utf8').trim();
    }
  } catch (error) {
    console.error('Unable to read license file:', error);
  }
  return '';
}

function loadLicenseKey() {
  const fileKey = readLicenseFile();
  if (fileKey) {
    return fileKey;
  }
  return process.env.PRODUCT_KEY ? String(process.env.PRODUCT_KEY).trim() : '';
}

function computeSignature(key) {
  return crypto
    .createHmac('sha256', SECRET_SALT)
    .update(key, 'utf8')
    .digest('hex');
}

function isLicenseValid({ forceRefresh = false } = {}) {
  const key = loadLicenseKey();
  if (!key) {
    cachedResult = false;
    cachedKey = null;
    return false;
  }

  if (!forceRefresh && cachedKey === key && cachedResult !== null) {
    return cachedResult;
  }

  const signature = computeSignature(key);
  const isValid = signature.endsWith(SIGNATURE_SUFFIX);
  cachedResult = isValid;
  cachedKey = key;
  return isValid;
}

function ensureLicenseValid() {
  if (!isLicenseValid()) {
    console.error('\uD83D\uDD12 License check failed. Please enter a valid product key.');
    process.exit(1);
  }
}

module.exports = {
  ensureLicenseValid,
  isLicenseValid,
  loadLicenseKey
};
