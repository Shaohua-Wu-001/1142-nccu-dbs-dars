FROM node:20-alpine

WORKDIR /app

# 複製 package.json 並安裝環境
COPY package*.json ./
RUN npm ci --omit=dev

# 複製程式碼與資料夾 (現在 data 在 backend 內)
COPY src ./src
COPY data ./data

EXPOSE 3001

# 啟動流程：1.資料庫遷移 2.匯入 Excel 規則 3.建立 Demo 帳號 4.啟動服務
CMD ["sh", "-c", "node src/scripts/migrate.js && node src/scripts/seedFromExcel.js && node src/scripts/seedDemoUser.js && node src/server.js"]
