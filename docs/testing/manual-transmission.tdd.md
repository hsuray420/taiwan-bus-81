# 手排駕駛 TDD 驗證紀錄

## 使用者旅程

玩家可以踩離合器、升降檔、回空檔與倒車；檔位會影響驅動方向與引擎轉速，拖檔時會熄火。玩家也可以播放自己提供的原始行車錄音作為參考。

## RED

新增 `tests/manual-transmission.test.mjs` 後，先執行：

```text
node --test tests/manual-transmission.test.mjs
```

測試因 `js/manual-transmission.mjs` 尚未存在而失敗，確認測試確實指向新的手排邏輯。

## GREEN

加入 `js/manual-transmission.mjs`、車內檔桿／離合器踏板動畫、遊戲物理與音效整合後，執行：

```text
node --test tests/*.test.mjs
node --check js/game.js
node --check js/audio.js
node --check js/bus.js
```

結果：11 個測試全部通過，三個瀏覽器腳本語法檢查通過。

瀏覽器驗證確認：

- HUD 顯示檔位、離合器狀態與 RPM。
- `Shift+R` 可以掛入 1 檔；放開離合器且未給油時會提示拖檔熄火。
- `V` 播放 `assets/audio/user-video-reference.mp3`，按鈕狀態變成「播放中」。
- 本機瀏覽器錯誤紀錄為空。
