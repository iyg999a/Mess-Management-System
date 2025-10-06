// src/components/LeaveManager.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function LeaveManager() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leaves')
        .select('*, students(name, roll_no)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLeaves(data || []);
    } catch (error) {
      alert(`Error fetching leaves: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateLeaveStatus = async (leaveId, newStatus) => {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status: newStatus })
        .eq('id', leaveId);
      
      if (error) throw error;
      
      setLeaves(leaves.map(leave => 
        leave.id === leaveId ? { ...leave, status: newStatus } : leave
      ));
      alert(`Leave request has been ${newStatus.toLowerCase()}!`);
    } catch (error) {
      alert(`Error updating leave status: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status.toLowerCase().replace(' ', '-');
    return <span className={`status-badge status-${statusClass}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '1rem' }}>Loading leave requests...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h3 className="card-title">📋 Leave Requests ({leaves.length})</h3>
        <div className="list">
          {leaves.map(leave => (
            <div key={leave.id} className="list-item">
              <div className="list-item-content">
                <div className="list-item-title">
                  {leave.students?.name || leave.student_no}
                </div>
                <div className="list-item-subtitle">
                  {leave.start_date} to {leave.end_date}
                  <br />
                  Status: {getStatusBadge(leave.status)}
                </div>
              </div>
              {leave.status === 'pending' && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')} 
                    className="btn btn-success btn-sm"
                  >
                    ✅ Approve
                  </button>
                  <button 
                    onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')} 
                    className="btn btn-warning btn-sm"
                  >
                    ❌ Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {leaves.length === 0 && (
            <div className="text-center p-4" style={{ color: '#6b7280' }}>
              No leave requests found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}