from flask import Flask, request, send_from_directory
from flask_cors import CORS
from Datagetters import UsersDataGetter 
from GeneralServerTools import Sha1
import os, re, json

app = Flask(__name__, static_url_path='')

hasher = Sha1()
user_data_getter = UsersDataGetter()

CORS(app)

@app.route('/validateUserToken',methods=['POST'])
def validateUserToken():
    if request.method == 'POST':
        user_ip = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
        valid_token = hasher.get_hash(request.form['user_name'] + user_ip)
        if valid_token == request.form['token']:
            return {'response':'ok'}
        return {'response':'invalid'}


@app.route('/loginUsers',methods=['POST'])
def loginUsers():
    if request.method == 'POST':
        return user_data_getter.login(request.form['user_name'], request.form['password'], request.environ.get('HTTP_X_REAL_IP', request.remote_addr))

if __name__ == "__main__":
    app.run(debug=True)