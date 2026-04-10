from flask import Blueprint, request, jsonify
from app import db
from app.models import models

bp = Blueprint('interests', __name__)


def interest_to_dict(interest):
    return {
        "id": interest.id,
        "name": interest.name,
        "category": interest.category,
        "emoji": interest.emoji,
        "display_order": interest.display_order,
        "is_active": interest.is_active
    }


@bp.route("/", methods=["GET"])
def get_interests():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    search = request.args.get("search")
    
    query = db.session.query(models.InterestTag).filter(models.InterestTag.is_active == True)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(models.InterestTag.name.ilike(search_pattern))
    
    total = query.count()
    total_pages = (total + per_page - 1) // per_page
    skip = (page - 1) * per_page
    
    interests = query.offset(skip).limit(per_page).all()
    
    return jsonify({
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages,
        "data": [interest_to_dict(i) for i in interests]
    })


@bp.route("/categories", methods=["GET"])
def get_categories():
    categories = db.session.query(models.InterestTag.category).distinct().filter(models.InterestTag.category != None).all()
    return jsonify([c[0] for c in categories])
