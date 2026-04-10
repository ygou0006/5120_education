from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.models import models
from app.utils.auth import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token

bp = Blueprint('auth', __name__)


def get_current_user():
    token = request.headers.get('Authorization')
    if not token:
        return None
    if token.startswith('Bearer '):
        token = token[7:]
    
    payload = decode_token(token)
    if payload is None:
        return None
    username = payload.get("sub")
    if username is None:
        return None
    user = db.session.query(models.User).filter(models.User.username == username).first()
    return user


def get_current_active_user():
    current_user = get_current_user()
    if not current_user:
        return jsonify({"detail": "Could not validate credentials"}), 401
    if not current_user.is_active:
        return jsonify({"detail": "Inactive user"}), 400
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


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"detail": "Invalid request body"}), 400
    
    if not data.get("username") or not data.get("password") or not data.get("email"):
        return jsonify({"detail": "Username, email and password required"}), 400
    
    db_user = db.session.query(models.User).filter(
        (models.User.username == data.get("username")) | (models.User.email == data.get("email"))
    ).first()
    if db_user:
        return jsonify({"detail": "Username or email already registered"}), 400

    hashed_password = get_password_hash(data.get("password"))
    db_user = models.User(
        username=data.get("username"),
        email=data.get("email"),
        password_hash=hashed_password,
        full_name=data.get("full_name"),
        age=data.get("age"),
        school=data.get("school"),
        grade=data.get("grade"),
        avatar_url=data.get("avatar_url")
    )
    db.session.add(db_user)
    db.session.commit()
    db.session.refresh(db_user)
    return jsonify(user_to_dict(db_user)), 201


@bp.route("/login", methods=["POST"])
def login():
    # Support JSON and form data
    data = request.get_json(silent=True) or {}
    if not data:
        data = request.form.to_dict()
    
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"detail": "Username and password required"}), 400
    
    user = db.session.query(models.User).filter(models.User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({"detail": "Incorrect username or password"}), 401
    if not user.is_active:
        return jsonify({"detail": "Inactive user"}), 400
    
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    })


@bp.route("/logout", methods=["POST"])
def logout():
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    return jsonify({"message": "Successfully logged out"})


@bp.route("/me", methods=["GET"])
def get_me():
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    return jsonify(user_to_dict(current_user))


@bp.route("/profile", methods=["PUT"])
def update_profile():
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    if data.get("full_name") is not None:
        current_user.full_name = data.get("full_name")
    if data.get("age") is not None:
        current_user.age = data.get("age")
    if data.get("school") is not None:
        current_user.school = data.get("school")
    if data.get("grade") is not None:
        current_user.grade = data.get("grade")
    if data.get("avatar_url") is not None:
        current_user.avatar_url = data.get("avatar_url")
    
    db.session.commit()
    db.session.refresh(current_user)
    return jsonify(user_to_dict(current_user))


@bp.route("/change-password", methods=["POST"])
def change_password():
    current_user = get_current_active_user()
    if isinstance(current_user, tuple):
        return current_user
    
    data = request.get_json()
    if not verify_password(data.get("old_password"), current_user.password_hash):
        return jsonify({"detail": "Incorrect password"}), 400
    
    current_user.password_hash = get_password_hash(data.get("new_password"))
    db.session.commit()
    return jsonify({"message": "Password changed successfully"})
