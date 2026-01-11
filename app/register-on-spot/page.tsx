'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import colleges from '@/data/colleges';
import departments from '@/data/departments';
import type { RegistrationData, PaymentData } from '@/types';

export default function RegisterOnSpot() {
  const router = useRouter();
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    name: '',
    email: '',
    college: '',
    customCollege: '',
    collegeNotListed: false,
    department: '',
    customDepartment: '',
    departmentNotListed: false,
    year: '1',
    phone: '',
    accommodation: 'No'
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    participantId: '',
    email: '',
    name: '',
    fee: 0
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [registrationComplete, setRegistrationComplete] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string>('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleRegistrationChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    const checked = target.checked;
    
    if (type === 'checkbox') {
      setRegistrationData({
        ...registrationData,
        [name]: checked
      });
    } else {
      setRegistrationData({
        ...registrationData,
        [name]: value
      });
    }
    setError('');
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // Prepare data for API
      const finalCollege = registrationData.collegeNotListed 
        ? registrationData.customCollege 
        : registrationData.college;
      
      const finalDepartment = registrationData.departmentNotListed 
        ? registrationData.customDepartment 
        : registrationData.department;

      // Mock successful registration (replace with actual API later)
      const mockParticipantId = 'KRIYA' + Math.floor(1000 + Math.random() * 9000);
      
      // Update payment section with mock data
      setPaymentData({
        participantId: mockParticipantId,
        email: registrationData.email,
        name: registrationData.name,
        fee: registrationData.accommodation === 'Yes' ? 250 : 200
      });

      setRegistrationComplete(true);
      setSuccess('Registration successful! Now generate payment URL.');
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePaymentUrl = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      // Mock payment URL generation (replace with actual API later)
      const mockPaymentUrl = `https://payment.kriya.com/pay/${paymentData.participantId}?amount=${paymentData.fee}`;
      setPaymentUrl(mockPaymentUrl);
      
      // Trigger QR code display on dashboard
      const event = new CustomEvent('displayQR', { 
        detail: { url: mockPaymentUrl } 
      });
      window.dispatchEvent(event);
      
      setSuccess('Payment URL generated successfully!');
    } catch (err) {
      setError('Failed to generate payment URL. Please try again.');
      console.error('Payment URL generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegistration = () => {
    setRegistrationData({
      name: '',
      email: '',
      college: '',
      customCollege: '',
      collegeNotListed: false,
      department: '',
      customDepartment: '',
      departmentNotListed: false,
      year: '1',
      phone: '',
      accommodation: 'No'
    });
    setPaymentData({
      participantId: '',
      email: '',
      name: '',
      fee: 0
    });
    setRegistrationComplete(false);
    setPaymentUrl('');
    setError('');
    setSuccess('');
  };

  const handleClearPayment = () => {
    setPaymentUrl('');
    setSuccess('');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Register On Spot</h1>
      </div>

      <div className="page-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Registration Form Section */}
        <section>
          <h2 className="section-title">Registration Form</h2>
          <form onSubmit={handleRegister}>
            <div className="two-column">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-input"
                  value={registrationData.name}
                  onChange={handleRegistrationChange}
                  required
                  disabled={registrationComplete}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  value={registrationData.email}
                  onChange={handleRegistrationChange}
                  required
                  disabled={registrationComplete}
                />
              </div>
            </div>

            <div className="two-column">
              <div className="form-group">
                <label htmlFor="college" className="form-label">College/University</label>
                <select
                  id="college"
                  name="college"
                  className="form-select"
                  value={registrationData.college}
                  onChange={handleRegistrationChange}
                  required={!registrationData.collegeNotListed}
                  disabled={registrationData.collegeNotListed || registrationComplete}
                >
                  <option value="">Select...</option>
                  {colleges.map((college, index) => (
                    <option key={index} value={college}>{college}</option>
                  ))}
                </select>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="collegeNotListed"
                    checked={registrationData.collegeNotListed}
                    onChange={handleRegistrationChange}
                    disabled={registrationComplete}
                  />
                  Your college is not listed above
                </label>
                {registrationData.collegeNotListed && (
                  <input
                    type="text"
                    name="customCollege"
                    className="form-input"
                    placeholder="Enter your college name"
                    value={registrationData.customCollege}
                    onChange={handleRegistrationChange}
                    required
                    disabled={registrationComplete}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>

              <div className="form-group">
                <label htmlFor="department" className="form-label">Department</label>
                <select
                  id="department"
                  name="department"
                  className="form-select"
                  value={registrationData.department}
                  onChange={handleRegistrationChange}
                  required={!registrationData.departmentNotListed}
                  disabled={registrationData.departmentNotListed || registrationComplete}
                >
                  <option value="">Select...</option>
                  {departments.map((dept, index) => (
                    <option key={index} value={dept}>{dept}</option>
                  ))}
                </select>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="departmentNotListed"
                    checked={registrationData.departmentNotListed}
                    onChange={handleRegistrationChange}
                    disabled={registrationComplete}
                  />
                  Your department is not listed above
                </label>
                {registrationData.departmentNotListed && (
                  <input
                    type="text"
                    name="customDepartment"
                    className="form-input"
                    placeholder="Enter your department"
                    value={registrationData.customDepartment}
                    onChange={handleRegistrationChange}
                    required
                    disabled={registrationComplete}
                    style={{ marginTop: '8px' }}
                  />
                )}
              </div>
            </div>

            <div className="two-column">
              <div className="form-group">
                <label htmlFor="year" className="form-label">Year</label>
                <select
                  id="year"
                  name="year"
                  className="form-select"
                  value={registrationData.year}
                  onChange={handleRegistrationChange}
                  required
                  disabled={registrationComplete}
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-input"
                  value={registrationData.phone}
                  onChange={handleRegistrationChange}
                  pattern="[0-9]{10}"
                  required
                  disabled={registrationComplete}
                />
              </div>
            </div>

            <div className="two-column">
              <div className="form-group">
                <label htmlFor="accommodation" className="form-label">Require Accommodation ?</label>
                <select
                  id="accommodation"
                  name="accommodation"
                  className="form-select"
                  value={registrationData.accommodation}
                  onChange={handleRegistrationChange}
                  required
                  disabled={registrationComplete}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {!registrationComplete && (
              <div className="btn-group">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancelRegistration}>
                  Cancel
                </button>
              </div>
            )}
          </form>
        </section>

        {/* Payment URL Generation Section */}
        {registrationComplete && (
          <>
            <hr className="section-divider" />
            <section>
              <h2 className="section-title">Payment URL Generation</h2>
              <form onSubmit={handleGeneratePaymentUrl}>
                <div className="two-column">
                  <div className="form-group">
                    <label htmlFor="participantId" className="form-label">Infinitum ID</label>
                    <input
                      type="text"
                      id="participantId"
                      name="participantId"
                      className="form-input"
                      value={paymentData.participantId}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="paymentEmail" className="form-label">Email</label>
                    <input
                      type="email"
                      id="paymentEmail"
                      name="paymentEmail"
                      className="form-input"
                      value={paymentData.email}
                      readOnly
                    />
                  </div>
                </div>

                <div className="two-column">
                  <div className="form-group">
                    <label htmlFor="paymentName" className="form-label">Name</label>
                    <input
                      type="text"
                      id="paymentName"
                      name="paymentName"
                      className="form-input"
                      value={paymentData.name}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fee" className="form-label">Fee</label>
                    <input
                      type="number"
                      id="fee"
                      name="fee"
                      className="form-input"
                      value={paymentData.fee}
                      readOnly
                    />
                  </div>
                </div>

                <div className="btn-group">
                  <button type="submit" className="btn btn-primary" disabled={loading || !!paymentUrl}>
                    {loading ? 'Generating...' : 'Generate Payment URL'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleClearPayment}>
                    Clear
                  </button>
                </div>

                {paymentUrl && (
                  <div className="alert alert-info" style={{ marginTop: '16px' }}>
                    Payment URL: <a href={paymentUrl} target="_blank" rel="noopener noreferrer">{paymentUrl}</a>
                  </div>
                )}
              </form>
            </section>
          </>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => router.push('/')}
            style={{ maxWidth: '200px' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
