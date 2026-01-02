FROM nginx:alpine

# Install Node.js for any dynamic content
RUN apk add --no-cache nodejs npm

# Copy BlackRoad OS web files
WORKDIR /usr/share/nginx/html
COPY ../../pages/blackroad-io/home.html /usr/share/nginx/html/index.html

# Configure nginx
RUN echo 'server { \
    listen 80; \
    server_name _; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
