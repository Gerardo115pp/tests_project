package main

import (
	"database/sql"
	"fmt"
	"net/http"

	_ "github.com/go-sql-driver/mysql"
)

func panicIfErr(err error) {
	if err != nil {
		panic(err)
	}
}

type User struct {
	Id          int    `json:"id"`
	Name        string `json:"name"`
	Hsh         string `json:"hsh"`
	Data_folder string `json:"data_folder"`
}

type Server struct {
	port    int
	db_conn *sql.DB
}

func (self *Server) init(port int) {
	var new_connection *sql.DB
	self.port = port
	new_connection, err := sql.Open("mysql", "root:da!nyblue@/interviews")
	panicIfErr(err)
	self.db_conn = new_connection
}

func (self *Server) getPortString() string {
	return fmt.Sprintf(":%d", self.port)
}

func (self *Server) shortNameExists(response http.ResponseWriter, request *http.Request) {
	var requested_user *User = new(User)
	var result *sql.Row = self.db_conn.QueryRow("SELECT * FROM users")
	panicIfErr(result.Scan(&requested_user.Id, &requested_user.Name, &requested_user.Hsh, &requested_user.Data_folder))
	_, _ = response.Write([]byte(fmt.Sprintf("fokin guuuud %s:%s", requested_user.Name, requested_user.Hsh)))
}

func (self *Server) serve() {

	http.HandleFunc("/does-shortname-exists", self.shortNameExists)

	fmt.Printf("Server lisiting on '127.0.0.1:%d'\n", self.port)

	panicIfErr(http.ListenAndServe(self.getPortString(), nil))
}

func main() {
	var server *Server = new(Server)
	server.init(5003)
	server.serve()
}
