// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard({ session }) {
  const [students, setStudents] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [bills, setBills] = useState([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRollNo, setNewStudentRollNo] = useState('');
  const [newStudentBranch, setNewStudentBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      if (studentError) throw studentError;
      setStudents(studentData || []);

      // Fetch leaves
      const { data: leaveData, error: leaveError } = await supabase
        .from('leaves')
        .select('*, students(name, roll_no)')
        .order('created_at', { ascending: false });
      if (leaveError) throw leaveError;
      setLeaves(leaveData || []);

      // Fetch bills
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .select('*, students(name, roll_no)')
        .order('year, month', { ascending: false });
      if (billError) throw billError;
      setBills(billData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentRollNo.trim() || !newStudentBranch.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .insert([{ 
          name: newStudentName.trim(), 
          roll_no: newStudentRollNo.trim().toUpperCase(), 
          branch: newStudentBranch.trim() 
        }]);
      
      if (error) throw error;
      
      alert('Student added successfully!');
      setNewStudentName('');
      setNewStudentRollNo('');
      setNewStudentBranch('');
      fetchData();
    } catch (error) {
      alert(`Error adding student: ${error.message}`);
    }
  };

  const handleDeleteStudent = async (rollNo) => {
    if (!window.confirm(`Are you sure you want to delete student ${rollNo}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('roll_no', rollNo);
      
      if (error) throw error;
      
        setStudents(students.filter(student => student.roll_no !== rollNo));
        alert('Student deleted successfully!');
    } catch (error) {
      alert(`Error deleting student: ${error.message}`);
    }
  };

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

  const handleGenerateBills = async () => {
    if (!window.confirm('This will generate/update bills for all students for September 2025. Are you sure?')) {
      return;
    }

    const BILLING_YEAR = 2025;
    const BILLING_MONTH = 9;
    const BASE_AMOUNT = 4500;
    const COST_PER_DAY = 150;

    try {
      // Get all students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('roll_no');
      if (studentsError) throw studentsError;

      for (const student of students) {
        // Get approved leaves for the billing month
        const { data: approvedLeaves, error: leavesError } = await supabase
          .from('leaves')
          .select('start_date, end_date')
          .eq('student_no', student.roll_no)
          .eq('status', 'Approved')
          .gte('start_date', `${BILLING_YEAR}-0${BILLING_MONTH}-01`)
          .lte('end_date', `${BILLING_YEAR}-0${BILLING_MONTH}-30`);
        
        if (leavesError) throw leavesError;

        let totalLeaveDays = 0;
        approvedLeaves.forEach(leave => {
          const start = new Date(leave.start_date);
          const end = new Date(leave.end_date);
          const diffTime = Math.abs(end - start);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          totalLeaveDays += diffDays;
        });

        const finalAmount = BASE_AMOUNT - (totalLeaveDays * COST_PER_DAY);
        
        const { error: billError } = await supabase
          .from('bills')
          .upsert(
            { 
              student_no: student.roll_no, 
              month: BILLING_MONTH, 
              year: BILLING_YEAR, 
              leave_days: totalLeaveDays, 
              final_amount: finalAmount, 
              status: 'Unpaid' 
            }, 
            { onConflict: 'student_no, month, year' }
          );
        
        if (billError) throw billError;
      }

      alert('Bills for September 2025 have been generated successfully!');
      fetchData();
    } catch (error) {
      alert(`Error generating bills: ${error.message}`);
    }
  };

    const handleMarkAsPaid = async (billId) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: 'Paid' })
        .eq('id', billId);
      
      if (error) throw error;
      
      setBills(bills.map(bill => 
        bill.id === billId ? { ...bill, status: 'Paid' } : bill
      ));
      alert('Bill marked as paid!');
    } catch (error) {
      alert(`Error updating bill: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
    await supabase.auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status.toLowerCase().replace(' ', '-');
    return <span className={`status-badge status-${statusClass}`}>{status}</span>;
  };

  // Calculate statistics
  const stats = {
    totalStudents: students.length,
    pendingLeaves: leaves.filter(leave => leave.status === 'pending').length,
    unpaidBills: bills.filter(bill => bill.status === 'Unpaid').length,
    totalRevenue: bills.filter(bill => bill.status === 'Paid').reduce((sum, bill) => sum + bill.final_amount, 0)
  };

  if (loading) {
    return (
      <div className="container">
        <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
          <div className="loading-spinner"></div>
          <span className="ml-3">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div className="flex justify-between items-center">
          <div>
            <h1>🎛️ Admin Dashboard</h1>
            <p className="mt-2" style={{ color: '#6b7280' }}>
              Welcome back, <strong>{session.user.email}</strong>
            </p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">👥 Total Students</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1', margin: 0 }}>
                {stats.totalStudents}
              </p>
            </div>
            <div style={{ fontSize: '3rem', opacity: 0.3 }}>👥</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">📋 Pending Leaves</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
                {stats.pendingLeaves}
              </p>
            </div>
            <div style={{ fontSize: '3rem', opacity: 0.3 }}>📋</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">💰 Unpaid Bills</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', margin: 0 }}>
                {stats.unpaidBills}
              </p>
            </div>
            <div style={{ fontSize: '3rem', opacity: 0.3 }}>💰</div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="card-title">💵 Total Revenue</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981', margin: 0 }}>
                ₹{stats.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div style={{ fontSize: '3rem', opacity: 0.3 }}>💵</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav">
        <button 
          className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-button ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          👥 Students
        </button>
        <button 
          className={`nav-button ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          💰 Bills
        </button>
        <button 
          className={`nav-button ${activeTab === 'leaves' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaves')}
        >
          📋 Leaves
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
          <div className="card">
            <h3 className="card-title">📊 Quick Actions</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleGenerateBills} 
                className="btn btn-primary"
              >
                💰 Generate Bills for September 2025
              </button>
              <button 
                onClick={() => setActiveTab('students')} 
                className="btn btn-secondary"
              >
                👥 Manage Students
              </button>
              <button 
                onClick={() => setActiveTab('leaves')} 
                className="btn btn-warning"
              >
                📋 Review Leave Requests ({stats.pendingLeaves} pending)
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="card-title">📈 Recent Activity</h3>
            <div className="list">
              {[...bills.slice(0, 5), ...leaves.slice(0, 5)]
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, 5)
                .map((item, index) => (
                  <div key={index} className="list-item">
                    <div className="list-item-content">
                      <div className="list-item-title">
                        {item.student_no ? 
                          `Bill for ${item.students?.name || item.student_no}` :
                          `Leave request from ${item.students?.name || item.student_no}`
                        }
                      </div>
                      <div className="list-item-subtitle">
                        {item.student_no ? 
                          `₹${item.final_amount} - ${item.status}` :
                          `${item.start_date} to ${item.end_date} - ${item.status}`
                        }
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div>
          {/* Add Student Form */}
          <div className="card">
            <h3 className="card-title">👥 Add New Student</h3>
      <form onSubmit={handleAddStudent}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="rollNo">Roll Number</label>
                  <input 
                    id="rollNo"
                    type="text" 
                    className="form-input"
                    placeholder="e.g., CS001" 
                    value={newStudentRollNo} 
                    onChange={(e) => setNewStudentRollNo(e.target.value.toUpperCase())} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input 
                    id="name"
                    type="text" 
                    className="form-input"
                    placeholder="Student's full name" 
                    value={newStudentName} 
                    onChange={(e) => setNewStudentName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="branch">Branch</label>
                  <input 
                    id="branch"
                    type="text" 
                    className="form-input"
                    placeholder="e.g., Computer Science" 
                    value={newStudentBranch} 
                    onChange={(e) => setNewStudentBranch(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-3">
                ➕ Add Student
              </button>
      </form>
          </div>

          {/* Students List */}
          <div className="card">
            <h3 className="card-title">👥 Student List ({students.length})</h3>
            <div className="list">
        {students.map(student => (
                <div key={student.roll_no} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">{student.name}</div>
                    <div className="list-item-subtitle">
                      {student.roll_no} | {student.branch}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteStudent(student.roll_no)} 
                    className="btn btn-danger btn-sm"
                  >
                    🗑️ Delete
                  </button>
                </div>
              ))}
              {students.length === 0 && (
                <div className="text-center p-4" style={{ color: '#6b7280' }}>
                  No students found. Add your first student above.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bills' && (
        <div>
          <div className="card">
            <h3 className="card-title">💰 Bill Management</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleGenerateBills} 
                className="btn btn-primary"
              >
                💰 Generate Bills for September 2025
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">📄 Generated Bills ({bills.length})</h3>
            <div className="list">
        {bills.map(bill => (
                <div key={bill.id} className="list-item">
                  <div className="list-item-content">
                    <div className="list-item-title">
                      {bill.students?.name || bill.student_no}
                    </div>
                    <div className="list-item-subtitle">
                      {bill.month}/{bill.year} | ₹{bill.final_amount}
                      {bill.leave_days > 0 && ` | ${bill.leave_days} leave days`}
                    </div>
                    <div className="list-item-meta">
                      Status: {getStatusBadge(bill.status)}
                    </div>
                  </div>
            {bill.status === 'Unpaid' && (
                    <button 
                      onClick={() => handleMarkAsPaid(bill.id)} 
                      className="btn btn-success btn-sm"
                    >
                      ✅ Mark as Paid
                    </button>
                  )}
                </div>
              ))}
              {bills.length === 0 && (
                <div className="text-center p-4" style={{ color: '#6b7280' }}>
                  No bills generated yet. Generate bills for the current month.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
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
                    {leave.reason && (
                      <div className="list-item-meta">
                        Reason: {leave.reason}
                      </div>
                    )}
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
      )}
    </div>
  );
}