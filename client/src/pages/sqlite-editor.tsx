import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { DatabaseSchema, QueryResult } from "@shared/schema";
import { SqliteDatabase, downloadBlob } from "@/lib/sqlite-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Database, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import FileUpload from "@/components/file-upload";
import SchemaBrowser from "@/components/schema-browser";
import SqlEditor from "@/components/sql-editor";
import ResultsTable from "@/components/results-table";
import CrudModal from "@/components/crud-modal";

export default function SqliteEditor() {
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [database, setDatabase] = useState<SqliteDatabase | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState("query");
  const [isCrudModalOpen, setIsCrudModalOpen] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState<{
    name: string;
    size: string;
    tableCount: number;
  } | null>(null);

  const { toast } = useToast();

  const loadDatabaseMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/sqlite/${fileId}/buffer`);
      if (!response.ok) {
        throw new Error('Failed to load database file');
      }
      return response.arrayBuffer();
    },
    onSuccess: async (buffer, fileId) => {
      try {
        const db = await SqliteDatabase.fromBuffer(buffer);
        setDatabase(db);
        setCurrentFileId(fileId);
        
        const dbSchema = db.getSchema();
        setSchema(dbSchema);
        
        // Set database info
        setDatabaseInfo({
          name: "database.db",
          size: `${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`,
          tableCount: dbSchema.tables.length,
        });
        
        toast({
          title: "Success",
          description: "Database loaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to parse SQLite database",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load database",
        variant: "destructive",
      });
    },
  });

  const handleFileUploaded = (fileId: string) => {
    loadDatabaseMutation.mutate(fileId);
  };

  const handleExecuteQuery = async (sql: string) => {
    if (!database) {
      toast({
        title: "Error",
        description: "No database loaded",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    setQueryError(null);
    
    try {
      const startTime = performance.now();
      const result = database.executeQuery(sql);
      const endTime = performance.now();
      
      setQueryResult(result);
      setExecutionTime((endTime - startTime) / 1000);
      
      // Refresh schema if it might have changed
      if (sql.toLowerCase().includes('create') || sql.toLowerCase().includes('drop') || sql.toLowerCase().includes('alter')) {
        const newSchema = database.getSchema();
        setSchema(newSchema);
      }
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : "Query execution failed");
      setQueryResult(null);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    if (activeTab === "browse") {
      // Auto-generate a SELECT query for the selected table
      const sql = `SELECT * FROM ${tableName} LIMIT 100;`;
      handleExecuteQuery(sql);
    }
  };

  const handleCrudSubmit = async (tableName: string, data: Record<string, any>) => {
    if (!database) return;

    try {
      // Generate INSERT statement
      const columns = Object.keys(data).filter(key => data[key] !== '');
      const values = columns.map(col => {
        const value = data[col];
        if (typeof value === 'string') {
          return `'${value.replace(/'/g, "''")}'`; // Escape single quotes
        }
        return value;
      });

      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
      
      await handleExecuteQuery(sql);
      
      // Refresh the current view if browsing this table
      if (selectedTable === tableName && activeTab === "browse") {
        handleExecuteQuery(`SELECT * FROM ${tableName} LIMIT 100;`);
      }
      
      toast({
        title: "Success",
        description: "Record inserted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to insert record",
        variant: "destructive",
      });
    }
  };

  const handleExportDatabase = async () => {
    if (!database || !currentFileId) {
      toast({
        title: "Error",
        description: "No database to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/sqlite/${currentFileId}/download`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      downloadBlob(blob, databaseInfo?.name || 'database.db');
      
      toast({
        title: "Success",
        description: "Database exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export database",
        variant: "destructive",
      });
    }
  };

  const handleNewDatabase = () => {
    if (database) {
      database.close();
    }
    setDatabase(null);
    setSchema(null);
    setCurrentFileId(null);
    setSelectedTable(null);
    setQueryResult(null);
    setQueryError(null);
    setDatabaseInfo(null);
    setActiveTab("query");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Database className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">SQLite Editor</h1>
            </div>
            {databaseInfo && (
              <div className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
                <span data-testid="database-name">{databaseInfo.name}</span>
                <span className="text-primary">•</span>
                <span data-testid="database-size">{databaseInfo.size}</span>
                <span className="text-primary">•</span>
                <span data-testid="database-tables">{databaseInfo.tableCount} tables</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleExportDatabase}
              disabled={!database}
              data-testid="button-export-database"
            >
              <Download className="h-4 w-4 mr-2" />
              Export DB
            </Button>
            <Button
              onClick={handleNewDatabase}
              variant="secondary"
              data-testid="button-new-database"
            >
              <Plus className="h-4 w-4 mr-2" />
              New
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          <FileUpload onFileUploaded={handleFileUploaded} />
          <SchemaBrowser 
            schema={schema} 
            onTableSelect={handleTableSelect}
            selectedTable={selectedTable}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 bg-card border-b border-border rounded-none">
              <TabsTrigger value="query" data-testid="tab-query">SQL Query</TabsTrigger>
              <TabsTrigger value="browse" data-testid="tab-browse">Browse Data</TabsTrigger>
              <TabsTrigger value="structure" data-testid="tab-structure">Structure</TabsTrigger>
              <TabsTrigger value="insert" data-testid="tab-insert">Insert</TabsTrigger>
            </TabsList>

            <TabsContent value="query" className="flex-1 flex flex-col mt-0">
              <div className="flex-1 flex flex-col">
                <SqlEditor onExecute={handleExecuteQuery} isExecuting={isExecuting} />
                <ResultsTable 
                  result={queryResult} 
                  executionTime={executionTime || undefined}
                  error={queryError || undefined}
                />
              </div>
            </TabsContent>

            <TabsContent value="browse" className="flex-1 flex flex-col mt-0">
              <div className="flex-1 flex flex-col">
                {selectedTable ? (
                  <ResultsTable 
                    result={queryResult} 
                    executionTime={executionTime || undefined}
                    error={queryError || undefined}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground">Select a table to browse its data</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="structure" className="flex-1 flex flex-col mt-0">
              <div className="flex-1 p-6">
                {schema ? (
                  <div className="space-y-6">
                    {schema.tables.map((table) => (
                      <div key={table.name} className="border border-border rounded-lg">
                        <div className="bg-muted px-4 py-2 border-b border-border">
                          <h3 className="font-semibold">{table.name}</h3>
                          <p className="text-sm text-muted-foreground">{table.rowCount} rows</p>
                        </div>
                        <div className="p-4">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left p-2">Column</th>
                                  <th className="text-left p-2">Type</th>
                                  <th className="text-left p-2">Null</th>
                                  <th className="text-left p-2">Default</th>
                                  <th className="text-left p-2">Key</th>
                                </tr>
                              </thead>
                              <tbody>
                                {table.columns.map((column) => (
                                  <tr key={column.name} className="border-b border-border">
                                    <td className="p-2 font-mono">{column.name}</td>
                                    <td className="p-2">{column.type}</td>
                                    <td className="p-2">{column.notnull ? 'NO' : 'YES'}</td>
                                    <td className="p-2">{column.dflt_value || ''}</td>
                                    <td className="p-2">{column.pk ? 'PRIMARY' : ''}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Load a database to view structure</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insert" className="flex-1 flex flex-col mt-0">
              <div className="flex-1 p-6">
                {schema && selectedTable ? (
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-semibold mb-4">Insert New Record into {selectedTable}</h3>
                    <Button
                      onClick={() => setIsCrudModalOpen(true)}
                      data-testid="button-open-insert-modal"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Record
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      {!schema ? "Load a database" : "Select a table"} to insert new records
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* CRUD Modal */}
      <CrudModal
        isOpen={isCrudModalOpen}
        onClose={() => setIsCrudModalOpen(false)}
        tableName={selectedTable}
        schema={schema}
        onSubmit={handleCrudSubmit}
      />
    </div>
  );
}
