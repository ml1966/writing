# 英文寫作練習 App

每日英文寫作練習，由 Claude AI 批改文法與提供建議。

---

## 安裝步驟（在 Windows 電腦操作）

### 第一步：安裝必要工具

1. 安裝 **Node.js**
   - 開啟瀏覽器，前往 https://nodejs.org
   - 點「LTS」版本下載，執行安裝程式，一路按「Next」即可

2. 安裝 **VS Code**（程式碼編輯器）
   - 前往 https://code.visualstudio.com
   - 下載並安裝

### 第二步：下載這個專案

1. 前往 GitHub：https://github.com/ml1966/writing
2. 點綠色「Code」按鈕 → 選「Download ZIP」
3. 解壓縮到桌面，資料夾名稱改為 `english-writing-app`

### 第三步：填入你的 API Key

1. 用 VS Code 打開資料夾
2. 打開 `App.js`
3. 找到這一行：
   ```
   const ANTHROPIC_API_KEY = "在這裡貼上你的API Key";
   ```
4. 把引號裡面的文字換成你的 API Key（格式：sk-ant-api03-...）

### 第四步：安裝套件並啟動

打開 VS Code 的終端機（Terminal → New Terminal），輸入以下指令：

```bash
npm install
npx expo start
```

執行後畫面會出現一個 **QR Code**。

### 第五步：在 iPad / iPhone 測試

1. App Store 搜尋「Expo Go」並安裝
2. 打開 Expo Go，掃描電腦畫面上的 QR Code
3. App 就會出現在你的裝置上！

---

## 使用說明

| 步驟 | 說明 |
|------|------|
| 1 | 從 4 個主題中選一個今日寫作題目 |
| 2 | 參考建議句型開始寫英文 |
| 3 | 完成後按「Save & Get Feedback」 |
| 4 | AI 批改結果會顯示文法錯誤與修正建議 |
| 5 | 按「History」可回顧所有歷史紀錄 |

---

## 費用說明

- VS Code、Node.js、Expo Go：完全免費
- Claude API：按使用量計費，每篇文章約 USD $0.01，非常便宜

---

## 遇到問題？

把錯誤訊息截圖，貼給 Claude 詢問，它會幫你解決！
