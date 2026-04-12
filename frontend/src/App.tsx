import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import About from './pages/About'
import Explore from './pages/Explore'
import Results from './pages/Results'
import CareerDetail from './pages/CareerDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Compare from './pages/Compare'
import Admin from './pages/Admin'
import Careers from './pages/Careers'

function App() {
  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/results" element={<Results />} />
        <Route path="/careers/:id" element={<CareerDetail />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  )
}

export default App