import React from 'react';
import {
  Box, Card, InputBase, Select, MenuItem,
  Button, FormControl, InputLabel, useTheme
} from '@mui/material';
import { Search, RotateCcw, Plus } from 'lucide-react';

export default function StudentFilters({
  filters, setFilters, onReset, onAddClick,
  blocks = [],   // array of block objects from RoomContext
  isRector = false,
}) {
  const theme = useTheme();

  const handleFilterChange = (field) => (event) =>
    setFilters({ ...filters, [field]: event.target.value });

  return (
    <Card sx={{
      p: 3, mb: 4, borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3,
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
      }}>
        {/* Search */}
        <Box sx={{
          display: 'flex', alignItems: 'center', flex: 1,
          backgroundColor: 'background.default',
          border: '1px solid', borderColor: 'divider',
          borderRadius: 2, px: 2, py: 1,
          transition: 'border-color 0.2s',
          '&:focus-within': { borderColor: '#4F46E5' },
        }}>
          <Search size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />
          <InputBase
            placeholder="Search by Name, Reg No, or Room..."
            value={filters.search}
            onChange={handleFilterChange('search')}
            sx={{ width: '100%' }}
          />
        </Box>

        {/* Dropdowns + actions */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, flexWrap: 'wrap',
        }}>

          {/* ── Block filter ── */}
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Block</InputLabel>
            <Select
              value={filters.block}
              label="Block"
              onChange={handleFilterChange('block')}
            >
              <MenuItem value="All">All Blocks</MenuItem>
              {blocks.map(b => (
                <MenuItem key={b.name} value={b.name}>{b.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Course</InputLabel>
            <Select value={filters.course} label="Course" onChange={handleFilterChange('course')}>
              <MenuItem value="All">All Courses</MenuItem>
              <MenuItem value="CSE">CSE</MenuItem>
              <MenuItem value="ECE">ECE</MenuItem>
              <MenuItem value="ME">ME</MenuItem>
              <MenuItem value="CE">CE</MenuItem>
              <MenuItem value="BBA">BBA</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Year</InputLabel>
            <Select value={filters.year} label="Year" onChange={handleFilterChange('year')}>
              <MenuItem value="All">All Years</MenuItem>
              <MenuItem value="1st">1st</MenuItem>
              <MenuItem value="2nd">2nd</MenuItem>
              <MenuItem value="3rd">3rd</MenuItem>
              <MenuItem value="4th">4th</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filters.status} label="Status" onChange={handleFilterChange('status')}>
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Present">Present</MenuItem>
              <MenuItem value="Outing">Outing</MenuItem>
              <MenuItem value="Leave">Leave</MenuItem>
              <MenuItem value="Late">Late</MenuItem>
              <MenuItem value="Absent">Absent</MenuItem>
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

          {/* Hide "Add Student" for rector — they only mark attendance */}
          {!isRector && (
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={onAddClick}
              sx={{ backgroundColor: '#4F46E5', '&:hover': { backgroundColor: '#4338CA' } }}
            >
              Add Student
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  );
}
