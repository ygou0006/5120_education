import { Link } from 'react-router-dom';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="footer py-4">
      <Container>
        <Row className="align-items-center">
          <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
            <p className="mb-0">&copy; 2026 Prospect. Career exploration for young people in Australia.</p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <Link to="/about" className="me-3">About</Link>
            <a href="#" className="me-3">Privacy Policy</a>
            <a href="#">Contact</a>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;