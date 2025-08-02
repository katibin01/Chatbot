<p align="center">
  <img src="https://raw.githubusercontent.com/katibin01/Chatbot/main/assets/logo.png" width="400" alt="Chatbot WhatsApp AI Logo" />
</p>

<h1 align="center">Chatbot AI</h1>

<p align="center">
  🤖 Powerful and Secure WhatsApp Chatbot powered by <strong>Rasa AI</strong> and <strong>OpenWA Node.js</strong> for seamless and scalable automate.
</p>

<p align="center">
  <a href="https://github.com/katibin01/Chatbot/actions"><img alt="Build Status" src="https://img.shields.io/github/actions/workflow/status/katibin01/Chatbot/main.yml"></a>
  <a href="https://github.com/katibin01/Chatbot/issues"><img alt="Issues" src="https://img.shields.io/github/issues/katibin01/Chatbot"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/github/license/katibin01/Chatbot"></a>
  <a href="#"><img alt="Node.js" src="https://img.shields.io/badge/Node.js-18.x-green?logo=node.js"></a>
  <a href="#"><img alt="Rasa" src="https://img.shields.io/badge/Rasa-3.x-blue?logo=rasa"></a>
</p>

---

## 🚀 Fitur Unggulan

### 🔹 Core Features
- 🤖 **Integrasi Rasa AI** — Koneksi dengan server Rasa untuk respon cerdas.
- 🧠 **Manajemen Session** — Session yang konsisten dan scalable.
- ⚙️ **Auto Retry & Rate Limit** — Perlindungan dari spam dan error retry otomatis.
- ✍️ **Simulasi Mengetik** — Memberi kesan respon dengan `NLP`.

### 🔸 Advanced Features
- 📈 **Analytics & Monitoring** — Pelacakan performa & penggunaan bot.
- 🛡️ **Keamanan Konten** — Filter spam, blokir kata kunci, dan audit log.
- 🏥 **Health Check Endpoint** — Pemeriksaan uptime & resource.
- 🔁 **Auto Recovery & Optimization** — Stabilitas untuk penggunaan jangka panjang.

---

## 🧰 Teknologi yang Digunakan

| Teknologi | Fungsi |
|----------|--------|
| 🧠 **`Rasa`** | Natural Language Understanding (`NLU`) & response AI |
| 💬 **`OpenWA`** | Library Node.js untuk WhatsApp Web automation |
| 🌐 **`Express.js`** | Web server & endpoint health check |
| 🗃️ **`File-based` / `Redis`** | Manajemen session & statistik |
| 🛢️ **`Database`** | `PostgreSQL`, `Radis`, `Apache`, `MySQL` |
| 📦 **`PM2` / `Docker`** | Deployment dan monitoring |
| 📝 **`Puppeteer` / `Chromium`** | Engine WhatsApp Web otomatis |

---

## 📦 Instalasi

### 📋 Requirements
- `Node.js v18+` (rekomendasi v20.x)
- `Rasa` Server (default port: `5005`)
- `WhatsApp` account aktif
- `Google Chrome` atau `Chromium`

### ⚙️ Setup Langkah Demi Langkah
```bash
git clone https://github.com/katibin01/Chatbot.git
cd Chatbot
npm install
cp .env.example .env
```

Edit konfigurasi .env sesuai kebutuhan

---

## ▶️ Menjalankan Aplikasi

## 🤖 Menjalankan Rasa
- Buat Model Trainning:
```bash
rasa train
```

## 📱 Jalankan Chatbot WhatsApp
- Pastikan WhatsApp account aktif dan terhubung ke WhatsApp Web:
```bash
npm start
```
- Chatbot akan otomatis terhubung ke WhatsApp Web dan siap menerima pesan.

## 💬 Tes Respon dari WhatsApp
1. Jalankan `npm start`
2. Scan QR Code WhatsApp
3. Kirim pesan via WhatsApp seperti hi, halo, siapa kamu, dll
4. Bot akan menjawab dari intent dan response di `domain.yml`

---

Menjalankan Aplikasi secara manual
## 🤖 Manual Running
- Buatkan Data trainning dengan:
```bash
rasa train
```
- Pastikan Rasa API sudah aktif:
```bash
rasa run --enable-api --cors "*" --debug
```
Opsional (untuk interaktif chat via `shell`):
```bash
rasa shell
```

## 🧪 Testing Fitur
- Gunakan `rasa shell` untuk menguji fitur chatbot secara interaktif.
- Gunakan `curl` atau `Postman` untuk menguji endpoint API chatbot.

## ⚙️ Struktur Direktori
```bash
Chatbot/
├── assets/
│   └── logo.png
├── rasa/
│   ├── domain.yml
│   ├── data/
│   ├── config.yml
│   └── models/
├── src/
│   ├── routes/
│   ├── services/
│   └── utils/
├── .env
├── app.js
├── package.json
└── README.md
```

## 🚧 Troubleshooting

|             Masalah               |                       Solusi                           |
| --------------------------------- | ------------------------------------------------------ |
| QR Code tidak muncul              | Pastikan koneksi internet stabil dan tidak diblokir    |
| Tidak ada respons dari bot        | Cek apakah server Rasa sedang berjalan                 |
| Error `403` atau `CORS`           | Pastikan Rasa dijalankan dengan opsi `--cors "*"`      |
| Tidak terkoneksi ke WhatsApp      | Logout dari semua device WhatsApp Web dan coba lagi    |

## 📚 Others
Lihat dokumentasi lainnya.

- [Rasa AI](https://rasa.com/docs/rasa/)
<!-- - [WhatsApp Web API](https://developers.facebook.com/docs/whatsapp/api/) -->
- [OpenWA Node.js](https://docs.openwa.dev/)

---

## 📜 Lisensi
<p align="center">ISC License ©2025. by: katibin</p>