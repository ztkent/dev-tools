FROM golang:latest
LABEL maintainer="Zachary Kent <ztkent@gmail.com>"

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main
RUN mkdir -p /app/data

EXPOSE 8088

CMD ["./main"]