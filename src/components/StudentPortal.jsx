import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function StudentPortal() {
  const [rollNo, setRollNo] = useState('');
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submittingRef, setSubmittingRef] = useState(false);

  const SBI_PAYMENT_LINK = "https://onlinesbi.sbi.bank.in/sbicollect/icollecthome.htm";

  const handleFetchBill = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBill(null);
    setShowSubmitForm(false);
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*, students(name)')
        .eq('student_no', rollNo)
        .order('year, month', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      setBill(data);
    } catch (error) {
      setError('Could not find a bill for that Roll Number.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReference = async (e) => {
    e.preventDefault();
    if (!paymentRef.trim()) {
      alert('Please enter a payment reference number.');
      return;
    }
    
    setSubmittingRef(true);
    try {
      const { error } = await supabase
        .from('bills')
        .update({ 
          status: 'Verification Pending', 
          payment_reference: paymentRef.trim() 
        })
        .eq('id', bill.id);
      
      if (error) throw error;
      
      setBill({ 
        ...bill, 
        status: 'Verification Pending', 
        payment_reference: paymentRef.trim() 
      });
      setPaymentRef('');
      setShowSubmitForm(false);
      alert('Reference number submitted for verification!');
    } catch (error) {
      alert('There was an error submitting your reference number.');
    } finally {
      setSubmittingRef(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusClass = status.toLowerCase().replace(' ', '-');
    return <span className={`status-badge status-${statusClass}`}>{status}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="header">
        <h2>👨‍🎓 Student Bill Portal</h2>
        <p className="text-center mt-2" style={{ color: '#6b7280' }}>
          Check your mess bill and submit payment references
        </p>
      </div>

      {/* Search Form */}
      <div className="card">
        <form onSubmit={handleFetchBill}>
          <div className="form-group">
            <label htmlFor="rollNo">Enter Your Roll Number</label>
            <input 
              id="rollNo" 
              type="text" 
              className="form-input"
              placeholder="e.g., TEST001" 
              value={rollNo} 
              onChange={(e) => setRollNo(e.target.value.toUpperCase())} 
              required 
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Searching...
              </>
            ) : (
              <>
                🔍 Get My Bill
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="alert alert-error mt-4">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Bill Display */}
      {bill && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📄 Your Latest Bill</h3>
            <p className="card-subtitle">Bill details and payment options</p>
          </div>

          <div className="list">
            <div className="list-item">
              <div className="list-item-content">
                <div className="list-item-title">Student Name</div>
                <div className="list-item-subtitle">{bill.students?.name}</div>
              </div>
            </div>

            <div className="list-item">
              <div className="list-item-content">
                <div className="list-item-title">Roll Number</div>
                <div className="list-item-subtitle">{bill.student_no}</div>
              </div>
            </div>

            <div className="list-item">
              <div className="list-item-content">
                <div className="list-item-title">Billing Period</div>
                <div className="list-item-subtitle">{bill.month}/{bill.year}</div>
              </div>
            </div>

            <div className="list-item">
              <div className="list-item-content">
                <div className="list-item-title">Final Amount</div>
                <div className="list-item-subtitle">
                  <strong style={{ fontSize: '1.2rem', color: '#059669' }}>
                    ₹{bill.final_amount}
                  </strong>
                </div>
              </div>
            </div>

            <div className="list-item">
              <div className="list-item-content">
                <div className="list-item-title">Payment Status</div>
                <div className="list-item-subtitle">
                  {getStatusBadge(bill.status)}
                </div>
              </div>
            </div>

            {bill.leave_days > 0 && (
              <div className="list-item">
                <div className="list-item-content">
                  <div className="list-item-title">Leave Days</div>
                  <div className="list-item-subtitle">{bill.leave_days} days</div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Actions */}
          {bill.status === 'Unpaid' && (
            <div className="mt-4">
              <div className="flex flex-col gap-3">
                <a 
                  href={SBI_PAYMENT_LINK} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  💳 Pay Now via SBI
                </a>

                {!showSubmitForm ? (
                  <button 
                    onClick={() => setShowSubmitForm(true)}
                    className="btn btn-secondary"
                  >
                    📝 Already Paid? Submit Reference
                  </button>
                ) : (
                  <div className="card mt-3">
                    <h4 className="card-title">Submit Payment Reference</h4>
                    <form onSubmit={handleSubmitReference}>
                      <div className="form-group">
                        <label htmlFor="paymentRef">Payment Reference Number</label>
                        <input 
                          id="paymentRef"
                          type="text" 
                          className="form-input"
                          placeholder="Enter SBI payment reference number" 
                          value={paymentRef} 
                          onChange={(e) => setPaymentRef(e.target.value)} 
                          required 
                          disabled={submittingRef}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          type="submit" 
                          className="btn btn-success flex-1"
                          disabled={submittingRef}
                        >
                          {submittingRef ? (
                            <>
                              <div className="loading-spinner"></div>
                              Submitting...
                            </>
                          ) : (
                            '✅ Submit for Verification'
                          )}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowSubmitForm(false);
                            setPaymentRef('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {bill.status === 'Verification Pending' && (
            <div className="alert alert-warning mt-4">
              <strong>⏳ Verification Pending:</strong> Your payment is being verified. 
              Reference: <code>{bill.payment_reference}</code>
            </div>
          )}

          {bill.status === 'Paid' && (
            <div className="alert alert-success mt-4">
              <strong>✅ Payment Confirmed:</strong> Your bill has been successfully paid and verified.
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div className="card">
        <h4 className="card-title">💡 Need Help?</h4>
        <div className="list">
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">Payment Issues</div>
              <div className="list-item-subtitle">Contact the mess office during working hours</div>
            </div>
          </div>
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">Reference Number</div>
              <div className="list-item-subtitle">Find this in your SBI payment confirmation SMS/email</div>
            </div>
          </div>
          <div className="list-item">
            <div className="list-item-content">
              <div className="list-item-title">Leave Days</div>
              <div className="list-item-subtitle">Approved leave days are automatically deducted from your bill</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}