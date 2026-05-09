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

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build-user /app/target/*.jar user-service.jar
COPY --from=build-task /app/target/*.jar task-service.jar

RUN apk add --no-cache nginx curl

COPY frontend/index.html /usr/share/nginx/html/
COPY frontend/style.css /usr/share/nginx/html/
COPY frontend/script.js /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

RUN cat > /app/start.sh << 'STARTEOF'
#!/bin/sh
set -e

# Force IPv4 to avoid Alpine Linux IPv6 issues
JAVA_OPTS="-Djava.net.preferIPv4Stack=true"

wait_for_port() {
  local port=$1
  local name=$2
  local max=90
  local count=0
  echo "Waiting for $name on port $port..."
  while ! curl -s -o /dev/null http://127.0.0.1:${port}/ 2>/dev/null; do
    count=$((count + 1))
    if [ $count -ge $max ]; then
      echo "Timeout waiting for $name after ${max}s" >&2
      break
    fi
    sleep 1
  done
  echo "$name is ready."
}

PORT=8081 java $JAVA_OPTS -jar /app/user-service.jar &
wait_for_port 8081 "user-service"

PORT=8082 java $JAVA_OPTS -jar /app/task-service.jar &
wait_for_port 8082 "task-service"

echo "All services started. Starting nginx..."
exec nginx -g "daemon off;"
STARTEOF
RUN chmod +x /app/start.sh

EXPOSE 80 8081 8082

CMD ["/app/start.sh"]
