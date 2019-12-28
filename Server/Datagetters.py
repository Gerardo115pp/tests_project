from GeneralServerTools import getConnection, Sha1
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
        self.credentials["database"] = "interviews"
        self.__hasher = Sha1()
        self.ok = {"response":"ok"}
    
    def login(self, user, password, ip):
            mysql = self.__getConnAndCursor()
            try:
                hsh = self.__hasher.get_hash(password)
                sql = f"SELECT * FROM usuarios WHERE name='{user}';"
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
                print(f"Error({e.with_traceback()})")
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
            sql = f"SELECT interviews.id as interview, interviewees.name, interviewees.id as interviewee FROM interviews INNER JOIN interviewees ON interviews.applyed_to=interviewees.id AND interviews.created_by={user_id} AND interviews.was_finished=1;"
            mysql['cursor'].execute(sql)
            results = mysql['cursor'].fetchall()
            if results:
                user_folder = self.getUserFolder(user_id)
                response ={"interviews":{}}
                for result in results:
                    print(f"Getting results of interview '{result['interview']}'...")
                    path_to_results = f"{user_folder}Interviewees/{result['interviewee']}/{result['interview']}.json"
                    result_content = {}
                    
                    if os.path.exists(path_to_results) and os.stat(path_to_results).st_size != 0:
                        with open(path_to_results, 'r') as f:
                            result_content = json.load(f)
                    else:
                        print(f"no results found for '{result['interview']}'")
                    
                    
                    if not result_content:
                        continue
                    
                    response['interviews'][result['interview']] = {
                        "results": result_content,
                        "name": result["name"],
                        "interviewee_key": result['interviewee']
                    }
                return response
            else:
                print(f"Failure on query: {sql}")
                return self.getBadResponse(f"unkown user id '{user_id}'")
        except Exception as e:
            print(f"Error while getting the results for '{user_id}': {e}")
            return self.getBadResponse()
        finally:
            mysql["conn"].close()
            
    def __getConnAndCursor(self):
        conn = getConnection(self.credentials)
        cursor = conn.cursor(dictionary=True)
        return {
            "conn": conn,
            "cursor": cursor
        }
        
    def getBadResponse(self, msg="Server error, sorry for the inconvenience"):
        return {
            "response":"bad",
            "msg":msg
        }
    
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
                    
                interviewer_directory = self.getUserFolder(interview['created_by'])
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
    
    def createInterview(self, name, tests, user_id):
        """
        Spected reasponse format:
        {
            interview_key: "the primary key of the interview",
            interviewee_key: "the primary key of the interviewee",
            tests:[test_content_1,test_content_2...test_content_n]
        }
        """
        if type(tests).__name__ == 'list':
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
                    mysql['cursor'].execute(f"INSERT INTO `interviews`(id, created_by, applyed_to) VALUES ('{interview_uuid}','{user_id}','{interviewee_key}');")
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
            print(f'parameter \'test\' must be of type \'list\' but instead got \'{type(test).__name__}\'')
            return self.getBadResponse()
            
    def createInterviewee(self, name, user_id):
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

    