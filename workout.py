import os
from flask import Flask, request, jsonify, session
from flask import render_template
from flask_mysqldb import MySQL
from flask_cors import CORS
import MySQLdb.cursors
import re
import json


from datetime import timedelta
app = Flask(__name__)

app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key')
# Make session last 7 days
app.permanent_session_lifetime = timedelta(days=7)
# Allow CORS for all origins and credentials (cookies/sessions)
CORS(app, origins=["http://127.0.0.1:5500", "http://localhost:5500"], supports_credentials=True, allow_headers=["Content-Type"])
# Allow session cookies to be sent cross-origin for local dev
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False

# MySQL configuration from environment variables
app.config['MYSQL_HOST'] = '127.0.0.1'  # Use the same as your MySQL Workbench connection
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = 'BrettGardner11'  # <-- Replace with your actual MySQL password
app.config['MYSQL_DB'] = 'workout_site'

# Serve index.html from templates
mysql = MySQL(app)
def index():
    return render_template('index.html')

# Health check endpoint
@app.route('/')
def health():
    return 'API is running!'

# User registration endpoint
@app.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
        account = cursor.fetchone()
        if account:
            return jsonify({'error': 'Account already exists!'}), 409
        # For demo: store password as plain text (not secure). Use hashing in production!
        cursor.execute(
            'INSERT INTO users (username, name, email, password_hash) VALUES (%s, %s, %s, %s)',
            (username, name, email, password)
        )
        mysql.connection.commit()
        return jsonify({'message': 'User registered successfully!'}), 201
    except Exception as e:
        print('Registration error:', e)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


# User login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    account = cursor.fetchone()
    if account and account['password_hash'] == password:
        session.permanent = True  # Make session cookie persistent
        session['loggedin'] = True
        session['id'] = account['id']
        session['username'] = account['username']
        # Force session to be modified
        session.modified = True
        return jsonify({
            'success': True,
            'user': {
                'id': account['id'],
                'username': account['username'],
                'name': account.get('name'),
                'email': account.get('email')
            }
        })
    else:
        return jsonify({'success': False, 'error': 'Incorrect username/password!'}), 401


# Add workout session endpoint
@app.route('/add_workout', methods=['POST'])
def add_workout():
    try:
        if 'id' not in session:
            return jsonify({'error': 'User not logged in!'}), 401

        data = request.get_json()
        sessionId = data.get('sessionId')
        date = data.get('date')
        import datetime
        import pytz
        # Convert JS timestamp (ms) to MySQL DATETIME string in local timezone (America/New_York)
        if isinstance(date, (int, float)):
            tz = pytz.timezone('America/New_York')
            dt_utc = datetime.datetime.utcfromtimestamp(date / 1000.0).replace(tzinfo=pytz.utc)
            dt_local = dt_utc.astimezone(tz)
            date = dt_local.strftime('%Y-%m-%d %H:%M:%S')
        totalTime = data.get('totalTime')
        exercises = data.get('exercises', [])

        # Basic validation
        if not sessionId or not date or not totalTime or not isinstance(exercises, list):
            return jsonify({'error': 'Missing or invalid workout data'}), 400

        user_id = session['id']
        username = session.get('username')
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)

        # Insert workout session with username
        cursor.execute(
            'INSERT INTO workout_sessions (user_id, username, sessionId, date, totalTime) VALUES (%s, %s, %s, %s, %s)',
            (user_id, username, sessionId, date, totalTime)
        )
        session_db_id = cursor.lastrowid

        # Insert exercises with username
        for ex in exercises:
            cursor.execute('''INSERT INTO exercises
                (session_id, username, name, type, muscle, targetSets, targetReps, targetWeight, actualSets, actualReps, actualWeight)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                (session_db_id,
                 username,
                 ex.get('name'),
                 ex.get('type'),
                 ex.get('muscle'),
                 ex.get('targetSets'),
                 ex.get('targetReps'),
                 ex.get('targetWeight'),
                 ex.get('actualSets'),
                 ex.get('actualReps'),
                 ex.get('actualWeight')))
            exercise_db_id = cursor.lastrowid

            # Insert sets for this exercise
            for s in ex.get('sets', []):
                cursor.execute('''INSERT INTO sets
                    (session_id, username, exercise_name, set_number, reps, weight)
                    VALUES (%s, %s, %s, %s, %s)''',
                    (session_db_id, username, ex.get('name'), s.get('setNumber'), s.get('reps'), s.get('weight')))
        mysql.connection.commit()
        return jsonify({
            'message': 'Workout session added!',
            'session_id': session_db_id,
            'exercises': exercises
        }), 201

    except Exception as e:
        mysql.connection.rollback()
        print('Add workout error:', e)
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


# Get workout history endpoint
@app.route('/workouts', methods=['GET'])
def get_workouts():
    if 'loggedin' not in session:
        return jsonify({'error': 'Not logged in!'}), 401
    user_id = session['id']
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    # Get all sessions for this user
    cursor.execute('SELECT * FROM workout_sessions WHERE user_id = %s ORDER BY date DESC', (user_id,))
    sessions = cursor.fetchall()
    # For each session, get exercises
    for sess in sessions:
        cursor.execute('SELECT * FROM exercises WHERE session_id = %s', (sess['id'],))
        exercises = cursor.fetchall()
        for ex in exercises:
            # Fetch sets for this exercise in this session
            cursor.execute('SELECT set_number, reps, weight FROM sets WHERE session_id = %s AND exercise_name = %s ORDER BY set_number ASC', (sess['id'], ex['name']))
            ex['sets'] = cursor.fetchall()
        sess['exercises'] = exercises
    return jsonify({'workouts': sessions})


@app.after_request
def add_cors_headers(response):
    # This ensures cookies are set cross-origin for local dev
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    # Only allow the frontend origin
    origin = request.headers.get('Origin')
    if origin in ["http://localhost:5500", "http://127.0.0.1:5500"]:
        response.headers['Access-Control-Allow-Origin'] = origin
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response


if __name__ == '__main__':
    app.run(debug=True, port=5050)


