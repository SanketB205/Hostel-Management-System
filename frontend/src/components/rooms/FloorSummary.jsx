import React from 'react';
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
  Divider
} from '@mui/material';

export default function FloorSummary({ block }) {
  return (
    <Card sx={{ 
      borderRadius: '12px', 
      boxShadow: 'none', 
      border: '1px solid',
      borderColor: 'divider',
      backgroundColor: (theme) => theme.palette.mode === 'light' ? '#F8FAFC' : theme.palette.background.default,
      height: '100%'
    }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
          Floor Summary
        </Typography>
        
        <TableContainer sx={{ overflowX: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, px: 1 }}>Floor</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, px: 1 }}>Rooms</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#22C55E', px: 1 }}>Available</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#F59E0B', px: 1 }}>Occupied</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(block.floors || []).map((floor) => (
                <TableRow key={floor.name} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell sx={{ fontWeight: 500, px: 1 }}>{floor.name}</TableCell>
                  <TableCell align="center" sx={{ px: 1 }}>{floor.totalRooms}</TableCell>
                  <TableCell align="center" sx={{ color: '#22C55E', fontWeight: 600, px: 1 }}>{floor.available}</TableCell>
                  <TableCell align="center" sx={{ color: '#F59E0B', fontWeight: 600, px: 1 }}>{floor.occupied}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Total</Typography>
          <Box sx={{ display: 'flex', gap: 3.5, mr: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{block.totalRooms}</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#22C55E' }}>{block.available}</Typography>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F59E0B' }}>{block.occupied}</Typography>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
