import axios from 'axios';
import type { User, Course, InterestTag, Occupation, CareerMatch, EmploymentData, SalaryTrend, RegionalEmployment, FutureOutcome, LoginRequest, RegisterRequest, Token, Exploration, PaginatedResponse } from '../types';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data: LoginRequest) => api.post<Token>('/auth/login', new URLSearchParams({ username: data.username, password: data.password }).toString(), {headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}),
  register: (data: RegisterRequest) => api.post<User>('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<User>('/auth/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/auth/profile', data),
  changePassword: (oldPassword: string, newPassword: string) => api.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),
};

export const coursesAPI = {
  getAll: (page: number = 1, perPage: number = 10, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    if (search) params.append('search', search);
    return api.get<PaginatedResponse<Course>>(`/courses/?${params.toString()}`);
  },
  getOne: (id: number) => api.get<Course>(`/courses/${id}`),
  getCategories: () => api.get<string[]>('/courses/categories/list'),
};

export const interestsAPI = {
  getAll: (page: number = 1, perPage: number = 20, search?: string) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    if (search) params.append('search', search);
    return api.get<PaginatedResponse<InterestTag>>(`/interests/?${params.toString()}`);
  },
  getCategories: () => api.get<string[]>('/interests/categories'),
};

export const careersAPI = {
  getOne: (id: number) => api.get<Occupation>(`/careers/${id}`),
  getEmployment: (id: number) => api.get<EmploymentData[]>(`/careers/${id}/employment`),
  getSalary: (id: number) => api.get<SalaryTrend[]>(`/careers/${id}/salary`),
  getRegional: (id: number) => api.get<RegionalEmployment[]>(`/careers/${id}/regional`),
  getFutureOutcome: (id: number) => api.get<FutureOutcome>(`/careers/${id}/outlook`),
  search: (q: string, skip: number = 0, limit: number = 20) => 
    api.get<{data: Occupation[]; total: number; page: number; per_page: number; total_pages: number}>(`/careers/search/list?q=${encodeURIComponent(q)}&skip=${skip}&limit=${limit}`),
};

export const matchAPI = {
  matchCareers: (courseIds: number[], interestIds: number[]) => 
    api.post<CareerMatch[]>('/match/careers', { course_ids: courseIds, interest_ids: interestIds }),
};

export const favoritesAPI = {
  add: (occupationId: number) => api.post('/favorites/add', { occupation_id: occupationId }),
  remove: (occupationId: number) => api.delete(`/favorites/remove?occupation_id=${occupationId}`),
  list: () => api.get<Occupation[]>('/favorites/list'),
};

export const compareAPI = {
  create: (occupationIds: number[], comparisonName?: string) => 
    api.post<{ id: number; message: string }>('/compare/create', { occupation_ids: occupationIds, comparison_name: comparisonName }),
  get: (id: number) => api.get(`/compare/${id}`),
  anonymous: (occupationIds: number[]) => api.post('/compare/anonymous', { occupation_ids: occupationIds }),
};

export const explorationsAPI = {
  save: (selectedCourses: number[], selectedTags: number[], matchedCareers: number[]) => 
    api.post<{ id: number; message: string }>('/explorations/save', { 
      selected_courses: selectedCourses, 
      selected_tags: selectedTags, 
      matched_careers: matchedCareers 
    }),
  history: () => api.get<Exploration[]>('/explorations/history'),
  getOne: (id: number) => api.get<Exploration>(`/explorations/${id}`),
};

export const sessionAPI = {
  create: () => api.post<{ session_id: string }>('/session/create'),
  save: (sessionId: string, data: { selected_courses?: number[]; selected_tags?: number[] }) => 
    api.post(`/session/save?session_id=${sessionId}`, data),
  get: (sessionId: string) => api.get(`/session/${sessionId}`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats/users'),
  getExplorationStats: () => api.get('/admin/stats/explorations'),
  getFavoriteStats: () => api.get('/admin/stats/favorites'),
  getCourses: () => api.get<Course[]>('/admin/courses'),
  createCourse: (data: Partial<Course>) => api.post<Course>('/admin/courses', data),
  updateCourse: (id: number, data: Partial<Course>) => api.put<Course>(`/admin/courses/${id}`, data),
  deleteCourse: (id: number) => api.delete(`/admin/courses/${id}`),
  getInterests: () => api.get<InterestTag[]>('/admin/interests'),
  createInterest: (data: Partial<InterestTag>) => api.post<InterestTag>('/admin/interests', data),
  updateInterest: (id: number, data: Partial<InterestTag>) => api.put<InterestTag>(`/admin/interests/${id}`, data),
  deleteInterest: (id: number) => api.delete(`/admin/interests/${id}`),
  getCareers: (params?: { page?: number; per_page?: number; search?: string }) => 
    api.get<{data: Occupation[]; total: number; page: number; per_page: number; total_pages: number}>('/admin/careers', { params }),
  createCareer: (data: Partial<Occupation>) => api.post<Occupation>('/admin/careers', data),
  updateCareer: (id: number, data: Partial<Occupation>) => api.put<Occupation>(`/admin/careers/${id}`, data),
  deleteCareer: (id: number) => api.delete(`/admin/careers/${id}`),
  getCareerCourses: (careerId: number) => api.get<any[]>(`/admin/careers/${careerId}/courses`),
  addCareerCourse: (careerId: number, data: { course_id: number; weight_score: number; importance_level: number; is_required: boolean }) => 
    api.post(`/admin/careers/${careerId}/courses`, data),
  updateCareerCourse: (careerId: number, courseId: number, data: { weight_score: number; importance_level: number; is_required: boolean }) =>
    api.put(`/admin/careers/${careerId}/courses/${courseId}`, data),
  removeCareerCourse: (careerId: number, courseId: number) => api.delete(`/admin/careers/${careerId}/courses/${courseId}`),
  getCareerInterests: (careerId: number) => api.get<any[]>(`/admin/careers/${careerId}/interests`),
  addCareerInterest: (careerId: number, data: { interest_tag_id: number; relevance_score: number }) =>
    api.post(`/admin/careers/${careerId}/interests`, data),
  updateCareerInterest: (careerId: number, interestId: number, data: { relevance_score: number }) =>
    api.put(`/admin/careers/${careerId}/interests/${interestId}`, data),
  removeCareerInterest: (careerId: number, interestId: number) => api.delete(`/admin/careers/${careerId}/interests/${interestId}`),
  getCareerFutureOutlook: (careerId: number) => api.get<any>(`/admin/careers/${careerId}/future-outlook`),
  createCareerFutureOutlook: (careerId: number, data: { projected_growth_rate?: number; projected_employment?: number; automation_risk_score?: number; emerging_industry?: boolean; skills_in_demand?: string[] }) =>
    api.post(`/admin/careers/${careerId}/future-outlook`, data),
  updateCareerFutureOutlook: (careerId: number, data: { projected_growth_rate?: number; projected_employment?: number; automation_risk_score?: number; emerging_industry?: boolean; skills_in_demand?: string[] }) =>
    api.put(`/admin/careers/${careerId}/future-outlook`, data),
  deleteCareerFutureOutlook: (careerId: number) => api.delete(`/admin/careers/${careerId}/future-outlook`),
  getUsers: () => api.get<User[]>('/admin/users'),
  updateUser: (id: number, data: Partial<User>) => api.put<User>(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
};

export default api;