import React, { useState, useEffect } from 'react';
import { complaints } from '../api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography,
  Chip,
  Collapse
} from '@mui/material';
import {
  LayoutDashboard,
  Users,
  Bed,
  UserCheck,
  Bell,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Building,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 280;

const SIDEBAR_ITEMS = [
  { group: 'Overview' },
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Students', path: '/students', icon: Users },
  { title: 'Rooms', path: '/rooms', icon: Bed },
  { title: 'Staff', path: '/staff', icon: UserCheck },
  { title: 'Complaints', path: '/complaints', icon: Bell },
  { group: 'Management' },
  { 
    title: 'Attendance', 
    icon: FileText,
    children: [
      { title: 'Student', path: '/attendance/student' },
      { title: 'Staff', path: '/attendance/staff' }
    ]
  },
  { title: 'Finances', path: '/finances', icon: DollarSign },
  { group: 'System' },
  { title: 'Settings', path: '/settings', icon: Settings }
];

const drawerPaperSx = {
  width: drawerWidth,
  boxSizing: 'border-box',
  backgroundColor: 'background.paper',
  color: 'text.primary',
  borderRight: '1px solid',
  borderColor: 'divider',
  px: 2,
  py: 3,
  zIndex: (theme) => theme.zIndex.modal + 10,
};

export default function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const role = user?.role;

  const [complaintCount, setComplaintCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const fetchCount = async () => {
      try {
        if (user.role === 'student') {
          // Student: count ALL own complaints (not just pending)
          const res = await complaints.listMine();
          if (active) setComplaintCount((res.data || []).length);
        } else if (user.role === 'rector') {
          // Rector: count ALL student complaints (not just pending)
          const res = await complaints.listAll({ creatorRole: 'student' });
          if (active) setComplaintCount((res.data || []).length);
        } else if (user.role === 'admin') {
          // Admin: count ALL complaints from both students AND rectors
          const res = await complaints.listAll(); // No creatorRole filter = get all
          if (active) setComplaintCount((res.data || []).length);
        }
      } catch (err) {
        console.error('Failed to fetch complaint count:', err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  const filteredSidebarItems = React.useMemo(() => {
    return SIDEBAR_ITEMS.map(item => {
      if (item.children) {
        const filteredChildren = item.children.filter(child => {
          if (role === 'student') {
            if (child.path === '/attendance/staff') return false;
          }
          if (role === 'rector') {
            if (child.path === '/attendance/staff') return false;
          }
          return true;
        });
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }

      // Hide students/staff pages from student role
      if (role === 'student') {
        if (item.path === '/students' || item.path === '/staff') return null;
      }

      return item;
    }).filter(Boolean);
  }, [role]);

  const [openSubmenus, setOpenSubmenus] = React.useState({});

  React.useEffect(() => {
    const nextState = {};
    filteredSidebarItems.forEach(item => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          location.pathname.startsWith(child.path)
        );
        nextState[item.title] = hasActiveChild;
      }
    });
    setOpenSubmenus(nextState);
  }, [location.pathname, filteredSidebarItems]);

  const handleToggleSubmenu = (title) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const drawerContent = (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, px: 1 }}>
        <Box 
          sx={{ 
            width: 36, 
            height: 36, 
            borderRadius: 2, 
            background: 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <Building size={20} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5, fontSize: '1.1rem' }}>
          HostelSpace
        </Typography>
      </Box>
      <List sx={{ pt: 0, flex: 1 }}>
        {filteredSidebarItems.map((item, idx) => {
          if (item.group) {
            return (
              <Typography 
                key={idx} 
                variant="overline" 
                sx={{ 
                  display: 'block', 
                  color: 'text.secondary', 
                  fontWeight: 600, 
                  px: 2, 
                  mt: idx === 0 ? 0 : 3, 
                  mb: 1,
                  letterSpacing: 1
                }}
              >
                {item.group}
              </Typography>
            );
          }

          const Icon = item.icon;

          if (item.children) {
            const isOpen = !!openSubmenus[item.title];
            const isParentActive = item.children.some(child => 
              location.pathname.startsWith(child.path)
            );
            
            return (
              <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <ListItem disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    onClick={() => handleToggleSubmenu(item.title)}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                      px: 2,
                      color: isParentActive ? 'text.primary' : 'text.secondary',
                      background: isParentActive ? 'linear-gradient(90deg, rgba(79,70,229,0.15) 0%, rgba(37,99,235,0.05) 100%)' : 'transparent',
                      borderLeft: isParentActive ? '3px solid #4F46E5' : '3px solid transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: isParentActive 
                          ? 'linear-gradient(90deg, rgba(79,70,229,0.2) 0%, rgba(37,99,235,0.1) 100%)' 
                          : 'rgba(255,255,255,0.05)',
                        color: 'text.primary',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      <Icon size={20} strokeWidth={isParentActive ? 2.5 : 2} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.title} 
                      sx={{ 
                        '& .MuiTypography-root': {
                          fontWeight: isParentActive ? 600 : 500,
                          fontSize: '0.95rem'
                        }
                      }} 
                    />
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ pl: 4 }}>
                    {item.children.map((child, cIdx) => {
                      const isChildActive = location.pathname.startsWith(child.path);
                      return (
                        <ListItem key={cIdx} disablePadding sx={{ mb: 0.5 }}>
                          <ListItemButton
                            component={Link}
                            to={child.path}
                            onClick={() => {
                              if (window.innerWidth < 900 && handleDrawerToggle) handleDrawerToggle();
                            }}
                            sx={{
                              borderRadius: 2,
                              py: 0.8,
                              px: 2,
                              color: isChildActive ? 'primary.main' : 'text.secondary',
                              background: isChildActive ? 'rgba(79,70,229,0.08)' : 'transparent',
                              transition: 'all 0.2s',
                              '&:hover': {
                                background: 'rgba(255,255,255,0.05)',
                                color: 'text.primary',
                                transform: 'translateX(4px)'
                              }
                            }}
                          >
                            <ListItemText 
                              primary={child.title} 
                              sx={{ 
                                '& .MuiTypography-root': {
                                  fontWeight: isChildActive ? 600 : 500,
                                  fontSize: '0.9rem'
                                }
                              }} 
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </Box>
            );
          }

          const isActive = item.path ? location.pathname.startsWith(item.path) : false;
          return (
            <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={item.path ? Link : 'div'}
                to={item.path || '#'}
                onClick={() => {
                  if (window.innerWidth < 900 && handleDrawerToggle) handleDrawerToggle();
                }}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  px: 2,
                  color: isActive ? 'text.primary' : 'text.secondary',
                  background: isActive ? 'linear-gradient(90deg, rgba(79,70,229,0.15) 0%, rgba(37,99,235,0.05) 100%)' : 'transparent',
                  borderLeft: isActive ? '3px solid #4F46E5' : '3px solid transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: isActive 
                      ? 'linear-gradient(90deg, rgba(79,70,229,0.2) 0%, rgba(37,99,235,0.1) 100%)' 
                      : 'rgba(255,255,255,0.05)',
                    color: 'text.primary',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </ListItemIcon>
                <ListItemText 
                  primary={item.title} 
                  sx={{ 
                    '& .MuiTypography-root': {
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.95rem'
                    }
                  }} 
                />
                {item.title === 'Complaints' ? (
                  complaintCount > 0 && (
                    <Chip 
                      label={complaintCount} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        backgroundColor: '#EF4444', 
                        color: 'white', 
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }} 
                    />
                  )
                ) : item.badge ? (
                  <Chip 
                    label={item.badge} 
                    size="small" 
                    sx={{ 
                      height: 20, 
                      backgroundColor: '#EF4444', 
                      color: 'white', 
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }} 
                  />
                ) : null}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ mt: 'auto', pt: 2 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2,
              color: '#EF4444',
              py: 1.2,
              px: 2,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                transform: 'translateX(4px)'
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
              <LogOut size={20} />
            </ListItemIcon>
            <ListItemText 
              primary="Log Out" 
              sx={{ '& .MuiTypography-root': { fontWeight: 500 } }} 
            />
          </ListItemButton>
        </ListItem>
      </Box>
    </>
  );

  return (
    <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': drawerPaperSx,
        }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': drawerPaperSx,
          zIndex: (theme) => theme.zIndex.modal + 10,
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
