import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  return (
    <BsNavbar expand="lg" className="navbar navbar-dark" fixed="top" collapseOnSelect>
      <Container>
        <BsNavbar.Brand as={Link} to="/" className="navbar-brand">Prospect</BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" onClick={() => setExpanded(!expanded)} />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>Home</Nav.Link>
            <Nav.Link as={Link} to="/explore" onClick={() => setExpanded(false)}>Explore</Nav.Link>
            <Nav.Link as={Link} to="/careers" onClick={() => setExpanded(false)}>Careers</Nav.Link>
            <Nav.Link as={Link} to="/about" onClick={() => setExpanded(false)}>About</Nav.Link>
            {user ? (
              <>
                <Nav.Link as={Link} to="/dashboard" onClick={() => setExpanded(false)}>Dashboard</Nav.Link>
                {user.role === 'admin' && (
                  <Nav.Link as={Link} to="/admin" onClick={() => setExpanded(false)}>Admin</Nav.Link>
                )}
                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login" onClick={() => setExpanded(false)}>Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
