import { type SqliteFile, type InsertSqliteFile } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  getSqliteFile(id: string): Promise<SqliteFile | undefined>;
  createSqliteFile(file: InsertSqliteFile): Promise<SqliteFile>;
  deleteSqliteFile(id: string): Promise<void>;
  getFileBuffer(filename: string): Promise<Buffer>;
  saveFileBuffer(filename: string, buffer: Buffer): Promise<void>;
}

export class MemStorage implements IStorage {
  private files: Map<string, SqliteFile>;
  private fileBuffers: Map<string, Buffer>;
  private uploadsDir: string;

  constructor() {
    this.files = new Map();
    this.fileBuffers = new Map();
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async getSqliteFile(id: string): Promise<SqliteFile | undefined> {
    return this.files.get(id);
  }

  async createSqliteFile(insertFile: InsertSqliteFile): Promise<SqliteFile> {
    const id = randomUUID();
    const file: SqliteFile = {
      ...insertFile,
      id,
      uploadedAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async deleteSqliteFile(id: string): Promise<void> {
    const file = this.files.get(id);
    if (file) {
      // Delete physical file
      const filePath = path.join(this.uploadsDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      this.files.delete(id);
      this.fileBuffers.delete(file.filename);
    }
  }

  async getFileBuffer(filename: string): Promise<Buffer> {
    const cached = this.fileBuffers.get(filename);
    if (cached) {
      return cached;
    }

    const filePath = path.join(this.uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      this.fileBuffers.set(filename, buffer);
      return buffer;
    }

    throw new Error("File not found");
  }

  async saveFileBuffer(filename: string, buffer: Buffer): Promise<void> {
    const filePath = path.join(this.uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);
    this.fileBuffers.set(filename, buffer);
  }
}

export const storage = new MemStorage();
