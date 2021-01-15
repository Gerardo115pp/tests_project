package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

const SERVER_STATE_DIRECTORY = "./new_test_checkpoints"
const LOGS_DIRECTORY = "./logs"
const OPERATIONAL_DATA = "../operational_data"

func panicIfErr(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func warnError(err error, msg string) error {
	fmt.Printf("%s: %s\n", msg, err.Error())
	return err
}

type TestData struct {
	Name       string   `json:"name"`
	Url        string   `json:"url"`
	Type       string   `json:"type"`
	Awnsers    []string `json:"answers"`
	Measures   []string
	Short_Name string
	Length     int
	File_Path  string
}

type Server struct {
	port                   int
	db_conn                *sql.DB
	logger                 *log.Logger
	logging_file           string
	generic_ok_response    []byte
	generic_error_response []byte
}

func (self *Server) init(port int) {
	var new_connection *sql.DB
	self.port = port
	new_connection, err := sql.Open("mysql", "root:da!nyblue@/interviews")
	panicIfErr(err)
	self.logger = self.setLogger()
	self.db_conn = new_connection
	self.generic_ok_response = self.createResponse("\"ok\"")
	self.generic_error_response = self.createResponse("\"error\"")
}

func (self *Server) createResponse(msg string) (response []byte) {
	response = []byte(fmt.Sprintf("{\"response\": %s}", msg))
	return
}

func (self *Server) createTest(response http.ResponseWriter, request *http.Request) {
	var err error
	var test_data string = request.FormValue("test_data")
	var new_test *TestData
	panicIfErr(json.Unmarshal([]byte(test_data), &new_test))
	panicIfErr(json.Unmarshal([]byte(request.FormValue("measures")), &(new_test.Measures)))

	new_test.Length, err = strconv.Atoi(request.FormValue("length"))
	panicIfErr(err)
	new_test.Short_Name = request.FormValue("short_name")
	self.log(fmt.Sprintf("Serving create test request for test named \"%s\" with length %d\n", new_test.Name, new_test.Length))

	new_test.File_Path = fmt.Sprintf("../tests/B1/%s.json", new_test.Short_Name)
	err = ioutil.WriteFile(new_test.File_Path, []byte(test_data), 0666)
	if err != nil {
		self.log(fmt.Sprintf("Exception ocurred while trying to create test: %s\n", err.Error()))
		response.WriteHeader(http.StatusInternalServerError)
		_, _ = response.Write(self.generic_error_response)
	}

	// inserting new test to db
	new_test.File_Path = new_test.File_Path[1:] // removing one dot to make the test path compatible with python server
	self.insertTestToOperationalData(new_test)  // add the test to Dictionary and to Locations
	err = self.insertNewTest(new_test)
	if err != nil {
		self.log(fmt.Sprintf("Exception ocurred while trying to create test: %s\n", err.Error()))
		response.WriteHeader(http.StatusInternalServerError)
		_, _ = response.Write(self.generic_error_response)
	}

	// deleting checkpoint
	var checkpoint_file string = fmt.Sprintf("./%s/%s.json", SERVER_STATE_DIRECTORY, new_test.Name)
	if self.pathExists(checkpoint_file) {
		err := os.Remove(checkpoint_file)
		if err != nil {
			_ = warnError(err, "Exception ocurred while deleting file checkpoint")
		}
	}

	response.WriteHeader(http.StatusOK)
	response.Header().Set("Content-Type", "application/json")
	_, _ = response.Write(self.generic_ok_response)
}

func (self *Server) createDirectoryIfNotExists(directory_name string) {
	_, err := os.Stat(directory_name)
	if os.IsNotExist(err) {
		panicIfErr(os.Mkdir(directory_name, 0755))
	}
}

func (self *Server) enableCors(handler func(http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("Access-Control-Allow-Origin", "*")
		handler(response, request)
	}
}

func (self *Server) getPortString() string {
	return fmt.Sprintf(":%d", self.port)
}

func (self Server) getCurrentLoggingFile() string {
	current_time := time.Now()
	return fmt.Sprintf("./%s/%d-%d-%d.log", LOGS_DIRECTORY, current_time.Year(), current_time.Month(), current_time.Day())
}

func (self *Server) insertNewTest(test_data *TestData) (err error) {
	var insertions_result sql.Result
	insertions_query, err := self.db_conn.Prepare("INSERT INTO `tests`(id, short_name, full_name, length, path) VALUES (NULL, ?, ?, ?, ?)")
	if err != nil {
		return warnError(err, "Exception while inserting new test")
	}

	insertions_result, err = insertions_query.Exec(test_data.Short_Name, test_data.Name, test_data.Length, test_data.File_Path)
	if err != nil {
		return warnError(err, "Exception while inserting new test")
	}

	new_test_id, err := insertions_result.LastInsertId()
	if err != nil {
		return warnError(err, "Exception while inserting new test")
	}

	for _, stat := range test_data.Measures {
		stat_insert_result, err := self.db_conn.Exec("INSERT INTO `stats`(id, name) VALUES (NULL, ?)", stat)

		if err != nil {
			return warnError(err, fmt.Sprintf("Exception while inserting new stat %s", stat))
		}

		fmt.Printf("Inserted stat '%s'\n", stat)
		stat_id, _ := stat_insert_result.LastInsertId()
		_, err = self.db_conn.Exec("INSERT INTO `testsstats`(stat, test) VALUES (?, ?)", stat_id, new_test_id)
		if err != nil {
			return warnError(err, fmt.Sprintf("Exception while inserting new stat %s", stat))
		}
	}

	return

}

func (self *Server) insertTestToOperationalData(test_data *TestData) {
	var test_dict_filename string = fmt.Sprintf("%s/testDictyonary.json", OPERATIONAL_DATA)
	var test_locations_filename string = fmt.Sprintf("%s/testLocations.json", OPERATIONAL_DATA)
	b_data, err := ioutil.ReadFile(test_dict_filename)
	panicIfErr(err)

	var test_dict map[string]string
	var test_locations map[string]string
	panicIfErr(json.Unmarshal(b_data, &test_dict))

	b_data, err = ioutil.ReadFile(test_locations_filename)
	panicIfErr(err)

	panicIfErr(json.Unmarshal(b_data, &test_locations))

	test_dict[test_data.Name] = test_data.Short_Name
	test_locations[test_data.Short_Name] = test_data.File_Path

	b_data, err = json.Marshal(test_dict)
	panicIfErr(err)
	panicIfErr(ioutil.WriteFile(test_dict_filename, b_data, 0666))

	b_data, err = json.Marshal(test_locations)
	panicIfErr(err)
	panicIfErr(ioutil.WriteFile(test_locations_filename, b_data, 0666))
}

func (self *Server) log(msg string) {
	if self.logging_file != self.getCurrentLoggingFile() {
		self.logger = self.setLogger()
	}

	self.logger.Println(msg)
	fmt.Println(msg)
}

func (self *Server) pathExists(path_name string) bool {
	_, err := os.Stat(path_name)
	return !(os.IsNotExist(err))
}

func (self *Server) serveStateProgress(response http.ResponseWriter, request *http.Request) {
	var test_state_file string = fmt.Sprintf("%s/%s.json", SERVER_STATE_DIRECTORY, request.FormValue("test_name"))
	self.log(fmt.Sprintf("Serving state of unfinished test '%s'\n", test_state_file))
	if self.pathExists(test_state_file) {
		file_bytes, err := ioutil.ReadFile(test_state_file)
		panicIfErr(err)
		response.Header().Set("Content-Type", "application/json")
		_, _ = response.Write(file_bytes)
		return
	}
	self.log(fmt.Sprintf("No checkpoints for '%s'", test_state_file))
	response.WriteHeader(http.StatusBadRequest)
	_, _ = response.Write(self.generic_error_response)
}

func (self *Server) saveState(response http.ResponseWriter, request *http.Request) {
	var test_state string = request.FormValue("test_state")
	var test_name string = request.FormValue("test_name")
	self.log(fmt.Sprintf("Serving a save test_state request from %s for a test named %s\n", request.RemoteAddr, test_name))
	if test_state != "" {

		self.createDirectoryIfNotExists(SERVER_STATE_DIRECTORY)

		err := ioutil.WriteFile(fmt.Sprintf("%s/%s.json", SERVER_STATE_DIRECTORY, test_name), []byte(test_state), 0666)
		if err != nil {
			self.log(fmt.Sprintf("Exception occurred while saving test state: %v", err))
			response.WriteHeader(http.StatusInternalServerError)
			_, _ = response.Write(self.generic_error_response)
		}
	}
	response.Header().Set("Content-Type", "application/json")
	_, _ = response.Write(self.generic_ok_response)
}

func (self *Server) setLogger() *log.Logger {
	self.createDirectoryIfNotExists(LOGS_DIRECTORY)
	self.logging_file = self.getCurrentLoggingFile()

	logout, err := os.OpenFile(self.logging_file, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	panicIfErr(err)

	logger := log.New(logout, "[cnt server]", log.Ldate|log.Ltime|log.Lshortfile)
	return logger
}

func (self *Server) shortNameExists(response http.ResponseWriter, request *http.Request) {
	var field_value string = request.URL.Query().Get("field_value")
	var test_field string = response.Header().Get("test_field")
	var exists string = "true"
	self.log(fmt.Sprintf("Serveing test field validation request for '%s' test_field, from '%s'\n", test_field, request.RemoteAddr))
	if len(field_value) > 0 {
		var temp, query string
		query = fmt.Sprintf("SELECT short_name FROM tests WHERE `%s`=?", test_field)
		var result *sql.Row = self.db_conn.QueryRow(query, field_value)
		var err error = result.Scan(&temp)
		if err == sql.ErrNoRows {
			exists = "false"
		} else {
			panicIfErr(err)
		}
	}
	response.Header().Set("Content-Type", "application/json")
	var json_response []byte = self.createResponse(exists)
	self.log(fmt.Sprintf("Response was: %s\n", string(json_response)))
	_, _ = response.Write(json_response)
}

func (self *Server) validateTestField(handler func(http.ResponseWriter, *http.Request), test_field string) http.HandlerFunc {
	return func(response http.ResponseWriter, request *http.Request) {
		switch test_field {
		case "short_name":
			response.Header().Add("test_field", test_field)
		case "full_name":
			response.Header().Add("test_field", test_field)
		default:
			response.WriteHeader(http.StatusBadRequest)
			_, _ = response.Write(self.createResponse("\"error\""))
			return
		}
		handler(response, request)
	}
}

func (self *Server) serve() {
	http.HandleFunc("/does-shortname-exists", self.enableCors(self.validateTestField(self.shortNameExists, "short_name")))
	http.HandleFunc("/does-testname-exists", self.enableCors(self.validateTestField(self.shortNameExists, "full_name")))
	http.HandleFunc("/save-test-check-point", self.enableCors(self.saveState))
	http.HandleFunc("/load-test-check-point", self.enableCors(self.serveStateProgress))
	http.HandleFunc("/create-new-test", self.enableCors(self.createTest))

	fmt.Printf("Server lisiting on '127.0.0.1:%d'\n", self.port)

	panicIfErr(http.ListenAndServe(self.getPortString(), nil))
}

func main() {
	var server *Server = new(Server)
	server.init(5003)
	server.serve()
}
