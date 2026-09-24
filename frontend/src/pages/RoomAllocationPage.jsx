import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Grid, 
  TextField, 
  MenuItem, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  InputAdornment,
  Divider,
  Paper
} from '@mui/material';
import { Search, Plus, UserPlus, Key, CheckCircle2 } from 'lucide-react';

// Mock Data
const MOCK_STUDENTS = [
  { id: 'STU001', name: 'Rahul Sharma', course: 'B.Tech CS', year: '1st Year' },
  { id: 'STU002', name: 'Priya Patel', course: 'B.Tech IT', year: '1st Year' },
  { id: 'STU003', name: 'Amit Singh', course: 'MBA', year: '1st Year' },
];

const MOCK_ROOMS = [
  { id: 'A101', block: 'Block A', type: 'Standard', availableBeds: 2 },
  { id: 'A102', block: 'Block A', type: 'Standard', availableBeds: 1 },
  { id: 'B201', block: 'Block B', type: 'Deluxe', availableBeds: 3 },
  { id: 'C305', block: 'Block C', type: 'Standard', availableBeds: 4 },
];

const MOCK_ALLOCATIONS = [
  { id: 'ALC001', studentName: 'Vikram Verma', studentId: 'STU089', room: 'A101', block: 'Block A', date: '2026-06-20', status: 'Allocated' },
  { id: 'ALC002', studentName: 'Neha Gupta', studentId: 'STU092', room: 'B204', block: 'Block B', date: '2026-06-19', status: 'Allocated' },
  { id: 'ALC003', studentName: 'Rohan Desai', studentId: 'STU105', room: 'C102', block: 'Block C', date: '2026-06-18', status: 'Pending Approval' },
];

export default function RoomAllocationPage() {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [allocations, setAllocations] = useState(() => {
    try {
      const saved = localStorage.getItem('hostel_allocations');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load allocations from local storage', e);
    }
    return MOCK_ALLOCATIONS;
  });

  React.useEffect(() => {
    localStorage.setItem('hostel_allocations', JSON.stringify(allocations));
  }, [allocations]);

  const handleAllocate = () => {
    if (!selectedStudent || !selectedRoom) return;
    
    const student = MOCK_STUDENTS.find(s => s.id === selectedStudent);
    const room = MOCK_ROOMS.find(r => r.id === selectedRoom);

    const newAllocation = {
      id: `ALC00${allocations.length + 1}`,
      studentName: student.name,
      studentId: student.id,
      room: room.id,
      block: room.block,
      date: new Date().toISOString().split('T')[0],
      status: 'Allocated'
    };

    setAllocations([newAllocation, ...allocations]);
    setSelectedStudent('');
    setSelectedRoom('');
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Room Allocation
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<UserPlus size={18} />}
          sx={{ 
            backgroundColor: '#4F46E5',
            '&:hover': { backgroundColor: '#4338CA' },
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Bulk Allocate
        </Button>
      </Box>

      <Grid container spacing={4}>
        {/* Allocation Form Area */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            p: 3, 
            borderRadius: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            height: '100%'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ p: 1, backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: '8px', color: '#4F46E5' }}>
                <Key size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>New Allocation</Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                select
                label="Select Student"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                fullWidth
                variant="outlined"
              >
                {MOCK_STUDENTS.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name} ({student.id}) - {student.course}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Select Room"
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                fullWidth
                variant="outlined"
                helperText="Only rooms with available beds are shown"
              >
                {MOCK_ROOMS.map((room) => (
                  <MenuItem key={room.id} value={room.id}>
                    Room {room.id} ({room.block}) - {room.availableBeds} beds available
                  </MenuItem>
                ))}
              </TextField>

              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  size="large"
                  onClick={handleAllocate}
                  disabled={!selectedStudent || !selectedRoom}
                  sx={{ 
                    backgroundColor: '#10B981',
                    color: '#fff',
                    py: 1.5,
                    fontWeight: 700,
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: '#059669' },
                    '&.Mui-disabled': { backgroundColor: 'rgba(16, 185, 129, 0.5)', color: '#fff' }
                  }}
                  startIcon={<CheckCircle2 />}
                >
                  Confirm Allocation
                </Button>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Recent Allocations Table */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            p: 3, 
            borderRadius: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Allocations</Typography>
              <TextField
                size="small"
                placeholder="Search allocations..."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={18} />
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{ width: 250 }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Allocation ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Student</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allocations.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 500, color: 'text.secondary' }}>{row.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.studentName}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.studentId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.room}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.block}</Typography>
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.date}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.status} 
                          size="small"
                          sx={{ 
                            fontWeight: 600,
                            backgroundColor: row.status === 'Allocated' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: row.status === 'Allocated' ? '#16A34A' : '#D97706'
                          }} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {allocations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No recent allocations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
