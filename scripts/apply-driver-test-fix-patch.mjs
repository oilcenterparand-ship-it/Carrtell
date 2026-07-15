import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const patchRoot = path.join(root, "__patch__");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log("copied", path.relative(root, dest));
}

copyRecursive(path.join(patchRoot, "src"), path.join(root, "src"));
fs.rmSync(patchRoot, { recursive: true, force: true });
console.log("Driver test mode fix applied.");
