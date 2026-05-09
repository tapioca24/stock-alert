FROM mcr.microsoft.com/playwright:v1.59.1-noble
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY src ./src
COPY products.yaml ./
CMD ["node", "--strip-types", "src/index.ts"]
