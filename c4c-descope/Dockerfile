# Use the official Node.js image from the Docker Hub
FROM node:18.20.2

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the app source code
COPY . .

# Expose the port the app runs on
EXPOSE 2425

# Start the app
CMD ["node", "app.js"]
