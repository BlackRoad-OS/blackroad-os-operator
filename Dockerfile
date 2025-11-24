FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY operator.env.example ./operator.env.example
EXPOSE 4000
CMD ["node", "dist/index.js"]
