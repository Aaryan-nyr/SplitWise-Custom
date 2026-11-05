FROM node:22-bookworm-slim
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
WORKDIR /app

COPY ./start-app.sh package*.json ./
RUN npm ci

COPY . .

RUN DATABASE_URL=${DATABASE_URL} npx prisma generate \
    && DATABASE_URL=${DATABASE_URL} npm run build

EXPOSE 3000

CMD ["bash", "./start-app.sh"]
