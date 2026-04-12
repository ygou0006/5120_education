import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { favoritesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import type { CareerMatch, Occupation } from '../types';
import './Results.css';

const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM5Q0EzQUYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj5DYXJlZXI8L3RleHQ+PC9zdmc+';

interface LocationState {
  careers: CareerMatch[];
  selectedCourses: number[];
  selectedInterests: number[];
}

const Results = () => {
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as LocationState | null;
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const careers = state?.careers || [];
  const maxScore = Math.max(...careers.map((c: CareerMatch) => c.match_score), 1);

  useEffect(() => {
    if (!user) return;
    favoritesAPI.list().then(res => {
      setFavoriteIds(res.data.map((f: Occupation) => f.id));
    }).catch(() => {});
  }, [user]);

  const toggleFavorite = async (id: number) => {
    if (!user) {
      alert('Please login to save favorites');
      return;
    }
    if (favoriteIds.includes(id)) {
      await favoritesAPI.remove(id);
      setFavoriteIds(prev => prev.filter(x => x !== id));
    } else {
      await favoritesAPI.add(id);
      setFavoriteIds(prev => [...prev, id]);
    }
  };

  const toggleCompare = (id: number) => {
    setSelectedForCompare(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <Container className="results-page py-4" style={{ paddingTop: '80px' }}>
      <div className="text-center mb-4">
        <h1>Matching Careers</h1>
        <p className="text-muted">Based on your selected courses and interests</p>
      </div>

      {careers.length === 0 ? (
        <div className="no-results text-center py-5">
          <p className="mb-3">No matching careers found based on your selected courses and interests.</p>
          <Link to="/" className="btn btn-gradient-gray">Back to Home</Link>
        </div>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {careers.map((career: CareerMatch) => (
            <Col key={career.occupation_id}>
              <Card className="h-100 result-card">
                <Card.Img variant="top" src={career.image_base64 || defaultImage} alt={career.title} style={{ height: '150px', objectFit: 'cover' }} />
                <Card.Body>
                  <Card.Title>{career.title}</Card.Title>
                  <Badge bg="secondary">{career.category}</Badge>
                  <div className="match-score mt-3">
                    <div className="d-flex justify-content-between mb-1">
                      <small>Match Score</small>
                      <small>{Math.round(career.match_score)}%</small>
                    </div>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ width: `${(career.match_score / maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Form.Check
                      type="checkbox"
                      label="Compare"
                      checked={selectedForCompare.includes(career.occupation_id)}
                      onChange={() => toggleCompare(career.occupation_id)}
                    />
                    <div className="d-flex gap-2">
                      <Button 
                        variant={user && favoriteIds.includes(career.occupation_id) ? 'danger' : 'outline-danger'} 
                        size="sm"
                        onClick={() => toggleFavorite(career.occupation_id)}
                      >
                        {user && favoriteIds.includes(career.occupation_id) ? '♥' : '♡'}
                      </Button>
                      <Link to={`/careers/${career.occupation_id}`} className="btn btn-gradient btn-sm">
                        View
                      </Link>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {selectedForCompare.length >= 2 && (
        <div className="compare-bar fixed-bottom py-3 px-4">
          <Container>
            <Row className="align-items-center">
              <Col md={8}>
                <span className="me-3">{selectedForCompare.length} careers selected</span>
              </Col>
              <Col md={4} className="text-end">
                <Link to="/compare" state={{ careerIds: selectedForCompare }} className="btn btn-primary">
                  Compare Now
                </Link>
              </Col>
            </Row>
          </Container>
        </div>
      )}
    </Container>
  );
};

export default Results;
