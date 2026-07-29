import React from 'react';
import { 
  Box, 
  Card, 
  InputBase, 
  Select, 
  MenuItem, 
  Button, 
  FormControl, 
  InputLabel,
  useTheme 
} from '@mui/material';
import { Search, RotateCcw, Plus } from 'lucide-react';

export default function ComplaintFilters({ filters, setFilters, onReset, onAddClick }) {
  const theme = useTheme();

  const handleFilterChange = (field) => (event) => {
    setFilters({ ...filters, [field]: event.target.value });
  };

  return (
    <Card sx={{ p: 3, mb: 4, borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' }, 
        gap: 3,
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between'
      }}>
        {/* Search Input */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            flex: 1,
            backgroundColor: 'background.default',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: 2,
            py: 1,
            transition: 'border-color 0.2s',
            '&:focus-within': {
              borderColor: '#4F46E5',
            }
          }}
        >
          <Search size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />
          <InputBase
            placeholder="Search by ID, Name, Room, or Title..."
            value={filters.search}
            onChange={handleFilterChange('search')}
            sx={{ width: '100%' }}
          />
        </Box>

        {/* Dropdowns & Actions */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 2,
          flexWrap: 'wrap'
        }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={handleFilterChange('status')}
            >
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Resolved">Resolved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={handleFilterChange('category')}
            >
              <MenuItem value="All">All Categories</MenuItem>
              <MenuItem value="Electrical">Electrical</MenuItem>
              <MenuItem value="Plumbing">Plumbing</MenuItem>
              <MenuItem value="Carpentry">Carpentry</MenuItem>
              <MenuItem value="Internet">Internet</MenuItem>
              <MenuItem value="Cleaning">Cleaning</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={filters.priority}
              label="Priority"
              onChange={handleFilterChange('priority')}
            >
              <MenuItem value="All">All Priorities</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Hostel Block</InputLabel>
            <Select
              value={filters.block}
              label="Hostel Block"
              onChange={handleFilterChange('block')}
            >
              <MenuItem value="All">All Blocks</MenuItem>
              <MenuItem value="Block A">Block A</MenuItem>
              <MenuItem value="Block B">Block B</MenuItem>
              <MenuItem value="Block C">Block C</MenuItem>
            </Select>
          </FormControl>

          <Button 
            variant="outlined" 
            startIcon={<RotateCcw size={16} />}
            onClick={onReset}
            sx={{ borderColor: 'divider', color: 'text.secondary' }}
          >
            Reset
          </Button>

          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />}
            onClick={onAddClick}
            sx={{ 
              backgroundColor: '#4F46E5',
              '&:hover': { backgroundColor: '#4338CA' }
            }}
          >
            Add Complaint
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
