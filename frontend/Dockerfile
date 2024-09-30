# Use Nginx version 1.15.2 alpine as the base image
FROM nginx:1.15.2-alpine

# Copy the React build output to the Nginx web directory
COPY ./build /var/www

# Copy your custom Nginx configuration
COPY deployment/nginx.conf /etc/nginx/nginx.conf

# Expose port 82
EXPOSE 82

# Start Nginx in the foreground (necessary for Docker to run the container)
ENTRYPOINT ["nginx", "-g", "daemon off;"]
