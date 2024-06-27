// saveHistory.js
import { openDb } from './db.js';

async function saveHistory(history) {
  const db = await openDb();
  await db.exec('CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, role TEXT, text TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
  
  const insert = 'INSERT INTO history (role, text) VALUES (?, ?)';
  
  for (const entry of history) {
    await db.run(insert, [entry.role, entry.text]);
  }

  await db.close();
}

export { saveHistory };
