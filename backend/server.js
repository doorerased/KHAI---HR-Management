const express = require('express');
const cors = require('cors');
const extractorRouter = require('./routes/extractor_final');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 요청 로그 미들웨어
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 라우터 연결
app.use('/api/extract', extractorRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '평가 위원 관리 백엔드 서버 정상 작동 중' });
});

const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`[Backend] Server is running on http://${HOST}:${PORT}`);
});

// 전역 에러 핸들러 (Multer 에러 등 HTML 500 응답 방지용)
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  if (err) {
    res.status(500).json({ success: false, error: err.message || '서버 내부 오류가 발생했습니다.' });
  } else {
    next();
  }
});

// 강제 무응답 종료를 잡기 위한 프로세스 레벨 핸들러
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
