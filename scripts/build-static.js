const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const clientDir = path.join(rootDir, "client");
const outputDir = path.join(rootDir, "dist");

fs.rmSync(outputDir, {
  recursive: true,
  force: true
});

fs.cpSync(clientDir, outputDir, {
  recursive: true
});

console.log(`Copied ${clientDir} to ${outputDir}`);
