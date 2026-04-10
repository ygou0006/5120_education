from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid
from app import db
from app.models import models

bp = Blueprint('explorations', __name__)


@bp.route("/save", methods=["POST"])
def save_exploration():
    from app.api.auth import get_current_active_user
    
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    db_exploration = models.UserExploration(
        user_id=current_user.id,
        selected_courses=data.get("selected_courses"),
        selected_tags=data.get("selected_tags"),
        matched_careers=data.get("matched_careers")
    )
    db.session.add(db_exploration)
    db.session.commit()
    db.session.refresh(db_exploration)
    return jsonify({"id": db_exploration.id, "message": "Exploration saved"}), 201


@bp.route("/history", methods=["GET"])
def get_history():
    from app.api.auth import get_current_active_user
    
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    explorations = db.session.query(models.UserExploration).filter(
        models.UserExploration.user_id == current_user.id
    ).order_by(models.UserExploration.created_at.desc()).limit(20).all()
    
    result = []
    for e in explorations:
        result.append({
            "id": e.id,
            "selected_courses": e.selected_courses,
            "selected_tags": e.selected_tags,
            "matched_careers": e.matched_careers,
            "created_at": e.created_at.isoformat() if e.created_at else None
        })
    return jsonify(result)


@bp.route("/<int:exploration_id>", methods=["GET"])
def get_exploration(exploration_id):
    from app.api.auth import get_current_active_user
    
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    exploration = db.session.query(models.UserExploration).filter(
        models.UserExploration.id == exploration_id,
        models.UserExploration.user_id == current_user.id
    ).first()
    if not exploration:
        return jsonify({"detail": "Exploration not found"}), 404
    
    return jsonify({
        "id": exploration.id,
        "selected_courses": exploration.selected_courses,
        "selected_tags": exploration.selected_tags,
        "matched_careers": exploration.matched_careers,
        "created_at": exploration.created_at.isoformat() if exploration.created_at else None
    })


bp_session = Blueprint('session', __name__)


@bp_session.route("/create", methods=["POST"])
def create_session():
    session_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    db_session = models.AnonymousSession(
        session_id=session_id,
        expires_at=expires_at
    )
    db.session.add(db_session)
    db.session.commit()
    
    return jsonify({"session_id": session_id})


@bp_session.route("/save", methods=["POST"])
def save_session():
    data = request.get_json()
    session_id = data.get("session_id")
    
    session = db.session.query(models.AnonymousSession).filter(
        models.AnonymousSession.session_id == session_id
    ).first()
    if not session:
        return jsonify({"detail": "Session not found"}), 404
    
    if data.get("selected_courses") is not None:
        session.selected_courses = data.get("selected_courses")
    if data.get("selected_tags") is not None:
        session.selected_tags = data.get("selected_tags")
    if data.get("favorite_occupations") is not None:
        session.favorite_occupations = data.get("favorite_occupations")
    if data.get("comparison_occupations") is not None:
        session.comparison_occupations = data.get("comparison_occupations")
    
    db.session.commit()
    return jsonify({"message": "Session saved"})


@bp_session.route("/<session_id>", methods=["GET"])
def get_session(session_id):
    session = db.session.query(models.AnonymousSession).filter(
        models.AnonymousSession.session_id == session_id
    ).first()
    if not session:
        return jsonify({"detail": "Session not found"}), 404
    
    return jsonify({
        "session_id": session.session_id,
        "selected_courses": session.selected_courses,
        "selected_tags": session.selected_tags,
        "favorite_occupations": session.favorite_occupations,
        "comparison_occupations": session.comparison_occupations
    })
