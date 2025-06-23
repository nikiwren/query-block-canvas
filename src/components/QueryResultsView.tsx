
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface QueryResultsViewProps {
  sqlQuery: string;
  onSaveQuery: () => void;
  onExit: () => void;
}

const QueryResultsView: React.FC<QueryResultsViewProps> = ({ sqlQuery, onSaveQuery, onExit }) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const rowsPerPage = 20;

  // Mock data execution - replace this with actual database call
  useEffect(() => {
    const executeQuery = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data generation based on query
        const mockColumns = ['id', 'name', 'email', 'created_at', 'status'];
        const mockData = Array.from({ length: 200 }, (_, index) => ({
          id: index + 1,
          name: `User ${index + 1}`,
          email: `user${index + 1}@example.com`,
          created_at: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
          status: Math.random() > 0.5 ? 'active' : 'inactive'
        }));
        
        setColumns(mockColumns);
        setData(mockData);
        setTotalRows(mockData.length);
      } catch (err) {
        setError('Failed to execute query. Please check your SQL syntax.');
        console.error('Query execution error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (sqlQuery && sqlQuery.trim() !== '-- Build your query using the blocks') {
      executeQuery();
    } else {
      setError('No valid query to execute');
      setLoading(false);
    }
  }, [sqlQuery]);

  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg">Executing query...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Query Results</h2>
          <div className="space-x-2">
            <Button onClick={onSaveQuery} variant="default">
              Save Query
            </Button>
            <Button onClick={onExit} variant="outline">
              Exit
            </Button>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertTitle>Query Execution Failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">Query Results</h2>
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, totalRows)} of {totalRows} rows
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={onSaveQuery} variant="default">
            Save Query
          </Button>
          <Button onClick={onExit} variant="outline">
            Exit
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column} className="font-semibold">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row, index) => (
                <TableRow key={startIndex + index}>
                  {columns.map((column) => (
                    <TableCell key={column} className="max-w-xs truncate">
                      {row[column]?.toString() || ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNumber)}
                      isActive={currentPage === pageNumber}
                      className="cursor-pointer"
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default QueryResultsView;
