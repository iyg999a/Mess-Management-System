import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function BillManager() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*, students(name, roll_no)')
        .order('year, month', { ascending: false });
      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      alert(`Error fetching bills: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleGenerateBills = async () => {
    if (!window.confirm('This will generate/update bills for all students for September 2025. Are you sure?')) {
      return;
    }
    alert('Generating bills... This may take a moment.');
    
    const BILLING_YEAR = 2025;
    const BILLING_MONTH = 9; // September
    const PREVIOUS_MONTH = 8; // August
    const PREVIOUS_YEAR = 2025;
    const BASE_AMOUNT = 4500;
    const COST_PER_DAY = 150;

    try {
      const { data: students, error: studentsError } = await supabase.from('students').select('roll_no');
      if (studentsError) throw studentsError;

      for (const student of students) {
        const { data: previousBill } = await supabase
          .from('bills')
          .select('final_amount, amount_paid')
          .eq('student_no', student.roll_no)
          .eq('month', PREVIOUS_MONTH)
          .eq('year', PREVIOUS_YEAR)
          .single();
        
        const balanceBill = previousBill ? previousBill.final_amount - previousBill.amount_paid : 0;
        
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

        const currentMonthBill = BASE_AMOUNT - (totalLeaveDays * COST_PER_DAY);
        const finalAmount = currentMonthBill + balanceBill;

        const { error: billError } = await supabase
          .from('bills')
          .upsert({ 
            student_no: student.roll_no, 
            month: BILLING_MONTH, 
            year: BILLING_YEAR, 
            leave_days: totalLeaveDays, 
            balance_bill: balanceBill,
            current_month_bill: currentMonthBill,
            final_amount: finalAmount,
            status: finalAmount <= 0 ? 'Paid' : 'Unpaid' 
          }, { onConflict: 'student_no, month, year' });
        
        if (billError) throw billError;
      }

      alert('Bills have been generated successfully!');
      fetchBills();
    } catch (error) {
      alert(`Error generating bills: ${error.message}`);
    }
  };

  const handleMarkAsPaid = async (bill) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status: 'Paid', amount_paid: bill.final_amount })
        .eq('id', bill.id);
      
      if (error) throw error;
      
      setBills(bills.map(b => 
        b.id === bill.id ? { ...b, status: 'Paid', amount_paid: bill.final_amount } : b
      ));
      alert('Bill marked as paid!');
    } catch (error) {
      alert(`Error updating bill: ${error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const statusClass = status.toLowerCase().replace(' ', '-');
    return <span className={`status-badge status-${statusClass}`}>{status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '1rem' }}>Loading bills...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h3 className="card-title">💰 Bill Management</h3>
        <button onClick={handleGenerateBills} className="btn btn-primary">
          Generate Bills for September 2025
        </button>
      </div>

      <div className="card">
        <h3 className="card-title">📄 Generated Bills ({bills.length})</h3>
        <div className="list">
          {bills.map(bill => {
            // NEW: Calculate the remaining balance for display
            const remainingBalance = bill.final_amount - bill.amount_paid;

            return (
              <div key={bill.id} className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">{bill.students?.name || bill.student_no}</div>
                  <div className="list-item-subtitle">
                    {bill.month}/{bill.year} | <strong>Total Due: ₹{bill.final_amount}</strong>
                    <br />
                    <small> (Prev Balance: ₹{bill.balance_bill} + Current: ₹{bill.current_month_bill}) </small>
                  </div>
                  {/* NEW: Updated meta section to show remaining balance */}
                  <div className="list-item-meta" style={remainingBalance > 0 ? {color: 'red'} : {color: 'green'}}>
                    Status: {getStatusBadge(bill.status)} | Paid: ₹{bill.amount_paid} | <strong>Balance: ₹{remainingBalance}</strong>
                  </div>
                </div>
                {/* UPDATED: Show button only if there is a remaining balance */}
                {remainingBalance > 0 && bill.status === 'Unpaid' && (
                  <button onClick={() => handleMarkAsPaid(bill)} className="btn btn-success btn-sm">
                    ✅ Mark as Fully Paid
                  </button>
                )}
              </div>
            );
          })}
          {bills.length === 0 && (
            <div className="text-center p-4" style={{ color: '#6b7280' }}>
              No bills generated yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}