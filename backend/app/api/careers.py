from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models import models
from app.schemas.schemas import EmploymentProjectionResponse

bp = Blueprint('careers', __name__)


def occupation_to_dict(occupation, fields=None):
    all_fields = {
        "id": occupation.id,
        "anzsco_code": occupation.anzsco_code,
        "title": occupation.title,
        "description": occupation.description,
        "image": occupation.image,
        "category": occupation.category,
        "sub_category": occupation.sub_category,
        "skill_level": occupation.skill_level,
        "education_required": occupation.education_required,
        "work_type": occupation.work_type,
        "work_hours": occupation.work_hours,
        "main_tasks": occupation.main_tasks,
        "pathway": occupation.pathway,
        "alternative_pathways": occupation.alternative_pathways,
        "is_active": occupation.is_active
    }
    
    if fields is None:
        return all_fields
    
    requested = [f.strip() for f in fields.split(",")]
    return {k: v for k, v in all_fields.items() if k in requested}


def employment_to_dict(data):
    return {
        "id": data.id,
        "year": data.year,
        "employment_count": data.employment_count,
        "unemployment_rate": data.unemployment_rate,
        "full_time_percentage": data.full_time_percentage,
        "part_time_percentage": data.part_time_percentage,
        "female_percentage": data.female_percentage,
        "male_percentage": data.male_percentage,
        "future_outlook": data.future_outlook
    }


def salary_to_dict(data):
    return {
        "id": data.id,
        "year": data.year,
        "average_annual_salary": data.average_annual_salary,
        "median_annual_salary": data.median_annual_salary,
        "entry_level_salary": data.entry_level_salary,
        "senior_level_salary": data.senior_level_salary,
        "gender_pay_gap": data.gender_pay_gap,
        "salary_growth_rate": data.salary_growth_rate
    }


def regional_to_dict(data):
    return {
        "id": data.id,
        "state": data.state,
        "employment_share": data.employment_share,
        "employment_count": data.employment_count,
        "growth_rate": data.growth_rate,
        "year": data.year
    }


def outlook_to_dict(data):
    return {
        "id": data.id,
        "projected_growth_rate": data.projected_growth_rate,
        "projected_employment": data.projected_employment,
        "automation_risk_score": data.automation_risk_score,
        "emerging_industry": data.emerging_industry,
        "vce_requirements": data.vce_requirements,
        "skills_in_demand": data.skills_in_demand
    }


@bp.route("/<int:occupation_id>", methods=["GET"])
def get_career(occupation_id):
    occupation = db.session.query(models.Occupation).filter(models.Occupation.id == occupation_id).first()
    if not occupation:
        return jsonify({"detail": "Career not found"}), 404
    return jsonify(occupation_to_dict(occupation))


@bp.route("/<int:occupation_id>/employment", methods=["GET"])
def get_employment_data(occupation_id):
    data = db.session.query(models.EmploymentData).filter(
        models.EmploymentData.occupation_id == occupation_id
    ).order_by(models.EmploymentData.year.asc()).all()
    return jsonify([employment_to_dict(d) for d in data])


@bp.route("/<int:occupation_id>/salary", methods=["GET"])
def get_salary_data(occupation_id):
    data = db.session.query(models.SalaryTrend).filter(
        models.SalaryTrend.occupation_id == occupation_id
    ).order_by(models.SalaryTrend.year.asc()).all()
    return jsonify([salary_to_dict(d) for d in data])


@bp.route("/<int:occupation_id>/regional", methods=["GET"])
def get_regional_data(occupation_id):
    latest_year = db.session.query(models.RegionalEmployment.year).filter(
        models.RegionalEmployment.occupation_id == occupation_id
    ).order_by(models.RegionalEmployment.year.desc()).first()
    
    if not latest_year:
        return jsonify([])
    
    data = db.session.query(models.RegionalEmployment).filter(
        models.RegionalEmployment.occupation_id == occupation_id,
        models.RegionalEmployment.year == latest_year[0]
    ).all()
    return jsonify([regional_to_dict(d) for d in data])


@bp.route("/<int:occupation_id>/outlook", methods=["GET"])
def get_future_outlook(occupation_id):
    outlook = db.session.query(models.FutureOutlook).filter(
        models.FutureOutlook.occupation_id == occupation_id
    ).first()
    if not outlook:
        return jsonify(None)
    return jsonify(outlook_to_dict(outlook))


@bp.route("/<int:occupation_id>/courses", methods=["GET"])
def get_career_courses(occupation_id):
    links = db.session.query(models.OccupationCourse).filter(
        models.OccupationCourse.occupation_id == occupation_id
    ).all()
    return jsonify([{
        "course_id": l.course_id,
        "course_name": l.course.name,
        "course_code": l.course.code,
        "is_required": l.is_required,
        "weight_score": l.weight_score,
        "importance_level": l.importance_level,
    } for l in links])


@bp.route("/<int:occupation_id>/projections", methods=["GET"])
def get_employment_projections(occupation_id):
    projection = db.session.query(models.EmploymentProjection).filter(
        models.EmploymentProjection.occupation_id == occupation_id
    ).first()
    if not projection:
        return jsonify(None)
    return jsonify(EmploymentProjectionResponse.model_validate(projection).model_dump())


@bp.route("/search/list", methods=["GET"])
def search_careers():
    q = request.args.get("q", "")
    skip = request.args.get("skip", 0, type=int)
    limit = request.args.get("limit", 20, type=int)
    fields = request.args.get("fields", None)
    
    query = db.session.query(models.Occupation).filter(
        models.Occupation.is_active == True,
    )
    
    if q:
        query = query.filter(
            (models.Occupation.title.ilike(f"%{q}%")) | (models.Occupation.description.ilike(f"%{q}%"))
        )
    
    total = query.count()
    occupations = query.offset(skip).limit(limit).all()
    return jsonify({
        "data": [occupation_to_dict(o, fields) for o in occupations],
        "total": total,
        "page": skip // limit + 1,
        "per_page": limit,
        "total_pages": (total + limit - 1) // limit
    })
