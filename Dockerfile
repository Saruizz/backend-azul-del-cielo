# Stage 1: Build NestJS application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json prisma.config.ts* ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build && npx tsc prisma/seed.ts --skipLibCheck --target ES2022 --module CommonJS --moduleResolution node --esModuleInterop true

# Stage 2: Production image
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json prisma.config.ts* ./

COPY --from=build /app/prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY --from=build /app/dist ./dist
RUN mkdir -p uploads && chmod -R 777 uploads
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && (node dist/main 2>/dev/null || node dist/src/main)"]
