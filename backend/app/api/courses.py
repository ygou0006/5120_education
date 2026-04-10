from flask import Blueprint, request, jsonify
from app import db
from app.models import models

bp = Blueprint('courses', __name__)


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


@bp.route("/", methods=["GET"])
def get_courses():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("search")
    
    query = db.session.query(models.Course).filter(models.Course.is_active == True)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.Course.name.ilike(search_pattern)) | 
            (models.Course.code.ilike(search_pattern))
        )
    
    total = query.count()
    total_pages = (total + per_page - 1) // per_page
    skip = (page - 1) * per_page
    
    courses = query.offset(skip).limit(per_page).all()
    
    return jsonify({
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "data": [course_to_dict(c) for c in courses]
    })


@bp.route("/<int:course_id>", methods=["GET"])
def get_course(course_id):
    course = db.session.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        return jsonify({"detail": "Course not found"}), 404
    return jsonify(course_to_dict(course))


@bp.route("/categories/list", methods=["GET"])
def get_categories():
    categories = db.session.query(models.Course.category).distinct().filter(models.Course.category != None).all()
    return jsonify([c[0] for c in categories])
