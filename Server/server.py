from flask import Flask, request, send_from_directory
from flask_cors import CORS
from GeneralServerTools import Sha1
import os, re, json

app = Flask(__name__, static_url_path='')

hasher = Sha1()

CORS(app)

@app.route('/validateUserToken',methods=['POST'])
def validateUserToken():
    if request.method == 'POST':
        user_ip = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
        valid_token = hasher.get_hash(request.form['user_name'] + user_ip)
        if valid_token == request.form['token']:
            return {'response':'ok'}
        return {'response':'invalid'}
    

if __name__ == "__main__":
    app.run(debug=True)