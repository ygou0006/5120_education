import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Pagination } from 'react-bootstrap';
import { careersAPI } from '../api';
import type { Occupation } from '../types';
import './Careers.css';

const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM5Q0EzQUYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj5DYXJlZXI8L3RleHQ+PC9zdmc+';

const Careers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [careers, setCareers] = useState<Occupation[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('q') || '';

  const fetchCareers = async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    try {
      const res = await careersAPI.search(searchTerm, (pageNum - 1) * 12, 12);
      const data = res.data?.data || [];
      setCareers(data);
      setTotalPages(res.data?.total_pages || 1);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCareers(page, search);
  }, [page, search]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchTerm = formData.get('search') as string || '';
    setSearchParams({ q: searchTerm, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: search, page: newPage.toString() });
  };

  const renderPagination = () => {
    const items: React.ReactNode[] = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    items.push(
      <Pagination.Prev key="prev" disabled={page === 1} onClick={() => handlePageChange(page - 1)} />
    );

    for (let i = start; i <= end; i++) {
      items.push(
        <Pagination.Item key={i} active={i === page} onClick={() => handlePageChange(i)}>
          {i}
        </Pagination.Item>
      );
    }

    items.push(
      <Pagination.Next key="next" disabled={page === totalPages} onClick={() => handlePageChange(page + 1)} />
    );

    return <Pagination className="justify-content-center">{items}</Pagination>;
  };

  return (
    <Container className="careers-page py-4" style={{ paddingTop: '80px' }}>
      <h1 className="text-center mb-4">All Careers</h1>

      <Form onSubmit={handleSearch} className="mb-4">
        <Row className="justify-content-center">
          <Col md={6}>
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                name="search"
                placeholder="Search careers..."
                defaultValue={search}
              />
              <Button className='btn btn-gradient' type="submit" variant="primary">Search</Button>
            </div>
          </Col>
        </Row>
      </Form>

      {loading ? (
        <div className="text-center py-5">
          <p>Loading...</p>
        </div>
      ) : careers.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No careers found.</p>
        </div>
      ) : (
        <>
          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {careers.map((career) => (
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

          {totalPages > 1 && (
            <div className="mt-4">
              {renderPagination()}
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default Careers;
