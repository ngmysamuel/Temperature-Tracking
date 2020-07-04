import connexion
from connexion.resolver import RestyResolver
from flask_cors import CORS
from flask import render_template

app = connexion.App(__name__, specification_dir='./')
app.add_api('server.yml')
CORS(app.app)
#app.add_api('swaggerfulltest.yml')

@app.route('/')
def index():
	return render_template("home.html")


# If we're running in stand alone mode, run the application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
