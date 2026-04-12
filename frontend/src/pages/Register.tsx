import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
}

const Register = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name
      });
      navigate('/login');
    } catch {
      setError('Registration failed');
    }
  };

  return (
    <Container className="auth-page">
      <Row className="justify-content-center align-items-center min-vh-100">
        <Col md={6} lg={5}>
          <Card className="auth-card shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Create Account</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="full_name"
                    placeholder="Enter full name"
                    value={formData.full_name}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100 btn-gradient">Register</Button>
              </Form>
              <p className="text-center mt-3 mb-0">
                Already have an account? <Link to="/login" style={{color: '#336'}}>Login</Link>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
