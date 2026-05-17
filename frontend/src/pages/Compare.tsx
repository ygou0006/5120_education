import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Modal } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { careersAPI, compareAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Occupation, EmploymentData, SalaryTrend, RegionalEmployment } from '../types';
import { AppConfig } from '../config';
import './Compare.css';

const COMPARE_SECTIONS = [
  { id: 'compare-overview', label: 'Overview' },
  { id: 'compare-employment', label: 'Employment' },
  { id: 'compare-salary', label: 'Salary' },
  { id: 'compare-regional', label: 'Regional' },
  { id: 'compare-table', label: 'Table' },
];

const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiM5Q0EzQUYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj5DYXJlZXI8L3RleHQ+PC9zdmc+';

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
  const [mergedEmploymentData, setMergedEmploymentData] = useState<any[]>([]);
  const [mergedSalaryData, setMergedSalaryData] = useState<any[]>([]);
  const [regionalData, setRegionalData] = useState<Record<number, RegionalEmployment[]>>({});
  const [mergedRegionalData, setMergedRegionalData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [empMetric, setEmpMetric] = useState<'employment_count' | 'female_percentage' | 'male_percentage'>('employment_count');
  const [salMetric, setSalMetric] = useState<'average_annual_salary' | 'entry_level_salary' | 'senior_level_salary' | 'gender_pay_gap'>('average_annual_salary');
  const [activeSections, setActiveSections] = useState<string[]>(['compare-overview']);

  const careerIds = state?.careerIds || [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const mergeChartData = (data: Record<number, any[]>) => {
    const allYears = new Set<number>();
    Object.values(data).forEach(arr => {
      arr.forEach(item => allYears.add(item.year));
    });

    const merged: any[] = [];
    Array.from(allYears).sort().forEach(year => {
      const entry: any = { year };
      Object.entries(data).forEach(([occupationId, arr]) => {
        const item = arr.find(a => a.year === year);
        if (item) {
          Object.keys(item).forEach(key => {
            if (key !== 'year' && key !== 'id') {
              entry[`${occupationId}:${key}`] = item[key];
            }
          });
        }
      });
      merged.push(entry);
    });
    return merged;
  };
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];

  const mergeRegionalData = (data: Record<number, RegionalEmployment[]>) => {
    const allStates = new Set<string>();
    Object.values(data).forEach(arr => {
      arr.forEach(item => allStates.add(item.state));
    });

    const merged: any[] = [];
    Array.from(allStates).sort().forEach(state => {
      const entry: any = { state };
      Object.entries(data).forEach(([occupationId, arr]) => {
        const item = arr.find(a => a.state === state);
        if (item) {
          entry[`${occupationId}:employment_share`] = item.employment_share;
        }
      });
      merged.push(entry);
    });
    return merged;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (careerIds.length === 0) return;

      const occs: Occupation[] = [];
      const empData: Record<number, EmploymentData[]> = {};
      const salData: Record<number, SalaryTrend[]> = {};
      const regData: Record<number, RegionalEmployment[]> = {};

      for (const id of careerIds) {
        const [career, emp, sal, reg] = await Promise.all([
          careersAPI.getOne(id),
          careersAPI.getEmployment(id),
          careersAPI.getSalary(id),
          careersAPI.getRegional(id)
        ]);
        occs.push(career.data);
        empData[id] = emp.data;
        salData[id] = sal.data;
        regData[id] = reg.data;
      }

      setOccupations(occs);
      setEmploymentData(empData);
      setSalaryData(salData);
      setRegionalData(regData);

      const mergedEmp = mergeChartData(empData as any);
      const mergedSal = mergeChartData(salData as any);
      const mergedReg = mergeRegionalData(regData);
      setMergedEmploymentData(mergedEmp);
      setMergedSalaryData(mergedSal);
      setMergedRegionalData(mergedReg);
    };
    fetchData();
  }, [careerIds]);

  useEffect(() => {
    setLoadingCareers(true);
    careersAPI.search('', 0, 500, 'id,title,anzsco_code,category,sub_category')
      .then(res => setAllCareers(res.data?.data || []))
      .catch(() => { })
      .finally(() => setLoadingCareers(false));
  }, []);

  const visibleSections = useMemo(() => {
    if (occupations.length < 2) return COMPARE_SECTIONS;
    return COMPARE_SECTIONS;
  }, [occupations]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

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

        if (candidates.length === 0) {
          setActiveSections([visibleSections[0].id]);
          return;
        }

        const minTop = Math.min(...candidates.map(c => c.top));
        const activeIds = candidates
          .filter(c => c.top >= minTop && c.top <= minTop + 10)
          .map(c => c.id);

        setActiveSections(activeIds);
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

  const addCareer = async (id: number) => {
    if (occupations.length >= 5) {
      alert('Maximum 5 careers');
      return;
    }
    const [career, emp, sal, reg] = await Promise.all([
      careersAPI.getOne(id),
      careersAPI.getEmployment(id),
      careersAPI.getSalary(id),
      careersAPI.getRegional(id)
    ]);
    const newOccupations = [...occupations, career.data];
    const newEmpData = { ...employmentData, [id]: emp.data };
    const newSalData = { ...salaryData, [id]: sal.data };
    const newRegData = { ...regionalData, [id]: reg.data };
    setOccupations(newOccupations);
    setEmploymentData(newEmpData);
    setSalaryData(newSalData);
    setRegionalData(newRegData);
    setMergedEmploymentData(mergeChartData(newEmpData));
    setMergedSalaryData(mergeChartData(newSalData));
    setMergedRegionalData(mergeRegionalData(newRegData));
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const removeCareer = (id: number) => {
    const newOccupations = occupations.filter(o => o.id !== id);
    const newEmpData = { ...employmentData };
    const newSalData = { ...salaryData };
    const newRegData = { ...regionalData };
    delete newEmpData[id];
    delete newSalData[id];
    delete newRegData[id];
    setOccupations(newOccupations);
    setEmploymentData(newEmpData);
    setSalaryData(newSalData);
    setRegionalData(newRegData);
    setMergedEmploymentData(mergeChartData(newEmpData));
    setMergedSalaryData(mergeChartData(newSalData));
    setMergedRegionalData(mergeRegionalData(newRegData));
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

  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toString();
  };

  const empMetricConfigs: Record<string, { label: string; format: (v: number) => string }> = {
    employment_count: { label: 'Employees', format: (v) => v.toLocaleString() },
    female_percentage: { label: 'Female (%)', format: (v) => `${v}%` },
    male_percentage: { label: 'Male (%)', format: (v) => `${v}%` },
  };

  const salMetricConfigs: Record<string, { label: string; format: (v: number) => string }> = {
    average_annual_salary: { label: 'Salary (AUD)', format: (v) => `$${v.toLocaleString()}` },
    entry_level_salary: { label: 'Salary (AUD)', format: (v) => `$${v.toLocaleString()}` },
    senior_level_salary: { label: 'Salary (AUD)', format: (v) => `$${v.toLocaleString()}` },
    gender_pay_gap: { label: 'Gender Pay Gap (AUD)', format: (v) => `$${v.toLocaleString()}` },
  };

  const regionalChart = useMemo(() => mergedRegionalData.length > 0 && (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={mergedRegionalData} barSize={12} barGap={0} margin={{ left: 15 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="state" tickFormatter={(v) => v} />
          <YAxis label={{ value: 'Employment Share (%)', angle: -90, position: 'insideLeft', offset: -10, dy: 70 }} />
          <Tooltip
            formatter={(value: any, name: any) => [`${value}%`, name]}
            labelFormatter={(label) => STATE_NAMES[label] || label}
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
          {occupations.map((occ) => (
            <Bar
              key={occ.id}
              dataKey={`${occ.id}:employment_share`}
              fill={colors[occupations.indexOf(occ) % colors.length]}
              name={occ.title}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  ), [mergedRegionalData, occupations]);

  return (
    <Container className="compare-page py-4" style={{ paddingTop: '80px' }}>
      <h1 className="text-center mb-4">Compare Careers</h1>

      <Row className="mb-4">
        <Col md={7} className="mx-auto">
          <div ref={searchRef}>
            <Form.Group style={{ position: 'relative' }}>
              <Form.Label>Search careers to compare:</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder={loadingCareers ? "Loading..." : "Search by career title..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  onFocus={() => !loadingCareers && setShowSearchResults(true)}
                  onKeyDown={(e) => e.key === 'Enter' && !loadingCareers && setShowSearchResults(true)}
                  disabled={loadingCareers}
                />
                <Button variant="primary" className="ms-2 btn-gradient-sm" onClick={() => setShowSearchResults(true)}>Search</Button>
              </div>
              {showSearchResults && (
                <div className="search-results" style={{ position: 'absolute', width: '100%', maxHeight: '300px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '0 0 4px 4px', background: 'white', zIndex: 200 }}>
                  {allCareers
                    .filter(c => !occupations.find(o => o.id === c.id))
                    .filter(c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 500)
                    .map(c => (
                      <div key={c.id} className="search-result-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', cursor: 'pointer' }} onClick={() => { addCareer(c.id); setSearchQuery(''); setShowSearchResults(false); }}>
                        <span>{c.title}</span>
                        <Button className='btn-gradient-sm' variant="primary" size="sm">+</Button>
                      </div>
                    ))}
                  {allCareers.filter(c => !occupations.find(o => o.id === c.id)).filter(c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                    <div style={{ padding: '10px', color: '#666' }}>No results found</div>
                  )}
                </div>
              )}
            </Form.Group>
          </div>
        </Col>
      </Row>

      <div id="compare-overview">
        <Row xs={1} sm={2} md={3} lg={5} className="g-3 mb-4">
          {occupations.map((occ) => (
            <Col key={occ.id}>
              <Card className="h-100 text-center position-relative">
                <Button
                  variant=""
                  size="sm"
                  className="position-absolute top-0 end-0 m-2 btn-compare-remove"
                  onClick={() => removeCareer(occ.id)}
                  style={{ zIndex: 1 }}
                >
                  X
                </Button>
                <Card.Img variant="top" src={occ.image || defaultImage} alt={occ.title} style={{ height: '120px', objectFit: 'cover' }} />
                <Card.Body>
                  <Card.Title>{occ.title}</Card.Title>
                  <Badge bg="secondary" title={occ.category}>{occ.category}</Badge>
                  <p className="small mb-0 mt-2">ANZSCO: {occ.anzsco_code}</p>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {occupations.length >= 2 && (
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
              {s.label}
            </a>
          ))}
        </div>
      )}

      {occupations.length >= 2 && (
        <>
          <Row className="mb-4 g-2">
            <Col md={6}>
              <div id="compare-employment">
                <Card className="h-100">
                  <Card.Body>
                    <h2>Employment Trends</h2>
                    <p className="text-muted mb-3">Number of employees by year for different occupations</p>
                    <div className="d-flex justify-content-center gap-3 mb-2 flex-wrap">
                      <Form.Check
                        type="radio"
                        label="Employees"
                        name="compareEmpMetric"
                        id="compare-emp-count"
                        checked={empMetric === 'employment_count'}
                        onChange={() => setEmpMetric('employment_count')}
                      />
                      <Form.Check
                        type="radio"
                        label="Female %"
                        name="compareEmpMetric"
                        id="compare-emp-female"
                        checked={empMetric === 'female_percentage'}
                        onChange={() => setEmpMetric('female_percentage')}
                      />
                      <Form.Check
                        type="radio"
                        label="Male %"
                        name="compareEmpMetric"
                        id="compare-emp-male"
                        checked={empMetric === 'male_percentage'}
                        onChange={() => setEmpMetric('male_percentage')}
                      />
                    </div>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={mergedEmploymentData} barSize={8} barGap={0} margin={{ left: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value: number) => empMetric === 'employment_count' ? formatCompact(value) : value.toString()} label={{ value: empMetricConfigs[empMetric].label, angle: -90, position: 'insideLeft', offset: -10, dy: 35 }} />
                          <Tooltip
                            formatter={(value: any) => {
                              const cfg = empMetricConfigs[empMetric];
                              return cfg.format(value);
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
                          {occupations.map((occ) => (
                            <Bar
                              key={occ.id}
                              dataKey={`${occ.id}:${empMetric}`}
                              fill={colors[occupations.indexOf(occ) % colors.length]}
                              name={occ.title}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
            <Col md={6}>
              <div id="compare-salary">
                <Card className="h-100">
                  <Card.Body>
                    <h2>Salary Trends</h2>
                    <p className="text-muted mb-3">Salary trends over the years</p>
                    <div className="d-flex justify-content-center gap-3 mb-2 flex-wrap">
                      <Form.Check
                        type="radio"
                        label="Average"
                        name="compareSalMetric"
                        id="compare-sal-avg"
                        checked={salMetric === 'average_annual_salary'}
                        onChange={() => setSalMetric('average_annual_salary')}
                      />
                      <Form.Check
                        type="radio"
                        label="Entry Level"
                        name="compareSalMetric"
                        id="compare-sal-entry"
                        checked={salMetric === 'entry_level_salary'}
                        onChange={() => setSalMetric('entry_level_salary')}
                      />
                      <Form.Check
                        type="radio"
                        label="Senior Level"
                        name="compareSalMetric"
                        id="compare-sal-senior"
                        checked={salMetric === 'senior_level_salary'}
                        onChange={() => setSalMetric('senior_level_salary')}
                      />
                      <Form.Check
                        type="radio"
                        label="Pay Gap"
                        name="compareSalMetric"
                        id="compare-sal-gap"
                        checked={salMetric === 'gender_pay_gap'}
                        onChange={() => setSalMetric('gender_pay_gap')}
                      />
                    </div>
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={mergedSalaryData} barSize={8} barGap={0} margin={{ left: 15 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value: number) => formatCompact(value)} label={{ value: salMetricConfigs[salMetric].label, angle: -90, position: 'insideLeft', offset: -10, dy: 35 }} />
                          <Tooltip
                            formatter={(value: any) => {
                              const cfg = salMetricConfigs[salMetric];
                              return cfg.format(value);
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
                            labelStyle={{ fontSize: '15px', color: '#666', marginBottom: '4px' }}
                          />
                          {occupations.map((occ) => (
                            <Bar
                              key={occ.id}
                              dataKey={`${occ.id}:${salMetric}`}
                              fill={colors[occupations.indexOf(occ) % colors.length]}
                              name={occ.title}
                            />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>

          <div id="compare-regional">
            {occupations.length > 0 && mergedRegionalData.length > 0 && (
              <Card className="mb-4">
                <Card.Body>
                  <h2>Regional Distribution</h2>
                  <p className="text-muted mb-3">Employment share by state across occupations</p>
                  {regionalChart}
                </Card.Body>
              </Card>
            )}
          </div>

          <div id="compare-table">
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
                        <td>Job Difficulty</td>
                        {occupations.map(o => <td key={o.id}>{o.skill_level}/5</td>)}
                      </tr>
                      <tr>
                        <td>Education Required</td>
                        {occupations.map(o => <td key={o.id}>{o.education_required || 'N/A'}</td>)}
                      </tr>
                      {/*
                      <tr>
                        <td>Work Type</td>
                        {occupations.map(o => <td key={o.id}>{o.work_type || 'N/A'}</td>)}
                      </tr>
                      */}
                      <tr>
                        <td>Salary Range (AUD)</td>
                        {occupations.map(o => {
                          const latest = (salaryData[o.id] || []).slice(-1)[0];
                          if (!latest) return <td key={o.id}>N/A</td>;
                          const avg = latest.average_annual_salary;
                          const min = Math.floor(avg! * 0.9 / 100) * 100;
                          const max = Math.ceil(avg! * 1.1 / 100) * 100;
                          return <td key={o.id}>${min.toLocaleString()} - ${max.toLocaleString()}</td>;
                        })}
                      </tr>
                      {/*
                      <tr>
                        <td>Latest Avg Salary (AUD)</td>
                        {occupations.map(o => {
                          const latest = (salaryData[o.id] || []).slice(-1)[0];
                          return <td key={o.id}>{latest ? `$${latest.average_annual_salary?.toLocaleString()}` : 'N/A'}</td>;
                        })}
                      </tr>
                      */}
                      {occupations.some(o => o.pathway) && (
                        <tr>
                          <td>Pathway</td>
                          {occupations.map(o => {
                            if (!o.pathway) return <td key={o.id}>-</td>;
                            const isLong = o.pathway.length > 50;
                            const display = isLong ? o.pathway.slice(0, 50) + '...' : o.pathway;
                            return <td key={o.id} style={{ whiteSpace: 'pre-line', verticalAlign: 'top' }}>
                              <span>{display}</span>
                              {isLong && <Button variant="link" size="sm" className="p-0 ms-0 d-block" style={{ marginTop: "0" }} onClick={() => setModalContent({ title: 'Pathway', content: o.pathway! })}>Details</Button>}
                            </td>;
                          })}
                        </tr>
                      )}
                      {occupations.some(o => o.alternative_pathways) && (
                        <tr>
                          <td>Alternative Pathways</td>
                          {occupations.map(o => {
                            if (!o.alternative_pathways) return <td key={o.id}>-</td>;
                            const isLong = o.alternative_pathways.length > 50;
                            const display = isLong ? o.alternative_pathways.slice(0, 50) + '...' : o.alternative_pathways;
                            return <td key={o.id} style={{ whiteSpace: 'pre-line', verticalAlign: 'top' }}>
                              <span>{display}</span>
                              {isLong && <Button variant="link" size="sm" className="p-0 ms-1 d-block" onClick={() => setModalContent({ title: 'Alternative Pathways', content: o.alternative_pathways! })}>Details</Button>}
                            </td>;
                          })}
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </div>

          {AppConfig.enableLoginAndRegister && user && (
            <div className="text-center">
              <Button className="btn btn-gradient" variant="primary" onClick={handleSave}>Save Comparison</Button>
            </div>
          )}
        </>
      )}

      <div className="text-center mt-4">
        <Link to="/explore" className="btn btn-gradient-gray">← Back to Explore</Link>
      </div>

      <Modal show={!!modalContent} onHide={() => setModalContent(null)} centered className='compare-modal'>
        <Modal.Header closeButton>
          <Modal.Title>{modalContent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ whiteSpace: 'pre-line' }}>{modalContent?.content}</Modal.Body>
      </Modal>
    </Container>
  );
};

export default Compare;
