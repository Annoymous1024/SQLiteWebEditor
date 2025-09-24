import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSqliteFileSchema } from "@shared/schema";
import multer from "multer";
import { randomUUID } from "crypto";
import path from "path";
import Database from "better-sqlite3";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.db', '.sqlite', '.sqlite3'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only SQLite files (.db, .sqlite, .sqlite3) are allowed'));
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Create sample SQLite database for testing
  app.post("/api/sqlite/sample", async (req, res) => {
    try {
      const filename = `sample_${randomUUID()}.db`;
      const tempPath = path.join(process.cwd(), 'uploads', filename);
      
      // Create in-memory database
      const db = new Database(':memory:');
      
      // Create sample tables
      db.exec(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          age INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT,
          user_id INTEGER,
          published BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        
        CREATE TABLE categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          description TEXT
        );
      `);
      
      // Insert sample data
      const insertUser = db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
      const insertPost = db.prepare('INSERT INTO posts (title, content, user_id, published) VALUES (?, ?, ?, ?)');
      const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
      
      // Sample users
      insertUser.run('John Doe', 'john@example.com', 30);
      insertUser.run('Jane Smith', 'jane@example.com', 25);
      insertUser.run('Bob Johnson', 'bob@example.com', 35);
      
      // Sample posts
      insertPost.run('Getting Started with SQLite', 'This is a beginner guide to SQLite...', 1, 1);
      insertPost.run('Advanced SQL Queries', 'Learn about complex joins and subqueries...', 2, 1);
      insertPost.run('Database Design Principles', 'Best practices for designing databases...', 1, 0);
      
      // Sample categories
      insertCategory.run('Technology', 'Posts about technology and programming');
      insertCategory.run('Tutorials', 'Step-by-step guides and tutorials');
      insertCategory.run('Tips', 'Helpful tips and tricks');
      
      // Export to buffer
      const buffer = db.serialize();
      console.log(`Sample database created: ${filename}, buffer size: ${buffer.length} bytes`);
      db.close();
      
      // Save to storage
      await storage.saveFileBuffer(filename, buffer);
      console.log(`Sample database saved to storage: ${filename}`);
      
      // Create file record
      const fileData = {
        filename,
        originalName: 'sample_database.db',
        fileSize: buffer.length,
      };
      
      const validatedData = insertSqliteFileSchema.parse(fileData);
      const sqliteFile = await storage.createSqliteFile(validatedData);
      
      res.json({ success: true, file: sqliteFile });
    } catch (error) {
      console.error("Sample database creation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to create sample database" 
      });
    }
  });

  // Upload SQLite file
  app.post("/api/sqlite/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        console.log("Upload failed: No file received");
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filename = `${randomUUID()}_${req.file.originalname}`;
      console.log(`File upload: ${req.file.originalname} -> ${filename}, size: ${req.file.size} bytes`);
      
      // Save file buffer
      await storage.saveFileBuffer(filename, req.file.buffer);
      console.log(`File saved to storage: ${filename}`);

      // Create file record
      const fileData = {
        filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
      };

      const validatedData = insertSqliteFileSchema.parse(fileData);
      const sqliteFile = await storage.createSqliteFile(validatedData);

      res.json({ success: true, file: sqliteFile });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Upload failed" 
      });
    }
  });

  // Download SQLite file
  app.get("/api/sqlite/:id/download", async (req, res) => {
    try {
      const { id } = req.params;
      const file = await storage.getSqliteFile(id);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      const buffer = await storage.getFileBuffer(file.filename);
      
      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Download failed" 
      });
    }
  });

  // Get file buffer for frontend processing
  app.get("/api/sqlite/:id/buffer", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Buffer request for file ID: ${id}`);
      const file = await storage.getSqliteFile(id);
      
      if (!file) {
        console.log(`File not found: ${id}`);
        return res.status(404).json({ message: "File not found" });
      }

      const buffer = await storage.getFileBuffer(file.filename);
      console.log(`Serving buffer for ${file.filename}, size: ${buffer.length} bytes`);
      
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(buffer);
    } catch (error) {
      console.error("Buffer fetch error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch file" 
      });
    }
  });

  // Delete SQLite file
  app.delete("/api/sqlite/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSqliteFile(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Delete failed" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
