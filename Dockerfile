# build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm install -g pnpm && pnpm install && pnpm build:prod

# final stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start"]
