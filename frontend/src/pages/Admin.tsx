import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../api';
import type { Course, InterestTag, Occupation, User } from '../types';
import './Admin.css';

interface Stats {
  total?: number;
  active?: number;
}

interface CourseFormData {
  name: string;
  code: string;
  category: string;
  description: string;
  icon_name?: string;
  color_code?: string;
  image_base64?: string;
}

interface InterestFormData {
  name: string;
  category: string;
  emoji: string;
}

interface CareerFormData {
  anzsco_code: string;
  title: string;
  description: string;
  category: string;
  sub_category: string;
  skill_level: number;
  education_required: string;
  work_type: string;
  work_hours?: string;
  main_tasks?: string;
  image_base64?: string;
}

interface UserFormData {
  full_name: string;
  age?: number;
  school?: string;
  grade?: string;
  avatar_url?: string;
}

interface CareerCourse {
  course_id: number;
  course_name: string;
  course_code: string;
  weight_score: number;
  importance_level: number;
  is_required: boolean;
}

interface CareerInterest {
  interest_id: number;
  interest_name: string;
  interest_emoji: string;
  relevance_score: number;
}

const EMOJI_LIST = ['💻', '🎮', '🎨', '🔢', '✍️', '📊', '🔬', '🌱', '🏃', '🎵', '📚', '🧩', '🔧', '🩺', '📱', '🌐', '🎬', '📷', '🍳', '👗', '🏗️', '💰', '🧠', '🌍', '🎯', '💡', '🤝', '🗣️', '📝', '🎲'];

