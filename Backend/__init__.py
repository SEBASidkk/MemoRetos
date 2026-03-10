import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from .config import config

FRONT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

#Inicializar extensiones
db      = SQLAlchemy()
migrate = Migrate()
jwt     = JWTManager()


def create_app(env="default"):
    app = Flask(__name__)
    app.config.from_object(config[env])

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"])

    from app.routes.auth import is_token_revoked
    jwt.token_in_blocklist_loader(is_token_revoked)

    from app.routes.auth       import auth_bp
    from app.routes.game       import game_bp
    from app.routes.dashboard  import dashboard_bp
    from app.routes.memoretos  import memoretos_bp
    from app.routes.answers    import answers_bp
    from app.routes.groups     import groups_bp

    # Prefijos alineados a la DEFINICION DE ENDPOINTS (PDF)
    app.register_blueprint(auth_bp,      url_prefix="/auth")       # /auth/login, /auth/register
    app.register_blueprint(game_bp,      url_prefix="")            # /session/start, /game/session/event
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")  # /dashboard/ranking
    app.register_blueprint(memoretos_bp, url_prefix="/memoretos")  # /memoretos/published
    app.register_blueprint(answers_bp,   url_prefix="")            # /answers, /answer/history
    app.register_blueprint(groups_bp,    url_prefix="/groups")     # /groups/...

    from flask import jsonify

    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "message": "MemoRetos API corriendo ✅"})

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def index(path):
        file_path = os.path.join(FRONT_DIR, path)
        if path and os.path.exists(file_path):
            return send_from_directory(FRONT_DIR, path)
        return send_from_directory(FRONT_DIR, "index.html")

    return app
