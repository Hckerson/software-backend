FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN pnpm run build

EXPOSE 5000

CMD ["pnpm", "run", "start:prod"]
