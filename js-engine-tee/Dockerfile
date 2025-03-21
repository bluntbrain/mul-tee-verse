FROM --platform=linux/amd64 node:18-alpine

# Create app directory
WORKDIR /app

# Install build dependencies and Rust
RUN apk add --no-cache xxd curl build-base openssl-dev

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install dcap-qvl-cli
RUN cargo install dcap-qvl-cli

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 8888

# Command to run the application
CMD ["node", "dist/main.js"]