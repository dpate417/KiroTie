import logging

from flask import Flask, jsonify
from flask_cors import CORS

from models.baselines import load_baselines

logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)

    # Load baselines at startup — halts with SystemExit on missing/invalid file
    baselines = load_baselines("data/event_baselines.json")
    app.config["BASELINES"] = baselines
    logger.info("Baselines loaded: per_person_cost=$%.2f", baselines.per_person_cost)

    # CORS for Vite dev server
    CORS(app, origins=["http://localhost:5173"])

    # Register blueprints
    from routes.auth import auth_bp
    from routes.events import events_bp
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(events_bp, url_prefix="/api")

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error("Internal server error: %s", error)
        return jsonify({"status": "error", "data": None, "error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
