import React from 'react';
import { Box } from '@mui/material';
import StudentRoomCard from './StudentRoomCard';
import StudentAttendanceCard from './StudentAttendanceCard';
import StudentFinanceCard from './StudentFinanceCard';
import StudentComplaintCard from './StudentComplaintCard';
import HostelUpdatesCard from './HostelUpdatesCard';

export default function StudentSummaryCards({
  student,
  attendanceStats,
  financeStats,
  complaintStats,
  updates = [],
  dynamicNotices = [],
  onRoomClick,
}) {
  const activeAllocation = (student?.allocations || []).find(a => a.status === 'active') || (student?.allocations || [])[0];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(5, 1fr)',
        },
        gap: 3,
        mb: 4,
      }}
    >
      <StudentRoomCard allocation={activeAllocation} onClick={onRoomClick} />
      <StudentAttendanceCard attendanceStats={attendanceStats} />
      <StudentFinanceCard financeStats={financeStats} />
      <StudentComplaintCard complaintStats={complaintStats} />
      <HostelUpdatesCard updates={updates} dynamicNotices={dynamicNotices} />
    </Box>
  );
}
