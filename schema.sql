-- Daily Bread — D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,          -- bcrypt hash
  display_name TEXT  NOT NULL,
  created_at TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  invite_code TEXT    NOT NULL UNIQUE,
  book        TEXT    NOT NULL,          -- e.g. "JHN" (API.Bible book ID)
  book_label  TEXT    NOT NULL,          -- e.g. "John"
  total_chapters INTEGER NOT NULL,
  start_date  TEXT    NOT NULL,          -- ISO date: "2026-03-15"
  created_by  INTEGER NOT NULL REFERENCES users(id),
  created_at  TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS group_members (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id  INTEGER NOT NULL REFERENCES groups(id),
  user_id   INTEGER NOT NULL REFERENCES users(id),
  joined_at TEXT    DEFAULT (datetime('now')),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS reflections (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id   INTEGER NOT NULL REFERENCES groups(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  chapter    INTEGER NOT NULL,           -- chapter number (1-based)
  content    TEXT    NOT NULL,
  created_at TEXT    DEFAULT (datetime('now')),
  UNIQUE(group_id, user_id, chapter)     -- one reflection per person per chapter
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reflections_group_chapter ON reflections(group_id, chapter);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite ON groups(invite_code);
