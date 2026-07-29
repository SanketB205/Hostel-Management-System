import React, { useState, useRef } from 'react';
import { 
  Box, 
  Card, 
  InputBase, 
  Select, 
  MenuItem, 
  Button, 
  FormControl, 
  InputLabel,
  useTheme,
  Popper,
  Grow,
  Paper,
  ClickAwayListener,
  MenuList
} from '@mui/material';
import { Search, RotateCcw, Plus } from 'lucide-react';

export default function RoomFilters({ filters, setFilters, onReset, onAddClick, onBulkAddClick, blocks = [], isAdmin }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  const handleMenuItemClick = (action) => {
    setOpen(false);
    if (action === 'single') {
      onAddClick();
    } else if (action === 'bulk') {
      if (onBulkAddClick) onBulkAddClick();
    }
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

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
              borderColor: '#6366F1',
            }
          }}
        >
          <Search size={20} color={theme.palette.text.secondary} style={{ marginRight: 8 }} />
          <InputBase
            placeholder="Search room number..."
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
            <InputLabel>Block</InputLabel>
            <Select
              value={filters.block}
              label="Block"
              onChange={handleFilterChange('block')}
            >
              <MenuItem value="All Blocks">All Blocks</MenuItem>
              {blocks.map((b) => (
                <MenuItem key={b.name} value={b.name}>{b.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Floor</InputLabel>
            <Select
              value={filters.floor}
              label="Floor"
              onChange={handleFilterChange('floor')}
            >
              <MenuItem value="All Floors">All Floors</MenuItem>
              <MenuItem value="Floor 1">Floor 1</MenuItem>
              <MenuItem value="Floor 2">Floor 2</MenuItem>
              <MenuItem value="Floor 3">Floor 3</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Room Type</InputLabel>
            <Select
              value={filters.roomType}
              label="Room Type"
              onChange={handleFilterChange('roomType')}
            >
              <MenuItem value="All Types">All Types</MenuItem>
              <MenuItem value="Standard">Standard</MenuItem>
              <MenuItem value="Deluxe">Deluxe</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={handleFilterChange('status')}
            >
              <MenuItem value="All Status">All Status</MenuItem>
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="Occupied">Occupied</MenuItem>
              <MenuItem value="Full">Full</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
              <MenuItem value="Reserved">Reserved</MenuItem>
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

          {isAdmin && (
            <>
              <Button 
                variant="contained" 
                ref={anchorRef}
                startIcon={<Plus size={18} />}
                onClick={handleToggle}
                aria-controls={open ? 'split-button-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="menu"
                sx={{ 
                  backgroundColor: '#6366F1',
                  '&:hover': { backgroundColor: '#4F46E5' }
                }}
              >
                Add Room
              </Button>
              
              <Popper
                sx={{ zIndex: 1000 }}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
              >
                {({ TransitionProps, placement }) => (
                  <Grow
                    {...TransitionProps}
                    style={{
                      transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                    }}
                  >
                    <Paper sx={{ mt: 0.5, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
                      <ClickAwayListener onClickAway={handleClose}>
                        <MenuList id="split-button-menu" autoFocusItem>
                          <MenuItem onClick={() => handleMenuItemClick('single')}>
                            Add Single Room
                          </MenuItem>
                          <MenuItem onClick={() => handleMenuItemClick('bulk')}>
                            Bulk Add Rooms
                          </MenuItem>
                        </MenuList>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>
            </>
          )}
        </Box>
      </Box>
    </Card>
  );
}
