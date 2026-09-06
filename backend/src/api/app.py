from flask import Flask
from api.endpoints import endpoint_bp
from db import DataBase

app = Flask(__name__)

app.register_blueprint(endpoint_bp)

db = DataBase()
db.set_read_mode()

app.config['DB'] = db

if __name__ == '__main__':
    app.run(debug=True)
