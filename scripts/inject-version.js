#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Update version.ts
const versionTsPath = path.join(__dirname, '..', 'src', 'version.ts');
const versionContent = `// This file is auto-generated during build
export const VERSION = '${version}';
`;

fs.writeFileSync(versionTsPath, versionContent);
console.log(`Injected version ${version} into src/version.ts`);

// Also update the compiled version if it exists
const distVersionPath = path.join(__dirname, '..', 'dist', 'version.js');
if (fs.existsSync(distVersionPath)) {
  const distVersionContent = `// This file is auto-generated during build
export const VERSION = '${version}';
`;
  fs.writeFileSync(distVersionPath, distVersionContent);
  console.log(`Injected version ${version} into dist/version.js`);
}