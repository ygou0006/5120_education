from flask import Blueprint, request, jsonify
from app import db
from app.models import models
import uuid

bp = Blueprint('compare', __name__)


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


@bp.route("/create", methods=["POST"])
def create_comparison():
    from app.api.auth import get_current_active_user
    
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    occupation_ids = data.get("occupation_ids", [])
    
    if len(occupation_ids) < 2:
        return jsonify({"detail": "Need at least 2 occupations"}), 400
    if len(occupation_ids) > 5:
        return jsonify({"detail": "Maximum 5 occupations allowed"}), 400
    
    db_comparison = models.UserComparison(
        user_id=current_user.id,
        comparison_name=data.get("comparison_name"),
        occupations=occupation_ids
    )
    db.session.add(db_comparison)
    db.session.commit()
    db.session.refresh(db_comparison)
    return jsonify({"id": db_comparison.id, "message": "Comparison saved"})


@bp.route("/<int:comparison_id>", methods=["GET"])
def get_comparison(comparison_id):
    comparison = db.session.query(models.UserComparison).filter(models.UserComparison.id == comparison_id).first()
    if not comparison:
        return jsonify({"detail": "Comparison not found"}), 404
    
    occupations = db.session.query(models.Occupation).filter(
        models.Occupation.id.in_(comparison.occupations)
    ).all()
    return jsonify({"comparison": {
        "id": comparison.id,
        "user_id": comparison.user_id,
        "comparison_name": comparison.comparison_name,
        "occupations": comparison.occupations,
        "created_at": comparison.created_at.isoformat() if comparison.created_at else None
    }, "occupations": [occupation_to_dict(o) for o in occupations]})


@bp.route("/anonymous", methods=["POST"])
def create_anonymous_comparison():
    data = request.get_json()
    occupation_ids = data.get("occupation_ids", [])
    
    if len(occupation_ids) < 2:
        return jsonify({"detail": "Need at least 2 occupations"}), 400
    if len(occupation_ids) > 5:
        return jsonify({"detail": "Maximum 5 occupations allowed"}), 400
    
    session_id = str(uuid.uuid4())
    
    occupations = db.session.query(models.Occupation).filter(
        models.Occupation.id.in_(occupation_ids)
    ).all()
    return jsonify({"session_id": session_id, "occupations": [occupation_to_dict(o) for o in occupations]})
