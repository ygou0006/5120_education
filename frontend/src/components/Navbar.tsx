import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar as BsNavbar, Nav, Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { AppConfig } from '../config';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const unlocked = sessionStorage.getItem('unlocked') === 'true';
  
  const handleLock = () => {
    sessionStorage.setItem('preLockPath', location.pathname);
    sessionStorage.removeItem('unlocked');
    navigate('/unlock');
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setExpanded(false);
  };

  const isHomePage = location.pathname === '/';
  const navbarClass = `navbar navbar-dark ${isHomePage && !scrolled ? 'navbar-transparent' : ''}`;

  return (
    <BsNavbar expand="lg" className={navbarClass} fixed="top" collapseOnSelect>
      <Container>
        <BsNavbar.Brand as={Link} to="/" className="navbar-brand">🌱 Prospect</BsNavbar.Brand>
        <BsNavbar.Toggle aria-controls="basic-navbar-nav" onClick={() => setExpanded(!expanded)} />
        <BsNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link as={Link} to="/" onClick={() => setExpanded(false)}>Home</Nav.Link>
            <Nav.Link as={Link} to="/explore" onClick={() => setExpanded(false)}>Explore</Nav.Link>
            <Nav.Link as={Link} to="/careers" onClick={() => setExpanded(false)}>Careers</Nav.Link>
            <Nav.Link as={Link} to="/compare" onClick={() => setExpanded(false)}>Compare</Nav.Link>
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
                {AppConfig.enableLoginAndRegister && (
                  <>
                    <Nav.Link as={Link} to="/login" onClick={() => setExpanded(false)}>Login</Nav.Link>
                    <Nav.Link as={Link} to="/register">Register</Nav.Link>
                  </>
                )}
              </>
            )}
            {unlocked && AppConfig.enablePasswordLock && (
              <Nav.Link onClick={handleLock} style={{ cursor: 'pointer' }} title="Lock Site">🔒</Nav.Link>
            )}
          </Nav>
        </BsNavbar.Collapse>
      </Container>
    </BsNavbar>
  );
};

export default Navbar;
