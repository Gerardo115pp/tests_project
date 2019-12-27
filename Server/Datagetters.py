from GeneralServerTools import getConnection, Sha1
from threading import Thread
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
        
    def getBadResponse(self, msg=""):
        return {
            "response":"bad",
            "msg":msg
        }
    
    def deleteIntervieweeById(self, interviewee):
        print(f"Deleting {interviewee}...")
        file_name = f"./interviews/{interviewee}.json";
        if os.path.exists(file_name) and re.match(r"^[a-z\d]{40}",interviewee):
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
           