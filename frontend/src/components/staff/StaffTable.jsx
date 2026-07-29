import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  TableSortLabel,
  Chip,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { Eye } from 'lucide-react';

const STATUS_COLORS = {
  Active: { color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)', dot: '🟢' },
  'On Leave': { color: '#D97706', bg: 'rgba(245, 158, 11, 0.1)', dot: '🟡' },
  Inactive: { color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)', dot: '🔴' }
};

export default function StaffTable({ staff }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortedStaff = [...staff].sort((a, b) => {
    if (b[orderBy] < a[orderBy]) return order === 'asc' ? 1 : -1;
    if (b[orderBy] > a[orderBy]) return order === 'asc' ? -1 : 1;
    return 0;
  });

  const paginatedStaff = sortedStaff.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const headCells = [
    { id: 'staffId', label: 'Staff ID' },
    { id: 'name', label: 'Name' },
    { id: 'designation', label: 'Designation' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'assignedBlock', label: 'Assigned Block' },
    { id: 'actions', label: 'Actions', disableSort: true }
  ];

  return (
    <Card sx={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell 
                   key={headCell.id}
                  align={headCell.id === 'actions' ? 'right' : 'left'}
                  sx={{ fontWeight: 600, backgroundColor: 'background.paper' }}
                >
                  {headCell.disableSort ? (
                    headCell.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">No staff found matching the criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedStaff.map((row, index) => (
                <TableRow 
                  key={row.staffId}
                  hover
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                    '&:last-child td': { borderBottom: 0 },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.staffId}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell>{row.designation}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.assignedBlock}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small" sx={{ color: 'text.secondary', '&:hover': { color: '#4F46E5', backgroundColor: 'rgba(79, 70, 229, 0.1)' } }}>
                        <Eye size={18} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={staff.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
}
