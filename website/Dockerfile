# Use an official PHP image as the base image
FROM php:8.1-apache

# Copy the application files to the container
COPY . /var/www/html/

# Set the ServerName directive to suppress the warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Expose port 5567
EXPOSE 80

# Run the apache server in the foreground
CMD ["apache2-foreground"]
