# Build stage
FROM node:22-slim AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production image
FROM node:22-slim
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["node", "dist/index.js"]
CMD ["--help"]
