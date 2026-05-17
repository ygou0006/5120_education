import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { favoritesAPI, matchAPI } from '../api';
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
  const [loading, setLoading] = useState(false);
  const [showFlexModal, setShowFlexModal] = useState(false);

  const [careers, setCareers] = useState<CareerMatch[]>(state?.careers || []);
  const [selectedCourses, setSelectedCourses] = useState<number[]>(state?.selectedCourses || []);
  const [selectedInterests, setSelectedInterests] = useState<number[]>(state?.selectedInterests || []);
  const [selectedCoursesNames, setSelectedCoursesNames] = useState<string[]>(state?.selectedCoursesNames || []);
  const [selectedInterestsNames, setSelectedInterestsNames] = useState<string[]>(state?.selectedInterestsNames || []);
  const maxScore = Math.max(...careers.map((c: CareerMatch) => c.match_score), 1);
  const highMatchCount = careers.filter(c => c.match_score > 50).length;
  const stars = highMatchCount >= 9 ? 5 : highMatchCount >= 7 ? 4 : highMatchCount >= 5 ? 3 : highMatchCount >= 3 ? 2 : highMatchCount >= 1 ? 1 : 0.5;
  const starLabels = ['', '1 Star — Very Low Flexibility', '2 Stars — Low Flexibility', '3 Stars — Moderate Flexibility', '4 Stars — High Flexibility', '5 Stars — Very High Flexibility'];
  const starLabel = stars < 1 ? 'Less Than 1 Star — Very Low Flexibility' : starLabels[Math.ceil(stars)];

  const renderStars = (count: number, fontSize: string = '1.1rem') => {
    const full = Math.floor(count);
    const half = count % 1 !== 0;
    return (
      <>
        {[...Array(full)].map((_, i) => (
          <i key={`f${i}`} className="bi bi-star-fill" style={{ color: '#f4b942', marginRight: '1px', fontSize }}></i>
        ))}
        {half && <i className="bi bi-star-half" style={{ color: '#f4b942', marginRight: '1px', fontSize }}></i>}
      </>
    );
  };

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

  const handleRemoveCourse = async (idx: number) => {
    const newIds = selectedCourses.filter((_, i) => i !== idx);
    const newNames = selectedCoursesNames.filter((_, i) => i !== idx);
    setSelectedCourses(newIds);
    setSelectedCoursesNames(newNames);
    if (newIds.length > 0 || selectedInterests.length > 0) {
      setLoading(true);
      const res = await matchAPI.matchCareers(newIds, selectedInterests);
      setCareers(res.data);
      setLoading(false);
    } else {
      setCareers([]);
    }
  };

  const handleRemoveInterest = async (idx: number) => {
    const newIds = selectedInterests.filter((_, i) => i !== idx);
    const newNames = selectedInterestsNames.filter((_, i) => i !== idx);
    setSelectedInterests(newIds);
    setSelectedInterestsNames(newNames);
    if (selectedCourses.length > 0 || newIds.length > 0) {
      setLoading(true);
      const res = await matchAPI.matchCareers(selectedCourses, newIds);
      setCareers(res.data);
      setLoading(false);
    } else {
      setCareers([]);
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
            1. Your Subjects
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', flex: '1 1 0', marginLeft: '10px' }}>
                    {selectedCoursesNames.map((name, idx) => (
                      <Badge
                        key={idx}
                        className="badge-custom-color"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        onClick={() => handleRemoveCourse(idx)}
                      >
                        {name}
                        <span style={{ marginLeft: '5px', fontWeight: 'bold', fontSize: '1.1em', lineHeight: 1 }}>&times;</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {selectedInterestsNames.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline' }}>
                  <strong>Your interests:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', flex: '1 1 0', marginLeft: '10px' }}>
                    {selectedInterestsNames.map((name, idx) => (
                      <Badge
                        key={idx}
                        className="badge-custom-color"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        onClick={() => handleRemoveInterest(idx)}
                      >
                        {name}
                        <span style={{ marginLeft: '5px', fontWeight: 'bold', fontSize: '1.1em', lineHeight: 1 }}>&times;</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {careers.length > 0 && (
                <div className="mt-2 pt-1" style={{ borderTop: '1px solid #eee' }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <strong>Flexibility:</strong>
                      <span style={{ fontSize: '1.1rem', letterSpacing: '2px' }}>
                        {renderStars(stars)}
                      </span>
                      {stars > 0 && (
                        <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                          — {starLabel}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 text-decoration-none"
                      onClick={() => setShowFlexModal(true)}
                      style={{ fontSize: '0.9rem', color: "var(--bs-heading-color)" }}
                    >
                      <i className="bi bi-question-circle" style={{ fontSize: '1rem', marginRight: '3px' }}></i> What is Flexibility?
                    </Button>
                  </div>
                  <p className="mb-0 mt-1 text-muted" style={{ fontSize: '0.9rem' }}>
                    This subject combination opens up <strong>{careers.length}</strong> possible career paths, giving you a high level of future flexibility.
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Updating results...</p>
          </div>
        ) : careers.length === 0 ? (
          <div className="no-results text-center py-5">
            <p className="mb-3" style={{ color: '#933' }}>No matching careers found based on your selected courses and interests.</p>
            <Link to="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}  className="btn btn-gradient-gray">Back</Link>
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
                  <span style={{ color: '#fff' }}>{selectedForCompare.length} careers selected</span><br />
                  <Link to="/compare" state={{ careerIds: selectedForCompare }} className="btn btn-gradient-sm ps-4 pe-4">
                    Compare Now
                  </Link>
                </Col>
              </Row>
            </Container>
          </div>
        )}

        {showFlexModal && (
          <div className="modal-overlay" onClick={() => setShowFlexModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <h5 className="mb-0">What is Flexibility?</h5>
                <button className="btn-close" onClick={() => setShowFlexModal(false)}></button>
              </div>
              <p className="text-muted mb-3">
                This subject combination opens up <strong>{careers.length}</strong> possible career paths, giving you a high level of future flexibility.
              </p>
              {stars > 0 && (
                <div>
                  <strong>
                    {renderStars(stars, '1rem')}
                    {' '}{starLabel}
                  </strong>
                  <p className="mb-0 mt-1 text-muted" style={{ fontSize: '0.9rem' }}>
                    {Math.ceil(stars) === 1 && 'This subject combination leads to only a few career options. Your future pathways may be quite limited.'}
                    {Math.ceil(stars) === 2 && 'This combination offers some career options, but your future choices may still be somewhat restricted.'}
                    {Math.ceil(stars) === 3 && 'This combination provides a balanced range of career options, giving you a reasonable level of flexibility.'}
                    {Math.ceil(stars) === 4 && 'This combination opens up many career pathways, allowing you to keep your options flexible in the future.'}
                    {Math.ceil(stars) === 5 && 'This combination leads to a wide variety of career options, giving you maximum flexibility and choice in the future.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default Results;
