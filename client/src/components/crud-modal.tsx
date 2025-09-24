import { useState, useEffect } from "react";
import { DatabaseSchema, ColumnInfo } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, X } from "lucide-react";

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string | null;
  schema: DatabaseSchema | null;
  onSubmit: (tableName: string, data: Record<string, any>) => void;
}

export default function CrudModal({ isOpen, onClose, tableName, schema, onSubmit }: CrudModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const table = schema?.tables.find(t => t.name === tableName);

  useEffect(() => {
    if (table) {
      // Initialize form data with default values
      const initialData: Record<string, any> = {};
      table.columns.forEach(column => {
        if (column.pk !== 1) { // Don't include auto-increment primary keys
          initialData[column.name] = column.dflt_value || '';
        }
      });
      setFormData(initialData);
    }
  }, [table]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableName) {
      onSubmit(tableName, formData);
      onClose();
    }
  };

  const handleInputChange = (columnName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [columnName]: value
    }));
  };

  const renderInput = (column: ColumnInfo) => {
    const value = formData[column.name] || '';
    const type = column.type.toLowerCase();

    if (type.includes('boolean') || type.includes('bit')) {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={column.name}
            checked={!!value}
            onCheckedChange={(checked) => handleInputChange(column.name, checked)}
            data-testid={`input-${column.name}`}
          />
          <Label htmlFor={column.name} className="text-sm">
            {column.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Label>
        </div>
      );
    }

    if (type.includes('text') && type.includes('long')) {
      return (
        <div>
          <Label htmlFor={column.name} className="text-sm font-medium text-foreground mb-2 block">
            {column.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            {column.notnull === 1 && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Textarea
            id={column.name}
            value={value}
            onChange={(e) => handleInputChange(column.name, e.target.value)}
            placeholder={`Enter ${column.name}`}
            required={column.notnull === 1}
            data-testid={`input-${column.name}`}
          />
        </div>
      );
    }

    const inputType = type.includes('int') || type.includes('num') ? 'number' :
                     type.includes('date') ? 'date' :
                     type.includes('time') ? 'datetime-local' :
                     type.includes('email') ? 'email' : 'text';

    return (
      <div>
        <Label htmlFor={column.name} className="text-sm font-medium text-foreground mb-2 block">
          {column.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          {column.notnull === 1 && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          id={column.name}
          type={inputType}
          value={value}
          onChange={(e) => handleInputChange(column.name, e.target.value)}
          placeholder={`Enter ${column.name}`}
          required={column.notnull === 1}
          data-testid={`input-${column.name}`}
        />
      </div>
    );
  };

  if (!table) return null;

  const editableColumns = table.columns.filter(col => col.pk !== 1); // Exclude auto-increment PKs

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-2xl mx-4" data-testid="crud-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2 text-primary" />
            Add New Record - {tableName}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-4">
            {editableColumns.length <= 4 ? (
              // Grid layout for few columns
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editableColumns.map(column => (
                  <div key={column.name}>
                    {renderInput(column)}
                  </div>
                ))}
              </div>
            ) : (
              // Single column layout for many columns
              <div className="space-y-4">
                {editableColumns.map(column => (
                  <div key={column.name}>
                    {renderInput(column)}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-record">
              <Save className="h-4 w-4 mr-2" />
              Save Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
