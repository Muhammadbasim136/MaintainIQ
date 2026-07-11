import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const sendMagicLink = async (targetEmail) => {
    return supabase.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await sendMagicLink(email);
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    const { error } = await sendMagicLink(email);
    if (error) setError(error.message || 'Failed to resend. Try again.');
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">

        <div className="forgot-header">
          <div className="forgot-icon">
            <i className="fas fa-lock"></i>
          </div>
          <h1>Reset Password</h1>
          <p>{sent ? 'Magic link sent' : "We'll send a magic link to your email"}</p>
        </div>

        {error && (
          <div className="error-box">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}

        {/* Step 1: Ask for email */}
        {!sent && (
          <form onSubmit={handleRequestReset} className="forgot-form">
            <div className="input-group">
              <label><i className="fas fa-envelope"></i> Email Address</label>
              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <p style={{ fontSize: '13px', color: '#6b7280', margin: '-6px 0 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-info-circle"></i> We will send a magic link to your email. Click it to set a new password.
            </p>

            <button type="submit" className="reset-btn" disabled={loading}>
              {loading ? (
                <><span className="spinner"></span> Sending...</>
              ) : (
                <><i className="fas fa-paper-plane"></i> Send Magic Link</>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Confirmation that link was sent */}
        {sent && (
          <div className="otp-section">
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-envelope-open-text" style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '16px' }}></i>
              <p className="otp-message">
                We've sent a magic link to <strong>{email}</strong>. Open your inbox and click the link — it'll take you to a page where you can set a new password.
              </p>
            </div>

            <p className="resend-text">
              Didn't get it?{' '}
              <button onClick={handleResend} className="resend-link" type="button">
                Resend link
              </button>
            </p>

            <button
              className="back-link-btn"
              onClick={() => { setSent(false); setError(''); }}
            >
              <i className="fas fa-arrow-left"></i> Change Email
            </button>
          </div>
        )}

        {!sent && (
          <p className="back-link">
            <Link to="/login">
              <i className="fas fa-arrow-left"></i> Back to Sign In
            </Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
