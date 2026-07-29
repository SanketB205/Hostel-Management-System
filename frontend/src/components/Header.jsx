import React, { useContext } from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  InputBase, 
  Badge, 
  Box,
  Typography,
  useTheme
} from '@mui/material';
import { Search, Bell, Menu as MenuIcon, Moon, Sun } from 'lucide-react';
import { ColorModeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import ProfileAvatar from './ProfileAvatar';

export default function Header({ handleDrawerToggle }) {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { user } = useAuth();

  const email = user?.email || 'admin@example.com';
  const role = user?.role || 'admin';
  const name = email.split('@')[0];
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        color: 'text.primary',
        backgroundColor: 'background.paper',
        zIndex: (theme) => theme.zIndex.modal + 10,
        borderBottom: 1,
        borderColor: 'divider'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '72px !important', px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Search Bar */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              backgroundColor: 'action.hover',
              borderRadius: 3,
              px: 2,
              py: 1,
              width: '100%',
              maxWidth: 400,
              transition: 'all 0.2s',
              border: '1px solid transparent',
              '&:focus-within': {
                backgroundColor: 'background.paper',
                borderColor: '#4F46E5',
                boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)'
              }
            }}
          >
            <Search size={18} color={theme.palette.text.secondary} />
            <InputBase
              placeholder="Search students, rooms..."
              sx={{ ml: 1.5, flex: 1, fontSize: '0.9rem' }}
            />
          </Box>
        </Box>

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton 
            sx={{ 
              backgroundColor: 'background.default', 
              border: 1, borderColor: 'divider',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontWeight: 700 } }}>
              <Bell size={20} color={theme.palette.text.secondary} />
            </Badge>
          </IconButton>

          <IconButton 
            onClick={colorMode.toggleColorMode}
            sx={{ 
              backgroundColor: 'background.default', 
              border: 1, borderColor: 'divider',
              '&:hover': { backgroundColor: 'action.hover' }
            }}
          >
            {theme.palette.mode === 'dark' ? <Sun size={20} color={theme.palette.text.secondary} /> : <Moon size={20} color={theme.palette.text.secondary} />}
          </IconButton>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              cursor: 'pointer',
              p: 0.5,
              pr: 2,
              borderRadius: 8,
              border: '1px solid transparent',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'background.default',
                border: 1, borderColor: 'divider'
              }
            }}
          >
            <ProfileAvatar size={36} />
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {capitalizedName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                {capitalizedRole}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
