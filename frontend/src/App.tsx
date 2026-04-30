import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import RequireUnlock from './components/RequireUnlock'
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
import PasswordLock from './pages/PasswordLock'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/unlock" element={<PasswordLock />} />
        <Route
          path="*"
          element={
            <RequireUnlock>
              <>
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
                  <Route path="/admin*" element={<Admin />} />
                </Routes>
                <Footer />
              </>
            </RequireUnlock>
          }
        />
      </Routes>
    </div>
  )
}

export default App