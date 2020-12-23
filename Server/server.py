from flask import Flask, request, send_from_directory
from flask_cors import CORS
from Datagetters import UsersDataGetter 
from GeneralServerTools import Sha1
import os, re, json

app = Flask(__name__, static_url_path='')

uuids_regex = re.compile(r"^[a-z\d]{40}$")
token_users_regex = re.compile(r"^testToken_[a-z\d]{40}$")
hasher = Sha1()
user_data_getter = UsersDataGetter()
tokens_data = {} #contains the users that created the test-tokes {test-token: user_id}

CORS(app)

#=====================================
#
#           Admintools
#
#=====================================

@app.route('/receive-test', methods=['POST'])
def addTest():
    #
    #   test data must include: test, key, file_name, type, fullname, length, stats
    #
    if request.method == "POST":
        test_data = json.loads(request.form['test_data'])
        testhash = hasher.get_hash(test_data['test'])
        if testhash == test_data['key']: 
            return user_data_getter.addTest(test_data)
    return user_data_getter.getBadResponse()
        


#End of Admintools

def changeTokenUser(token_user):
    if type(token_user).__name__ == 'str':
        if token_users_regex.match(token_user):
            token_user = token_user.split('_')[1]
    print(f"token: {token_user}")
    return token_user

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

@app.route('/get-user-tokens', methods=['POST'])
def getUserTokens():
    # excpects user parameter to be the id of a user
    return user_data_getter.getTokensInfo(request.form['user'])

@app.route('/getTestTokenInfo/<test_token>/')
def getTestTokenInfo(test_token):
    if uuids_regex.match(test_token):
        if test_token not in tokens_data:
            user_id = user_data_getter.getInterviewerByInterviewID(test_token)
            tokens_data[test_token] = user_id
        return user_data_getter.getTestTokenInfo(test_token, tokens_data[test_token])

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
        return user_data_getter.createInterview(request.form["name"],tests,request.form["user_id"], request.form["profile_id"], request.form['tokenized'])

@app.route('/handleResults',  methods=['POST'])
def handleResults():
    if request.method == 'POST':
        return user_data_getter.updateResults(request.form["key"],json.loads(request.form["results"]))

@app.route("/catchUnfinishedTest", methods=['POST'])
def catchUnfinishedTest():
    if request.method == 'POST':
        interview_data = json.loads(request.form['interview_data'])
        test_token = changeTokenUser(interview_data['interviewer'])
        if test_token not in tokens_data and type(test_token).__name__ == 'str':
            tokens_data[test_token] = user_data_getter.getInterviewerByInterviewID(test_token)
            interview_data['interviewer'] = tokens_data[test_token]
        return user_data_getter.catchTest(interview_data)

@app.route('/getCatchedInterviews', methods=['POST'])
def getCatchedInterviews():
    if request.method == 'POST':
        return user_data_getter.getCatchedInterviews(request.form['user'])

@app.route('/getTesttAttributes/<test_short_name>/')
def getTesttAttributes(test_short_name=None):
    if test_short_name:
        return user_data_getter.getMeasuerdAttribsByShortName(test_short_name)
    else:
        return user_data_getter.getBadResponse()

@app.route('/createProfileForUser', methods=['POST'])
def createProfileForUser():
    if request.method == 'POST':
        return user_data_getter.saveNewProfile(request.form['profile'], request.form['user'])
    
@app.route("/getSimpleUserProfiles/<user_id>/")
def getSimpleUserProfiles(user_id=None):
    if user_id:
        return user_data_getter.getSimpleUserProfiles(user_id)
    else:
        user_data_getter.getBadResponse("no user id was given...")

if __name__ == "__main__":
    app.run(debug=True)
