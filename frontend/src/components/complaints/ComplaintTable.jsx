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
  Pending: { color: '#D97706', bg: 'rgba(245, 158, 11, 0.1)', dot: '🟠' },
  'In Progress': { color: '#2563EB', bg: 'rgba(59, 130, 246, 0.1)', dot: '🔵' },
  Resolved: { color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)', dot: '🟢' },
  Rejected: { color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)', dot: '🔴' }
};

const PRIORITY_COLORS = {
  Low: { color: '#16A34A', bg: 'rgba(34, 197, 94, 0.1)', dot: '🟢' },
  Medium: { color: '#D97706', bg: 'rgba(245, 158, 11, 0.1)', dot: '🟡' },
  High: { color: '#DC2626', bg: 'rgba(239, 68, 68, 0.1)', dot: '🔴' }
};

export default function ComplaintTable({ complaints }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('date');
  const [order, setOrder] = useState('desc');

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

  const sortedComplaints = [...complaints].sort((a, b) => {
    if (b[orderBy] < a[orderBy]) return order === 'asc' ? 1 : -1;
    if (b[orderBy] > a[orderBy]) return order === 'asc' ? -1 : 1;
    return 0;
  });

  const paginatedComplaints = sortedComplaints.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const headCells = [
    { id: 'complaintId', label: 'Complaint ID' },
    { id: 'studentName', label: 'Student Name' },
    { id: 'roomNo', label: 'Room No' },
    { id: 'category', label: 'Category' },
    { id: 'title', label: 'Title' },
    { id: 'priority', label: 'Priority' },
    { id: 'status', label: 'Status' },
    { id: 'date', label: 'Date' },
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
            {paginatedComplaints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">No complaints found matching the criteria.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedComplaints.map((row, index) => (
                <TableRow 
                  key={row.complaintId}
                  hover
                  sx={{ 
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                    '&:last-child td': { borderBottom: 0 },
                    transition: 'background-color 0.2s'
                  }}
                >
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 500 }}>{row.complaintId}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.studentName}</TableCell>
                  <TableCell>{row.roomNo}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.title}>{row.title}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${PRIORITY_COLORS[row.priority]?.dot} ${row.priority}`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        backgroundColor: PRIORITY_COLORS[row.priority]?.bg,
                        color: PRIORITY_COLORS[row.priority]?.color,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${STATUS_COLORS[row.status]?.dot} ${row.status}`}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        backgroundColor: STATUS_COLORS[row.status]?.bg,
                        color: STATUS_COLORS[row.status]?.color,
                      }}
                    />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
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
        count={complaints.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Card>
  );
}
