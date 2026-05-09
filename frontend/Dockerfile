FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY style.css /usr/share/nginx/html/
COPY script.js /usr/share/nginx/html/
# Inject API_BASE into index.html
RUN sed -i 's|<head>|<head><script>window.API_BASE = "${API_BASE}";</script>|' /usr/share/nginx/html/index.html
EXPOSE 80
