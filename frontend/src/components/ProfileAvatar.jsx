import React from 'react';
import { Avatar, Box } from '@mui/material';

export default function ProfileAvatar({ size = 40 }) {
  const scale = size / 64;

  return (
    <Avatar
      sx={{
        width: size,
        height: size,
        bgcolor: '#DEDCDB',
        border: `${Math.max(2, 3 * scale)}px solid #252525`,
      }}
    >
      <Box
        sx={{
          width: 25 * scale,
          height: 25 * scale,
          borderRadius: '50%',
          bgcolor: '#85817D',
          position: 'absolute',
          top: 14 * scale,
        }}
      />
      <Box
        sx={{
          width: 45 * scale,
          height: 22 * scale,
          borderRadius: `${24 * scale}px ${24 * scale}px ${5 * scale}px ${5 * scale}px`,
          bgcolor: '#85817D',
          position: 'absolute',
          bottom: 14 * scale,
        }}
      />
    </Avatar>
  );
}
