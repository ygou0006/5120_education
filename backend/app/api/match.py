from flask import Blueprint, request, jsonify
from sqlalchemy import case, func
from app import db
from app.models import models

bp = Blueprint('match', __name__)

COURSE_WEIGHT = 0.9
INTEREST_WEIGHT = 0.1


@bp.route("/careers", methods=["POST"])
def match_careers():
    data = request.get_json(silent=True) or {}
    course_ids = data.get("course_ids", [])
    interest_ids = data.get("interest_ids", [])
    
    if not course_ids and not interest_ids:
        return jsonify({"detail": "Please select at least one course or interest"}), 400
    
    total_count = len(course_ids) + len(interest_ids)
    
    # Base query - get all active occupations
    query = db.session.query(
        models.Occupation.id,
        models.Occupation.title,
        models.Occupation.image_base64,
        models.Occupation.category
    ).filter(models.Occupation.is_active == True)
    
    # Calculate course score
    course_score_expr = None
    if course_ids:
        subquery_courses = db.session.query(
            models.OccupationCourse.occupation_id,
            func.sum(
                models.OccupationCourse.weight_score * 
                (models.OccupationCourse.importance_level / 3.0) *
                case((models.OccupationCourse.is_required == True, 1.5), else_=1.0)
            ).label('course_score')
        ).filter(
            models.OccupationCourse.course_id.in_(course_ids)
        ).group_by(models.OccupationCourse.occupation_id).subquery()
        
        query = query.outerjoin(
            subquery_courses,
            models.Occupation.id == subquery_courses.c.occupation_id
        )
        course_score_expr = func.coalesce(subquery_courses.c.course_score, 0)
    
    # Calculate interest score
    interest_score_expr = None
    if interest_ids:
        subquery_interests = db.session.query(
            models.OccupationInterest.occupation_id,
            func.sum(models.OccupationInterest.relevance_score).label('interest_score')
        ).filter(
            models.OccupationInterest.interest_tag_id.in_(interest_ids)
        ).group_by(models.OccupationInterest.occupation_id).subquery()
        
        query = query.outerjoin(
            subquery_interests,
            models.Occupation.id == subquery_interests.c.occupation_id
        )
        interest_score_expr = func.coalesce(subquery_interests.c.interest_score, 0)
    
    # Add score columns
    if course_score_expr is not None:
        query = query.add_columns(course_score_expr)
    
    if interest_score_expr is not None:
        query = query.add_columns(interest_score_expr)
    
    results_raw = query.all()
    
    # Calculate final score
    results = []
    for row in results_raw:
        occ_id, title, image_base64, category = row[0], row[1], row[2], row[3]
        
        course_score = 0
        if course_score_expr is not None and len(row) > 4:
            course_score = float(row[4]) if row[4] else 0
        
        interest_score = 0
        if interest_score_expr is not None:
            idx = 5 if course_score_expr is not None else 4
            if len(row) > idx:
                interest_score = float(row[idx]) if row[idx] else 0
        
        total_score = (course_score * COURSE_WEIGHT) + (interest_score * INTEREST_WEIGHT)
        
        if total_count > 0:
            final_score = total_score / total_count
        else:
            final_score = 0
        
        if final_score > 0:
            results.append({
                "occupation_id": occ_id,
                "title": title,
                "image_base64": image_base64,
                "category": category,
                "match_score": round(final_score, 2)
            })
    
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return jsonify(results[:10])
