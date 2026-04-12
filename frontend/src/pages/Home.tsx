import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { careersAPI } from '../api';
import type { Occupation } from '../types';
import './Home.css';

const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM5Q0EzQUYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj5DYXJlZXI8L3RleHQ+PC9zdmc+';

const Home = () => {
  const [careers, setCareers] = useState<Occupation[]>([]);

  useEffect(() => {
    careersAPI.search('', 0, 4).then(res => {
      setCareers(res.data?.data?.slice(0, 4) || []);
    }).catch(() => {});
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="hero-title">Discover Your Future Career</h1>
              <p className="hero-text">Explore career paths that match your interests and chosen subjects. Made for Australian high school students.</p>
              <Link to="/explore" className="btn btn-gradient btn-lg">Start Exploring</Link>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="featured-careers py-5">
        <Container>
          <h2 className="text-center mb-4">Featured Careers</h2>
          <Row xs={1} sm={2} lg={4} className="g-4">
            {careers.map(career => (
              <Col key={career.id}>
                <Link to={`/careers/${career.id}`} className="text-decoration-none">
                  <Card className="h-100 d-flex flex-column career-card">
                    <Card.Img variant="top" src={career.image_base64 || defaultImage} alt={career.title} style={{ height: '150px', objectFit: 'cover' }} />
                    <Card.Body className="flex-grow-1">
                      <Card.Title className="text-dark">{career.title}</Card.Title>
                      <Card.Text className="text-muted">{career.category}</Card.Text>
                    </Card.Body>
                    <Card.Footer className="text-center">
                      <span className="btn btn-gradient btn-sm">View Details</span>
                    </Card.Footer>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      <section className="stats-section py-5 bg-light">
        <Container>
          <h2 className="text-center mb-4">Australian Employment Data</h2>
          <Row xs={1} md={3} className="g-4 text-center">
            <Col>
              <div className="stat-card">
                <h3>13M+</h3>
                <p>Employed Australians</p>
              </div>
            </Col>
            <Col>
              <div className="stat-card">
                <h3>700+</h3>
                <p>Career Paths</p>
              </div>
            </Col>
            <Col>
              <div className="stat-card">
                <h3>100+</h3>
                <p>High School Courses</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="how-it-works py-5">
        <Container>
          <h2 className="text-center mb-4">How It Works</h2>
          <Row xs={1} md={3} className="g-4">
            <Col>
              <div className="step text-center">
                <div className="step-number">1</div>
                <h3>Choose Your Subjects</h3>
                <p>Select the high school courses you're taking or interested in</p>
              </div>
            </Col>
            <Col>
              <div className="step text-center">
                <div className="step-number">2</div>
                <h3>Add Your Interests</h3>
                <p>Pick activities and subjects that interest you</p>
              </div>
            </Col>
            <Col>
              <div className="step text-center">
                <div className="step-number">3</div>
                <h3>Discover Careers</h3>
                <p>Get matched with careers that fit your profile</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="testimonials py-5 bg-light">
        <Container>
          <h2 className="text-center mb-4">What Students Say</h2>
          <Row xs={1} md={2} className="g-4">
            <Col>
              <div className="testimonial">
                <p>"Prospect helped me understand what I could do with my science and math subjects."</p>
                <span>- Year 11 Student, Sydney</span>
              </div>
            </Col>
            <Col>
              <div className="testimonial">
                <p>"The career matching was surprisingly accurate. I found my dream job!"</p>
                <span>- Year 12 Student, Melbourne</span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <footer className="footer py-4">
        <Container>
          <Row className="align-items-center">
            <Col md={6} className="text-center text-md-start mb-3 mb-md-0">
              <p className="mb-0">&copy; 2026 Prospect. Career exploration for Australian students.</p>
            </Col>
            <Col md={6} className="text-center text-md-end">
              <Link to="/about" className="me-3">About</Link>
              <a href="#" className="me-3">Privacy Policy</a>
              <a href="#">Contact</a>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Home;
