FROM node:20-alpine

WORKDIR /workspace

COPY backend/package.json ./backend/package.json
COPY frontend/package.json ./frontend/package.json

WORKDIR /workspace/backend
RUN npm install

WORKDIR /workspace/frontend
RUN npm install

WORKDIR /workspace
COPY backend ./backend
COPY frontend ./frontend

WORKDIR /workspace/backend
RUN npm test

WORKDIR /workspace/frontend
RUN npm test

CMD ["sh", "-c", "cd /workspace/backend && npm test && cd /workspace/frontend && npm test"]

