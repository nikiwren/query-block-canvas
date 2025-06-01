
import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ColumnTreeView from '@/components/ColumnTreeView';
import EnhancedBlocklyEditor from '@/components/EnhancedBlocklyEditor';

interface SelectedColumn {
  id: string;
  name: string;
  table: string;
}

const Index = () => {
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumn[]>([]);

  const handleColumnSelect = (columnId: string, columnName: string, tableName: string, checked: boolean) => {
    if (checked) {
      setSelectedColumns(prev => [...prev, { id: columnId, name: columnName, table: tableName }]);
    } else {
      setSelectedColumns(prev => prev.filter(col => col.id !== columnId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="h-screen w-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <Card className="h-full rounded-none border-r">
              <CardHeader>
                <CardTitle>Database Schema</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[calc(100%-4rem)]">
                <ColumnTreeView onColumnSelect={handleColumnSelect} />
              </CardContent>
            </Card>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={70}>
            <div className="h-full p-4">
              <EnhancedBlocklyEditor selectedColumns={selectedColumns} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
