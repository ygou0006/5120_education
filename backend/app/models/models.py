from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app import db


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(db.Model):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100))
    age = Column(Integer)
    school = Column(String(200))
    grade = Column(String(20))
    avatar_url = Column(String(500))
    role = Column(Enum(UserRole), default=UserRole.user)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    favorites = relationship("UserFavorite", back_populates="user")
    explorations = relationship("UserExploration", back_populates="user")
    comparisons = relationship("UserComparison", back_populates="user")
    activity_logs = relationship("UserActivityLog", back_populates="user")


class Course(db.Model):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    category = Column(String(50))
    description = Column(Text)
    image_base64 = Column(Text)
    icon_name = Column(String(50))
    color_code = Column(String(7))
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    occupation_courses = relationship("OccupationCourse", back_populates="course")


class InterestTag(db.Model):
    __tablename__ = "interest_tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50))
    emoji = Column(String(10))
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    occupation_interests = relationship("OccupationInterest", back_populates="interest_tag")


class Occupation(db.Model):
    __tablename__ = "occupations"

    id = Column(Integer, primary_key=True, index=True)
    anzsco_code = Column(String(6), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    image_base64 = Column(Text)
    category = Column(String(100))
    sub_category = Column(String(100))
    skill_level = Column(Integer)
    education_required = Column(String(200))
    work_type = Column(String(50))
    work_hours = Column(String(50))
    main_tasks = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    occupation_courses = relationship("OccupationCourse", back_populates="occupation")
    occupation_interests = relationship("OccupationInterest", back_populates="occupation")
    employment_data = relationship("EmploymentData", back_populates="occupation")
    salary_trends = relationship("SalaryTrend", back_populates="occupation")
    regional_employment = relationship("RegionalEmployment", back_populates="occupation")
    future_outlook = relationship("FutureOutlook", back_populates="occupation", uselist=False)


class OccupationCourse(db.Model):
    __tablename__ = "occupation_courses"

    id = Column(Integer, primary_key=True, index=True)
    occupation_id = Column(Integer, ForeignKey("occupations.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    weight_score = Column(Float, nullable=False)
    importance_level = Column(Integer)
    is_required = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())

    occupation = relationship("Occupation", back_populates="occupation_courses")
    course = relationship("Course", back_populates="occupation_courses")


class OccupationInterest(db.Model):
    __tablename__ = "occupation_interests"

    id = Column(Integer, primary_key=True, index=True)
    occupation_id = Column(Integer, ForeignKey("occupations.id", ondelete="CASCADE"), nullable=False)
    interest_tag_id = Column(Integer, ForeignKey("interest_tags.id", ondelete="CASCADE"), nullable=False)
    relevance_score = Column(Float)
    created_at = Column(DateTime, server_default=func.now())

    occupation = relationship("Occupation", back_populates="occupation_interests")
    interest_tag = relationship("InterestTag", back_populates="occupation_interests")


class EmploymentData(db.Model):
    __tablename__ = "employment_data"

    id = Column(Integer, primary_key=True, index=True)
    occupation_id = Column(Integer, ForeignKey("occupations.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    employment_count = Column(Integer)
    unemployment_rate = Column(Float)
    full_time_percentage = Column(Float)
    part_time_percentage = Column(Float)
    female_percentage = Column(Float)
    male_percentage = Column(Float)
    future_outlook = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    occupation = relationship("Occupation", back_populates="employment_data")


class SalaryTrend(db.Model):
    __tablename__ = "salary_trends"

    id = Column(Integer, primary_key=True, index=True)
    occupation_id = Column(Integer, ForeignKey("occupations.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    average_annual_salary = Column(Integer)
    median_annual_salary = Column(Integer)
    entry_level_salary = Column(Integer)
    senior_level_salary = Column(Integer)
    gender_pay_gap = Column(Float)
    salary_growth_rate = Column(Float)
    created_at = Column(DateTime, server_default=func.now())

    occupation = relationship("Occupation", back_populates="salary_trends")


class RegionalEmployment(db.Model):
    __tablename__ = "regional_employment"

    id = Column(Integer, primary_key=True, index=True)
    occupation_id = Column(Integer, ForeignKey("occupations.id", ondelete="CASCADE"), nullable=False)
    state = Column(String(50), nullable=False)
    employment_share = Column(Float)
    employment_count = Column(Integer)
    growth_rate = Column(Float)
    year = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())

    occupation = relationship("Occupation", back_populates="regional_employment")


class FutureOutlook(db.Model):
    __tablename__ = "future_outlook"

    id = Column(Integer, primary_key=True, index=True)
    occupation_id = Column(Integer, ForeignKey("occupations.id", ondelete="CASCADE"), nullable=False)
    projected_growth_rate = Column(Float)
    projected_employment = Column(Integer)
    automation_risk_score = Column(Float)
    emerging_industry = Column(Boolean, default=False)
    skills_in_demand = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    occupation = relationship("Occupation", back_populates="future_outlook")


class UserExploration(db.Model):
    __tablename__ = "user_explorations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(100))
    selected_courses = Column(JSON)
    selected_tags = Column(JSON)
    matched_careers = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="explorations")


class UserFavorite(db.Model):
    __tablename__ = "user_favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    occupation_id = Column(Integer, ForeignKey("occupations.id", ondelete="CASCADE"), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="favorites")
    occupation = relationship("Occupation")


class UserComparison(db.Model):
    __tablename__ = "user_comparisons"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    comparison_name = Column(String(100))
    occupations = Column(JSON, nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="comparisons")


class AnonymousSession(db.Model):
    __tablename__ = "anonymous_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    selected_courses = Column(JSON)
    selected_tags = Column(JSON)
    favorite_occupations = Column(JSON)
    comparison_occupations = Column(JSON)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class UserActivityLog(db.Model):
    __tablename__ = "user_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    session_id = Column(String(100))
    action_type = Column(String(50), nullable=False)
    action_data = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="activity_logs")
