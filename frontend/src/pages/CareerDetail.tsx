import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { careersAPI, favoritesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { AppConfig } from '../config';
import type { Occupation, EmploymentData, SalaryTrend, RegionalEmployment, FutureOutcome } from '../types';
import './CareerDetail.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];

const CareerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [career, setCareer] = useState<Occupation | null>(null);
  const [employment, setEmployment] = useState<EmploymentData[]>([]);
  const [salary, setSalary] = useState<SalaryTrend[]>([]);
  const [regional, setRegional] = useState<RegionalEmployment[]>([]);
  const [outlook, setOutlook] = useState<FutureOutcome | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const numId = parseInt(id);
      try {
        const [careerRes, empRes, salRes, regRes, outRes] = await Promise.all([
          careersAPI.getOne(numId),
          careersAPI.getEmployment(numId),
          careersAPI.getSalary(numId),
          careersAPI.getRegional(numId),
          careersAPI.getFutureOutcome(numId)
        ]);
        setCareer(careerRes.data);
        setEmployment(empRes.data);
        setSalary(salRes.data);
        setRegional(regRes.data);
        setOutlook(outRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    if (user && id) {
      favoritesAPI.list().then(res => {
        setIsFavorite(res.data.some(f => f.id === parseInt(id)));
      }).catch(() => {});
    }
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user || !id) return;
    const numId = parseInt(id);
    if (isFavorite) {
      await favoritesAPI.remove(numId);
    } else {
      await favoritesAPI.add(numId);
    }
    setIsFavorite(!isFavorite);
  };

  if (!career) return <Container className="career-detail py-5 text-center"><p>Loading...</p></Container>;

  return (
    <Container className="career-detail py-4" style={{ paddingTop: '80px' }}>
      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center gap-3">
                {(career.image) && (
                  <img 
                    src={career.image} 
                    alt={career.title}
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                  />
                )}
                <div>
                  <h1>{career.title}</h1>
                  <div>
                    <Badge bg="secondary" className="me-2">ANZSCO: {career.anzsco_code}</Badge>
                    <Badge bg="info" className="me-2">{career.category}</Badge>
                    {career.sub_category && <Badge bg="primary">{career.sub_category}</Badge>}
                  </div>
                </div>
              </div>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              {AppConfig.enableFavorites && (
              <Button 
                variant={isFavorite ? 'danger' : 'outline-danger'} 
                onClick={toggleFavorite}
              >
                {isFavorite ? '♥ Favorited' : '♡ Add to Favorites'}
              </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="g-3 mb-4">
        <Col xs={6} md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h5>Skill Level</h5>
              <p className="mb-0">{career.skill_level}/5</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h5>Education Required</h5>
              <p className="mb-0">{career.education_required || 'Not specified'}</p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h5>Salary</h5>
              <p className="mb-0">
                {salary.length > 0 && salary[salary.length - 1].average_annual_salary
                  ? (() => {
                      const avg = salary[salary.length - 1].average_annual_salary;
                      const min = Math.floor(avg! * 0.9 / 100) * 100;
                      const max = Math.ceil(avg! * 1.1 / 100) * 100;
                      return `AUD $${min.toLocaleString()} - $${max.toLocaleString()}`;
                    })()
                  : 'Not specified'}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h5>Work Hours</h5>
              <p className="mb-0">{career.work_hours || 'Not specified'}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <h2>Job Description</h2>
          <p>{career.description}</p>
          {career.main_tasks && (
            <>
              <h3>Main Tasks</h3>
              <p>{career.main_tasks}</p>
            </>
          )}
        </Card.Body>
      </Card>

      {(career.pathway || career.alternative_pathways) && (
        <Row className="mb-4 g-2">
          {career.pathway && (
            <Col xs={12} md={career.alternative_pathways ? 6 : 12}>
              <Card className="h-100">
                <Card.Body>
                  <h3>Pathway</h3>
                  <p style={{whiteSpace: 'pre-line'}}>{career.pathway}</p>
                </Card.Body>
              </Card>
            </Col>
          )}
          {career.alternative_pathways && (
            <Col xs={12} md={career.pathway ? 6 : 12}>
              <Card className="h-100">
                <Card.Body>
                  <h3>Alternative Pathways</h3>
                  <p style={{whiteSpace: 'pre-line'}}>{career.alternative_pathways}</p>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {(employment.length > 0 || salary.length > 0) && (
        <Row className="mb-4 g-2">
          {employment.length > 0 && (
            <Col md={6}>
              <Card className="h-100">
                <Card.Body>
                  <h2>Employment Trends</h2>
                  <p className="text-muted mb-3">This chart shows employment trends over the past 10 years</p>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={employment} margin={{ left: 40 }} barSize={15} barGap={0}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis label={{ value: 'Employees', angle: -90, position: 'insideLeft', offset: -35 }} />
                        <Tooltip
                          contentStyle={{
                            fontSize: '14px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                          itemStyle={{ fontSize: '13px', padding: '0px 0' }}
                          labelStyle={{ fontSize: '15px', color: '#666', marginBottom: '2px' }}
                        />
                        <Bar dataKey="employment_count" fill="#667eea" name="Employment" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
          {salary.length > 0 && (
            <Col md={6}>
              <Card className="h-100">
                <Card.Body>
                  <h2>Salary Trends</h2>
                  <p className="text-muted mb-3">Average and median annual salary by year</p>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={salary} margin={{ left: 40 }} barSize={15} barGap={0}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis label={{ value: 'Salary (AUD)', angle: -90, position: 'insideLeft', offset: -35 }} />
                        <Tooltip
                          contentStyle={{
                            fontSize: '14px',
                            padding: '8px 12px',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}
                          itemStyle={{ fontSize: '13px', padding: '0px 0' }}
                          labelStyle={{ fontSize: '15px', color: '#666', marginBottom: '2px' }}
                        />
                        <Bar dataKey="average_annual_salary" fill="#667eea" name="Average" />
                        <Bar dataKey="median_annual_salary" fill="#764ba2" name="Median" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          )}
        </Row>
      )}

      {regional.length > 0 && (
        <Card className="mb-4">
          <Card.Body>
            <h2>Regional Distribution</h2>
            <p className="text-muted mb-3">Employment distribution by state/region</p>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={regional} dataKey="employment_share" nameKey="state" cx="50%" cy="50%" label>
                    {regional.map((entry, index) => (
                      <Cell key={entry.state} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: '14px',
                      padding: '8px 12px',
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                    itemStyle={{ fontSize: '13px', padding: '0px 0' }}
                    labelStyle={{ fontSize: '15px', color: '#666', marginBottom: '2px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>
      )}

      {outlook && (
        <Card className="mb-4">
          <Card.Body>
            <h2>Future Outlook</h2>
            <Row className="g-3 mb-3">
              <Col xs={4}>
                <Card className="text-center bg-light">
                  <Card.Body>
                    <h6>Projected Growth Rate</h6>
                    <p className="mb-0">{outlook.projected_growth_rate || 'N/A'}%</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={4}>
                <Card className="text-center bg-light">
                  <Card.Body>
                    <h6>Automation Risk</h6>
                    <p className="mb-0">{outlook.automation_risk_score || 'N/A'}/100</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col xs={4}>
                <Card className="text-center bg-light">
                  <Card.Body>
                    <h6>Emerging Industry</h6>
                    <p className="mb-0">{outlook.emerging_industry ? 'Yes' : 'No'}</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            {outlook.skills_in_demand && (
              <div>
                <h5>In-Demand Skills</h5>
                <div>
                  {(outlook.skills_in_demand as string[]).map((skill: string) => (
                    <Badge key={skill} bg="primary" className="me-1 mb-1">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      <div className="text-center mb-4">
        <Link to="/explore" className="btn btn-gradient-gray">← Back to Explore</Link>
      </div>
    </Container>
  );
};

export default CareerDetail;
