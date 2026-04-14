'use strict';

const path = require('node:path');

const nestjsTrpcMain = require.resolve('nestjs-trpc');
const { FileScanner } = require(
  path.join(path.dirname(nestjsTrpcMain), 'scanners', 'file.scanner.js'),
);

const placeholder = path.resolve(__dirname, 'e2e-router-placeholder.ts');

FileScanner.prototype.getCallerFilePath = function getCallerFilePathE2e() {
  return placeholder;
};
