import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sqliteFiles = pgTable("sqlite_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const insertSqliteFileSchema = createInsertSchema(sqliteFiles).omit({
  id: true,
  uploadedAt: true,
});

export type InsertSqliteFile = z.infer<typeof insertSqliteFileSchema>;
export type SqliteFile = typeof sqliteFiles.$inferSelect;

// Client-side types for SQLite operations
export interface TableInfo {
  name: string;
  sql: string;
  type: string;
  rootpage: number;
}

export interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface QueryResult {
  columns: string[];
  values: any[][];
}

export interface DatabaseSchema {
  tables: Array<{
    name: string;
    columns: ColumnInfo[];
    rowCount: number;
  }>;
}
