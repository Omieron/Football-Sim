FROM golang:1.25-alpine AS builder

WORKDIR /src
RUN apk add --no-cache ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/main.go

FROM alpine:3.21

RUN apk add --no-cache ca-certificates
WORKDIR /app

COPY --from=builder /server /app/server

EXPOSE 8080
CMD ["/app/server"]
