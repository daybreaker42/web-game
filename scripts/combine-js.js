// ex: node combine-js.js file1.js file2.js ... output.js
const fs = require("fs");
const path = require("path");

if (process.argv.length < 4) {
  console.error("Usage: node combine-js.js input1.js input2.js ... output.js");
  process.exit(1);
}

const args = process.argv.slice(2);
const output = args.pop();
let result = "";

args.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  result += "\n// ========== " + path.basename(file) + " ==========\n";
  result += content.trim() + "\n";
});

fs.writeFileSync(output, result, "utf8");
console.log(`Combined ${args.length} files -> ${output}`);
