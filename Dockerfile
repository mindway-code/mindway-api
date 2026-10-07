# syntax=docker/dockerfile:1.7

FROM node:20.19.4-slim AS base
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

FROM base AS deps
RUN npm ci

FROM deps AS dev
ENV APP_ENV=dev
ENV NODE_ENV=development
COPY . .
EXPOSE 3333
CMD ["sh", "-c", "npm run db:generate && npm run dev"]

FROM deps AS test
ENV APP_ENV=dev
ENV NODE_ENV=test
COPY . .
RUN npm run db:generate
RUN npm run lint
RUN npm run lint:test
RUN npm test
RUN npm run build

FROM deps AS build
ENV APP_ENV=prod
ENV NODE_ENV=production
COPY . .
RUN npm run build

FROM base AS prod
WORKDIR /app
ENV APP_ENV=prod
ENV NODE_ENV=production

RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/src/infra/database/prisma ./src/infra/database/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3333

CMD ["npm", "start"]
