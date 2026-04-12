import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Badge } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { careersAPI, compareAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Occupation, EmploymentData, SalaryTrend } from '../types';
import './Compare.css';

const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM5Q0EzQUYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj5DYXJlZXI8L3RleHQ+PC9zdmc+';

interface LocationState {
  careerIds: number[];
}

const Compare = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  const { user } = useAuth();
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [allCareers, setAllCareers] = useState<Occupation[]>([]);
  const [employmentData, setEmploymentData] = useState<Record<number, EmploymentData[]>>({});
  const [salaryData, setSalaryData] = useState<Record<number, SalaryTrend[]>>({});
  const [selectedId, setSelectedId] = useState<string>('');

  const careerIds = state?.careerIds || [];
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

  useEffect(() => {
    const fetchData = async () => {
      if (careerIds.length === 0) return;
      
      const occs: Occupation[] = [];
      const empData: Record<number, EmploymentData[]> = {};
      const salData: Record<number, SalaryTrend[]> = {};
      
      for (const id of careerIds) {
        const [career, emp, sal] = await Promise.all([
          careersAPI.getOne(id),
          careersAPI.getEmployment(id),
          careersAPI.getSalary(id)
        ]);
        occs.push(career.data);
        empData[id] = emp.data;
        salData[id] = sal.data;
      }
      
      setOccupations(occs);
      setEmploymentData(empData);
      setSalaryData(salData);
    };
    fetchData();

    careersAPI.search('', 0, 100).then(res => setAllCareers(res.data?.data || [])).catch(() => {});
  }, [careerIds]);

  const addCareer = async (id: number) => {
    if (occupations.length >= 5) {
      alert('Maximum 5 careers');
      return;
    }
    const [career, emp, sal] = await Promise.all([
      careersAPI.getOne(id),
      careersAPI.getEmployment(id),
      careersAPI.getSalary(id)
    ]);
    setOccupations(prev => [...prev, career.data]);
    setEmploymentData(prev => ({ ...prev, [id]: emp.data }));
    setSalaryData(prev => ({ ...prev, [id]: sal.data }));
    setSelectedId('');
  };

  const removeCareer = (id: number) => {
    setOccupations(prev => prev.filter(o => o.id !== id));
  };

  const handleSave = async () => {
    if (!user) {
      alert('Please login to save comparisons');
      return;
    }
    await compareAPI.create(
      occupations.map(o => o.id),
      'My Comparison'
    );
    alert('Comparison saved');
  };

  return (
    <Container className="compare-page py-4" style={{ paddingTop: '80px' }}>
      <h1 className="text-center mb-4">Compare Careers</h1>
      
      <Row className="mb-4">
        <Col md={6} className="mx-auto">
          <Form.Group>
            <Form.Label>Add more careers to compare:</Form.Label>
            <Form.Select 
              value={selectedId} 
              onChange={(e) => {
                const val = e.target.value;
                setSelectedId(val);
                if (val) addCareer(parseInt(val));
              }}
            >
              <option value="">Select a career...</option>
              {allCareers
                .filter(c => !occupations.find(o => o.id === c.id))
                .map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))
              }
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row xs={1} sm={2} md={3} lg={5} className="g-3 mb-4">
        {occupations.map((occ) => (
          <Col key={occ.id}>
            <Card className="h-100 text-center position-relative">
              <Button 
                variant="outline-danger" 
                size="sm" 
                className="position-absolute top-0 end-0 m-2"
                onClick={() => removeCareer(occ.id)}
                style={{ zIndex: 1 }}
              >
                ×
              </Button>
              <Card.Img variant="top" src={occ.image_base64 || defaultImage} alt={occ.title} style={{ height: '120px', objectFit: 'cover' }} />
              <Card.Body>
                <Card.Title>{occ.title}</Card.Title>
                <Badge bg="secondary">{occ.category}</Badge>
                <p className="small mb-0 mt-2">ANZSCO: {occ.anzsco_code}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {occupations.length >= 2 && (
        <>
          <Card className="mb-4">
            <Card.Body>
              <h2>Employment Trends</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    {occupations.map((occ) => (
                      <Line 
                        key={occ.id}
                        type="monotone" 
                        data={employmentData[occ.id] || []} 
                        dataKey="employment_count" 
                        stroke={colors[occupations.indexOf(occ) % colors.length]}
                        name={occ.title}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <h2>Salary Trends</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    {occupations.map((occ) => (
                      <Line 
                        key={occ.id}
                        type="monotone" 
                        data={salaryData[occ.id] || []} 
                        dataKey="average_annual_salary" 
                        stroke={colors[occupations.indexOf(occ) % colors.length]}
                        name={occ.title}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Body>
              <h2>Comparison Table</h2>
              <div className="table-responsive">
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {occupations.map(o => <th key={o.id}>{o.title}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Category</td>
                      {occupations.map(o => <td key={o.id}>{o.category}</td>)}
                    </tr>
                    <tr>
                      <td>Skill Level</td>
                      {occupations.map(o => <td key={o.id}>{o.skill_level}/5</td>)}
                    </tr>
                    <tr>
                      <td>Education Required</td>
                      {occupations.map(o => <td key={o.id}>{o.education_required || 'N/A'}</td>)}
                    </tr>
                    <tr>
                      <td>Work Type</td>
                      {occupations.map(o => <td key={o.id}>{o.work_type || 'N/A'}</td>)}
                    </tr>
                    <tr>
                      <td>Latest Avg Salary</td>
                      {occupations.map(o => {
                        const latest = (salaryData[o.id] || []).slice(-1)[0];
                        return <td key={o.id}>{latest ? `$${latest.average_annual_salary?.toLocaleString()}` : 'N/A'}</td>;
                      })}
                    </tr>
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>

          {user && (
            <div className="text-center">
              <Button variant="primary" onClick={handleSave}>Save Comparison</Button>
            </div>
          )}
        </>
      )}

      <div className="text-center mt-4">
        <Link to="/explore" className="btn btn-outline-primary">← Back to Explore</Link>
      </div>
    </Container>
  );
};

export default Compare;
