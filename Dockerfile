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

# Install nginx for frontend
RUN apk add --no-cache nginx
COPY frontend/index.html /usr/share/nginx/html/
COPY frontend/style.css /usr/share/nginx/html/
COPY frontend/script.js /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

# Inject API_BASE at runtime using entrypoint script
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'sed -i "s|\${API_BASE}|'"'"'$API_BASE'"'"'|g" /usr/share/nginx/html/index.html' >> /app/entrypoint.sh && \
    echo 'exec /app/start.sh' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'export PORT=8081' >> /app/start.sh && \
    echo 'java -jar user-service.jar &' >> /app/start.sh && \
    echo 'sleep 30' >> /app/start.sh && \
    echo 'export PORT=8082' >> /app/start.sh && \
    echo 'java -jar task-service.jar &' >> /app/start.sh && \
    echo 'sleep 10' >> /app/start.sh && \
    echo 'export PORT=8080' >> /app/start.sh && \
    echo 'java -jar api-gateway.jar &' >> /app/start.sh && \
    echo 'sleep 15' >> /app/start.sh && \
    echo 'echo "Starting nginx on port 80..."' >> /app/start.sh && \
    echo 'nginx -g "daemon off;"' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 80 8080 8081 8082
CMD ["/app/entrypoint.sh"]
