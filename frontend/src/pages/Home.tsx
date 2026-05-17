import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { careersAPI } from '../api';
import type { Occupation } from '../types';
import heroImage from '../assets/hero.png';
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
            <Col lg={6} className="text-white">
              <h1 className="hero-title">From Subjects to Careers<br />Discover Your Future Pathway</h1>
              <p className="hero-text">
                Explore how your interests, subjects, and strengths connect to real career opportunities.
                Many young people struggle to understand how their learning connects to future careers - we make it simple and clear.
                Designed for young people aged 12–17, whether you are in school or outside formal education.
              </p>
              <Link to="/explore" className="btn btn-gradient btn-lg">Start Exploring Your Future</Link>
            </Col>
            <Col lg={6} className="d-none d-lg-block text-center">
              <img src={heroImage} alt="Hero" className="hero-image" />
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
                    <Card.Img variant="top" src={career.image || defaultImage} alt={career.title} style={{ height: '256px', objectFit: 'cover' }} />
                    <Card.Body className="flex-grow-1">
                      <Card.Title className="card-title">{career.title}</Card.Title>
                      <Card.Text className="text-muted">{career.category}</Card.Text>
                      <Card.Text className="card-description">{career.description!.length > 100 ? career.description!.substring(0, 100) + '...' : career.description}</Card.Text>
                    </Card.Body>
                    <Card.Footer className="text-center">
                      <span className="btn btn-card btn-sm">View Details</span>
                    </Card.Footer>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
          <div className="text-center mt-4">
            <Link to="/careers" className="btn btn-gradient-sm btn-lg btn-circle">
              View More
            </Link>
          </div>
        </Container>
      </section>

      <section className="stats-section py-5">
        <Container>
          <h2 className="text-center mb-4">Australian Employment Data</h2>
          <Row xs={1} md={3} className="g-4 text-center">
            <Col>
              <div className="stat-card">
                <h3>13M+</h3>
                <p><a href='https://www.careers.vic.gov.au/' target="_blank">Employed Australians</a></p>
              </div>
            </Col>
            <Col>
              <div className="stat-card">
                <h3>700+</h3>
                <p><a href='https://www.yourcareer.gov.au/career-pathways' target="_blank">Career Paths</a></p>
              </div>
            </Col>
            <Col>
              <div className="stat-card">
                <h3>100+</h3>
                <p><a href='https://www.vcaa.vic.edu.au/curriculum/vce-curriculum/vce-study-designs/vce-study-designs' target="_blank">High School Courses</a></p>
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
              <div className="step text-center" style={{ background: '#fff' }}>
                <div className="step-number">1</div>
                <h3>Tell Us About You</h3>
                <p>Select your subjects, interests, or areas you enjoy</p>
              </div>
            </Col>
            <Col>
              <div className="step text-center" style={{ background: '#fff' }}>
                <div className="step-number">2</div>
                <h3>Build Your Profile</h3>
                <p>We combine your inputs to understand your strengths and preferences</p>
              </div>
            </Col>
            <Col>
              <div className="step text-center" style={{ background: '#fff' }}>
                <div className="step-number">3</div>
                <h3>Discover Career Pathways</h3>
                <p>Explore careers and pathways that match your profile</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="testimonials py-5">
        <Container>
          <h2 className="text-center mb-4">Why Use CareerWeave</h2>
          <Row xs={1} md={1} className="g-4">
            <Col>
              <div className="testimonial">
                <p>• Understand how your learning connects to future careers</p>
                <p>• Explore options in a simple and visual way</p>
                <p>• Get personalised career insights </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

    </div>
  );
};

export default Home;
