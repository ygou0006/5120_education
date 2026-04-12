import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { favoritesAPI, explorationsAPI } from '../api';
import type { Occupation, Exploration } from '../types';
import './Dashboard.css';

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'history'>('profile');
  const [favorites, setFavorites] = useState<Occupation[]>([]);
  const [history, setHistory] = useState<Exploration[]>([]);
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    school: user?.school || '',
    grade: user?.grade || '',
    age: user?.age || ''
  });

  useEffect(() => {
    if (user) {
      favoritesAPI.list().then(res => setFavorites(res.data)).catch(() => {});
      explorationsAPI.history().then(res => setHistory(res.data)).catch(() => {});
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    await updateProfile({
      ...profileForm,
      age: profileForm.age ? Number(profileForm.age) : undefined
    });
    alert('Profile updated');
  };

  const handleRemoveFavorite = async (id: number) => {
    await favoritesAPI.remove(id);
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  if (!user) return <Container className="py-5"><p>Please login</p></Container>;

  return (
    <Container className="dashboard py-4" style={{ paddingTop: '80px' }}>
      <Row>
        <Col md={3} className="mb-4 mb-md-0">
          <Card>
            <Card.Header>
              <h4 className="mb-0">Dashboard</h4>
            </Card.Header>
            <Card.Body className="p-0">
              <Nav variant="pills" className="flex-column">
                <Nav.Item>
                  <Nav.Link 
                    className={activeTab === 'profile' ? 'active' : ''} 
                    onClick={() => setActiveTab('profile')}
                    style={{ cursor: 'pointer' }}
                  >
                    Profile
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    className={activeTab === 'favorites' ? 'active' : ''} 
                    onClick={() => setActiveTab('favorites')}
                    style={{ cursor: 'pointer' }}
                  >
                    My Favorites
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    className={activeTab === 'history' ? 'active' : ''} 
                    onClick={() => setActiveTab('history')}
                    style={{ cursor: 'pointer' }}
                  >
                    Exploration History
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={9}>
          {activeTab === 'profile' && (
            <Card>
              <Card.Header>
                <h4 className="mb-0">My Profile</h4>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="text" value={user.username} disabled />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" value={user.email} disabled />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={profileForm.full_name} 
                          onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})} 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Age</Form.Label>
                        <Form.Control 
                          type="number" 
                          value={profileForm.age} 
                          onChange={(e) => setProfileForm({...profileForm, age: parseInt(e.target.value)})} 
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>School</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={profileForm.school} 
                          onChange={(e) => setProfileForm({...profileForm, school: e.target.value})} 
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Grade</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={profileForm.grade} 
                          onChange={(e) => setProfileForm({...profileForm, grade: e.target.value})} 
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button className='btn btn-gradient' variant="primary" onClick={handleProfileUpdate}>Update Profile</Button>
                </Form>
              </Card.Body>
            </Card>
          )}
          
          {activeTab === 'favorites' && (
            <Card>
              <Card.Header>
                <h4 className="mb-0">My Favorites</h4>
              </Card.Header>
              <Card.Body>
                {favorites.length === 0 ? (
                  <p className="text-muted">No favorites yet</p>
                ) : (
                  <Row xs={1} md={2} lg={3} className="g-3">
                    {favorites.map(career => (
                      <Col key={career.id}>
                        <Card className="h-100">
                          <Card.Body>
                            <Card.Title>{career.title}</Card.Title>
                            <Card.Text>{career.category}</Card.Text>
                            <div className="d-flex gap-2">
                              <Link to={`/careers/${career.id}`} className="btn btn-gradient btn-sm">View</Link>
                              <Button variant="outline-danger" size="sm" onClick={() => handleRemoveFavorite(career.id)}>Remove</Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </Card.Body>
            </Card>
          )}
          
          {activeTab === 'history' && (
            <Card>
              <Card.Header>
                <h4 className="mb-0">Exploration History (Recently 20)</h4>
              </Card.Header>
              <Card.Body>
                {history.length === 0 ? (
                  <p className="text-muted">No exploration history</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Courses</th>
                          <th>Interests</th>
                          <th>Matched Careers</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map(h => (
                          <tr key={h.id}>
                            <td>{new Date(h.created_at).toLocaleDateString()}</td>
                            <td>{h.selected_courses?.length || 0}</td>
                            <td>{h.selected_tags?.length || 0}</td>
                            <td>{h.matched_careers?.length || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