const Admin = () => {
  const { user } = useAuth();
  
  // Get initial tab from URL
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'courses' || tab === 'interests' || tab === 'careers' || tab === 'users') {
      return tab;
    }
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'courses' | 'interests' | 'careers' | 'users'>(getInitialTab);
  const [courses, setCourses] = useState<Course[]>([]);
  const [interests, setInterests] = useState<InterestTag[]>([]);
  const [careers, setCareers] = useState<Occupation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({});

  // Pagination state for careers
  const [careerPage, setCareerPage] = useState(1);
  const [careerTotalPages, setCareerTotalPages] = useState(1);
  const [careerSearch, setCareerSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'course' | 'interest' | 'career' | 'user'>('add');
  const [currentItem, setCurrentItem] = useState<any>(null);

  const [courseForm, setCourseForm] = useState<CourseFormData>({ name: '', code: '', category: '', description: '' });
  const [interestForm, setInterestForm] = useState<InterestFormData>({ name: '', category: '', emoji: '' });
  const [careerForm, setCareerForm] = useState<CareerFormData>({ anzsco_code: '', title: '', description: '', category: '', sub_category: '', skill_level: 1, education_required: '', work_type: '' });
  const [userForm, setUserForm] = useState<UserFormData>({ full_name: '' });

  const [loading, setLoading] = useState(false);

  const [showCoursesModal, setShowCoursesModal] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState<Occupation | null>(null);
  const [careerCourses, setCareerCourses] = useState<CareerCourse[]>([]);
  const [courseWeightForm, setCourseWeightForm] = useState<{ [key: number]: { weight_score: number; importance_level: number; is_required: boolean } }>({});

  const [showInterestsModal, setShowInterestsModal] = useState(false);
  const [careerInterests, setCareerInterests] = useState<CareerInterest[]>([]);
  const [interestScoreForm, setInterestScoreForm] = useState<{ [key: number]: number }>({});

  const [showFutureOutlookModal, setShowFutureOutlookModal] = useState(false);
  const [futureOutlookForm, setFutureOutlookForm] = useState<{
    projected_growth_rate: number | '';
    projected_employment: number | '';
    automation_risk_score: number | '';
    emerging_industry: boolean;
    skills_in_demand: string;
  }>({
    projected_growth_rate: '',
    projected_employment: '',
    automation_risk_score: '',
    emerging_industry: false,
    skills_in_demand: ''
  });

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [coursesRes, interestsRes, statsRes, usersRes] = await Promise.all([
        adminAPI.getCourses(),
        adminAPI.getInterests(),
        adminAPI.getStats(),
        adminAPI.getUsers()
      ]);
      setCourses(coursesRes.data);
      setInterests(interestsRes.data);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCareers = async (page: number = 1, search: string = '') => {
    try {
      const res = await adminAPI.getCareers({ page, per_page: 10, search }) as any;
      console.log('careers response:', res);
      const data = res.data?.data || [];
      console.log('careers data:', data);
      setCareers(data);
      setCareerPage(res.data?.page || 1);
      setCareerTotalPages(res.data?.total_pages || 1);
    } catch (err) {
      console.error(err);
    }
  };

  // Load careers when tab changes to careers
  useEffect(() => {
    if (activeTab === 'careers') {
      loadCareers(1, careerSearch);
    }
  }, [activeTab]);

  // Initial load for careers if starting on careers tab
  useEffect(() => {
    if (activeTab === 'careers' && careers.length === 0) {
      loadCareers(1, '');
    }
  }, []);

  const resetForms = () => {
    setCourseForm({ name: '', code: '', category: '', description: '' });
    setInterestForm({ name: '', category: '', emoji: '' });
    setCareerForm({ anzsco_code: '', title: '', description: '', category: '', sub_category: '', skill_level: 1, education_required: '', work_type: '' });
    setUserForm({ full_name: '' });
    setCurrentItem(null);
    setImagePreview(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setForm: React.Dispatch<React.SetStateAction<any>>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((prev: any) => ({ ...prev, image_base64: base64 }));
      setImagePreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const openAddModal = (type: 'course' | 'interest' | 'career' | 'user') => {
    setModalType('add');
    resetForms();
    if (type === 'course') setModalType('course' as any);
    if (type === 'interest') setModalType('interest' as any);
    if (type === 'career') setModalType('career' as any);
    if (type === 'user') setModalType('user' as any);
    setShowModal(true);
  };

  const openEditModal = (type: 'course' | 'interest' | 'career' | 'user', item: any) => {
    setModalType('edit');
    setCurrentItem(item);
    if (type === 'course') {
      setCourseForm({
        name: item.name,
        code: item.code,
        category: item.category || '',
        description: item.description || '',
        icon_name: item.icon_name || '',
        color_code: item.color_code || '',
        image_base64: item.image_base64 || ''
      });
      setImagePreview(item.image_base64 || null);
      setModalType('course' as any);
    } else if (type === 'interest') {
      setInterestForm({
        name: item.name,
        category: item.category || '',
        emoji: item.emoji || ''
      });
      setModalType('interest' as any);
    } else if (type === 'career') {
      setCareerForm({
        anzsco_code: item.anzsco_code,
        title: item.title,
        description: item.description || '',
        category: item.category || '',
        sub_category: item.sub_category || '',
        skill_level: item.skill_level || 1,
        education_required: item.education_required || '',
        work_type: item.work_type || '',
        work_hours: item.work_hours || '',
        main_tasks: item.main_tasks || '',
        image_base64: item.image_base64 || ''
      });
      setImagePreview(item.image_base64 || null);
      setModalType('career' as any);
    } else if (type === 'user') {
      setUserForm({
        full_name: item.full_name || '',
        age: item.age,
        school: item.school || '',
        grade: item.grade || '',
        avatar_url: item.avatar_url || ''
      });
      setModalType('user' as any);
    }
    setShowModal(true);
  };

  const openCareerCoursesModal = async (career: Occupation) => {
    setSelectedCareer(career);
    setShowCoursesModal(true);
    try {
      const res = await adminAPI.getCareerCourses(career.id);
      setCareerCourses(res.data);
      const initialForm: { [key: number]: { weight_score: number; importance_level: number; is_required: boolean } } = {};
      res.data.forEach((cc: CareerCourse) => {
        initialForm[cc.course_id] = {
          weight_score: cc.weight_score,
          importance_level: cc.importance_level,
          is_required: cc.is_required
        };
      });
      setCourseWeightForm(initialForm);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCourseToCareer = async (courseId: number) => {
    if (!selectedCareer) return;
    try {
      await adminAPI.addCareerCourse(selectedCareer.id, {
        course_id: courseId,
        weight_score: 50,
        importance_level: 3,
        is_required: false
      });
      const res = await adminAPI.getCareerCourses(selectedCareer.id);
      setCareerCourses(res.data);
      setCourseWeightForm(prev => ({
        ...prev,
        [courseId]: { weight_score: 50, importance_level: 3, is_required: false }
      }));
    } catch (err) {
      console.error(err);
      alert('Course already linked or error occurred');
    }
  };

  const handleRemoveCourseFromCareer = async (courseId: number) => {
    if (!selectedCareer) return;
    try {
      await adminAPI.removeCareerCourse(selectedCareer.id, courseId);
      setCareerCourses(prev => prev.filter(cc => cc.course_id !== courseId));
      setCourseWeightForm(prev => {
        const newForm = { ...prev };
        delete newForm[courseId];
        return newForm;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCourseWeight = async (courseId: number) => {
    if (!selectedCareer) return;
    const form = courseWeightForm[courseId];
    if (!form) return;
    try {
      await adminAPI.updateCareerCourse(selectedCareer.id, courseId, {
        weight_score: form.weight_score,
        importance_level: form.importance_level,
        is_required: form.is_required
      });
      alert('Updated successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const openCareerInterestsModal = async (career: Occupation) => {
    setSelectedCareer(career);
    setShowInterestsModal(true);
    try {
      const res = await adminAPI.getCareerInterests(career.id);
      setCareerInterests(res.data);
      const initialForm: { [key: number]: number } = {};
      res.data.forEach((ci: CareerInterest) => {
        initialForm[ci.interest_id] = ci.relevance_score;
      });
      setInterestScoreForm(initialForm);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddInterestToCareer = async (interestId: number) => {
    if (!selectedCareer) return;
    try {
      await adminAPI.addCareerInterest(selectedCareer.id, {
        interest_tag_id: interestId,
        relevance_score: 50
      });
      const res = await adminAPI.getCareerInterests(selectedCareer.id);
      setCareerInterests(res.data);
      setInterestScoreForm(prev => ({
        ...prev,
        [interestId]: 50
      }));
    } catch (err) {
      console.error(err);
      alert('Interest already linked or error occurred');
    }
  };

  const handleRemoveInterestFromCareer = async (interestId: number) => {
    if (!selectedCareer) return;
    try {
      await adminAPI.removeCareerInterest(selectedCareer.id, interestId);
      setCareerInterests(prev => prev.filter(ci => ci.interest_id !== interestId));
      setInterestScoreForm(prev => {
        const newForm = { ...prev };
        delete newForm[interestId];
        return newForm;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateInterestScore = async (interestId: number) => {
    if (!selectedCareer) return;
    const score = interestScoreForm[interestId];
    if (score === undefined) return;
    try {
      await adminAPI.updateCareerInterest(selectedCareer.id, interestId, {
        relevance_score: score
      });
      alert('Updated successfully');
    } catch (err) {
      console.error(err);
    }
  };

  const openFutureOutlookModal = async (career: Occupation) => {
    setSelectedCareer(career);
    setShowFutureOutlookModal(true);
    try {
      const res = await adminAPI.getCareerFutureOutlook(career.id);
      setFutureOutlookForm({
        projected_growth_rate: res.data?.projected_growth_rate ?? '',
        projected_employment: res.data?.projected_employment ?? '',
        automation_risk_score: res.data?.automation_risk_score ?? '',
        emerging_industry: res.data?.emerging_industry ?? false,
        skills_in_demand: res.data?.skills_in_demand?.join(', ') ?? ''
      });
    } catch (err: any) {
      if (err.response?.status === 404) {
        setFutureOutlookForm({
          projected_growth_rate: '',
          projected_employment: '',
          automation_risk_score: '',
          emerging_industry: false,
          skills_in_demand: ''
        });
      } else {
        console.error(err);
      }
    }
  };

  const handleSaveFutureOutlook = async () => {
    if (!selectedCareer) return;
    setLoading(true);
    try {
      const data = {
        projected_growth_rate: futureOutlookForm.projected_growth_rate || undefined,
        projected_employment: futureOutlookForm.projected_employment || undefined,
        automation_risk_score: futureOutlookForm.automation_risk_score || undefined,
        emerging_industry: futureOutlookForm.emerging_industry,
        skills_in_demand: futureOutlookForm.skills_in_demand ? futureOutlookForm.skills_in_demand.split(',').map(s => s.trim()).filter(Boolean) : undefined
      };
      try {
        await adminAPI.updateCareerFutureOutlook(selectedCareer.id, data);
        alert('Updated successfully');
      } catch (err: any) {
        if (err.response?.status === 404) {
          await adminAPI.createCareerFutureOutlook(selectedCareer.id, data);
          alert('Created successfully');
        } else {
          throw err;
        }
      }
      setShowFutureOutlookModal(false);
    } catch (err) {
      console.error(err);
      alert('Operation failed');
    }
    setLoading(false);
  };

  const handleDeleteFutureOutlook = async () => {
    if (!selectedCareer) return;
    if (!confirm('Are you sure you want to delete the future outlook data?')) return;
    setLoading(true);
    try {
      await adminAPI.deleteCareerFutureOutlook(selectedCareer.id);
      alert('Deleted successfully');
      setShowFutureOutlookModal(false);
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
    setLoading(false);
  };

  const handleDelete = async (type: 'course' | 'interest' | 'career' | 'user', id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    setLoading(true);
    try {
      if (type === 'course') {
        await adminAPI.deleteCourse(id);
      } else if (type === 'interest') {
        await adminAPI.deleteInterest(id);
      } else if (type === 'career') {
        await adminAPI.deleteCareer(id);
      } else if (type === 'user') {
        await adminAPI.deleteUser(id);
      }
      loadData();
      if (activeTab === 'careers') {
        loadCareers(careerPage, careerSearch);
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const currentModal = modalType as string;
      const isEdit = currentItem !== null;
      
      if (currentModal === 'course') {
        if (isEdit) {
          await adminAPI.updateCourse(currentItem.id, courseForm);
        } else {
          await adminAPI.createCourse(courseForm);
        }
      } else if (currentModal === 'interest') {
        if (isEdit) {
          await adminAPI.updateInterest(currentItem.id, interestForm);
        } else {
          await adminAPI.createInterest(interestForm);
        }
      } else if (currentModal === 'career') {
        if (isEdit) {
          await adminAPI.updateCareer(currentItem.id, careerForm);
        } else {
          await adminAPI.createCareer(careerForm);
        }
      } else if (currentModal === 'user') {
        if (isEdit) {
          await adminAPI.updateUser(currentItem.id, userForm);
        }
      }
      setShowModal(false);
      loadData();
      if (activeTab === 'careers') {
        loadCareers(careerPage, careerSearch);
      }
    } catch (err) {
      console.error(err);
      alert('Operation failed');
    }
    setLoading(false);
  };

  const linkedCourseIds = careerCourses.map(cc => cc.course_id);

  if (!user || user.role !== 'admin') {
    return <div>Admin access required</div>;
  }

  return (
    <div className="admin-page">
      <h1>Admin Dashboard</h1>
      
      <div className="admin-tabs">
        <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => { setActiveTab('dashboard'); window.history.pushState({}, '', '/admin?tab=dashboard'); }}>Dashboard</button>
        <button className={activeTab === 'courses' ? 'active' : ''} onClick={() => { setActiveTab('courses'); window.history.pushState({}, '', '/admin?tab=courses'); }}>Courses</button>
        <button className={activeTab === 'interests' ? 'active' : ''} onClick={() => { setActiveTab('interests'); window.history.pushState({}, '', '/admin?tab=interests'); }}>Interests</button>
        <button className={activeTab === 'careers' ? 'active' : ''} onClick={() => { setActiveTab('careers'); window.history.pushState({}, '', '/admin?tab=careers'); }}>Careers</button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => { setActiveTab('users'); window.history.pushState({}, '', '/admin?tab=users'); }}>Users</button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="admin-section">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Users</h3>
              <p>{stats.total || 0}</p>
            </div>
            <div className="stat-card">
              <h3>Active Users</h3>
              <p>{stats.active || 0}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Course Management</h2>
            <button className="btn btn-gradient" onClick={() => openAddModal('course')}>+ Add Course</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Name</th>
                <th>Code</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td>{course.id}</td>
                  <td>{course.image_base64 ? <img src={course.image_base64} alt="" style={{width: 40, height: 40, objectFit: 'cover'}} /> : '-'}</td>
                  <td>{course.name}</td>
                  <td>{course.code}</td>
                  <td>{course.category}</td>
                  <td>
                    <button onClick={() => openEditModal('course', course)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete('course', course.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'interests' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Interest Tag Management</h2>
            <button className="btn btn-gradient" onClick={() => openAddModal('interest')}>+ Add Interest</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Emoji</th>
                <th>Name</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {interests.map(interest => (
                <tr key={interest.id}>
                  <td>{interest.id}</td>
                  <td style={{fontSize: '1.5rem'}}>{interest.emoji}</td>
                  <td>{interest.name}</td>
                  <td>{interest.category}</td>
                  <td>
                    <button onClick={() => openEditModal('interest', interest)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete('interest', interest.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'careers' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>Career Management</h2>
            <button className="btn btn-gradient" onClick={() => openAddModal('career')}>+ Add Career</button>
          </div>
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search careers..." 
              value={careerSearch}
              onChange={(e) => setCareerSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadCareers(1, careerSearch)}
            />
            <button className='btn btn-gradient' onClick={() => loadCareers(1, careerSearch)}>Search</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Title</th>
                <th>ANZSCO</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(careers || []).map(career => (
                <tr key={career.id}>
                  <td>{career.id}</td>
                  <td>{career.image_base64 ? <img src={career.image_base64} alt="" style={{width: 40, height: 40, objectFit: 'cover'}} /> : '-'}</td>
                  <td>{career.title}</td>
                  <td>{career.anzsco_code}</td>
                  <td>{career.category}</td>
                  <td>
                    <button onClick={() => openEditModal('career', career)}>Edit</button>
                    <button onClick={() => openCareerCoursesModal(career)}>Manage Courses</button>
                    <button onClick={() => openCareerInterestsModal(career)}>Manage Interests</button>
                    <button onClick={() => openFutureOutlookModal(career)}>Future Outlook</button>
                    <button className="delete-btn" onClick={() => handleDelete('career', career.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {careerTotalPages > 1 && (
            <div className="pagination">
              <button
                className='btn btn-gradient btn-sm'
                disabled={careerPage === 1} 
                onClick={() => loadCareers(careerPage - 1, careerSearch)}
              >
                Previous
              </button>
              <span>Page {careerPage} of {careerTotalPages}</span>
              <button
                className='btn btn-gradient btn-sm'
                disabled={careerPage === careerTotalPages} 
                onClick={() => loadCareers(careerPage + 1, careerSearch)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-section">
          <div className="section-header">
            <h2>User Management</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.full_name || '-'}</td>
                  <td>{u.role}</td>
                  <td>{u.is_active ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => openEditModal('user', u)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete('user', u.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>
              {modalType === 'add' ? 'Add' : 'Edit'} {' '}
              {modalType === 'course' ? 'Course' : modalType === 'interest' ? 'Interest' : modalType === 'career' ? 'Career' : 'User'}
            </h2>
            <form onSubmit={handleSubmit}>
              {modalType === 'course' && (
                <>
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" value={courseForm.name} onChange={e => setCourseForm({...courseForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Code *</label>
                    <input type="text" value={courseForm.code} onChange={e => setCourseForm({...courseForm, code: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" value={courseForm.category} onChange={e => setCourseForm({...courseForm, category: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={courseForm.description} onChange={e => setCourseForm({...courseForm, description: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Icon Name</label>
                    <input type="text" value={courseForm.icon_name} onChange={e => setCourseForm({...courseForm, icon_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Color Code</label>
                    <input type="text" value={courseForm.color_code} onChange={e => setCourseForm({...courseForm, color_code: e.target.value})} placeholder="#000000" />
                  </div>
                  <div className="form-group">
                    <label>Image</label>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setCourseForm)} ref={fileInputRef} />
                    {imagePreview && <img src={imagePreview} alt="Preview" style={{marginTop: 10, maxWidth: '100%', maxHeight: 150}} />}
                  </div>
                </>
              )}
              {modalType === 'interest' && (
                <>
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" value={interestForm.name} onChange={e => setInterestForm({...interestForm, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" value={interestForm.category} onChange={e => setInterestForm({...interestForm, category: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Emoji</label>
                    <div className="emoji-input-wrapper">
                      <input 
                        type="text" 
                        value={interestForm.emoji} 
                        onChange={e => setInterestForm({...interestForm, emoji: e.target.value})} 
                        placeholder="Click to select or type"
                      />
                      <button type="button" className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😀</button>
                    </div>
                    {showEmojiPicker && (
                      <div className="emoji-picker">
                        {EMOJI_LIST.map(emoji => (
                          <button 
                            key={emoji} 
                            type="button" 
                            onClick={() => {
                              setInterestForm({...interestForm, emoji});
                              setShowEmojiPicker(false);
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              {modalType === 'career' && (
                <>
                  <div className="form-group">
                    <label>ANZSCO Code *</label>
                    <input type="text" value={careerForm.anzsco_code} onChange={e => setCareerForm({...careerForm, anzsco_code: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Title *</label>
                    <input type="text" value={careerForm.title} onChange={e => setCareerForm({...careerForm, title: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input type="text" value={careerForm.category} onChange={e => setCareerForm({...careerForm, category: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Sub Category</label>
                    <input type="text" value={careerForm.sub_category} onChange={e => setCareerForm({...careerForm, sub_category: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={careerForm.description} onChange={e => setCareerForm({...careerForm, description: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Skill Level (1-5)</label>
                    <input type="number" min="1" max="5" value={careerForm.skill_level} onChange={e => setCareerForm({...careerForm, skill_level: parseInt(e.target.value)})} />
                  </div>
                  <div className="form-group">
                    <label>Education Required</label>
                    <input type="text" value={careerForm.education_required} onChange={e => setCareerForm({...careerForm, education_required: e.target.value})} placeholder="Bachelor degree or higher" />
                  </div>
                  <div className="form-group">
                    <label>Work Type</label>
                    <input type="text" value={careerForm.work_type} onChange={e => setCareerForm({...careerForm, work_type: e.target.value})} placeholder="Full-time" />
                  </div>
                  <div className="form-group">
                    <label>Work Hours</label>
                    <input type="text" value={careerForm.work_hours} onChange={e => setCareerForm({...careerForm, work_hours: e.target.value})} placeholder="Standard business hours" />
                  </div>
                  <div className="form-group">
                    <label>Main Tasks</label>
                    <textarea value={careerForm.main_tasks} onChange={e => setCareerForm({...careerForm, main_tasks: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Image</label>
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setCareerForm)} ref={fileInputRef} />
                    {imagePreview && <img src={imagePreview} alt="Preview" style={{marginTop: 10, maxWidth: '100%', maxHeight: 150}} />}
                  </div>
                </>
              )}
              {modalType === 'user' && (
                <>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={userForm.full_name} onChange={e => setUserForm({...userForm, full_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Age</label>
                    <input type="number" value={userForm.age || ''} onChange={e => setUserForm({...userForm, age: e.target.value ? parseInt(e.target.value) : undefined})} />
                  </div>
                  <div className="form-group">
                    <label>School</label>
                    <input type="text" value={userForm.school || ''} onChange={e => setUserForm({...userForm, school: e.target.value || undefined})} />
                  </div>
                  <div className="form-group">
                    <label>Grade</label>
                    <input type="text" value={userForm.grade || ''} onChange={e => setUserForm({...userForm, grade: e.target.value || undefined})} />
                  </div>
                  <div className="form-group">
                    <label>Avatar URL</label>
                    <input type="text" value={userForm.avatar_url || ''} onChange={e => setUserForm({...userForm, avatar_url: e.target.value || undefined})} placeholder="https://..." />
                  </div>
                </>
              )}
              <div className="form-actions">
                <button className='btn btn-gradient' type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCoursesModal && selectedCareer && (
        <div className="modal-overlay" onClick={() => setShowCoursesModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <h2>Manage Courses for: {selectedCareer.title}</h2>
            
            <div className="linked-courses">
              <h3>Linked Courses</h3>
              {careerCourses.length === 0 ? (
                <p>No courses linked yet.</p>
              ) : (
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Weight (0-100)</th>
                      <th>Importance (1-5)</th>
                      <th>Required</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {careerCourses.map(cc => (
                      <tr key={cc.course_id}>
                        <td>{cc.course_name} ({cc.course_code})</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={courseWeightForm[cc.course_id]?.weight_score ?? cc.weight_score}
                            onChange={e => setCourseWeightForm({
                              ...courseWeightForm,
                              [cc.course_id]: { ...courseWeightForm[cc.course_id], weight_score: parseInt(e.target.value) }
                            })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={courseWeightForm[cc.course_id]?.importance_level ?? cc.importance_level}
                            onChange={e => setCourseWeightForm({
                              ...courseWeightForm,
                              [cc.course_id]: { ...courseWeightForm[cc.course_id], importance_level: parseInt(e.target.value) }
                            })}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={courseWeightForm[cc.course_id]?.is_required ?? cc.is_required}
                            onChange={e => setCourseWeightForm({
                              ...courseWeightForm,
                              [cc.course_id]: { ...courseWeightForm[cc.course_id], is_required: e.target.checked }
                            })}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleUpdateCourseWeight(cc.course_id)}>Update</button>
                          <button className="delete-btn" onClick={() => handleRemoveCourseFromCareer(cc.course_id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="available-courses">
              <h3>Add Course</h3>
              <div className="course-list">
                {courses.filter(c => !linkedCourseIds.includes(c.id)).map(course => (
                  <div key={course.id} className="course-item">
                    <span>{course.name} ({course.code})</span>
                    <button onClick={() => handleAddCourseToCareer(course.id)}>Add</button>
                  </div>
                ))}
                {courses.filter(c => !linkedCourseIds.includes(c.id)).length === 0 && (
                  <p>All courses are already linked.</p>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowCoursesModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showInterestsModal && selectedCareer && (
        <div className="modal-overlay" onClick={() => setShowInterestsModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <h2>Manage Interests for: {selectedCareer.title}</h2>
            
            <div className="linked-courses">
              <h3>Linked Interests</h3>
              {careerInterests.length === 0 ? (
                <p>No interests linked yet.</p>
              ) : (
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th>Interest</th>
                      <th>Relevance Score (0-100)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {careerInterests.map(ci => (
                      <tr key={ci.interest_id}>
                        <td>{ci.interest_emoji} {ci.interest_name}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={interestScoreForm[ci.interest_id] ?? ci.relevance_score}
                            onChange={e => setInterestScoreForm({
                              ...interestScoreForm,
                              [ci.interest_id]: parseInt(e.target.value)
                            })}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleUpdateInterestScore(ci.interest_id)}>Update</button>
                          <button className="delete-btn" onClick={() => handleRemoveInterestFromCareer(ci.interest_id)}>Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="available-courses">
              <h3>Add Interest</h3>
              <div className="course-list">
                {interests.filter(i => !careerInterests.map(ci => ci.interest_id).includes(i.id)).map(interest => (
                  <div key={interest.id} className="course-item">
                    <span>{interest.emoji} {interest.name}</span>
                    <button onClick={() => handleAddInterestToCareer(interest.id)}>Add</button>
                  </div>
                ))}
                {interests.filter(i => !careerInterests.map(ci => ci.interest_id).includes(i.id)).length === 0 && (
                  <p>All interests are already linked.</p>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setShowInterestsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showFutureOutlookModal && selectedCareer && (
        <div className="modal-overlay" onClick={() => setShowFutureOutlookModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Future Outlook: {selectedCareer.title}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveFutureOutlook(); }}>
              <div className="form-group">
                <label>Projected Growth Rate (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={futureOutlookForm.projected_growth_rate} 
                  onChange={e => setFutureOutlookForm({...futureOutlookForm, projected_growth_rate: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                  placeholder="e.g., 15.5"
                />
              </div>
              <div className="form-group">
                <label>Projected Employment (5 years)</label>
                <input 
                  type="number"
                  value={futureOutlookForm.projected_employment} 
                  onChange={e => setFutureOutlookForm({...futureOutlookForm, projected_employment: e.target.value === '' ? '' : parseInt(e.target.value)})}
                  placeholder="e.g., 15000"
                />
              </div>
              <div className="form-group">
                <label>Automation Risk Score (0-100)</label>
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={futureOutlookForm.automation_risk_score} 
                  onChange={e => setFutureOutlookForm({...futureOutlookForm, automation_risk_score: e.target.value === '' ? '' : parseInt(e.target.value)})}
                  placeholder="e.g., 45"
                />
              </div>
              <div className="form-group">
                <label>
                  <input 
                    type="checkbox"
                    checked={futureOutlookForm.emerging_industry} 
                    onChange={e => setFutureOutlookForm({...futureOutlookForm, emerging_industry: e.target.checked})}
                  />
                  Emerging Industry
                </label>
              </div>
              <div className="form-group">
                <label>Skills in Demand (comma separated)</label>
                <input 
                  type="text"
                  value={futureOutlookForm.skills_in_demand} 
                  onChange={e => setFutureOutlookForm({...futureOutlookForm, skills_in_demand: e.target.value})}
                  placeholder="e.g., Python, Machine Learning, Data Analysis"
                />
              </div>
              <div className="form-actions">
                <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
                <button type="button" className="delete-btn" onClick={handleDeleteFutureOutlook}>Delete</button>
                <button type="button" onClick={() => setShowFutureOutlookModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;