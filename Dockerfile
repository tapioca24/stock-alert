FROM node:24-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY src ./src
COPY products.yaml ./
CMD ["node", "--strip-types", "src/index.ts"]
