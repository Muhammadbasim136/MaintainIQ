import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import './ForgotPassword.css';

// This page is where the magic link from resetPasswordForEmail() lands.
// Supabase (detectSessionInUrl: true) automatically reads the tokens from
// the URL and fires a PASSWORD_RECOVERY event once the temporary
// "recovery" session is ready — we wait for that before showing the form.
const ResetPassword = () => {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let settled = false;

    // In case the session was already parsed by the time this mounts
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!settled && session) {
        settled = true;
        setReady(true);
        setChecking(false);
      }
    });

    // Fires once Supabase finishes processing the recovery link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!settled && (event === 'PASSWORD_RECOVERY' || session)) {
        settled = true;
        setReady(true);
        setChecking(false);
      }
    });

    // If nothing happens in a few seconds, the link was invalid/expired
    const timeout = setTimeout(() => {
      if (!settled) setChecking(false);
    }, 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setSuccess('Password updated successfully! Redirecting to sign in...');
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Password reset successful! Please sign in with your new password.' },
        });
      }, 1800);

    } catch (err) {
      setError(err.message || 'Could not update password. Please try the link again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">

        <div className="forgot-header">
          <div className="forgot-icon">
            <i className="fas fa-key"></i>
          </div>
          <h1>New Password</h1>
          <p>Create a new password for your account</p>
        </div>

        {error && (
          <div className="error-box">
            <i className="fas fa-exclamation-circle"></i> {error}
          </div>
        )}
        {success && (
          <div className="success-box">
            <i className="fas fa-check-circle"></i> {success}
          </div>
        )}

        {/* Verifying the link */}
        {checking && !ready && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <span className="spinner" style={{ borderTopColor: '#f59e0b', borderColor: 'rgba(245,158,11,0.2)' }}></span>
            <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>Verifying your link...</p>
          </div>
        )}

        {/* Link invalid / expired */}
        {!checking && !ready && !success && (
          <div style={{ textAlign: 'center' }}>
            <p className="otp-message">
              This link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="reset-btn"
              style={{ display: 'inline-flex', textDecoration: 'none', marginTop: '8px' }}
            >
              <i className="fas fa-paper-plane"></i> Request New Link
            </Link>
          </div>
        )}

        {/* Link verified — show the form */}
        {ready && !success && (
          <form onSubmit={handleUpdatePassword} className="forgot-form">
            <div className="input-group">
              <label><i className="fas fa-lock"></i> New Password</label>
              <input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label><i className="fas fa-lock"></i> Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="reset-btn" disabled={loading}>
              {loading ? (
                <><span className="spinner"></span> Updating...</>
              ) : (
                <><i className="fas fa-save"></i> Update Password</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
