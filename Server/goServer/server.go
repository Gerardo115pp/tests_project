package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

const SERVER_STATE_DIRECTORY = "./new_test_checkpoints"

func panicIfErr(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

type Server struct {
	port                   int
	db_conn                *sql.DB
	generic_ok_response    []byte
	generic_error_response []byte
}

func (self *Server) init(port int) {
	var new_connection *sql.DB
	self.port = port
	new_connection, err := sql.Open("mysql", "root:da!nyblue@/interviews")
	panicIfErr(err)
	self.db_conn = new_connection
	self.generic_ok_response = self.createResponse("\"ok\"")
	self.generic_error_response = self.createResponse("\"error\"")
}

func (self *Server) createResponse(msg string) (response []byte) {
	response = []byte(fmt.Sprintf("{\"response\": %s}", msg))
	return
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

func (self *Server) pathExists(path_name string) bool {
	_, err := os.Stat(path_name)
	return !(os.IsNotExist(err))

}

func (self *Server) getPortString() string {
	return fmt.Sprintf(":%d", self.port)
}

func (self *Server) serveStateProgress(response http.ResponseWriter, request *http.Request) {
	var test_state_file string = fmt.Sprintf("%s/%s.json", SERVER_STATE_DIRECTORY, request.FormValue("test_name"))
	fmt.Printf("Serving state of unfinished test '%s'\n", test_state_file)
	if self.pathExists(test_state_file) {
		file_bytes, err := ioutil.ReadFile(test_state_file)
		panicIfErr(err)
		response.Header().Set("Content-Type", "application/json")
		_, _ = response.Write(file_bytes)
		return
	}
	fmt.Println("Error: test file doesnt exists")
	response.WriteHeader(http.StatusBadRequest)
	_, _ = response.Write(self.generic_error_response)
}

func (self *Server) saveState(response http.ResponseWriter, request *http.Request) {
	var test_state string = request.FormValue("test_state")
	var test_name string = request.FormValue("test_name")
	fmt.Printf("Serving a save test_state request from %s for a test named %s\n", request.RemoteAddr, test_name)
	if test_state != "" {

		self.createDirectoryIfNotExists(SERVER_STATE_DIRECTORY)

		err := ioutil.WriteFile(fmt.Sprintf("%s/%s.json", SERVER_STATE_DIRECTORY, test_name), []byte(test_state), 0666)
		if err != nil {
			fmt.Printf("Exception occurred while saving test state: %v", err)
			response.WriteHeader(http.StatusInternalServerError)
			_, _ = response.Write(self.generic_error_response)
		}
	}
	response.Header().Set("Content-Type", "application/json")
	_, _ = response.Write(self.generic_ok_response)
}

func (self *Server) shortNameExists(response http.ResponseWriter, request *http.Request) {
	var field_value string = request.URL.Query().Get("field_value")
	var test_field string = response.Header().Get("test_field")
	var exists string = "true"
	fmt.Printf("Serveing test field validation request for '%s' test_field, from '%s'\n", test_field, request.RemoteAddr)
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
	fmt.Printf("Response was: %s\n", string(json_response))
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

	fmt.Printf("Server lisiting on '127.0.0.1:%d'\n", self.port)

	panicIfErr(http.ListenAndServe(self.getPortString(), nil))
}

func main() {
	var server *Server = new(Server)
	server.init(5003)
	server.serve()
}
