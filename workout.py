
import os
from flask import Flask, request, jsonify, session
from flask_mysqldb import MySQL
from flask_cors import CORS
import MySQLdb.cursors
import re


app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key')
CORS(app)

# MySQL configuration from environment variables
app.config['MYSQL_HOST'] = os.environ.get('MYSQL_HOST', 'localhost')
app.config['MYSQL_USER'] = os.environ.get('MYSQL_USER', 'root')
app.config['MYSQL_PASSWORD'] = os.environ.get('MYSQL_PASSWORD', '')
app.config['MYSQL_DB'] = os.environ.get('MYSQL_DB', 'workout_db')

mysql = MySQL(app)

# User registration endpoint
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM users WHERE username = %s', (username,))
    account = cursor.fetchone()
    if account:
        return jsonify({'error': 'Account already exists!'}), 409
    cursor.execute('INSERT INTO users (username, password) VALUES (%s, %s)', (username, password))
    mysql.connection.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

# User login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM users WHERE username = %s AND password = %s', (username, password))
    account = cursor.fetchone()
    if account:
        session['loggedin'] = True
        session['id'] = account['id']
        session['username'] = account['username']
        return jsonify({'message': 'Login successful!'})
    else:
        return jsonify({'error': 'Incorrect username/password!'}), 401

# Add workout endpoint
@app.route('/add_workout', methods=['POST'])
def add_workout():
    if 'loggedin' not in session:
        return jsonify({'error': 'Not logged in!'}), 401
    data = request.get_json()
    workout_type = data.get('workout_type')
    details = data.get('details')
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('INSERT INTO workouts (user_id, workout_type, details) VALUES (%s, %s, %s)', (session['id'], workout_type, details))
    mysql.connection.commit()
    return jsonify({'message': 'Workout added!'})

# Get workout history endpoint
@app.route('/workouts', methods=['GET'])
def get_workouts():
    if 'loggedin' not in session:
        return jsonify({'error': 'Not logged in!'}), 401
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM workouts WHERE user_id = %s ORDER BY id DESC', (session['id'],))
    workouts = cursor.fetchall()
    return jsonify({'workouts': workouts})

if __name__ == '__main__':
    app.run(debug=True)
