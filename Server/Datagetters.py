from GeneralServerTools import getConnection, Sha1, getTestLocations
from threading import Thread
from datetime import datetime
from random import choice
from shutil import rmtree
import os, json, re

class DatagetterException(Exception):
    pass

class UsersDataGetter:
    def __init__(self):
        if os.path.exists('mysql\\mysql_credential.json'):
            with open('mysql\\mysql_credential.json','r') as f:
                self.credentials = json.load(f)
        else:
            raise DatagetterException("mysql\\mysql_credential.json is missing, keep in mind that the folder must be in the same directory as Datagetter.py")  
        self.tests_locations = getTestLocations()
        if not self.tests_locations :
            raise DatagetterException("Cant get tests/testLocations.json file, be sure to this file from the Server/ directory")
        self.credentials["database"] = "interviews" # selects the database that we will work with
        self.__hasher = Sha1()

        self.ok = {"response":"ok"}
    
    def login(self, user, password, ip):
            """
                confirms if the user password is correct (obviusly), and if true returns the
                primary key of the user and a token that is composed by its user name and ip address.  
            """
            mysql = self.__getConnAndCursor()
            try:
                hsh = self.__hasher.get_hash(password)
                sql = f"SELECT * FROM users WHERE name='{user}';"
                mysql["cursor"].execute(sql)
                user_credentials = mysql["cursor"].fetchall()
                if len(user_credentials) == 1:
                    user_credentials = user_credentials[0]
                    if user_credentials['hsh'] == hsh:
                        return {
                            "response":"ok",
                            "token":self.__hasher.get_hash(user + ip),
                            "id":user_credentials['id']
                        }
                    else:
                        return {'response':'wrong'}
            except Exception as e:
                print(f"Error({e})")
            finally:
                mysql["conn"].close()
    
    def getInterviewsByUserId(self, user_id):
        """
            Spected reasponse format:
                {Interviews:{
                    "interview_key_1":{"results":{"contento of the results files"}, "name":"name of the interviewee"}
                    .
                    .
                    .
                    interview_key_n
                }}
        """
        print(f"Getting Interviews of user with id '{user_id}'...")
        mysql = self.__getConnAndCursor()
        try:
            sql = f"SELECT interviews.id as interview, interviewees.name, interviewees.id as interviewee, profiles.path_to_file as profile FROM interviews, interviewees, profiles WHERE interviews.applyed_to=interviewees.id AND interviews.created_by={user_id} AND interviews.was_finished=1 AND profiles.id=interviews.profile;"
            mysql['cursor'].execute(sql)
            results = mysql['cursor'].fetchall()
            response ={"interviews":{}}
            if results:
                user_folder = self.getUserFolder(user_id)
                with open("./operational_data/testDictyonary.json", 'r') as f:
                    data_string = f.read()
                    data_string = data_string.replace('\\n', '')
                    response['test_interview'] = json.loads(data_string)
                for result in results:
                    print(f"Getting results of interview '{result['interview']}'...")
                    path_to_results = f"{user_folder}Interviewees/{result['interviewee']}/{result['interview']}.json"
                    result_content = {}
                    
                    if os.path.exists(path_to_results) and os.stat(path_to_results).st_size != 0:
                        with open(path_to_results, 'r') as f:
                            data_string = f.read()
                            data_string = data_string.replace("\\n", "")
                            result_content = json.loads(data_string)
                    else:
                        print(f"no results found for '{result['interview']}'")
 
                    #getting the profile that was used for this interview
                    if os.path.exists(result["profile"]):
                        with open(result["profile"]) as f:
                            data_string = f.read()
                            data_string = data_string.replace("\\n", "")
                            profile = json.loads(data_string)                  
                    else:
                        print(f"profile file path not found: '{result['profile']}'")
                        return self.getBadResponse()
                    
                    if not result_content:
                        continue
                    
                    response['interviews'][result['interview']] = {
                        "results": result_content,
                        "name": result["name"],
                        "interviewee_key": result['interviewee'],
                        "profile": profile
                    }
                return response
            else:
                print(f"Failure on query: {sql}")
                return response
            
        except Exception as e:
            print(f"Error while getting the results for '{user_id}': {e}")
            return self.getBadResponse()
        finally:
            mysql["conn"].close()
            
    def __getConnAndCursor(self):
        """
            returns a dict with a connection object and a cursor with results as dicts 
        """
        conn = getConnection(self.credentials)
        cursor = conn.cursor(dictionary=True)
        return {
            "conn": conn,
            "cursor": cursor
        }
        
    def getBadResponse(self, msg="Server error, sorry for the inconvenience"):
        """
            Used to que an standar error msg with an option to customize the msg
        """
        return {
            "response":"bad",
            "msg":msg
        }
    
    def getTestTokenInfo(self, test_token, user_id):
        #the test_token == interview_id
        print(f"Getting test_token info({test_token})...")
        tests_short_names = self.__getIntervieweeNameNdTests(test_token)
        response = {
            'interview': test_token,
            'interviewer': f"testToken_{test_token}",
            'interviewee': self.getIntervieweeByInterviewID(test_token),
            'needed_tests': self.getTestsContent(tests_short_names['tests'])
            }
        path_to_results = f"{self.getUserFolder(user_id)}Interviewees/{response['interviewee']}/{test_token}.json"
        if os.path.isfile(path_to_results):
            with open(path_to_results, 'r') as f:
                response['cached'] = json.load(f)
                response['cached']['interviewer'] = f"testToken_{test_token}"
        else:
            response['cached'] = {
                'tests': response['needed_tests'],
                "question_num": 1,
                "test_num": 0,
                "interviewee_answers": {},
                "interviewee_stats": {},
                "interviewee": response["interviewee"],
                "interview": test_token,
                "interviewer": f"testToken_{test_token}"
            }
        return response
    
    
    def getIntervieweeByInterviewID(self, interview):
        mysql = self.__getConnAndCursor()
        try:
            sql = f"SELECT applyed_to FROM interviews WHERE id='{interview}';"
            mysql['cursor'].execute(sql)
            result = mysql['cursor'].fetchall()
            return result[0]['applyed_to']
        except Exception as e:
            print(f"Exception on getIntervieweeByInterviewID: {e}")
        finally:
            mysql['conn'].close()
        
        
    def getTestsContent(self,  tests_short_names):
        tests_content = []
        for test in tests_short_names:
            if os.path.isfile(self.tests_locations[test]):
                with open(self.tests_locations[test], 'r') as f:
                    tests_content.append(json.load(f))
        return tests_content
        
    def getInterviewerByInterviewID(self, interview_uuid):
        mysql = self.__getConnAndCursor()
        print(f"looking for interviewer of '{interview_uuid}'...")
        try:
            mysql['cursor'].execute(f"SELECT created_by FROM interviews WHERE id='{interview_uuid}'")
            result = mysql['cursor'].fetchall()
            result = result[0]['created_by']
            return result
        except Exception as e:
            print(f"Exception ocurred while getting the interviewer for '{interview_uuid}'\n{e}")
            return self.getBadResponse()
        finally:
            mysql['conn'].close()    
    
    def deleteIntervieweeById(self, interviewee):
        """
            Spected reasponse format:
                {response:"standar response"}
        """
        print(f"Deleting {interviewee}...")
        if re.match(r"^[a-z\d]{40}",interviewee):
            mysql = self.__getConnAndCursor()
        
            try:
                mysql['cursor'].execute(f"SELECT * FROM interviews WHERE applyed_to='{interviewee}';")
                interviews = mysql['cursor'].fetchall()
                if interviews:
                    print(f"Deleting {len(interviews)} interviews...")
                    for interview in interviews:
                        if not self.deleteITbyInterviewId(interview['id']):
                            return self.getBadResponse("failed to delete ITs")
                    mysql['cursor'].execute(f"DELETE FROM interviews WHERE applyed_to='{interviewee}';")
                    mysql['conn'].commit()
                    interviewer_id = interview['created_by']
                else:
                    mysql['cursor'].execute(f"SELECT interviewer FROM interviewees WHERE id='{interviewee}';")
                    interviewer_id = mysql['cursor'].fetchall()
                    interviewer_id = interviewer_id[0]["interviewer"]
                
                interviewer_directory = self.getUserFolder(interviewer_id)
                interviewee_directory = f"{interviewer_directory}/Interviewees/{interviewee}/"
                if os.path.exists(interviewee_directory):
                    rmtree(interviewee_directory)

                mysql['cursor'].execute(f"DELETE FROM interviewees WHERE id='{interviewee}' LIMIT 1;")
                mysql["conn"].commit()
            except Exception as e:
                print(f"Error while deleting interviewee: {e}")
                return self.getBadResponse()
            finally:
                mysql["conn"].close()            

            return self.ok
            
        else:
            print("delete process failed...")
            return self.getBadResponse(f"no interviewee with id '{interviewee}' was found")  

    def deleteITbyInterviewId(self, interview_id):
        """
            Deletes every row matching 'interview_id' in the table InterviewsTests,
            returns True on success else returns False
        """
        mysql = self.__getConnAndCursor()
        try:
            print(f"Deleting ITs of '{interview_id}'...")
            mysql['cursor'].execute(f"DELETE FROM interviewstests WHERE interview='{interview_id}';")
            mysql['conn'].commit()
            return True
        except Exception as e:
            print(f"Error while deleting IT: {e}")
        finally:
            mysql['conn'].close()
        return False
    
    def createInterview(self, name, tests, user_id, profile, is_tokenized='0'):
        """
        Spected reasponse format:
        {
            interview_key: "the primary key of the interview",
            interviewee_key: "the primary key of the interviewee",
            tests:[test_content_1,test_content_2...test_content_n]
        }
        """
        if type(tests).__name__ == 'list' and name and len(tests):
            interviewee_key = self.createInterviewee(name,user_id)
            sql = ""
            print(f"{interviewee_key} requested for tests: {tests}")
            if interviewee_key:
                
                if os.path.exists('operational_data/testLocations.json'):
                    with open('operational_data/testLocations.json', 'r') as f:
                        tests_locations = json.load(f)
                else:
                    self.deleteIntervieweeById(interviewee_key)
                    print("unable to locate 'testLocations.json'")
                    return self.getBadResponse()
                
                interview_uuid = self.__hasher.get_hash(name+datetime.today().strftime('%f')+choice(tests))
                mysql = self.__getConnAndCursor()
                try:
                    print(f'Inserting Interview \'{interview_uuid}\'...')
                    mysql['cursor'].execute(f"INSERT INTO `interviews`(id, created_by, applyed_to, profile, tokenized) VALUES ('{interview_uuid}','{user_id}','{interviewee_key}', {profile}, {is_tokenized});")
                    mysql['conn'].commit()
                    
                    response = {
                        "interviewee_key": interviewee_key,
                        "interview_key": interview_uuid,
                        "tests":[]}
                    
                    for test in tests:
                        test_path = tests_locations[test]
                        if os.path.exists(test_path):
                            with open(test_path, 'r') as f:
                                response['tests'].append(json.load(f))
                            sql = f"INSERT INTO interviewstests(interview, test) SELECT '{interview_uuid}' AS interview,id AS test FROM tests WHERE short_name='{test}';"
                            mysql['cursor'].execute(sql)
                            mysql['conn'].commit()
                        else:
                            print(f"unable to locate test '{test}' in path '{test_path}'")
                            continue
                        
                except Exception as e:
                    print(e)
                    if sql:
                        print(f"Current query: {sql}")
                    response = self.getBadResponse()
                finally:
                    mysql['conn'].close()    
                return response
        else:
            if type(tests).__name__ != 'list':
                print(f'parameter \'test\' must be of type \'list\' but instead got \'{type(test).__name__}\'')
            else:
                print("got empty parameters")
            return self.getBadResponse()
            
    def createInterviewee(self, name, user_id):
        """
            Used to create an interviewee with its respectiv folder 
        """
        mysql = self.__getConnAndCursor()
        interviewee_key = self.__hasher.get_hash(name+datetime.today().strftime('%f'))
        try:
            data_folder = self.getUserFolder(user_id)
            if not os.path.exists(f"{data_folder}interviewees/{interviewee_key}"):
                os.mkdir(f"{data_folder}interviewees/{interviewee_key}")
            
            print(f'inserting interviewee {interviewee_key}...')
            sql = f"INSERT INTO Interviewees(id,name,interviewer) VALUES ('{interviewee_key}','{name}',{user_id});"
            mysql['cursor'].execute(sql)
            mysql['conn'].commit()
        except Exception as e:
            print(f"error while creating interviewee: {e}")
        finally:
            mysql['conn'].close()
            return interviewee_key
        
    def updateResults(self, interview_id, results):
        """
            gets the results of an interview once is completele finished and updates its status on de DB
        
            Spected reasponse format:
                {response:"standar response"}
        """
        print(f"Updateing results for {interview_id}")
        mysql = self.__getConnAndCursor()
        try:
            mysql['cursor'].execute(f"SELECT * FROM interviews WHERE id='{interview_id}';")
            interview_data = mysql["cursor"].fetchall()
            if interview_data:
                interview_data = interview_data[0]
                interviewer_folder_data = self.getUserFolder(interview_data['created_by'])
                interviewee_directory = f"{interviewer_folder_data}Interviewees/{interview_data['applyed_to']}/"
                
                if not os.path.exists(interviewee_directory):
                    os.mkdir(interviewee_directory)
                
                with open(f"{interviewee_directory+interview_id}.json", 'w') as f:
                    json.dump(results,f)
                    
                mysql["cursor"].execute(f"UPDATE interviews SET was_finished=1 WHERE id='{interview_id}';")
                mysql['conn'].commit()
                return self.ok
            else:
                print(f"Warning: trying to update results of unknwon Interview '{interview_id}'")
                return self.getBadResponse()
            
        except Exception as e:
            print(e)
            return self.getBadResponse()
        finally:
            mysql['conn'].close()

    def getUserFolder(self, user_id):
        mysql = self.__getConnAndCursor()
        mysql['cursor'].execute(f'SELECT data_folder FROM users WHERE id={user_id};')
        data_folder = mysql['cursor'].fetchall()
        if len(data_folder):
            data_folder = data_folder[0]['data_folder']
        else:
            raise DatagetterException('Error while try to get data_folder: invalid id was given')
        mysql['conn'].close()
        return data_folder

    def catchTest(self, interview_data):
        """
        
            interview_data is expected to be a dictionary containg the keys ('tests', 'question_num', 'test_num', 'interviewee_answers', 'interviewee_stats', 'interviewee', 'interview', 'interviewer')
            
            Spected reasponse format:
                {response:"standar response"}
                    
        """
        expected_params = ['tests', 'question_num', 'test_num', 'interviewee_answers', 'interviewee_stats', 'interviewee', 'interview', 'interviewer']
        if expected_params == list(interview_data.keys()):
            # print(f"catching ongoing interview with interview data:\n{interview_data}")
            path_to_results = f"{self.getUserFolder(interview_data['interviewer'])}Interviewees/{interview_data['interviewee']}/"
            if not os.path.exists(path_to_results):
                os.mkdir(path_to_results)
                
            with open(f"{path_to_results+interview_data['interview']}.json", 'w') as f:
                json.dump(interview_data,f)
            print(f'Success on catching interview {interview_data["interview"]}')
            return self.ok
        print(f"catchTests data expect a dict with keys <{expected_params}>\n instead found:\n <{list(interview_data.keys())}>")
        return self.getBadResponse()        
    
    def wasTokenCreated24HrsAgo(self, dt):
        created_on = datetime.timestamp(dt)
        now_timestamp = datetime.timestamp(datetime.now())
        return (now_timestamp - created_on) >= 86400 
    
    def getCatchedInterviews(self, user_id):
        """
            Gets all if any unfinished user interviews, if it finds interviews with status (in the DB)
            'was_finished=0' but no cached results, then it deletes it
            
            Spected reasponse format:
                {cached:[cached_interview_file_content_1, cached_interview_file_content_2, ..., cached_interview_file_content_n]}
                
        """
        if self.validateUserId(user_id):
            mysql = self.__getConnAndCursor()
            print(f"Getting unfinished interviews of user {user_id}...")
            try:
                mysql['cursor'].execute(f"SELECT id, applyed_to, tokenized, created FROM interviews WHERE created_by={user_id} AND was_finished=0;")
                results = mysql['cursor'].fetchall()
                if results:
                    
                    user_folder = self.getUserFolder(user_id)
                    response = {'cached':[]}
                     
                    for result in results:
                        path_to_cached_interview = f"{user_folder}Interviewees/{result['applyed_to']}/{result['id']}.json"
                        if not os.path.exists(path_to_cached_interview):
                            print(path_to_cached_interview)
                            created_on = result['created']
                            if result['tokenized'] == 0 or (result['tokenized'] == 1 and self.wasTokenCreated24HrsAgo(created_on)):
                                self.deleteIntervieweeById(result['applyed_to'])
                            continue
                        
                        with open(path_to_cached_interview, 'r') as f:
                            cached_data = json.load(f)
                        additional_data = self.__getIntervieweeNameNdTests(cached_data["interview"])
                        cached_data["interviewee_name"] = additional_data["name"]
                        cached_data["tests_names"] = additional_data["tests"]
                        response['cached'].append(cached_data)
                    
                    print(f"Got {len(response['cached'])} unfinished interview...")
                    return response                    
                else:
                    print(f"no unfinished interviews by user '{user_id}'...")
                    return {'cached':[]}
            except Exception as e:
                print(e)
                return self.getBadResponse()
            finally:
                mysql['conn'].close()
        else:
            print(f"user id '{user_id}' is not valid!")
            return self.getBadResponse()
        
    def __getIntervieweeNameNdTests(self, interview_id):
        """
            gets interview all the interview's tests short names and the name of the interviewee that took them
        """
        mysql = self.__getConnAndCursor()
        try:
            sql = f"SELECT interviewees.name AS interviewee, tests.short_name FROM tests,interviewstests,interviews,interviewees WHERE interviews.applyed_to=interviewees.id AND interviews.id=interviewstests.interview AND tests.id=interviewstests.test AND interviews.id='{interview_id}';"
            mysql['cursor'].execute(sql)
            results = mysql['cursor'].fetchall()
            if results:
                response = {"name": results[0]['interviewee'], "tests":[]}
                for result in results:
                    response["tests"].append(result["short_name"])
                
                return response  
            else:
                 raise DatagetterException(f"Error on query: {sql}\nreturned {results}")
        except Exception as e:
            print(e)
            return False
        finally:
            mysql['conn'].close()
    
    def validateUserId(self, user_id):
        if re.match(r"^[\d]+", str(user_id)):
            return True
        return False
    
    def getMeasuerdAttribsByShortName(self, short_name):
        if type(short_name).__name__ == 'str' and re.match(r"^[A-Z\d]+$", short_name):
            mysql = self.__getConnAndCursor()
            try:
                sql = f"SELECT stats.name FROM tests, testsstats, stats WHERE tests.id=testsstats.test AND testsstats.stat=stats.id AND tests.short_name='{short_name}';"
                mysql["cursor"].execute(sql)
                results = mysql["cursor"].fetchall()
                if not results:
                    print(f"WARNING: got no results from query:\n\t '{sql}'")
                return {
                        "response":"ok",
                        "attribs": [a["name"] for a in results]
                        }
                
            except Exception as e:
                print(f"Error while getting attributes for '{short_name}': {e}")
                return self.getBadResponse()
            finally:
                mysql["conn"].close()
        else:
            print(f"got invalid request for attributes of tests '{short_name}'")
            return self.getBadResponse()
        
    def saveNewProfile(self, profile_data, user):
        try:
            profile_data = json.loads(profile_data)
        except json.JSONDecodeError as e:
            print(f"An error ocurred while tying to parse profile values:\n{e}")
            return self.getBadResponse()
        if list(profile_data.keys()) == ['name', 'values']:
            profiles_folder = f"{self.getUserFolder(user)}profiles"
            
            if not os.path.exists(profiles_folder):
                os.mkdir(profiles_folder)
            
            path_to_file = f"{profiles_folder}/{profile_data['name']}.json"
            with open(path_to_file, 'w') as f:
                json.dump(profile_data, f)
            
            mysql = self.__getConnAndCursor()
            try:
                mysql["cursor"].execute(f"INSERT INTO profiles(id, name, path_to_file, creator) VALUES (NULL, '{profile_data['name']}', '{path_to_file}', {user});")
                mysql["conn"].commit()
            except Exception as e:
                print(f"an error occured while trying to inert profile on the database:\n{e}")
                return self.getBadResponse()
            finally:
                mysql["conn"].close()
                
            return self.ok                            

    def getSimpleUserProfiles(self, user_id):
        if re.match(r"^\d+$", user_id):
            mysql = self.__getConnAndCursor()
            try:
                mysql["cursor"].execute(f"SELECT path_to_file, id FROM profiles;")
                files = mysql["cursor"].fetchall()
                if files:
                    profiles = []
                    for result in files:
                        with open(result["path_to_file"], "r") as f:
                            profile_json = json.load(f)
                        
                        profiles.append({
                            "name": profile_json["name"],
                            "profile_id": result["id"],
                            "needed_tests": list(profile_json["values"].keys())
                        })
                    return {"response": "ok", "profiles": profiles}

                else:
                    print(f"no profiles where found for user {user_id}")
                    return self.getBadResponse("No has creado ningun perfil aun")
            except Exception as e:
                print(f"getUserProfile: {e}")
                return self.getBadResponse()
            finally:
                mysql["conn"].close()
        else:
            print(f"getUserProfile: invalid user_id '{user_id}'")
            return self.getBadResponse()
         