.PHONY: build test clean dev prod app-up app-down app-fresh app-destroy docker-clean-all deps

# The name of the output binary
BINARY_NAME=tools

# The Go path
GOPATH=$(shell go env GOPATH)

# The build commands
GOBUILD=go build
GOTEST=go test
GOCLEAN=go clean
GOGET=go get
GOMODTIDY=go mod tidy
GOMODVENDOR=go mod vendor
GOINSTALL=go install

# Build the application
build:
	$(GOBUILD) -o $(BINARY_NAME) -v .

# Install the application to GOPATH/bin
install:
	$(GOBUILD) -o $(BINARY_NAME) -v .
	mv $(BINARY_NAME) $(GOPATH)/bin

# Run in development mode
dev:
	ENV=dev go run main.go

# Run in production mode
prod:
	go run main.go

# Run tests
test:
	$(GOTEST) -v ./...

# Clean build artifacts
clean:
	$(GOCLEAN)
	rm -f $(BINARY_NAME)

# Download dependencies
deps:
	$(GOMODTIDY)
	$(GOGET) -d ./...

all: clean deps test build

.PHONY: app-up
app-up:
	docker compose -p tools --profile tools up

.PHONY: app-down
app-down:
	docker compose -p tools --profile tools down

.PHONY: app-fresh
app-fresh:
	docker compose -p tools --profile tools down
	docker compose -p tools --profile tools build --no-cache
	docker compose -p tools --profile tools up

.PHONY: app-destroy
app-destroy:
	@echo "🧹 Stopping and removing all tools containers..."
	docker compose -p tools --profile tools down --volumes --remove-orphans || true
	@echo "🗑️  Removing tools images..."
	docker images --filter=reference="tools*" -q | xargs -r docker rmi -f || true
	@echo "🧽 Cleaning up dangling images..."
	docker image prune -f || true
