import fs from 'fs';
import path from 'path';

export class JSONFileStore {
  constructor(filePath, initialValue) {
    this.filePath = filePath;
    this.initialValue = initialValue;
    this.ensureFile();
  }

  ensureFile() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(this.initialValue, null, 2));
    }
  }

  read() {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch {
      return structuredClone(this.initialValue);
    }
  }

  write(value) {
    fs.writeFileSync(this.filePath, JSON.stringify(value, null, 2));
  }
}
