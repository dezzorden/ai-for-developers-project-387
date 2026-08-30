FROM node:24-alpine AS contract
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY main.tsp tspconfig.yaml ./
RUN npm run typespec:compile

FROM node:24-alpine AS frontend-build
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm ci --prefix frontend
COPY frontend ./frontend
COPY --from=contract /app/tsp-output ./tsp-output
RUN npm --prefix frontend run build

FROM node:24-alpine AS backend-build
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/nest-cli.json backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src ./src
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "dist/main.js"]
