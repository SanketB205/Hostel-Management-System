import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Chip,
  Tabs,
  Tab,
  InputBase,
  IconButton,
  Button,
  useTheme,
  Avatar
} from '@mui/material';
import { Search, Filter, MoreHorizontal } from 'lucide-react';

const RECENT_STUDENTS = [
  { id: 'STU-1024', name: 'John Doe', room: 'A-101', course: 'Computer Science', status: 'Active' },
  { id: 'STU-1025', name: 'Jane Smith', room: 'B-204', course: 'Electrical Eng.', status: 'Active' },
  { id: 'STU-1026', name: 'Mike Johnson', room: 'C-305', course: 'Mechanical Eng.', status: 'Inactive' },
  { id: 'STU-1027', name: 'Emily Davis', room: 'A-102', course: 'Business Admin', status: 'Active' },
  { id: 'STU-1028', name: 'William Brown', room: 'B-205', course: 'Civil Eng.', status: 'Pending' },
];

export default function RecentActivityTables() {
  const [tabIndex, setTabIndex] = useState(0);
  const theme = useTheme();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'error';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ mt: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Recent Registrations</Typography>
          <Tabs 
            value={tabIndex} 
            onChange={(e, v) => setTabIndex(v)}
            sx={{ 
              minHeight: 40,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 40, py: 1 },
              '& .MuiTabs-indicator': { backgroundColor: '#4F46E5', height: 3, borderRadius: '3px 3px 0 0' },
              '& .Mui-selected': { color: '#4F46E5 !important' }
            }}
          >
            <Tab label="All Students" />
            <Tab label="Pending" />
            <Tab label="Archived" />
          </Tabs>
        </Box>
        <Box sx={{ pb: 1.5, display: { xs: 'none', sm: 'block' } }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: 'background.default',
              border: 1, borderColor: 'divider',
              borderRadius: 2,
              px: 1.5,
              py: 0.5,
            }}
          >
            <Search size={16} color={theme.palette.text.secondary} />
            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>Search...</Typography>
          </Box>
        </Box>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Course</TableCell>
              <TableCell>Room</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {RECENT_STUDENTS.map((row, idx) => (
              <TableRow 
                key={idx}
                sx={{ 
                  '&:last-child td': { borderBottom: 0 },
                  transition: 'background-color 0.2s',
                  '&:hover': { backgroundColor: 'background.default' }
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 32, height: 32, backgroundColor: 'action.hover', color: '#4F46E5', fontSize: '0.875rem', fontWeight: 600 }}>
                      {row.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {row.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {row.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', display: { xs: 'none', md: 'table-cell' } }}>{row.course}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.room}</Typography>
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'table-cell' } }}>{row.date}</TableCell>
                <TableCell>
                  <Chip 
                    label={row.status} 
                    size="small" 
                    sx={{ 
                      height: 22, 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      backgroundColor: 
                        row.status === 'Active' ? 'rgba(22, 163, 74, 0.1)' : 
                        row.status === 'Inactive' ? 'rgba(220, 38, 38, 0.1)' : 
                        'rgba(217, 119, 6, 0.1)',
                      color: 
                        row.status === 'Active' ? '#16A34A' : 
                        row.status === 'Inactive' ? '#DC2626' : 
                        '#D97706',
                    }} 
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small">
                    <MoreHorizontal size={18} color={theme.palette.text.secondary} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination Footer */}
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Showing 1 to 5 of 820 entries
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" disabled size="small" sx={{ borderColor: 'divider' }}>Previous</Button>
          <Button variant="outlined" size="small" sx={{ borderColor: 'divider', color: 'text.primary' }}>Next</Button>
        </Box>
      </Box>
    </Card>
  );
}
