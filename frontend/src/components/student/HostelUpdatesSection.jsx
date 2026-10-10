import React from 'react';
import { Card, Box, Typography, List, ListItem, ListItemIcon, ListItemText, Chip } from '@mui/material';
import { Megaphone, Bell, Info, AlertCircle, Calendar } from 'lucide-react';

export default function HostelUpdatesSection({ updates = [], dynamicNotices = [] }) {
  const allNotices = [...updates, ...dynamicNotices];

  return (
    <Card
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8B5CF6',
            }}
          >
            <Megaphone size={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
              Hostel Updates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Notices, maintenance & reminders
            </Typography>
          </Box>
        </Box>
        <Chip
          label={allNotices.length > 0 ? `${allNotices.length} Notice${allNotices.length > 1 ? 's' : ''}` : 'Notice Board'}
          size="small"
          sx={{
            fontWeight: 600,
            backgroundColor: allNotices.length > 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)',
            color: allNotices.length > 0 ? '#8B5CF6' : '#64748B',
          }}
        />
      </Box>

      {/* Notices List */}
      {allNotices.length === 0 ? (
        <Box
          sx={{
            py: 6,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.secondary',
          }}
        >
          <Bell size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
            No new hostel updates
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 300 }}>
            Important announcements, maintenance notices and events will appear here.
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0, '& > *:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' } }}>
          {allNotices.map((notice, idx) => (
            <ListItem
              key={idx}
              disableGutters
              sx={{
                py: 1.75,
                px: 1,
                borderRadius: 2,
                transition: 'background-color 0.2s',
                '&:hover': { backgroundColor: 'background.default' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: notice.isUrgent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: notice.isUrgent ? '#DC2626' : '#8B5CF6',
                  }}
                >
                  {notice.isUrgent ? <AlertCircle size={18} /> : <Info size={18} />}
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {notice.title}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.25, display: 'block' }}>
                    {notice.description || notice.message}
                  </Typography>
                }
              />
              {notice.tag && (
                <Chip
                  label={notice.tag}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    color: '#8B5CF6',
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Card>
  );
}
