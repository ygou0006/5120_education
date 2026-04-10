from flask import Blueprint, request, jsonify
from app import db
from app.models import models

bp = Blueprint('favorites', __name__)


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


@bp.route("/add", methods=["POST"])
def add_favorite():
    from app.api.auth import get_current_active_user
    
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    occupation_id = data.get("occupation_id")
    
    existing = db.session.query(models.UserFavorite).filter(
        models.UserFavorite.user_id == current_user.id,
        models.UserFavorite.occupation_id == occupation_id
    ).first()
    if existing:
        return jsonify({"detail": "Already favorited"}), 400
    
    db_favorite = models.UserFavorite(
        user_id=current_user.id,
        occupation_id=occupation_id,
        notes=data.get("notes")
    )
    db.session.add(db_favorite)
    db.session.commit()
    return jsonify({"message": "Added to favorites"}), 201


@bp.route("/remove", methods=["DELETE"])
def remove_favorite():
    from app.api.auth import get_current_active_user
    
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    occupation_id = request.args.get("occupation_id", type=int)
    
    favorite = db.session.query(models.UserFavorite).filter(
        models.UserFavorite.user_id == current_user.id,
        models.UserFavorite.occupation_id == occupation_id
    ).first()
    if not favorite:
        return jsonify({"detail": "Favorite not found"}), 404
    
    db.session.delete(favorite)
    db.session.commit()
    return jsonify({"message": "Removed from favorites"})


@bp.route("/list", methods=["GET"])
def get_favorites():
    from app.api.auth import get_current_active_user
    
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    favorites = db.session.query(models.Occupation).join(
        models.UserFavorite, models.UserFavorite.occupation_id == models.Occupation.id
    ).filter(models.UserFavorite.user_id == current_user.id).all()
    return jsonify([occupation_to_dict(o) for o in favorites])
