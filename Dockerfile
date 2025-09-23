# Use Node.js 18+ (Vite needs modern Node)
FROM node:20.17.0

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY . ./

RUN yarn install

RUN yarn prepare
# Install dependencies
RUN npm run build

# Copy everything else
COPY . .

# Install Vite globally (optional, but helpful for CLI)
# RUN npm install -g vite

# Expose Vite default dev port
EXPOSE 5173

# Start dev server
# --host 0.0.0.0 is CRITICAL — allows access from outside container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]