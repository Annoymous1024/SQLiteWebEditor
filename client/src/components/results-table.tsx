import { useState } from "react";
import { QueryResult } from "@shared/schema";
import { Download, Copy, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { downloadBlob, exportToCSV } from "@/lib/sqlite-utils";

interface ResultsTableProps {
  result: QueryResult | null;
  executionTime?: number;
  error?: string;
}

const ROWS_PER_PAGE = 50;

export default function ResultsTable({ result, executionTime, error }: ResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const totalRows = result?.values.length || 0;
  const totalPages = Math.ceil(totalRows / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = Math.min(startIndex + ROWS_PER_PAGE, totalRows);
  const currentRows = result?.values.slice(startIndex, endIndex) || [];

  const handleExportCSV = () => {
    if (!result) return;
    
    try {
      const csv = exportToCSV(result);
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, 'query_results.csv');
      
      toast({
        title: "Success",
        description: "Results exported to CSV",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export results",
        variant: "destructive",
      });
    }
  };

  const handleCopyResults = async () => {
    if (!result) return;
    
    try {
      const csv = exportToCSV(result);
      await navigator.clipboard.writeText(csv);
      
      toast({
        title: "Success",
        description: "Results copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy results",
        variant: "destructive",
      });
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (error) {
    return (
      <div className="flex-1 bg-card">
        <div className="border-b border-border px-4 py-2">
          <h3 className="text-sm font-semibold text-destructive">Query Error</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-destructive font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex-1 bg-card">
        <div className="border-b border-border px-4 py-2">
          <h3 className="text-sm font-semibold text-muted-foreground">No Results</h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Execute a query to see results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-card flex flex-col">
      {/* Results Toolbar */}
      <div className="border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-sm font-semibold text-foreground">Query Results</h3>
          <span className="text-xs text-muted-foreground" data-testid="results-count">
            {totalRows.toLocaleString()} rows returned
          </span>
          {executionTime && (
            <span className="text-xs text-muted-foreground" data-testid="execution-time">
              • Executed in {executionTime.toFixed(3)}s
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleExportCSV}
            variant="secondary"
            size="sm"
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={handleCopyResults}
            variant="secondary"
            size="sm"
            data-testid="button-copy-results"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm" data-testid="results-table">
          <thead className="bg-muted text-muted-foreground sticky top-0">
            <tr>
              {result.columns.map((column, index) => (
                <th
                  key={index}
                  className="text-left p-3 font-medium border-r border-border last:border-r-0"
                  data-testid={`column-header-${column}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-foreground">
            {currentRows.map((row, rowIndex) => (
              <tr
                key={startIndex + rowIndex}
                className="border-b border-border hover:bg-muted/50"
                data-testid={`row-${startIndex + rowIndex}`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="p-3 border-r border-border last:border-r-0 font-mono text-xs"
                    data-testid={`cell-${startIndex + rowIndex}-${cellIndex}`}
                  >
                    {cell === null ? (
                      <span className="text-muted-foreground italic">NULL</span>
                    ) : (
                      String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between">
          <div className="text-xs text-muted-foreground" data-testid="pagination-info">
            Showing {startIndex + 1} to {endIndex} of {totalRows.toLocaleString()} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
              data-testid="button-previous-page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">
              {currentPage}
            </span>
            <Button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
              data-testid="button-next-page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
