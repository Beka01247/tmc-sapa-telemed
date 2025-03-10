package main

import (
	"fmt"
	"net/http"
	
	"github.com/Beka01247/tmc-sapa-telemed/internal/routes"
)

func main() {
	router := routes.NewRouter()
	
	port := 8080
	addr := fmt.Sprintf(":%d", port)
	fmt.Printf("Server is running on http://localhost%s\n", addr)
	err := http.ListenAndServe(addr, router)
	if err != nil {
		fmt.Println(err)
	}
}