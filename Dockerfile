FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/app/data/app.db
ENV JWT_SECRET=subei-cooperative-secret-key-2024

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/sql-wasm.wasm ./sql-wasm.wasm
COPY --from=builder /app/node_modules ./node_modules

ENV SQL_WASM_PATH=/app/sql-wasm.wasm

EXPOSE 3001

CMD ["node", "--import", "tsx", "api/server.ts"]
