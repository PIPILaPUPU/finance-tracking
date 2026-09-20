# Single multi-stage Dockerfile for the whole Finance Tracker stack.
# Build targets: auth | account | category | transaction | migrate | web

# ---------- Go services ----------
FROM golang:1.27-alpine AS backend-builder
WORKDIR /src
RUN apk add --no-cache git ca-certificates
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/auth-app ./auth-app/cmd/app \
 && CGO_ENABLED=0 GOOS=linux go build -o /out/account-app ./account-app/cmd/app \
 && CGO_ENABLED=0 GOOS=linux go build -o /out/category-app ./category-app/cmd/app \
 && CGO_ENABLED=0 GOOS=linux go build -o /out/transaction-app ./transaction-app/cmd/app

FROM alpine:3.20 AS auth
RUN apk add --no-cache ca-certificates
COPY --from=backend-builder /out/auth-app /usr/local/bin/app
COPY backend/config.yaml /config/config.yaml
EXPOSE 8080
CMD ["app", "-config", "/config/config.yaml"]

FROM alpine:3.20 AS account
RUN apk add --no-cache ca-certificates
COPY --from=backend-builder /out/account-app /usr/local/bin/app
COPY backend/config.yaml /config/config.yaml
EXPOSE 8081
CMD ["app", "-config", "/config/config.yaml"]

FROM alpine:3.20 AS category
RUN apk add --no-cache ca-certificates
COPY --from=backend-builder /out/category-app /usr/local/bin/app
COPY backend/config.yaml /config/config.yaml
EXPOSE 8083
CMD ["app", "-config", "/config/config.yaml"]

FROM alpine:3.20 AS transaction
RUN apk add --no-cache ca-certificates
COPY --from=backend-builder /out/transaction-app /usr/local/bin/app
COPY backend/config.yaml /config/config.yaml
EXPOSE 8082
CMD ["app", "-config", "/config/config.yaml"]

FROM golang:1.27-alpine AS migrate
WORKDIR /migrate
ENV PATH="/go/bin:${PATH}"
RUN apk add --no-cache git ca-certificates \
 && go install github.com/pressly/goose/v3/cmd/goose@latest
COPY migtarions /migrations
COPY deploy/migrate.sh /migrate.sh
RUN chmod +x /migrate.sh
ENTRYPOINT ["/migrate.sh"]

# ---------- Frontend + nginx gateway ----------
FROM node:22-alpine AS frontend-builder
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine AS web
COPY --from=frontend-builder /src/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
