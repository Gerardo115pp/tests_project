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


@app.route('/loginUsers', methods=['POST'])
def loginUsers():
    if request.method == 'POST':
        return user_data_getter.login(request.form['user_name'], request.form['password'], request.environ.get('HTTP_X_REAL_IP', request.remote_addr))


@app.route('/getInterviews', methods=['POST'])
def getInterviews():
    if request.method == 'POST':
        user_id = request.form['id']
        return user_data_getter.getInterviewsByUserId(user_id)

@app.route('/deleteInterviewee', methods=['POST'])
def deleteInterviewee():
    if request.method == 'POST':
        return user_data_getter.deleteIntervieweeById(request.form['id'])

@app.route('/getTests')
def getTests():
    if os.path.exists('operational_data/testDictyonary.json'):
        with open('operational_data/testDictyonary.json', 'r') as f:
            response  = json.load(f)
        return response

@app.route('/createNewInterview', methods=['POST'])
def createNewInterview():
    if request.method == 'POST':
        tests = json.loads(request.form["needed"])
        return user_data_getter.createInterview(request.form["name"],tests,request.form["user_id"])

@app.route('/handleResults',  methods=['POST'])
def handleResults():
    if request.method == 'POST':
        return user_data_getter.updateResults(request.form["key"],json.loads(request.form["results"]))

@app.route("/catchUnfinishedTest", methods=['POST'])
def catchUnfinishedTest():
    if request.method == 'POST':
        return user_data_getter.catchTest(json.loads(request.form['interview_data']))

@app.route('/getCatchedInterviews', methods=['POST'])
def getCatchedInterviews():
    if request.method == 'POST':
        return user_data_getter.getCatchedInterviews(request.form['user'])

if __name__ == "__main__":
    app.run(debug=True)