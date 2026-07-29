import React, { useState, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import ComplaintStats from '../components/complaints/ComplaintStats';
import ComplaintFilters from '../components/complaints/ComplaintFilters';
import ComplaintTable from '../components/complaints/ComplaintTable';

const generateMockComplaints = () => {
  const categories = ['Electrical', 'Plumbing', 'Carpentry', 'Internet', 'Cleaning', 'Other'];
  const titles = [
    'Fan Not Working', 'Leaking Tap', 'Broken Chair', 'Wi-Fi disconnects frequently', 
    'Room not cleaned properly', 'AC Cooling Issue', 'Door Lock Jammed', 'Geyser Not Heating'
  ];
  const firstNames = ['Sanket', 'Aarav', 'Vihaan', 'Aditya', 'Rohan', 'Neha', 'Priya', 'Aditi'];
  const lastNames = ['Bhujbal', 'Sharma', 'Verma', 'Singh', 'Patel', 'Kumar', 'Gupta', 'Desai'];
  const blocks = ['Block A', 'Block B', 'Block C'];

  const desiredStatusDistribution = [
    ...Array(24).fill('Pending'),
    ...Array(18).fill('In Progress'),
    ...Array(114).fill('Resolved')
  ];

  return desiredStatusDistribution.map((status, index) => {
    const studentName = index === 0 ? 'Sanket Bhujbal' : `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const roomNo = index === 0 ? 'A-101' : `${blocks[Math.floor(Math.random() * blocks.length)].split(' ')[1]}-${100 + Math.floor(Math.random() * 300)}`;
    const category = index === 0 ? 'Electrical' : categories[Math.floor(Math.random() * categories.length)];
    const title = index === 0 ? 'Fan Not Working' : titles[Math.floor(Math.random() * titles.length)];
    
    let priority = 'Low';
    if (index === 0) priority = 'High';
    else if (index < 8) priority = 'High';
    else if (index % 3 === 0) priority = 'Medium';
    
    const complaintId = `CMP${String(index + 1).padStart(3, '0')}`;

    const date = new Date(2026, 5, 20 - Math.floor(Math.random() * 10));
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

    return {
      complaintId: index === 0 ? 'CMP001' : complaintId,
      studentName,
      roomNo,
      category,
      title,
      priority,
      status,
      date: index === 0 ? '20-Jun-2026' : formattedDate
    };
  });
};

const INITIAL_COMPLAINTS = generateMockComplaints();

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState(() => {
    try {
      const saved = localStorage.getItem('hostel_complaints');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load complaints from local storage', e);
    }
    return INITIAL_COMPLAINTS;
  });

  React.useEffect(() => {
    localStorage.setItem('hostel_complaints', JSON.stringify(complaints));
  }, [complaints]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'All',
    category: 'All',
    priority: 'All',
    block: 'All'
  });

  const handleResetFilters = () => {
    setFilters({ search: '', status: 'All', category: 'All', priority: 'All', block: 'All' });
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = c.studentName.toLowerCase().includes(filters.search.toLowerCase()) || 
                            c.complaintId.toLowerCase().includes(filters.search.toLowerCase()) || 
                            c.roomNo.toLowerCase().includes(filters.search.toLowerCase()) ||
                            c.title.toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = filters.status === 'All' || c.status === filters.status;
      const matchesCategory = filters.category === 'All' || c.category === filters.category;
      const matchesPriority = filters.priority === 'All' || c.priority === filters.priority;
      const matchesBlock = filters.block === 'All' || c.roomNo.startsWith(filters.block.split(' ')[1]);

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority && matchesBlock;
    });
  }, [complaints, filters]);

  const handleAddClick = () => {
    console.log("Add complaint clicked");
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        Complaint Management
      </Typography>
      
      <ComplaintStats complaints={filteredComplaints} />
      
      <ComplaintFilters 
        filters={filters} 
        setFilters={setFilters} 
        onReset={handleResetFilters}
        onAddClick={handleAddClick}
      />
      
      <ComplaintTable complaints={filteredComplaints} />
    </Box>
  );
}
