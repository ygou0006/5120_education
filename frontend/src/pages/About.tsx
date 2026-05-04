import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className='about'>
      <div className="about-page">
        <h1>About Prospect</h1>
        <p className="about-intro">
          • Prospect is a career exploration platform designed for young people aged 12–17 in
          Australia, including those in school and those outside formal schooling.<br />
          • Many young people find it difficult to understand how their learning choices, interests,
          and strengths connect to future career opportunities. For some, career information is
          fragmented or hard to access, making future planning even more challenging.<br />
          • Prospect helps simplify this process by providing clear, accessible, and personalized
          career exploration based on subjects, interests, and future opportunities.
        </p>

        <section className="features">
          <h2>Key Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <h3>Flexible Pathway Matching</h3>
              <p>Explore career pathways based on your subjects, interests, or personal goals, whether you are in school or outside formal schooling.</p>
            </div>
            <div className="feature-card">
              <h3>Student-Friendly Insights</h3>
              <p>Access easy-to-understand career information, including job trends and future demand, designed specifically for students.</p>
            </div>
            <div className="feature-card">
              <h3>Career Comparison Tool</h3>
              <p>Compare different career options side-by-side to understand skills, pathways, and future opportunities.</p>
            </div>
            <div className="feature-card">
              <h3>Future Outlook</h3>
              <p>Discover which careers are growing, changing, or at risk of automation based on Australian data.</p>
            </div>
          </div>
        </section>

        <section className="target-audience">
          <h2>Who Is This For?</h2>
          <p>
            Prospect is designed for young people aged 12-17 in Australia who are:
          </p>
          <ul>
            <li>Studying in school and exploring subject or elective choices</li>
            <li>Outside formal schooling but still thinking about future pathways</li>
            <li>Unsure how their interests, learning, or strengths connect to careers</li>
            <li>Looking for simple and accessible guidance about future work opportunities</li>
          </ul>
        </section>

        <section className="cta">
          <h2>Ready to Start?</h2>
          <Link to="/explore" className="cta-button btn-gradient">Start Exploring Your Future</Link>
        </section>
      </div>
    </div>
  );
};

export default About;