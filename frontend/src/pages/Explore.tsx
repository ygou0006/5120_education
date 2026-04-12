import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Badge, Pagination } from 'react-bootstrap';
import { coursesAPI, interestsAPI, matchAPI, explorationsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Course, InterestTag } from '../types';
import './Explore.css';

const defaultCourseImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM5Q0EzQUYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj5Db3Vyc2U8L3RleHQ+PC9zdmc+';

const Explore = () => {
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [interests, setInterests] = useState<InterestTag[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<number[]>([]);
  
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesTotalPages, setCoursesTotalPages] = useState(1);
  const [coursesSearch, setCoursesSearch] = useState('');
  
  const [interestsPage, setInterestsPage] = useState(1);
  const [interestsTotalPages, setInterestsTotalPages] = useState(1);
  const [interestsSearch, setInterestsSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCourses = useCallback((page: number, search: string) => {
    coursesAPI.getAll(page, 10, search || undefined)
      .then(res => {
        setCourses(res.data.data);
        setCoursesTotalPages(res.data.total_pages);
      })
      .catch(() => {});
  }, []);

  const fetchInterests = useCallback((page: number, search: string) => {
    interestsAPI.getAll(page, 20, search || undefined)
      .then(res => {
        setInterests(res.data.data);
        setInterestsTotalPages(res.data.total_pages);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchCourses(coursesPage, coursesSearch);
  }, [coursesPage, coursesSearch, fetchCourses]);

  useEffect(() => {
    fetchInterests(interestsPage, interestsSearch);
  }, [interestsPage, interestsSearch, fetchInterests]);

  const toggleCourse = (id: number) => {
    setSelectedCourses(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleInterest = (id: number) => {
    setSelectedInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCoursesSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCoursesPage(1);
    fetchCourses(1, coursesSearch);
  };

  const handleInterestsSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setInterestsPage(1);
    fetchInterests(1, interestsSearch);
  };

  const renderPagination = (currentPage: number, totalPages: number, onPageChange: (page: number) => void) => {
    const items: React.ReactNode[] = [];
    
    items.push(
      <Pagination.Prev 
        key="prev" 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)} 
      />
    );

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <Pagination.Item 
            key={i} 
            active={i === currentPage} 
            onClick={() => onPageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
    } else {
      items.push(
        <Pagination.Item 
          key={1} 
          active={1 === currentPage} 
          onClick={() => onPageChange(1)}
        >
          1
        </Pagination.Item>
      );
      if (currentPage > 3) items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        items.push(
          <Pagination.Item 
            key={i} 
            active={i === currentPage} 
            onClick={() => onPageChange(i)}
          >
            {i}
          </Pagination.Item>
        );
      }
      if (currentPage < totalPages - 2) items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
      items.push(
        <Pagination.Item 
          key={totalPages} 
          active={totalPages === currentPage} 
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next 
        key="next" 
        disabled={currentPage === totalPages} 
        onClick={() => onPageChange(currentPage + 1)} 
      />
    );

    return <Pagination className="justify-content-center mb-0">{items}</Pagination>;
  };

  const handleFindCareers = async () => {
    setLoading(true);
    try {
      const result = await matchAPI.matchCareers(selectedCourses, selectedInterests);
      
      if (user) {
        await explorationsAPI.save(
          selectedCourses,
          selectedInterests,
          result.data.map(c => c.occupation_id)
        );
      }
      
      navigate('/results', { 
        state: { 
          careers: result.data,
          selectedCourses,
          selectedInterests
        } 
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedCourses([]);
    setSelectedInterests([]);
    setStep(1);
  };

  return (
    <Container className="explore-page py-4">
      <div className="steps-indicator mb-4">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Courses</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Interests</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Results</div>
      </div>

      {step === 1 && (
        <div className="selection-section">
          <h2>Select Your Courses</h2>
          <p className="text-muted mb-4">Choose the subjects you're taking or interested in</p>
          
          <Form onSubmit={handleCoursesSearch} className="mb-4 d-flex justify-content-center">
            <Form.Control
              type="text"
              className='me-2'
              placeholder="Search courses..."
              value={coursesSearch}
              onChange={(e) => setCoursesSearch(e.target.value)}
            />
            <Button type="submit" variant="primary" className='btn-gradient'>Search</Button>
          </Form>
          
          <Row xs={1} sm={2} md={3} lg={4} className="g-3">
            {courses?.map(course => (
              <Col key={course.id}>
                <Card 
                  className={`selection-card h-100 ${selectedCourses.includes(course.id) ? 'selected border-primary' : ''}`}
                  onClick={() => toggleCourse(course.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <Card.Img variant="top" src={course.image_base64 || defaultCourseImage} alt={course.name} style={{ height: '120px', objectFit: 'cover' }} />
                  <Card.Body className="text-center">
                    <Card.Title>{course.name}</Card.Title>
                    <Badge bg="secondary">{course.category}</Badge>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
          
          {coursesTotalPages > 1 && (
            <div className="mt-4">
              {renderPagination(coursesPage, coursesTotalPages, setCoursesPage)}
            </div>
          )}
          
          <div className="d-flex justify-content-center mt-4">
            <Button
              className='btn-gradient'
              variant="primary" 
              size="lg"
              onClick={() => setStep(2)}
              disabled={selectedCourses.length === 0 && selectedInterests.length === 0}
            >
              Next: Select Interests
            </Button>
            <Button className='btn-gradient-gray ms-3' variant="outline-danger" size="lg" onClick={reset}>Reset</Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="selection-section">
          <h2>Select Your Interests</h2>
          <p className="text-muted mb-4">Pick activities that interest you</p>
          
          <Form onSubmit={handleInterestsSearch} className="d-flex justify-content-center mt-4 mb-4 m-3">
            <Form.Control
              type="text"
              placeholder="Search interests..."
              value={interestsSearch}
              onChange={(e) => setInterestsSearch(e.target.value)}
            />
            <Button className='btn-gradient ms-2' type="submit" variant="primary">Search</Button>
          </Form>
          
          <div className="tags-container">
            {interests?.map(interest => (
              <Button
                key={interest.id}
                variant={'outline-secondary'}
                className={selectedInterests.includes(interest.id) ? 'btn-gradient interest-tag me-2 mb-2' : 'outline-secondary interest-tag me-2 mb-2'}
                onClick={() => toggleInterest(interest.id)}
              >
                {interest.emoji} {interest.name}
              </Button>
            ))}
          </div>
          
          {interestsTotalPages > 1 && (
            <div className="mt-4">
              {renderPagination(interestsPage, interestsTotalPages, setInterestsPage)}
            </div>
          )}
          
          <div className="d-flex justify-content-center mt-4">
            <Button className='btn-gradient-gray' variant="outline-secondary" onClick={() => setStep(1)} disabled={loading}>Back</Button>
            <Button className='btn-gradient ms-3' variant="primary" size="lg" onClick={handleFindCareers} disabled={loading}>
              {loading ? 'Loading...' : 'Find Matching Careers'}
            </Button>
          </div>
        </div>
      )}

      <div className="selection-summary mt-4 p-3 bg-light rounded">
        <Row className="align-items-center">
          <Col md={8}>
            <p className="mb-0">Selected: <strong>{selectedCourses.length}</strong> courses, <strong>{selectedInterests.length}</strong> interests</p>
          </Col>
          <Col md={4} className="text-md-end">
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Explore;
