#!/usr/bin/env node
/**
 * Extract tool definitions and write them as JSON
 */

import { getToolDefinitions } from '../shared/tool-definitions.js';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extract tools (raw, without transformation)
const tools = getToolDefinitions();

// Write to a temp file
const outputPath = resolve(__dirname, 'tools-data.json');
writeFileSync(outputPath, JSON.stringify(tools, null, 2));

console.error(`Tools extracted to ${outputPath}`);