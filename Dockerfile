# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm run db:generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the generated Prisma client from builder stage
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production

# Run the application
CMD ["npm", "start"]
