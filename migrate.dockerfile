FROM node:20-alpine

WORKDIR /app

# install pnpm
RUN npm install -g pnpm

# copy only what's needed for cache
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "drizzle:migrate"]
