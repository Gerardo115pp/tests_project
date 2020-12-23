from mysql.connector import connect as mysql
import os, json

class Sha1:

    def __init__(self):
        self.h1 = 0x67452301
        self.h2 = 0xEFCDAB89
        self.h3 = 0x98BADCFE
        self.h4 = 0x10325476
        self.h5 = 0xC3D2E1F0

        self.bytes = ""


    def __setDefaultValues(self):
        self.h1 = 0x67452301
        self.h2 = 0xEFCDAB89
        self.h3 = 0x98BADCFE
        self.h4 = 0x10325476
        self.h5 = 0xC3D2E1F0

        self.bytes = ""

    def get_hash(self,data):
        if self.bytes:
            self.__setDefaultValues()
        return self.__Hash(data)

    def __Hash(self,data):

        for h in range(len(data)):

            self.bytes += "{0:08b}".format(ord(data[h]))

        bits = self.bytes + "1"

        pbits = bits

        while len(pbits) % 512 != 448:

            pbits += "0"

        pbits += "{0:064b}".format(len(bits)-1)

        for h in self.pedazo(pbits, 512):

            words = self.pedazo(h, 32)

            w = [0]*80

            for n in range(0, 16):

                w[n] = int(words[n], 2)

            for k in range(16, 80):

                w[k] = self.mover((w[k-3] ^ w[k-8] ^ w[k-14] ^ w[k-16]), 1)

            a = self.h1

            b = self.h2

            c = self.h3

            d = self.h4

            e = self.h5

            for k in range(0, 80):

                if 0 <= k <= 19:

                    f = (b & c) | ((~b) & d)

                    z = 0x5A827999

                elif 20 <= k <= 39:

                    f = b ^ c ^ d

                    z = 0x6ED9EBA1

                elif 40 <= k <= 59:

                    f = (b & c) | (b & d) | (c & d)

                    z = 0x8F1BBCDC

                elif 60 <= k <= 79:

                    f = b ^ c ^ d

                    z = 0xCA62C1D6

                temp = self.mover(a, 5) + f + e + z + w[k] & 0xffffffff

                e = d

                d = c

                c = self.mover(b, 30)

                b = a

                a = temp

            #input(f"e: {e}\nd: {d}\nc: {c}\nb: {b}\na: {a}\ntemp: {temp}")

            self.h1 = self.h1 + a & 0xffffffff

            self.h2 = self.h2 + b & 0xffffffff

            self.h3 = self.h3 + c & 0xffffffff

            self.h4 = self.h4 + d & 0xffffffff

            self.h5 = self.h5 + e & 0xffffffff

        return '%08x%08x%08x%08x%08x' % (self.h1, self.h2, self.h3, self.h4, self.h5)

    def pedazo(self, L, N):

        return [L[h:h+N] for h in range(0, len(L), N)]

    def mover(self, N, B):

        return ((N << B) | (N >> (32 - B))) & 0xffffffff

def getConnection(credentials):
    if "database" not in credentials:
        return mysql(
            host=credentials["host"],
            user=credentials["user"],
            password=credentials["password"]
        )
    else:
        return mysql(
            host=credentials["host"],
            user=credentials["user"],
            password=credentials["password"],
            database=credentials["database"]
        )
    
def getCredentials(db=None):
    with open('mysql/mysql_credential.json', 'r') as f:
        credentials = json.load(f)
    if db:
        credentials['database'] = db
    return credentials
        
def insertTestsFromJson(td_path='operational_data/testDictyonary.json', tl_path='operational_data/testLocations.json'):
    if os.path.exists(td_path) and os.path.exists(tl_path):
        with open(td_path, 'r') as f:
            td = json.load(f)
        with open(tl_path, 'r') as f:
            tl = json.load(f)

        conn = getConnection(getCredentials('interviews'))
        cursor = conn.cursor()
        try:
            for test in td.keys():
                
                test_path = tl[td[test]]
                if os.path.exists(test_path):
                    with open(test_path, 'r') as f:
                        tmp = json.load(f)
                else:
                    print(f"Missing '{test_path}'...")
                    continue
                
                length = len(tmp['questions']) if 'questions' in tmp.keys() else len(tmp[list(tmp.keys())[0]]['questions'])

                sql = f"INSERT INTO tests(id,short_name,full_name,length,path) VALUES (NULL, '{td[test]}', '{test}', {length}, '{test_path}');"
                print(f"executing: {sql}")
                cursor.execute(sql)
                conn.commit()
        except Exception as e:
            raise e
        
        finally:
            conn.close()

def insertStatsMeasuerd(insert=False):
    """
        this method must be executed from the Server directory
    """
    response = {}
    conn = getConnection(getCredentials('interviews'))
    cursor = conn.cursor(dictionary=True)
    for directory in os.scandir('./tests'):
        for test_file in os.scandir(f"./tests/{directory.name}"):
            with open(f"./tests/{directory.name}/{test_file.name}", 'r') as f:
                test_data = json.load(f)
            is_regular = 'questions' in test_data.keys()
            test_name = test_data['name'] if is_regular else list(test_data.keys())[0]
            test_questions = test_data['questions'] if is_regular else test_data[test_name]['questions']
            stats = set([test_questions[q_num]["mide"] for q_num in test_questions.keys()])
            response[test_name] = list(stats)
            
            if insert:
                for stat in stats:
                    cursor.execute(f"INSERT INTO stats(id, name) VALUES (NULL,'{stat}');")
                    conn.commit()
                    cursor.execute(f"INSERT INTO testsstats(test, stat) SELECT id AS test, {cursor.lastrowid} AS stat FROM tests WHERE full_name='{test_name}';")
                    conn.commit()
    conn.close()                    
    return response
            
def getTestLocations():
    test_locations_path = 'operational_data/testLocations.json'
    if os.path.exists(test_locations_path):
        with open(test_locations_path, 'r') as f:
            return json.load(f)
    return None
        




if __name__ == "__main__":
    print(insertStatsMeasuerd())