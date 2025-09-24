import { useState } from "react";
import { DatabaseSchema, ColumnInfo } from "@shared/schema";
import { ChevronDown, ChevronRight, Table, Key, Type, Calendar } from "lucide-react";

interface SchemaBrowserProps {
  schema: DatabaseSchema | null;
  onTableSelect: (tableName: string) => void;
  selectedTable: string | null;
}

export default function SchemaBrowser({ schema, onTableSelect, selectedTable }: SchemaBrowserProps) {
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const toggleTable = (tableName: string) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableName)) {
      newExpanded.delete(tableName);
    } else {
      newExpanded.add(tableName);
    }
    setExpandedTables(newExpanded);
  };

  const getColumnIcon = (column: ColumnInfo) => {
    if (column.pk === 1) {
      return <Key className="h-3 w-3 text-yellow-400" />;
    }
    if (column.type.toLowerCase().includes('int')) {
      return <span className="h-3 w-3 text-blue-400">#</span>;
    }
    if (column.type.toLowerCase().includes('text') || column.type.toLowerCase().includes('varchar')) {
      return <Type className="h-3 w-3 text-blue-400" />;
    }
    if (column.type.toLowerCase().includes('date') || column.type.toLowerCase().includes('time')) {
      return <Calendar className="h-3 w-3 text-green-400" />;
    }
    return <span className="h-3 w-3 text-gray-400">•</span>;
  };

  if (!schema) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
            <Table className="h-4 w-4 mr-2 text-primary" />
            Database Schema
          </h3>
          <p className="text-sm text-muted-foreground">Upload a SQLite file to view schema</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
          <Table className="h-4 w-4 mr-2 text-primary" />
          Database Schema
        </h3>
        
        <div className="space-y-2">
          {schema.tables.map((table) => {
            const isExpanded = expandedTables.has(table.name);
            const isSelected = selectedTable === table.name;
            
            return (
              <div key={table.name} className="tree-item">
                <div
                  className={`flex items-center p-2 rounded cursor-pointer ${
                    isSelected ? "bg-primary/20" : ""
                  }`}
                  onClick={() => {
                    toggleTable(table.name);
                    onTableSelect(table.name);
                  }}
                  data-testid={`table-${table.name}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground mr-2" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground mr-2" />
                  )}
                  <Table className="h-4 w-4 text-primary mr-2" />
                  <span className="text-sm font-medium">{table.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {table.rowCount.toLocaleString()}
                  </span>
                </div>
                
                {isExpanded && (
                  <div className="ml-6 mt-1 space-y-1">
                    {table.columns.map((column) => (
                      <div
                        key={column.name}
                        className="flex items-center p-1 text-xs"
                        data-testid={`column-${table.name}-${column.name}`}
                      >
                        {getColumnIcon(column)}
                        <span className="text-foreground ml-2 flex-1">{column.name}</span>
                        <span className="text-muted-foreground text-right">
                          {column.type}
                          {column.pk === 1 && " PRIMARY KEY"}
                          {column.notnull === 1 && !column.pk && " NOT NULL"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
