export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  age?: number;
  school?: string;
  grade?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  category?: string;
  description?: string;
  image_base64?: string;
  icon_name?: string;
  color_code?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface InterestTag {
  id: number;
  name: string;
  category?: string;
  emoji?: string;
  display_order: number;
  is_active: boolean;
}

export interface Occupation {
  id: number;
  anzsco_code: string;
  title: string;
  description?: string;
  image_base64?: string;
  category?: string;
  sub_category?: string;
  skill_level?: number;
  education_required?: string;
  work_type?: string;
  work_hours?: string;
  main_tasks?: string;
  is_active: boolean;
}

export interface CareerMatch {
  occupation_id: number;
  title: string;
  image_base64?: string;
  category?: string;
  match_score: number;
}

export interface EmploymentData {
  id: number;
  year: number;
  employment_count?: number;
  unemployment_rate?: number;
  full_time_percentage?: number;
  part_time_percentage?: number;
  female_percentage?: number;
  male_percentage?: number;
  future_outlook?: string;
}

export interface SalaryTrend {
  id: number;
  year: number;
  average_annual_salary?: number;
  median_annual_salary?: number;
  entry_level_salary?: number;
  senior_level_salary?: number;
  gender_pay_gap?: number;
  salary_growth_rate?: number;
}

export interface RegionalEmployment {
  id: number;
  state: string;
  employment_share?: number;
  employment_count?: number;
  growth_rate?: number;
  year?: number;
}

export interface FutureOutlook {
  id: number;
  occupation_id?: number;
  projected_growth_rate?: number;
  projected_employment?: number;
  automation_risk_score?: number;
  emerging_industry: boolean;
  skills_in_demand?: string[];
}

export type FutureOutcome = FutureOutlook;

export interface Exploration {
  id: number;
  selected_courses: number[];
  selected_tags: number[];
  matched_careers: number[];
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  data: T[];
}