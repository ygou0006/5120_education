import { Link } from 'react-router-dom';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <h1>About Prospect</h1>
      <p className="about-intro">
        Prospect is a career exploration platform designed specifically for Australian high school students (ages 12-17). 
        Our mission is to help students discover potential career paths based on their chosen subjects and interests.
      </p>

      <section className="features">
        <h2>Key Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Personalized Matching</h3>
            <p>Our algorithm matches your interests and subjects to relevant careers in Australia</p>
          </div>
          <div className="feature-card">
            <h3>Real Data</h3>
            <p>Employment and salary data based on Australian Bureau of Statistics (ABS) information</p>
          </div>
          <div className="feature-card">
            <h3>Career Comparison</h3>
            <p>Compare multiple careers side-by-side to make informed decisions</p>
          </div>
          <div className="feature-card">
            <h3>Future Outlook</h3>
            <p>View growth projections and automation risk for each career</p>
          </div>
        </div>
      </section>

      <section className="target-audience">
        <h2>Who Is This For?</h2>
        <p>
          Prospect is designed for Australian high school students in Years 7-12 (ages 12-17) who are:
        </p>
        <ul>
          <li>Exploring elective subjects and want to know career options</li>
          <li>Interested in understanding what different jobs involve</li>
          <li>Looking to align their studies with their future goals</li>
        </ul>
      </section>

      <section className="cta">
        <h2>Ready to Start?</h2>
        <Link to="/explore" className="cta-button btn-gradient">Start Exploring Now</Link>
      </section>
    </div>
  );
};

export default About;