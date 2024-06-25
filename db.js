// db.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function openDb() {
  return open({
    filename: './history.db',
    driver: sqlite3.Database
  });
}

export { openDb };
