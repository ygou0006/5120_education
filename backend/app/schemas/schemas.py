from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    age: Optional[int] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    school: Optional[str] = None
    grade: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


class CourseBase(BaseModel):
    name: str
    code: str
    category: Optional[str] = None
    description: Optional[str] = None
    image_base64: Optional[str] = None
    icon_name: Optional[str] = None
    color_code: Optional[str] = None


class CourseCreate(CourseBase):
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class CourseUpdate(CourseBase):
    name: Optional[str] = None
    code: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    image_base64: Optional[str] = None
    icon_name: Optional[str] = None
    color_code: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CourseResponse(CourseBase):
    id: int
    display_order: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class InterestTagBase(BaseModel):
    name: str
    category: Optional[str] = None
    emoji: Optional[str] = None


class InterestTagCreate(InterestTagBase):
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class InterestTagUpdate(InterestTagBase):
    name: Optional[str] = None
    category: Optional[str] = None
    emoji: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class InterestTagResponse(InterestTagBase):
    id: int
    display_order: int
    is_active: bool

    class Config:
        from_attributes = True


class OccupationBase(BaseModel):
    anzsco_code: str
    title: str
    description: Optional[str] = None
    image_base64: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    skill_level: Optional[int] = None
    education_required: Optional[str] = None
    work_type: Optional[str] = None
    work_hours: Optional[str] = None
    main_tasks: Optional[str] = None


class OccupationCreate(OccupationBase):
    is_active: Optional[bool] = True


class OccupationUpdate(OccupationBase):
    anzsco_code: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    image_base64: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    skill_level: Optional[int] = None
    education_required: Optional[str] = None
    work_type: Optional[str] = None
    work_hours: Optional[str] = None
    main_tasks: Optional[str] = None
    is_active: Optional[bool] = None


class OccupationResponse(OccupationBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


class OccupationCourseCreate(BaseModel):
    course_id: int
    weight_score: float = Field(ge=0, le=100)
    importance_level: Optional[int] = Field(ge=1, le=5)
    is_required: Optional[bool] = False


class OccupationCourseUpdate(BaseModel):
    weight_score: float = Field(ge=0, le=100)
    importance_level: Optional[int] = Field(ge=1, le=5)
    is_required: Optional[bool] = False


class EmploymentDataBase(BaseModel):
    year: int
    employment_count: Optional[int] = None
    unemployment_rate: Optional[float] = None
    full_time_percentage: Optional[float] = None
    part_time_percentage: Optional[float] = None
    female_percentage: Optional[float] = None
    male_percentage: Optional[float] = None
    future_outlook: Optional[str] = None


class EmploymentDataCreate(EmploymentDataBase):
    occupation_id: int


class EmploymentDataResponse(EmploymentDataBase):
    id: int

    class Config:
        from_attributes = True


class SalaryTrendBase(BaseModel):
    year: int
    average_annual_salary: Optional[int] = None
    median_annual_salary: Optional[int] = None
    entry_level_salary: Optional[int] = None
    senior_level_salary: Optional[int] = None
    gender_pay_gap: Optional[float] = None
    salary_growth_rate: Optional[float] = None


class SalaryTrendCreate(SalaryTrendBase):
    occupation_id: int


class SalaryTrendResponse(SalaryTrendBase):
    id: int

    class Config:
        from_attributes = True


class RegionalEmploymentBase(BaseModel):
    state: str
    employment_share: Optional[float] = None
    employment_count: Optional[int] = None
    growth_rate: Optional[float] = None
    year: Optional[int] = None


class RegionalEmploymentCreate(RegionalEmploymentBase):
    occupation_id: int


class RegionalEmploymentResponse(RegionalEmploymentBase):
    id: int

    class Config:
        from_attributes = True


class FutureOutlookBase(BaseModel):
    projected_growth_rate: Optional[float] = None
    projected_employment: Optional[int] = None
    automation_risk_score: Optional[float] = None
    emerging_industry: Optional[bool] = False
    skills_in_demand: Optional[List[str]] = None


class FutureOutlookCreate(FutureOutlookBase):
    occupation_id: int


class FutureOutlookResponse(FutureOutlookBase):
    id: int

    class Config:
        from_attributes = True


class CareerMatchRequest(BaseModel):
    course_ids: List[int] = []
    interest_ids: List[int] = []


class CareerMatchResponse(BaseModel):
    occupation_id: int
    title: str
    image_base64: Optional[str] = None
    category: Optional[str] = None
    match_score: float


class ExplorationSaveRequest(BaseModel):
    selected_courses: List[int]
    selected_tags: List[int]
    matched_careers: List[int]


class FavoriteCreate(BaseModel):
    occupation_id: int
    notes: Optional[str] = None


class ComparisonCreate(BaseModel):
    occupation_ids: List[int]
    comparison_name: Optional[str] = None


class SessionCreate(BaseModel):
    selected_courses: Optional[List[int]] = None
    selected_tags: Optional[List[int]] = None
    favorite_occupations: Optional[List[int]] = None
    comparison_occupations: Optional[List[int]] = None


class SessionSave(BaseModel):
    selected_courses: Optional[List[int]] = None
    selected_tags: Optional[List[int]] = None
    favorite_occupations: Optional[List[int]] = None
    comparison_occupations: Optional[List[int]] = None


class AdminStats(BaseModel):
    total_users: int
    total_explorations: int
    total_favorites: int
    popular_careers: List[dict]
    popular_courses: List[dict]


class PaginatedCourses(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int
    data: List[CourseResponse]


class PaginatedInterests(BaseModel):
    total: int
    page: int
    per_page: int
    total_pages: int
    data: List[InterestTagResponse]