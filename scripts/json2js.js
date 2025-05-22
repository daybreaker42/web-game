// ex: node scripts/json2js.js input.json output.js [varname]

const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
    console.error('Usage: node json2js.js input.json output.js [varname]');
    process.exit(1);
}

const input = process.argv[2];
const output = process.argv[3];
const varname = process.argv[4] || 'json_data';

const json = fs.readFileSync(input, 'utf8');
const code = `window.${varname} = ${json};\n`;

fs.writeFileSync(output, code);
console.log(`Converted: ${input} -> ${output}`);
