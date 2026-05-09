FROM maven:3.9-eclipse-temurin-17 AS build-user
WORKDIR /app
COPY user-service/pom.xml .
COPY user-service/src ./src
RUN mvn clean package -DskipTests

FROM maven:3.9-eclipse-temurin-17 AS build-task
WORKDIR /app
COPY task-service/pom.xml .
COPY task-service/src ./src
RUN mvn clean package -DskipTests

FROM maven:3.9-eclipse-temurin-17 AS build-gateway
WORKDIR /app
COPY api-gateway/pom.xml .
COPY api-gateway/src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build-user /app/target/*.jar user-service.jar
COPY --from=build-task /app/target/*.jar task-service.jar
COPY --from=build-gateway /app/target/*.jar api-gateway.jar

# Install nginx and curl (curl used for health-check waits)
RUN apk add --no-cache nginx curl

COPY frontend/index.html /usr/share/nginx/html/
COPY frontend/style.css /usr/share/nginx/html/
COPY frontend/script.js /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

# Create startup script that waits for each service before starting the next
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

wait_for() {
  local url=$1
  local name=$2
  local max=60
  local count=0
  echo "Waiting for $name at $url..."
  until curl -sf "$url" > /dev/null 2>&1; do
    count=$((count + 1))
    if [ $count -ge $max ]; then
      echo "Timeout waiting for $name" >&2
      return 1
    fi
    sleep 2
  done
  echo "$name is ready."
}

# Start user-service on port 8081
SERVER_PORT=8081 java -jar /app/user-service.jar &
wait_for "http://localhost:8081/api/auth/validate" "user-service" || true

# Start task-service on port 8082
SERVER_PORT=8082 java -jar /app/task-service.jar &
wait_for "http://localhost:8082/actuator/health" "task-service" || sleep 20

# Start api-gateway on port 8080
SERVER_PORT=8080 java -jar /app/api-gateway.jar &
sleep 10

echo "Starting nginx on port 80..."
exec nginx -g "daemon off;"
EOF
RUN chmod +x /app/start.sh

# Entrypoint: inject API_BASE at runtime then launch
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/sh
if [ -n "$API_BASE" ]; then
  sed -i "s|\${API_BASE}|$API_BASE|g" /usr/share/nginx/html/index.html
fi
exec /app/start.sh
EOF
RUN chmod +x /app/entrypoint.sh

EXPOSE 80 8080 8081 8082

CMD ["/app/entrypoint.sh"]
