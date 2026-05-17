import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { AppConfig } from '../config';
import './Auth.css';

const PasswordLock = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.toLowerCase() === AppConfig.sitePassword.toLowerCase()) {
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
              <h2 className="text-center mb-4">Unlock CareerWeave</h2>
              {error && <Alert variant="danger">{error}</Alert>}
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PasswordLock;
