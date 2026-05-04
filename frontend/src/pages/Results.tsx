import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { favoritesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { AppConfig } from '../config';
import type { CareerMatch, Occupation } from '../types';
import './Results.css';

const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM5Q0EzQUYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj5DYXJlZXI8L3RleHQ+PC9zdmc+';

interface LocationState {
  careers: CareerMatch[];
  selectedCourses: number[];
  selectedInterests: number[];
  selectedCoursesNames: string[];
  selectedInterestsNames: string[];
}

const Results = () => {
  const [step] = useState(3);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const state = location.state as LocationState | null;
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  const careers = state?.careers || [];
  const selectedCourses = state?.selectedCourses || [];
  const selectedInterests = state?.selectedInterests || [];
  const selectedCoursesNames = state?.selectedCoursesNames || [];
  const selectedInterestsNames = state?.selectedInterestsNames || [];
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
    <div className='results'>
      <Container className="results-page py-4" style={{ paddingTop: '80px' }}>
        <div className="steps-indicator mb-4">
          <div
            className={`step clickable ${step == 1 ? 'active' : ''}`}
            onClick={() => navigate('/explore', { state: { selectedCourses, selectedInterests, initialStep: 1 } })}
          >
            1. About You
          </div>
          <div
            className={`step clickable ${step == 2 ? 'active' : ''}`}
            onClick={() => navigate('/explore', { state: { selectedCourses, selectedInterests, initialStep: 2 } })}
          >
            2. Your Interests
          </div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Your Pathways</div>
        </div>

        <div className="text-center mb-1">
          <h1 className='mb-0'>Matching Careers</h1>
          <p className="text-muted mb-0">
            Close connection with the curriculum, Based on your interest in Problem Solving
          </p>
        </div>

        {(selectedCoursesNames.length > 0 || selectedInterestsNames.length > 0) && (
          <Card className="mb-4 info-card">
            <Card.Body className='py-2'>
              <h5 className="mb-1">Recommended because</h5>
              {selectedCoursesNames.length > 0 && (
                <div className="mb-0" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <strong>Your selections:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', flex: '1 1 0' }}>
                    {selectedCoursesNames.map((name, idx) => (
                      <Badge key={idx} className="badge-custom-color">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedInterestsNames.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <strong>Your interests:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', flex: '1 1 0' }}>
                    {selectedInterestsNames.map((name, idx) => (
                      <Badge key={idx} className="badge-custom-color">{name}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

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
                  <div onClick={() => navigate(`/careers/${career.occupation_id}`)} style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Card.Img variant="top" src={career.image || defaultImage} alt={career.title} style={{ height: '256px', objectFit: 'cover' }} />
                    <Card.Body style={{ flex: 1 }}>
                      <Card.Title className="mb-1">{career.title}</Card.Title>
                      <Badge bg="secondary" className="mb-2">{career.category}</Badge>
                      <Card.Text className="card-description">{career.description!.length > 80 ? career.description!.substring(0, 100) + '...' : career.description}</Card.Text>
                    </Card.Body>
                    <div className="match-score px-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Match Score</small>
                        <small>{Math.round(career.match_score)}%</small>
                      </div>
                      <div className="score-bar">
                        <div className="score-fill" style={{ width: `${(career.match_score / maxScore) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-center px-3 pb-0 my-3">
                      <div className="d-flex align-items-center gap-2">
                        <Form.Check
                          type="checkbox"
                          checked={selectedForCompare.includes(career.occupation_id)}
                          onChange={() => toggleCompare(career.occupation_id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span 
                          onClick={() => toggleCompare(career.occupation_id)}
                          style={{ cursor: 'pointer' }}
                        >
                          Compare
                        </span>
                      </div>
                      <div className="d-flex gap-2">
                        {AppConfig.enableFavorites && (
                        <Button
                          variant={user && favoriteIds.includes(career.occupation_id) ? 'danger' : 'outline-danger'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(career.occupation_id);
                          }}
                        >
                          {user && favoriteIds.includes(career.occupation_id) ? '♥' : '♡'}
                        </Button>
                        )}
                        <Link to={`/careers/${career.occupation_id}`} className="btn btn-gradient btn-sm">
                          View
                        </Link>
                      </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {selectedForCompare.length >= 2 && (
          <div className="compare-bar fixed-bottom py-3 px-4">
            <Container>
              <Row className="align-items-center">
                <Col md={12} className="text-center">
                  <span>{selectedForCompare.length} careers selected</span><br />
                  <Link to="/compare" state={{ careerIds: selectedForCompare }} className="btn btn-gradient-sm ps-4 pe-4">
                    Compare Now
                  </Link>
                </Col>
              </Row>
            </Container>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Results;
