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

# Install nginx and curl (for health checks)
RUN apk add --no-cache nginx curl

COPY frontend/index.html /usr/share/nginx/html/
COPY frontend/style.css /usr/share/nginx/html/
COPY frontend/script.js /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

# Create startup script — uses TCP-level health checks (no -f flag so any HTTP response = success)
RUN cat > /app/start.sh << 'STARTEOF'
#!/bin/sh
set -e

wait_for_port() {
  local port=$1
  local name=$2
  local max=90
  local count=0
  echo "Waiting for $name on port $port..."
  while ! curl -s -o /dev/null http://localhost:${port}/ 2>/dev/null; do
    count=$((count + 1))
    if [ $count -ge $max ]; then
      echo "Timeout waiting for $name after ${max}s" >&2
      break
    fi
    sleep 1
  done
  echo "$name is ready (port $port responding)."
}

# Start user-service on port 8081
SERVER_PORT=8081 java -jar /app/user-service.jar &
wait_for_port 8081 "user-service"

# Start task-service on port 8082
SERVER_PORT=8082 java -jar /app/task-service.jar &
wait_for_port 8082 "task-service"

# Start api-gateway on port 8080
SERVER_PORT=8080 java -jar /app/api-gateway.jar &
wait_for_port 8080 "api-gateway"

echo "All services started. Starting nginx on port 80..."
exec nginx -g "daemon off;"
STARTEOF
RUN chmod +x /app/start.sh

# Entrypoint: optional API_BASE injection then launch
RUN cat > /app/entrypoint.sh << 'ENTRYEOF'
#!/bin/sh
if [ -n "$API_BASE" ]; then
  sed -i "s|\${API_BASE}|$API_BASE|g" /usr/share/nginx/html/index.html
fi
exec /app/start.sh
ENTRYEOF
RUN chmod +x /app/entrypoint.sh

EXPOSE 80 8080 8081 8082

CMD ["/app/entrypoint.sh"]
