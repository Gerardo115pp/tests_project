from GeneralServerTools import getConnection, Sha1
import os, json

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
    
    def login(self, user, password, ip):
            conn = getConnection(self.credentials)
            try:
                cursor = conn.cursor(dictionary=True)
                hsh = self.__hasher.get_hash(password)
                sql = f"SELECT * FROM usuarios WHERE name='{user}';"
                cursor.execute(sql)
                user_credentials = cursor.fetchall()
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
                conn.close()