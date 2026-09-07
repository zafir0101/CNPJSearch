import argparse
import threading
from typing import Any

from flask import Flask, jsonify

from api.endpoints import endpoint_bp
from db import DataBase
import pipeline


class PipelineStatusStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._data: dict[str, Any] = {
            'status': 'idle',        
            'stage': None,
            'current_file': None,
            'files_done': 0,
            'files_total': 0,
            'error': None,
        }

    def update(self, patch: dict[str, Any]) -> None:
        with self._lock:
            self._data.update(patch)

    def set_status(self, status: str) -> None:
        self.update({'status': status})

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return dict(self._data)


def _run_pipeline_in_background(db: DataBase, status: PipelineStatusStore) -> None:
    try:
        status.set_status('provisionando')
        db.set_write_mode()
        pipeline.init_pipeline(db, on_progress=status.update)
        db.set_read_mode()
        status.update({'status': 'pronto', 'stage': 'concluido', 'current_file': None})
    except Exception as exc:  
        status.update({'status': 'erro', 'error': str(exc)})


def create_app(debug_mode: bool) -> Flask:
    app = Flask(__name__)
    app.register_blueprint(endpoint_bp)

    status = PipelineStatusStore()

    if debug_mode:
        db = DataBase(debug=True)
        db.set_read_mode()
        status.update({'status': 'pronto', 'stage': 'debug_db_injetado'})
    else:
        db = DataBase()
        threading.Thread(target=_run_pipeline_in_background, args=(db, status), daemon=True).start()

    app.config['DB'] = db
    app.config['PIPELINE_STATUS'] = status

    @app.after_request
    def _add_cors_headers(response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        return response

    @app.route('/api/v1/status', methods=['GET'])
    def get_status():
        return jsonify({'status': 'sucesso', 'dados': status.snapshot()}), 200

    return app


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='API de consulta de dados do CNPJ')
    parser.add_argument(
        '--debug',
        action='store_true',
        help='Pula a coleta de dados e usa a base pré-carregada em data/debug.db',
    )
    return parser.parse_args()


_args = _parse_args()
app = create_app(debug_mode=_args.debug)

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
