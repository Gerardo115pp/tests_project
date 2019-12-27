from GeneralServerTools import getConnection, Sha1
from threading import Thread
from datetime import datetime
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
        self.credentials["database"] = "tests_interviewees"
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
        mysql = self.__getConnAndCursor()
        try:
            sql = f"SELECT id,nombre,path_to_results FROM entrevistados WHERE interviewed_by={user_id};"
            mysql["cursor"].execute(sql)
            results = mysql["cursor"].fetchall()
            response = {"interviews":{}}
            if results:
                for result in results:

                    result_content = {}
                    if os.stat(result['path_to_results']).st_size != 0:
                        with open(result['path_to_results'], 'r') as f:
                            result_content = json.load(f)
                                      
                    if not result_content:
                        self.deleteIntervieweeById(result['id'])
                        continue
                    
                    response['interviews'][result['id']] = {
                        'results':result_content,
                        'name':result['nombre']
                    }
                
                return response
            else:
                return {
                    "response":"bad",
                    "msg": f"unkown user id '{user_id}'"
                }
        except Exception as e:
            raise e
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
        print(f"Deleting {interviewee}...")
        file_name = f"./interviews/{interviewee}.json";
        if re.match(r"^[a-z\d]{40}",interviewee):
           
            if os.path.exists(file_name):
                os.remove(file_name)

            mysql = self.__getConnAndCursor()
            try:
                mysql["cursor"].execute(f'DELETE FROM entrevistados WHERE id=\'{interviewee}\'')
                mysql["conn"].commit()
                return self.ok
            except Exception as e:
                raise e
            finally:
                mysql["conn"].close()
        else:
            print("delete process failed...")
            return self.getBadResponse(f"no interviewee with id '{interviewee}' was found")  
        
    def createInterview(self, name, tests, user_id):
        if type(tests).__name__ == 'list':
            interviewee_key = self.saveTempInterviewee(name,user_id)
            print(f"requeste for tests: {tests}")
            if interviewee_key:
                
                if os.path.exists('operational_data/testLocations.json'):
                    with open('operational_data/testLocations.json', 'r') as f:
                        tests_locations = json.load(f)
                else:
                    self.deleteIntervieweeById(interviewee_key)
                    print("unable to locate 'testLocations.json'")
                    return self.getBadResponse()
                
                response = {"interviewee_key": interviewee_key,"tests":[]}
                for test in tests:
                    test_path = tests_locations[test]
                    if os.path.exists(test_path):
                        with open(test_path, 'r') as f:
                            response['tests'].append(json.load(f))
                    else:
                        print(f"unable to locate test '{test}' in path '{test_path}'")
                        continue
                return response
        else:
            print(f'parameter \'test\' must be of type \'list\' but instead got \'{type(test).__name__}\'')
            return self.getBadResponse()
            
    def saveTempInterviewee(self, name, user_id):
        mysql = self.__getConnAndCursor()
        interviewee_key = ""
        try:
            interviewee_key = self.__hasher.get_hash(name+datetime.today().strftime('%f'))
            print(f'inserting {interviewee_key}')
            file_path = f"./interviews/{interviewee_key}.json"
            with open(file_path,'w') as f:
                json.dump({},f)
            sql = f"INSERT INTO entrevistados(id,nombre,path_to_results,interviewed_by) VALUES ('{interviewee_key}','{name}','{file_path}',{user_id});"
            mysql['cursor'].execute(sql)
            mysql['conn'].commit()
        except Exception as e:
            print(f"error while creating interviewee: {e.with_traceback()}")
        finally:
            mysql['conn'].close()
            return interviewee_key
        
    def updateResults(self, interviewee_id, results):
        print(f"Updateing results for {interviewee_id}")
        mysql = self.__getConnAndCursor()
        try:
            mysql['cursor'].execute(f"SELECT was_finished FROM entrevistados WHERE id='{interviewee_id}';")
            was_finished = mysql['cursor'].fetchall()
            
            if not len(was_finished):
                print(f"Trying to update unknown interviewee '{interviewee_id}';")
                return self.getBadResponse()
            
            was_finished = was_finished[0]["was_finished"]
            
            if not int(was_finished):
                mysql["cursor"].execute(f"UPDATE entrevistados SET was_finished='1' WHERE id='{interviewee_id}';")
                mysql['conn'].commit()
        except Exception as e:
            print(e.with_traceback(True))
            return self.getBadResponse()
        finally:
            mysql['conn'].close()
            
            
        file_path = f"./interviews/{interviewee_id}.json"
        if not os.path.exists(file_path):
            print(f"missing results file '{interviewee_id}'\n it will be create...")
        with open(file_path, 'w') as f:
            json.dump(results, f)
            
        return self.ok