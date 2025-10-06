import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { CSVLink } from 'react-csv';

export default function StudentManager() {
  const [students, setStudents] = useState([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRollNo, setNewStudentRollNo] = useState('');
  const [newStudentBranch, setNewStudentBranch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      alert(`Error fetching students: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();
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
      fetchStudents();
    } catch (error) {
      alert(`Error adding student: ${error.message}`);
    }
  };

  const handleDeleteStudent = async (rollNo) => {
    if (!window.confirm(`Are you sure you want to delete student ${rollNo}?`)) return;

    try {
      const { error } = await supabase.from('students').delete().eq('roll_no', rollNo);
      if (error) throw error;
      setStudents(students.filter(student => student.roll_no !== rollNo));
      alert('Student deleted successfully!');
    } catch (error) {
      alert(`Error deleting student: ${error.message}`);
    }
  };
  
  const csvHeaders = [
    { label: "Roll Number", key: "roll_no" },
    { label: "Full Name", key: "name" },
    { label: "Branch", key: "branch" }
  ];

  if (loading) {
    return <div>Loading students...</div>;
  }

  return (
    <div>
      <div className="card">
        <h3 className="card-title">👥 Add New Student</h3>
        <form onSubmit={handleAddStudent}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="rollNo">Roll Number</label>
              <input id="rollNo" type="text" className="form-input" placeholder="e.g., CS001" value={newStudentRollNo} onChange={(e) => setNewStudentRollNo(e.target.value.toUpperCase())} required />
            </div>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input id="name" type="text" className="form-input" placeholder="Student's full name" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="branch">Branch</label>
              <input id="branch" type="text" className="form-input" placeholder="e.g., Computer Science" value={newStudentBranch} onChange={(e) => setNewStudentBranch(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary mt-3">
            ➕ Add Student
          </button>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="card-title">👥 Student List ({students.length})</h3>
          <CSVLink 
            data={students} 
            headers={csvHeaders}
            filename={"student_list.csv"}
            className="btn btn-secondary btn-sm"
          >
            📄 Export as CSV
          </CSVLink>
        </div>
        <table className="students-table">
          <thead>
            <tr>
              <th>Roll No</th>
              <th>Name</th>
              <th>Branch</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student.roll_no}>
                <td>{student.roll_no}</td>
                <td>{student.name}</td>
                <td>{student.branch}</td>
                <td>
                  <button onClick={() => handleDeleteStudent(student.roll_no)} className="btn btn-danger btn-sm">
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="text-center p-4" style={{ color: '#6b7280' }}>
            No students found. Add your first student above.
          </div>
        )}
      </div>
    </div>
  );
}