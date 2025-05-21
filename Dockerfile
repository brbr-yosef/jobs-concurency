FROM node:23-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build --if-present

RUN chmod +x ./scripts/*.sh

FROM node:23-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/scripts ./scripts/
COPY --from=builder /app/src ./src/
COPY --from=builder /app/node_modules ./node_modules/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

ENV NODE_ENV=production
ENV PORT=3000
ENV MAX_CONCURRENT_JOBS=5
ENV JOB_RETRY_ATTEMPTS=1

EXPOSE 3000

CMD ["node", "src/index.js"]
