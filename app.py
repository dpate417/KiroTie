import logging
import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from models.baselines import load_baselines

logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__, static_folder="client/dist", static_url_path="")

    # Load baselines at startup — halts with SystemExit on missing/invalid file
    baselines = load_baselines("data/event_baselines.json")
    app.config["BASELINES"] = baselines
    logger.info("Baselines loaded: per_person_cost=$%.2f", baselines.per_person_cost)

    # CORS for Vite dev server
    CORS(app, origins=["http://localhost:5173", "http://localhost:5000"])

    # Register blueprints
    from routes.auth import auth_bp
    from routes.events import events_bp
    from routes.students import students_bp
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(events_bp, url_prefix="/api")
    app.register_blueprint(students_bp, url_prefix="/api")

    # Serve React frontend
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error("Internal server error: %s", error)
        return jsonify({"status": "error", "data": None, "error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
