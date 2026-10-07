FROM node:18-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src ./src
COPY docs/logo.jpg ./docs/logo.jpg
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend ./backend
COPY --from=frontend /app/dist ./dist

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
