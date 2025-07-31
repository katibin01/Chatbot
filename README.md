<p align="center">
  <img src="https://raw.githubusercontent.com/katibin01/Chatbot/main/assets/logo.png" width="200" alt="Chatbot WhatsApp AI Logo" />
</p>

<h1 align="center">Chatbot WhatsApp AI</h1>

<p align="center">
  🤖 Powerful and Secure WhatsApp Chatbot powered by <strong>Rasa AI</strong>, <strong>Node.js</strong>, and <strong>OpenWA</strong> for seamless and scalable automation.
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
- ✍️ **Simulasi Mengetik** — Memberi kesan respon manusiawi.

### 🔸 Advanced Features
- 📈 **Analytics & Monitoring** — Pelacakan performa & penggunaan bot.
- 🛡️ **Keamanan Konten** — Filter spam, blokir kata kunci, dan audit log.
- 🏥 **Health Check Endpoint** — Pemeriksaan uptime & resource.
- 🔁 **Auto Recovery & Optimization** — Stabilitas untuk penggunaan jangka panjang.

---

## 🧰 Teknologi yang Digunakan

| Teknologi | Fungsi |
|----------|--------|
| 🧠 **Rasa** | Natural Language Understanding & response AI |
| 💬 **OpenWA** | Library Node.js untuk WhatsApp Web automation |
| 🌐 **Express.js** | Web server & endpoint health check |
| 🗃️ **File-based / Redis** | Manajemen session & statistik |
| 📦 **PM2 / Docker** | Deployment dan monitoring |
| 📝 **Puppeteer / Chromium** | Engine WhatsApp Web otomatis |

---

## 📦 Instalasi

### 📋 Requirements
- Node.js v18+ (rekomendasi v20.x)
- Rasa Server (default port: `5005`)
- WhatsApp account aktif
- Google Chrome atau Chromium

### ⚙️ Setup Langkah Demi Langkah
```bash
git clone https://github.com/katibin01/Chatbot.git
cd Chatbot
npm install
cp .env.example .env
# Edit konfigurasi .env sesuai kebutuhan
