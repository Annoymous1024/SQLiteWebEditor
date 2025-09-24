import { DatabaseSchema, QueryResult, TableInfo, ColumnInfo } from "@shared/schema";

declare global {
  interface Window {
    initSqlJs: any;
    SQL: any;
  }
}

let SQL: any = null;

export async function initSqlJs() {
  if (SQL) return SQL;
  
  // Load sql.js from CDN
  if (!window.initSqlJs) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  SQL = await window.initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });
  
  return SQL;
}

export class SqliteDatabase {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  static async fromBuffer(buffer: ArrayBuffer): Promise<SqliteDatabase> {
    const SQL = await initSqlJs();
    const db = new SQL.Database(new Uint8Array(buffer));
    return new SqliteDatabase(db);
  }

  getSchema(): DatabaseSchema {
    const tables: Array<{ name: string; columns: ColumnInfo[]; rowCount: number }> = [];
    
    // Get all tables
    const tablesQuery = "SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'";
    const tablesResult = this.db.exec(tablesQuery);
    
    if (tablesResult.length > 0) {
      const tableRows = tablesResult[0].values;
      
      for (const [tableName] of tableRows) {
        // Get columns for this table
        const columnsQuery = `PRAGMA table_info(${tableName})`;
        const columnsResult = this.db.exec(columnsQuery);
        
        let columns: ColumnInfo[] = [];
        if (columnsResult.length > 0) {
          columns = columnsResult[0].values.map((row: any[]) => ({
            cid: row[0],
            name: row[1],
            type: row[2],
            notnull: row[3],
            dflt_value: row[4],
            pk: row[5],
          }));
        }
        
        // Get row count
        const countQuery = `SELECT COUNT(*) FROM ${tableName}`;
        const countResult = this.db.exec(countQuery);
        const rowCount = countResult.length > 0 ? countResult[0].values[0][0] : 0;
        
        tables.push({
          name: tableName as string,
          columns,
          rowCount: rowCount as number,
        });
      }
    }
    
    return { tables };
  }

  executeQuery(sql: string): QueryResult {
    try {
      const result = this.db.exec(sql);
      
      if (result.length === 0) {
        return { columns: [], values: [] };
      }
      
      return {
        columns: result[0].columns || [],
        values: result[0].values || [],
      };
    } catch (error) {
      throw new Error(`SQL Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  export(): Uint8Array {
    return this.db.export();
  }

  close(): void {
    this.db.close();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(result: QueryResult): string {
  if (result.columns.length === 0) return '';
  
  const csvRows = [];
  
  // Add headers
  csvRows.push(result.columns.map(col => `"${col}"`).join(','));
  
  // Add data rows
  for (const row of result.values) {
    csvRows.push(row.map(value => `"${value ?? ''}"`).join(','));
  }
  
  return csvRows.join('\n');
}
