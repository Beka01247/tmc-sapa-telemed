build:
	@go build -o bin/tmc-sapa-telemed ./cmd/api
run: build
	@./bin/tmc-sapa-telemed
test:
	@go test -v ./...