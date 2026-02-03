# Use Node.js 18+ (Vite needs modern Node)
FROM node:20.17.0

# Set working directory
WORKDIR /app

# Copying everything for now (this could be optimized to only copy relavent files)
COPY . ./

RUN yarn install

RUN yarn prepare
# Install dependencies
RUN npm run build

# Expose Vite default dev port
EXPOSE 5173

# Start dev server
# --host 0.0.0.0 is CRITICAL — allows access from outside container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]