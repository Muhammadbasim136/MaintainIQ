import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import { ensureProfile } from '../../lib/profile';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const finishSignup = async (user) => {
    await ensureProfile(user);
    navigate('/', { replace: true });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: 'admin',
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (error) throw error;

      // Confirm email is OFF -> Supabase signs the user in immediately
      if (data.session?.user) {
        await finishSignup(data.session.user);
        return;
      }

      if (data.user?.identities?.length === 0) {
        setError('This email is already registered. Please sign in instead.');
        return;
      }

      // Confirm email is ON -> account created, waiting for link click
      setEmailSent(true);
      setSuccess('');

    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setError('');
    setSuccess('');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });

    if (error) {
      setError(error.message || 'Failed to resend email. Try again.');
    } else {
      setSuccess('Confirmation link resent!');
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">

        <div className="signup-header">
          <div className="signup-logo">
            <i className="fas fa-qrcode"></i>
          </div>
          <h1>MaintainIQ</h1>
          <p>{emailSent ? 'Check your email' : 'Create your account'}</p>
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

        {/* Step 1: Signup form */}
        {!emailSent && (
          <form onSubmit={handleSignup} className="signup-form">
            <div className="input-group">
              <label><i className="fas fa-user"></i> Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label><i className="fas fa-envelope"></i> Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label><i className="fas fa-lock"></i> Password</label>
              <input
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label><i className="fas fa-lock"></i> Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <p style={{ fontSize: '13px', color: '#6b7280', margin: '-6px 0 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-info-circle"></i> We will send a confirmation link to your email.
            </p>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? (
                <><span className="spinner"></span> Creating Account...</>
              ) : (
                <><i className="fas fa-user-plus"></i> Create Account</>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Waiting on email confirmation link */}
        {emailSent && (
          <div className="otp-section">
            <div style={{ textAlign: 'center' }}>
              <i className="fas fa-envelope-open-text" style={{ fontSize: '48px', color: '#7c3aed', marginBottom: '16px' }}></i>
              <p className="otp-message">
                We've sent a confirmation link to <strong>{email}</strong>. Click it to activate your account — you'll be signed in automatically.
              </p>
            </div>

            <button className="signup-btn" onClick={() => navigate('/login')} type="button">
              <i className="fas fa-sign-in-alt"></i> Go to Sign In
            </button>

            <p className="resend-text">
              Didn't get the email?{' '}
              <button onClick={handleResendEmail} className="resend-link" type="button">
                Resend link
              </button>
            </p>

            <button
              className="back-link-btn"
              onClick={() => { setEmailSent(false); setError(''); setSuccess(''); }}
            >
              <i className="fas fa-arrow-left"></i> Back to Sign Up
            </button>
          </div>
        )}

        {!emailSent && (
          <p className="signup-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Signup;
