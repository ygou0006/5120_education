import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import './Auth.css';

const PasswordLock = () => {
  const [step, setStep] = useState<'set' | 'enter'>('enter');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('site_password');
    if (saved) {
      setStep('enter');
    } else {
      setStep('set');
    }
  }, []);

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    localStorage.setItem('site_password', password);
    sessionStorage.setItem('unlocked', 'true');
    const preLockPath = sessionStorage.getItem('preLockPath') || '/';
    sessionStorage.removeItem('preLockPath');
    navigate(preLockPath);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = localStorage.getItem('site_password');
    if (password === saved) {
      sessionStorage.setItem('unlocked', 'true');
      const preLockPath = sessionStorage.getItem('preLockPath') || '/';
      sessionStorage.removeItem('preLockPath');
      navigate(preLockPath);
    } else {
      setError('Incorrect password');
    }
  };

  return (
    <Container className="auth-page">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col md={5} lg={4}>
          <Card className="auth-card shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">
                {step === 'set' ? 'Set Site Password' : 'Unlock Prospect'}
              </h2>
              {error && <Alert variant="danger">{error}</Alert>}
              
              {step === 'set' ? (
                <Form onSubmit={handleSetPassword}>
                  <Form.Group className="mb-3">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100 btn-gradient">Set Password</Button>
                </Form>
              ) : (
                <Form onSubmit={handleUnlock}>
                  <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit" className="w-100 btn-gradient">Unlock</Button>
                </Form>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PasswordLock;
