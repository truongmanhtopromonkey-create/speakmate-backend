# SpeakMate Backend

Backend Node.js đơn giản để app iOS gọi tới, sau đó backend gọi OpenAI API.

## 1) Cài Node.js
Cài Node.js bản LTS trên Mac.

Kiểm tra:
```bash
node -v
npm -v
```

## 2) Cài dependencies
Trong thư mục này chạy:
```bash
npm install
```

## 3) Tạo file .env
Sao chép file mẫu:
```bash
cp .env.example .env
```

Mở `.env` và thay:
```env
OPENAI_API_KEY=sk-your_openai_api_key_here
PORT=3000
```

## 4) Chạy server
```bash
npm run dev
```

Nếu chạy đúng, Terminal sẽ hiện:
```text
SpeakMate backend running at http://0.0.0.0:3000
```

## 5) Test health check
Mở trình duyệt:
```text
http://127.0.0.1:3000/health
```

Hoặc dùng curl:
```bash
curl http://127.0.0.1:3000/health
```

## 6) Test endpoint chính
```bash
curl -X POST http://127.0.0.1:3000/speak/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I have went to the store yesterday",
    "topic": "Daily Talk"
  }'
```

## 7) Dùng trong iOS app

### Simulator
Dùng base URL:
```text
http://127.0.0.1:3000
```

### iPhone thật
Dùng IP Wi‑Fi của máy Mac:
```bash
ipconfig getifaddr en0
```
Ví dụ:
```text
http://192.168.1.23:3000
```

Mac và iPhone phải cùng Wi‑Fi.

## 8) Info.plist cho app iOS
Thêm các key sau:

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>

<key>NSSpeechRecognitionUsageDescription</key>
<string>This app uses speech recognition to convert your English speaking into text for AI feedback.</string>

<key>NSMicrophoneUsageDescription</key>
<string>This app uses the microphone so you can practice speaking English with AI.</string>
```

## 9) Lưu ý bảo mật
- Không nhúng OpenAI API key trực tiếp vào app iOS
- Chỉ để key trong file `.env`
- Không commit file `.env` lên Git

## 10) Cấu trúc thư mục
```text
speakmate-backend
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── server.mjs
```
