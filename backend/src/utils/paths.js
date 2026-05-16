const fs = require("fs");
const path = require("path");

function resolveDataFile(filename) {
  const candidates = [
    path.resolve(__dirname, "../../data", filename),
    path.resolve(process.cwd(), "data", filename),
    path.resolve(__dirname, "../../../data", filename),
    path.resolve(process.cwd(), "..", "data", filename)
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error(`Data file not found: ${filename}. Tried: ${candidates.join(", ")}`);
  }

  return found;
}

module.exports = {
  resolveDataFile
};