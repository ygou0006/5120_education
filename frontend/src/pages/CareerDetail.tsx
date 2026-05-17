import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Form } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { careersAPI, favoritesAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { AppConfig } from '../config';
import type { Occupation, EmploymentData, SalaryTrend, RegionalEmployment, FutureOutcome, EmploymentProjection } from '../types';
import './CareerDetail.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#2fac3e', '#00c2ee', '#a0a216', '#108876'];

const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  SA: 'South Australia',
  WA: 'Western Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  ACT: 'Australian Capital Territory',
};

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'description', label: 'Description' },
  { id: 'pathways', label: 'Pathways' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'employment', label: 'Employment' },
  { id: 'salary', label: 'Salary' },
  { id: 'regional', label: 'Regional' },
  { id: 'outlook', label: 'Outlook' },
];

const CareerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [career, setCareer] = useState<Occupation | null>(null);
  const [employment, setEmployment] = useState<EmploymentData[]>([]);
  const [salary, setSalary] = useState<SalaryTrend[]>([]);
  const [regional, setRegional] = useState<RegionalEmployment[]>([]);
  const [outlook, setOutlook] = useState<FutureOutcome | null>(null);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [courses, setCourses] = useState<{ course_id: number; course_name: string; is_required: boolean }[]>([]);
  const [projection, setProjection] = useState<EmploymentProjection | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeSections, setActiveSections] = useState<string[]>(['overview']);
  const [employmentMetric, setEmploymentMetric] = useState<'employment_count' | 'female_percentage' | 'male_percentage'>('employment_count');
  const [salaryMetric, setSalaryMetric] = useState<'average_annual_salary' | 'entry_level_salary' | 'senior_level_salary' | 'gender_pay_gap'>('average_annual_salary');

  const visibleSections = useMemo(() => {
    if (!career) return SECTIONS;
    return SECTIONS.filter(s => {
      switch (s.id) {
        case 'pathways': return !!(career.pathway || career.alternative_pathways);
        case 'requirements': return !!(outlook && (outlook.skills_in_demand || outlook.vce_requirements));
        case 'employment': return employment.length > 0;
        case 'salary': return salary.length > 0;
        case 'regional': return regional.length > 0;
        case 'outlook': return !!(outlook || projection);
        default: return true;
      }
    });
  }, [career, outlook, employment, salary, regional, projection]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      const numId = parseInt(id);
      try {
        const [careerRes, empRes, salRes, regRes, outRes, coursesRes, projRes] = await Promise.all([
          careersAPI.getOne(numId),
          careersAPI.getEmployment(numId),
          careersAPI.getSalary(numId),
          careersAPI.getRegional(numId),
          careersAPI.getFutureOutcome(numId),
          careersAPI.getCourses(numId),
          careersAPI.getProjections(numId)
        ]);
        setCareer(careerRes.data);
        setEmployment(empRes.data);
        setSalary(salRes.data);
        setRegional(regRes.data);
        setOutlook(outRes.data);
        setCourses(coursesRes.data);
        setProjection(projRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();

    if (user && id) {
      favoritesAPI.list().then(res => {
        setIsFavorite(res.data.some(f => f.id === parseInt(id)));
      }).catch(() => { });
    }
  }, [id, user]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const prevActiveKey = { current: '' };

    const handleScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const mainNavHeight = 62;
        const navEl = document.querySelector('.anchor-nav');
        const anchorNavHeight = navEl ? navEl.getBoundingClientRect().height : 50;
        const scrollPos = window.scrollY + mainNavHeight + anchorNavHeight + 10;

        const candidates: { id: string; top: number }[] = [];
        for (const section of visibleSections) {
          const el = document.getElementById(section.id);
          if (!el) continue;

          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;

          if (bottom > scrollPos) {
            candidates.push({ id: section.id, top });
          }
        }

        let activeIds: string[];
        if (candidates.length === 0) {
          activeIds = [visibleSections[0].id];
        } else {
          const minTop = Math.min(...candidates.map(c => c.top));
          activeIds = candidates
            .filter(c => c.top >= minTop && c.top <= minTop + 10)
            .map(c => c.id);
        }

        const activeKey = activeIds.sort().join(',');
        if (activeKey !== prevActiveKey.current) {
          prevActiveKey.current = activeKey;
          setActiveSections(activeIds);
        }
      }, 150);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, [visibleSections]);

  useEffect(() => {
    const updateOffset = () => {
      const navEl = document.querySelector('.anchor-nav');
      const navHeight = navEl ? navEl.getBoundingClientRect().height : 50;
      document.documentElement.style.setProperty('--scroll-offset', `${62 + navHeight + 10}px`);
    };

    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [visibleSections]);

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

  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
  };

  const metricConfigs: Record<string, { label: string; color: string; name: string; format: (v: number) => string }> = {
    employment_count: { label: 'Employees', color: '#667eea', name: 'Employment', format: (v) => v.toLocaleString() },
    female_percentage: { label: 'Female (%)', color: '#f093fb', name: 'Female %', format: (v) => `${v}%` },
    male_percentage: { label: 'Male (%)', color: '#4facfe', name: 'Male %', format: (v) => `${v}%` },
  };

  const salaryMetricConfigs: Record<string, { label: string; color: string; name: string; format: (v: number) => string }> = {
    average_annual_salary: { label: 'Salary (AUD)', color: '#667eea', name: 'Average', format: (v) => `$${v.toLocaleString()}` },
    entry_level_salary: { label: 'Salary (AUD)', color: '#4facfe', name: 'Entry Level', format: (v) => `$${v.toLocaleString()}` },
    senior_level_salary: { label: 'Salary (AUD)', color: '#f093fb', name: 'Senior Level', format: (v) => `$${v.toLocaleString()}` },
    gender_pay_gap: { label: 'Gender Pay Gap (AUD)', color: '#764ba2', name: 'Pay Gap', format: (v) => `$${v.toLocaleString()}` },
  };

  const empChart = useMemo(() => employment.length > 0 && (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={employment} margin={{ left: 15 }} barSize={15} barGap={0}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={(value: number) => employmentMetric === 'employment_count' ? formatCompact(value) : value.toString()} label={{ value: metricConfigs[employmentMetric].label, angle: -90, position: 'insideLeft', offset: -10, dy: 35 }} />
          <Tooltip
            formatter={(value: any) => {
              const cfg = metricConfigs[employmentMetric];
              return [cfg.format(value), cfg.name];
            }}
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
          <Bar dataKey={employmentMetric} fill={metricConfigs[employmentMetric].color} name={metricConfigs[employmentMetric].name} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ), [employment, employmentMetric]);

  const salChart = useMemo(() => salary.length > 0 && (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={salary} margin={{ left: 15 }} barSize={15} barGap={0}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={(value: number) => formatCompact(value)} label={{ value: salaryMetricConfigs[salaryMetric].label, angle: -90, position: 'insideLeft', offset: -10, dy: 35 }} />
          <Tooltip
            formatter={(value: any) => {
              const cfg = salaryMetricConfigs[salaryMetric];
              return [cfg.format(value), cfg.name];
            }}
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
          <Bar dataKey={salaryMetric} fill={salaryMetricConfigs[salaryMetric].color} name={salaryMetricConfigs[salaryMetric].name} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ), [salary, salaryMetric]);

  const regionalChart = useMemo(() => regional.length > 0 && (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={regional} dataKey="employment_share" nameKey="state" cx="50%" cy="50%" label={({ value, payload }) => `${value}% (${payload.state})`}>
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
            formatter={(value, name) => [value, STATE_NAMES[name as string] || name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  ), [regional]);

  const projectionChart = useMemo(() => projection && (
    <div className="mt-0 chart-container">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={[
          { year: '2025', employment: projection.year_2025_employment },
          { year: '2030', employment: projection.year_2030_employment },
          { year: '2035', employment: projection.year_2035_employment },
        ]} margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis label={{ value: 'Employment (k)', angle: -90, position: 'insideLeft', offset: -30, dy: 50 }} />
          <Tooltip />
          <Bar dataKey="employment" fill="#667eea" name="Employment (k)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  ), [projection]);

  if (!career) return <Container className="career-detail py-5 text-center"><p>Loading...</p></Container>;

  const fetchLabel = (s: any) => {
    if (s.id === 'outlook') {
      console.log(outlook)
      if (!outlook) return 'projection';
      if (!outlook.projected_growth_rate || !outlook.automation_risk_score || !outlook.emerging_industry) return 'Projection';
    }
    return s.label;
  };

  return (
    <Container className="career-detail py-4" style={{ paddingTop: '80px' }}>
      <Card className="mb-3">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={12}>
              <div className="d-flex align-items-start gap-3">
                {(career.image) && (
                  <img
                    src={career.image}
                    alt={career.title}
                    style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '6px' }}
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

      <div className="anchor-nav">
        {visibleSections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`anchor-nav-item${activeSections.includes(s.id) ? ' active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {fetchLabel(s)}
          </a>
        ))}
      </div>

      <div id="overview">
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="text-center h-100">
              <Card.Body>
                <h5>
                  Job Difficulty{' '}
                  <i className="bi bi-question-circle" style={{ cursor: 'pointer' }} onClick={() => setShowDifficultyModal(true)}></i>
                </h5>
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
      </div>

      <div id="description">
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
      </div>

      <div id="pathways">
        {(career.pathway || career.alternative_pathways) && (
          <Row className="mb-4 g-2">
            {career.pathway && (
              <Col xs={12} md={career.alternative_pathways ? 6 : 12}>
                <Card className="h-100">
                  <Card.Body>
                    <h3>Pathway</h3>
                    <p style={{ whiteSpace: 'pre-line' }}>{career.pathway}</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
            {career.alternative_pathways && (
              <Col xs={12} md={career.pathway ? 6 : 12}>
                <Card className="h-100">
                  <Card.Body>
                    <h3>Alternative Pathways</h3>
                    <p style={{ whiteSpace: 'pre-line' }}>{career.alternative_pathways}</p>
                  </Card.Body>
                </Card>
              </Col>
            )}
          </Row>
        )}
      </div>

      <div id="requirements">
        {outlook && (outlook.skills_in_demand || outlook.vce_requirements) && (
          <Row className="mb-4 g-2">
            <Col xs={12} md={12}>
              <Card className="h-100">
                <Card.Body>
                  <h3>Entry Requirements & Skills</h3>
                  {outlook.vce_requirements && (
                    <>
                      <h5 style={{ fontSize: '20px', paddingTop: '16px' }}>VCE Requirements <span style={{ fontSize: '12px', color: 'gray' }}>Only applies if you choose a university pathway</span></h5>
                      <div>
                        {courses.some(c => c.is_required) && (
                          <div className="mb-2">
                            {courses.filter(c => c.is_required).map((c) => (
                              <Badge key={c.course_id} bg="info" className="me-1 mb-1">{c.course_name}</Badge>
                            ))}
                          </div>
                        )}
                        {(outlook.vce_requirements as string[]).map((vce: string) => (
                          <Badge key={vce} bg="secondary" className="me-1 mb-1">{vce}</Badge>
                        ))}
                      </div>
                    </>
                  )}

                  {outlook.skills_in_demand && (
                    <>
                      <h5 style={{ fontSize: '20px', paddingTop: '16px' }}>In-Demand Skills</h5>
                      <div>
                        {(outlook.skills_in_demand as string[]).map((skill: string) => (
                          <Badge key={skill} bg="info" className="me-1 mb-1">{skill}</Badge>
                        ))}
                      </div>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {(employment.length > 0 || salary.length > 0) && (
        <Row className="mb-4 g-2">
          {employment.length > 0 && (
            <Col md={6}>
              <div id="employment">
                <Card className="h-100">
                  <Card.Body>
                    <h2>Employment Trends</h2>
                    <p className="text-muted mb-3">This chart shows employment trends over the past 10 years</p>
                    <div className="d-flex justify-content-center gap-3 mb-2 flex-wrap">
                      <Form.Check
                        type="radio"
                        label="Employees"
                        name="empMetric"
                        id="emp-metric-count"
                        checked={employmentMetric === 'employment_count'}
                        onChange={() => setEmploymentMetric('employment_count')}
                      />
                      <Form.Check
                        type="radio"
                        label="Female %"
                        name="empMetric"
                        id="emp-metric-female"
                        checked={employmentMetric === 'female_percentage'}
                        onChange={() => setEmploymentMetric('female_percentage')}
                      />
                      <Form.Check
                        type="radio"
                        label="Male %"
                        name="empMetric"
                        id="emp-metric-male"
                        checked={employmentMetric === 'male_percentage'}
                        onChange={() => setEmploymentMetric('male_percentage')}
                      />
                    </div>
                    {empChart}
                  </Card.Body>
                </Card>
              </div>
            </Col>
          )}
          {salary.length > 0 && (
            <Col md={6}>
              <div id="salary">
                <Card className="h-100">
                  <Card.Body>
                    <h2>Salary Trends</h2>
                    <p className="text-muted mb-3">Salary trends over the years</p>
                    <div className="d-flex justify-content-center gap-3 mb-2 flex-wrap">
                      <Form.Check
                        type="radio"
                        label="Average"
                        name="salMetric"
                        id="sal-metric-avg"
                        checked={salaryMetric === 'average_annual_salary'}
                        onChange={() => setSalaryMetric('average_annual_salary')}
                      />
                      <Form.Check
                        type="radio"
                        label="Entry Level"
                        name="salMetric"
                        id="sal-metric-entry"
                        checked={salaryMetric === 'entry_level_salary'}
                        onChange={() => setSalaryMetric('entry_level_salary')}
                      />
                      <Form.Check
                        type="radio"
                        label="Senior Level"
                        name="salMetric"
                        id="sal-metric-senior"
                        checked={salaryMetric === 'senior_level_salary'}
                        onChange={() => setSalaryMetric('senior_level_salary')}
                      />
                      <Form.Check
                        type="radio"
                        label="Pay Gap"
                        name="salMetric"
                        id="sal-metric-gap"
                        checked={salaryMetric === 'gender_pay_gap'}
                        onChange={() => setSalaryMetric('gender_pay_gap')}
                      />
                    </div>
                    {salChart}
                  </Card.Body>
                </Card>
              </div>
            </Col>
          )}
        </Row>
      )}

      <div id="regional">
        {regional.length > 0 && (
          <Card className="mb-4">
            <Card.Body>
              <h2>Regional Distribution</h2>
              <p className="text-muted mb-3">Employment distribution by state/region</p>
              <Row className="align-items-center">
                <Col xs={12} md={7}>
                  {regionalChart}
                </Col>
                <Col xs={12} md={5}>
                  <div className="d-flex flex-column gap-2">
                    {regional.map((entry, index) => (
                      <div key={entry.state} className="d-flex align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            backgroundColor: COLORS[index % COLORS.length],
                            marginRight: 8,
                            flexShrink: 0,
                          }}
                        />
                        {STATE_NAMES[entry.state] || entry.state} — {entry.employment_share}%
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        )}
      </div>

      <div id="outlook">
        {(outlook || projection) && (
          <Card className="mb-4">
            <Card.Body>
              {outlook && outlook.projected_growth_rate && outlook.automation_risk_score && outlook.emerging_industry && (
                <>
                  <h2>Future Outlook</h2>
                  <Row className="g-3 mb-5">
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
                </>
              )}

              {projection && (
                <>
                  <h2>Employment Projections</h2>
                  <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
                    Projected employment data from 2025 to 2035
                  </p>
                  {projectionChart}

                  <Row className="g-2">
                    <Col xs={6}>
                      <Card className="text-center bg-light">
                        <Card.Body className='p-2'>
                          <h6>5-Year Change</h6>
                          <p className="mb-0">{projection.change_5yr_level != null ? `${projection.change_5yr_level}K jobs` : 'N/A'}({projection.change_5yr_pct != null ? `${(projection.change_5yr_pct * 100).toFixed(1)}%` : 'N/A'})</p>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={6}>
                      <Card className="text-center bg-light">
                        <Card.Body className='p-2'>
                          <h6>10-Year Change</h6>
                          <p className="mb-0">{projection.change_10yr_level != null ? `${projection.change_10yr_level}K jobs` : 'N/A'}({projection.change_10yr_pct != null ? `${(projection.change_10yr_pct * 100).toFixed(1)}%` : 'N/A'})</p>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </>
              )}
            </Card.Body>
          </Card>
        )}
      </div>

      <div className="text-center mb-4">
        <Link to="#" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="btn btn-gradient-gray">← Back</Link>
      </div>

      {showDifficultyModal && (
        <div className="modal-overlay" onClick={() => setShowDifficultyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h5 className="mb-0">What is Job Difficulty?</h5>
              <button className="btn-close" onClick={() => setShowDifficultyModal(false)}></button>
            </div>
            <p className="text-muted mb-0">
              This score shows how challenging it is to enter and perform well in this job. It considers factors such as required education, skills, training time, and job complexity. A higher score means more preparation, higher skill requirements, and a more demanding role.
            </p>
          </div>
        </div>
      )}
    </Container>
  );
};

export default CareerDetail;
