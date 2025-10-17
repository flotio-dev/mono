# API

This folder contains the OpenAPI specification and a minimal skeleton to generate server or client code.

Files:
- `openapi.yaml` - the OpenAPI spec (replace with the actual spec exported from Postman; the linked spec requires a Postman login).
- `go.mod` - Go module for the generated server code.
- `cmd/main.go` - minimal main to run a generated server stub.

Notes about the Postman-hosted spec:

The URL you provided points to a Postman workspace that requires authentication (401). I couldn't fetch the spec automatically because it requires a Postman account with access. Please export the OpenAPI spec from Postman and drop it here as `openapi.yaml`.

Generating code:

Using oapi-codegen (Go):

1. Install oapi-codegen:

   go install github.com/deepmap/oapi-codegen/cmd/oapi-codegen@latest

2. Generate server and types:

   oapi-codegen -generate types,chi-server -package api -o pkg/api/gen.go openapi.yaml

Using OpenAPI Generator (CLI):

1. Install openapi-generator-cli and run generator:

   openapi-generator-cli generate -i openapi.yaml -g go-server -o gen-server

Replace `openapi.yaml` with the real spec and follow the generated server's README.
