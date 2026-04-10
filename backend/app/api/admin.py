from flask import Blueprint, request, jsonify
from sqlalchemy import func
from app import db
from app.models import models

bp = Blueprint('admin', __name__)


def require_admin():
    from app.api.auth import get_current_active_user
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    if current_user.role.value != "admin":
        return jsonify({"detail": "Admin access required"}), 403
    return current_user


def user_to_dict(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "age": user.age,
        "school": user.school,
        "grade": user.grade,
        "avatar_url": user.avatar_url,
        "role": user.role.value if user.role else "user",
        "is_active": user.is_active,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


def course_to_dict(course):
    return {
        "id": course.id,
        "name": course.name,
        "code": course.code,
        "category": course.category,
        "description": course.description,
        "image_base64": course.image_base64,
        "icon_name": course.icon_name,
        "color_code": course.color_code,
        "display_order": course.display_order,
        "is_active": course.is_active,
        "created_at": course.created_at.isoformat() if course.created_at else None
    }


def interest_to_dict(interest):
    return {
        "id": interest.id,
        "name": interest.name,
        "category": interest.category,
        "emoji": interest.emoji,
        "display_order": interest.display_order,
        "is_active": interest.is_active
    }


def occupation_to_dict(occupation):
    return {
        "id": occupation.id,
        "anzsco_code": occupation.anzsco_code,
        "title": occupation.title,
        "description": occupation.description,
        "image_base64": occupation.image_base64,
        "category": occupation.category,
        "sub_category": occupation.sub_category,
        "skill_level": occupation.skill_level,
        "education_required": occupation.education_required,
        "work_type": occupation.work_type,
        "work_hours": occupation.work_hours,
        "main_tasks": occupation.main_tasks,
        "is_active": occupation.is_active
    }


@bp.route("/stats/users", methods=["GET"])
def get_user_stats():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    total = db.session.query(models.User).count()
    active = db.session.query(models.User).filter(models.User.is_active == True).count()
    return jsonify({"total": total, "active": active})


@bp.route("/stats/explorations", methods=["GET"])
def get_exploration_stats():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    total = db.session.query(models.UserExploration).count()
    return jsonify({"total": total})


@bp.route("/stats/favorites", methods=["GET"])
def get_favorite_stats():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    favorites = db.session.query(
        models.Occupation.title,
        models.Occupation.id,
        func.count(models.UserFavorite.id).label("count")
    ).join(
        models.UserFavorite, models.UserFavorite.occupation_id == models.Occupation.id
    ).group_by(models.Occupation.id).order_by(func.count(models.UserFavorite.id).desc()).limit(10).all()
    return jsonify([{"id": f[1], "title": f[0], "count": f[2]} for f in favorites])


@bp.route("/stats/popular-courses", methods=["GET"])
def get_popular_courses():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    return jsonify([])


@bp.route("/courses", methods=["GET"])
def get_all_courses():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    courses = db.session.query(models.Course).all()
    return jsonify([course_to_dict(c) for c in courses])


@bp.route("/courses", methods=["POST"])
def create_course():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    data = request.get_json()
    db_course = models.Course(**data)
    db.session.add(db_course)
    db.session.commit()
    db.session.refresh(db_course)
    return jsonify(course_to_dict(db_course)), 201


@bp.route("/courses/<int:course_id>", methods=["PUT"])
def update_course(course_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    db_course = db.session.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        return jsonify({"detail": "Course not found"}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if value is not None:
            setattr(db_course, key, value)
    
    db.session.commit()
    db.session.refresh(db_course)
    return jsonify(course_to_dict(db_course))


@bp.route("/courses/<int:course_id>", methods=["DELETE"])
def delete_course(course_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    course = db.session.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        return jsonify({"detail": "Course not found"}), 404
    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": "Course deleted"})


@bp.route("/interests", methods=["GET"])
def get_all_interests():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    interests = db.session.query(models.InterestTag).all()
    return jsonify([interest_to_dict(i) for i in interests])


@bp.route("/interests", methods=["POST"])
def create_interest():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    data = request.get_json()
    db_interest = models.InterestTag(**data)
    db.session.add(db_interest)
    db.session.commit()
    db.session.refresh(db_interest)
    return jsonify(interest_to_dict(db_interest)), 201


@bp.route("/interests/<int:interest_id>", methods=["PUT"])
def update_interest(interest_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    db_interest = db.session.query(models.InterestTag).filter(models.InterestTag.id == interest_id).first()
    if not db_interest:
        return jsonify({"detail": "Interest not found"}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if value is not None:
            setattr(db_interest, key, value)
    
    db.session.commit()
    db.session.refresh(db_interest)
    return jsonify(interest_to_dict(db_interest))


@bp.route("/interests/<int:interest_id>", methods=["DELETE"])
def delete_interest(interest_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    interest = db.session.query(models.InterestTag).filter(models.InterestTag.id == interest_id).first()
    if not interest:
        return jsonify({"detail": "Interest not found"}), 404
    db.session.delete(interest)
    db.session.commit()
    return jsonify({"message": "Interest deleted"})


@bp.route("/careers", methods=["GET"])
def get_all_careers():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    
    query = db.session.query(models.Occupation)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Occupation.title.ilike(search_pattern)) |
            (models.Occupation.anzsco_code.ilike(search_pattern))
        )
    
    total = query.count()
    total_pages = (total + per_page - 1) // per_page
    skip = (page - 1) * per_page
    
    careers = query.offset(skip).limit(per_page).all()
    
    return jsonify({
        "data": [occupation_to_dict(c) for c in careers],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    })


@bp.route("/careers", methods=["POST"])
def create_career():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    data = request.get_json()
    db_career = models.Occupation(**data)
    db.session.add(db_career)
    db.session.commit()
    db.session.refresh(db_career)
    return jsonify(occupation_to_dict(db_career)), 201


@bp.route("/careers/<int:career_id>", methods=["PUT"])
def update_career(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    db_career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not db_career:
        return jsonify({"detail": "Career not found"}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if value is not None:
            setattr(db_career, key, value)
    
    db.session.commit()
    db.session.refresh(db_career)
    return jsonify(occupation_to_dict(db_career))


@bp.route("/careers/<int:career_id>", methods=["DELETE"])
def delete_career(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    db.session.delete(career)
    db.session.commit()
    return jsonify({"message": "Career deleted"})


def future_outlook_to_dict(outlook):
    return {
        "id": outlook.id,
        "occupation_id": outlook.occupation_id,
        "projected_growth_rate": outlook.projected_growth_rate,
        "projected_employment": outlook.projected_employment,
        "automation_risk_score": outlook.automation_risk_score,
        "emerging_industry": outlook.emerging_industry,
        "skills_in_demand": outlook.skills_in_demand
    }


@bp.route("/careers/<int:career_id>/future-outlook", methods=["GET"])
def get_career_future_outlook(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    
    outlook = db.session.query(models.FutureOutlook).filter(
        models.FutureOutlook.occupation_id == career_id
    ).first()
    
    if not outlook:
        return jsonify({"detail": "Future outlook not found"}), 404
    
    return jsonify(future_outlook_to_dict(outlook))


@bp.route("/careers/<int:career_id>/future-outlook", methods=["POST"])
def create_career_future_outlook(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    
    existing = db.session.query(models.FutureOutlook).filter(
        models.FutureOutlook.occupation_id == career_id
    ).first()
    if existing:
        return jsonify({"detail": "Future outlook already exists. Use PUT to update."}), 400
    
    data = request.get_json()
    outlook = models.FutureOutlook(
        occupation_id=career_id,
        projected_growth_rate=data.get("projected_growth_rate"),
        projected_employment=data.get("projected_employment"),
        automation_risk_score=data.get("automation_risk_score"),
        emerging_industry=data.get("emerging_industry", False),
        skills_in_demand=data.get("skills_in_demand")
    )
    db.session.add(outlook)
    db.session.commit()
    db.session.refresh(outlook)
    return jsonify(future_outlook_to_dict(outlook)), 201


@bp.route("/careers/<int:career_id>/future-outlook", methods=["PUT"])
def update_career_future_outlook(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    
    outlook = db.session.query(models.FutureOutlook).filter(
        models.FutureOutlook.occupation_id == career_id
    ).first()
    
    if not outlook:
        return jsonify({"detail": "Future outlook not found. Use POST to create."}), 404
    
    data = request.get_json()
    if data.get("projected_growth_rate") is not None:
        outlook.projected_growth_rate = data.get("projected_growth_rate")
    if data.get("projected_employment") is not None:
        outlook.projected_employment = data.get("projected_employment")
    if data.get("automation_risk_score") is not None:
        outlook.automation_risk_score = data.get("automation_risk_score")
    if data.get("emerging_industry") is not None:
        outlook.emerging_industry = data.get("emerging_industry")
    if data.get("skills_in_demand") is not None:
        outlook.skills_in_demand = data.get("skills_in_demand")
    
    db.session.commit()
    db.session.refresh(outlook)
    return jsonify(future_outlook_to_dict(outlook))


@bp.route("/careers/<int:career_id>/future-outlook", methods=["DELETE"])
def delete_career_future_outlook(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    
    outlook = db.session.query(models.FutureOutlook).filter(
        models.FutureOutlook.occupation_id == career_id
    ).first()
    
    if not outlook:
        return jsonify({"detail": "Future outlook not found"}), 404
    
    db.session.delete(outlook)
    db.session.commit()
    return jsonify({"message": "Future outlook deleted"})


@bp.route("/careers/<int:career_id>/courses", methods=["POST"])
def add_career_course(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    
    data = request.get_json()
    course = db.session.query(models.Course).filter(models.Course.id == data.get("course_id")).first()
    if not course:
        return jsonify({"detail": "Course not found"}), 404
    
    existing = db.session.query(models.OccupationCourse).filter(
        models.OccupationCourse.occupation_id == career_id,
        models.OccupationCourse.course_id == data.get("course_id")
    ).first()
    if existing:
        return jsonify({"detail": "Course already linked"}), 400
    
    oc = models.OccupationCourse(
        occupation_id=career_id,
        course_id=data.get("course_id"),
        weight_score=data.get("weight_score"),
        importance_level=data.get("importance_level"),
        is_required=data.get("is_required", False)
    )
    db.session.add(oc)
    db.session.commit()
    return jsonify({"message": "Course linked"})


@bp.route("/careers/<int:career_id>/courses/<int:course_id>", methods=["DELETE"])
def remove_career_course(career_id, course_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    link = db.session.query(models.OccupationCourse).filter(
        models.OccupationCourse.occupation_id == career_id,
        models.OccupationCourse.course_id == course_id
    ).first()
    if not link:
        return jsonify({"detail": "Link not found"}), 404
    db.session.delete(link)
    db.session.commit()
    return jsonify({"message": "Course unlinked"})


@bp.route("/careers/<int:career_id>/courses", methods=["GET"])
def get_career_courses(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    
    links = db.session.query(models.OccupationCourse).filter(
        models.OccupationCourse.occupation_id == career_id
    ).all()
    
    result_list = []
    for link in links:
        course = db.session.query(models.Course).filter(models.Course.id == link.course_id).first()
        if course:
            result_list.append({
                "course_id": course.id,
                "course_name": course.name,
                "course_code": course.code,
                "weight_score": link.weight_score,
                "importance_level": link.importance_level,
                "is_required": link.is_required
            })
    return jsonify(result_list)


@bp.route("/careers/<int:career_id>/courses/<int:course_id>", methods=["PUT"])
def update_career_course(career_id, course_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    link = db.session.query(models.OccupationCourse).filter(
        models.OccupationCourse.occupation_id == career_id,
        models.OccupationCourse.course_id == course_id
    ).first()
    if not link:
        return jsonify({"detail": "Link not found"}), 404
    
    data = request.get_json()
    link.weight_score = data.get("weight_score")
    link.importance_level = data.get("importance_level")
    link.is_required = data.get("is_required")
    db.session.commit()
    return jsonify({"message": "Course link updated"})


@bp.route("/careers/<int:career_id>/interests", methods=["GET"])
def get_career_interests(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    
    links = db.session.query(models.OccupationInterest).filter(
        models.OccupationInterest.occupation_id == career_id
    ).all()
    
    result_list = []
    for link in links:
        interest = db.session.query(models.InterestTag).filter(models.InterestTag.id == link.interest_tag_id).first()
        if interest:
            result_list.append({
                "interest_id": interest.id,
                "interest_name": interest.name,
                "interest_emoji": interest.emoji,
                "relevance_score": link.relevance_score
            })
    return jsonify(result_list)


@bp.route("/careers/<int:career_id>/interests", methods=["POST"])
def add_career_interest(career_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    career = db.session.query(models.Occupation).filter(models.Occupation.id == career_id).first()
    if not career:
        return jsonify({"detail": "Career not found"}), 404
    
    data = request.get_json()
    interest_id = data.get("interest_tag_id")
    relevance_score = data.get("relevance_score", 50)
    
    interest = db.session.query(models.InterestTag).filter(models.InterestTag.id == interest_id).first()
    if not interest:
        return jsonify({"detail": "Interest not found"}), 404
    
    existing = db.session.query(models.OccupationInterest).filter(
        models.OccupationInterest.occupation_id == career_id,
        models.OccupationInterest.interest_tag_id == interest_id
    ).first()
    if existing:
        return jsonify({"detail": "Interest already linked"}), 400
    
    oi = models.OccupationInterest(
        occupation_id=career_id,
        interest_tag_id=interest_id,
        relevance_score=relevance_score
    )
    db.session.add(oi)
    db.session.commit()
    return jsonify({"message": "Interest linked"})


@bp.route("/careers/<int:career_id>/interests/<int:interest_id>", methods=["PUT"])
def update_career_interest(career_id, interest_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    link = db.session.query(models.OccupationInterest).filter(
        models.OccupationInterest.occupation_id == career_id,
        models.OccupationInterest.interest_tag_id == interest_id
    ).first()
    if not link:
        return jsonify({"detail": "Link not found"}), 404
    
    data = request.get_json()
    if "relevance_score" in data:
        link.relevance_score = data["relevance_score"]
    db.session.commit()
    return jsonify({"message": "Interest link updated"})


@bp.route("/careers/<int:career_id>/interests/<int:interest_id>", methods=["DELETE"])
def remove_career_interest(career_id, interest_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    link = db.session.query(models.OccupationInterest).filter(
        models.OccupationInterest.occupation_id == career_id,
        models.OccupationInterest.interest_tag_id == interest_id
    ).first()
    if not link:
        return jsonify({"detail": "Link not found"}), 404
    db.session.delete(link)
    db.session.commit()
    return jsonify({"message": "Interest unlinked"})


@bp.route("/employment-data", methods=["POST"])
def create_employment_data():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    data = request.get_json()
    db_data = models.EmploymentData(**data)
    db.session.add(db_data)
    db.session.commit()
    db.session.refresh(db_data)
    return jsonify({"id": db_data.id}), 201


@bp.route("/employment-data/<int:data_id>", methods=["PUT"])
def update_employment_data(data_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    db_data = db.session.query(models.EmploymentData).filter(models.EmploymentData.id == data_id).first()
    if not db_data:
        return jsonify({"detail": "Data not found"}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if value is not None:
            setattr(db_data, key, value)
    
    db.session.commit()
    db.session.refresh(db_data)
    return jsonify({"id": db_data.id})


@bp.route("/employment-data/<int:data_id>", methods=["DELETE"])
def delete_employment_data(data_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    data = db.session.query(models.EmploymentData).filter(models.EmploymentData.id == data_id).first()
    if not data:
        return jsonify({"detail": "Data not found"}), 404
    db.session.delete(data)
    db.session.commit()
    return jsonify({"message": "Data deleted"})


@bp.route("/salary-data", methods=["POST"])
def create_salary_data():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    data = request.get_json()
    db_data = models.SalaryTrend(**data)
    db.session.add(db_data)
    db.session.commit()
    db.session.refresh(db_data)
    return jsonify({"id": db_data.id}), 201


@bp.route("/salary-data/<int:data_id>", methods=["PUT"])
def update_salary_data(data_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    db_data = db.session.query(models.SalaryTrend).filter(models.SalaryTrend.id == data_id).first()
    if not db_data:
        return jsonify({"detail": "Data not found"}), 404
    
    data = request.get_json()
    for key, value in data.items():
        if value is not None:
            setattr(db_data, key, value)
    
    db.session.commit()
    db.session.refresh(db_data)
    return jsonify({"id": db_data.id})


@bp.route("/salary-data/<int:data_id>", methods=["DELETE"])
def delete_salary_data(data_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    data = db.session.query(models.SalaryTrend).filter(models.SalaryTrend.id == data_id).first()
    if not data:
        return jsonify({"detail": "Data not found"}), 404
    db.session.delete(data)
    db.session.commit()
    return jsonify({"message": "Data deleted"})


@bp.route("/users", methods=["GET"])
def get_all_users():
    result = require_admin()
    if isinstance(result, tuple):
        return result
    users = db.session.query(models.User).all()
    return jsonify([user_to_dict(u) for u in users])


@bp.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    db_user = db.session.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return jsonify({"detail": "User not found"}), 404
    
    data = request.get_json()
    if data.get("full_name") is not None:
        db_user.full_name = data.get("full_name")
    if data.get("age") is not None:
        db_user.age = data.get("age")
    if data.get("school") is not None:
        db_user.school = data.get("school")
    if data.get("grade") is not None:
        db_user.grade = data.get("grade")
    if data.get("avatar_url") is not None:
        db_user.avatar_url = data.get("avatar_url")
    
    db.session.commit()
    db.session.refresh(db_user)
    return jsonify(user_to_dict(db_user))


@bp.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    result = require_admin()
    if isinstance(result, tuple):
        return result
    
    if user_id == result.id:
        return jsonify({"detail": "Cannot delete yourself"}), 400
    
    db_user = db.session.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return jsonify({"detail": "User not found"}), 404
    
    db.session.delete(db_user)
    db.session.commit()
    return jsonify({"message": "User deleted"})
