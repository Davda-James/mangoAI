import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, 'node_modules', 'pdf-parse', 'index.js');

if (existsSync(filePath)) {
  let content = await readFile(filePath, 'utf8');
  // Remove the debug block
  content = content.replace(
    /\/\/for testing purpose[^\n]*\nif \(isDebugMode\) \{[\s\S]*?\n\}/,
    '// Debug code removed for production\n'
  );
  await writeFile(filePath, content, 'utf8');
  console.log('Patched pdf-parse debug code.');
}