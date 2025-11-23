# ☁️ Cloud Box

Simple cloud file storage on Flask. Like your personal Google Drive.

## 🚀 What it does

- 📁 **Store files** up to 20GB
- 👤 **Register/login** with proper security  
- 📧 **Email verification**
- 🔑 **REST API** for integrations
- 📱 **Responsive design** - works everywhere

## 🛠️ Tech Stack

- **Backend:** Python + Flask + SQLAlchemy
- **Frontend:** Pure JS + HTML/CSS
- **Database:** SQLite
- **Security:** bcrypt, sessions, validation

## ⚡ Quick Start

```bash
# 1. Clone
git clone https://github.com/Daniil5648/Cloud-Box.git
cd cloud-box

# 2. Virtual environment  
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 3. Dependencies
pip install -r requirements.txt

# 4. Run
python main.py

🔌 API

All requests require API key:
GET /api/{api_key}/user_info      # User info
GET /api/{api_key}/user_files      # List files
POST /api/{api_key}/upload_file     # Upload file  
POST /api/{api_key}/delete_file/{name} # Delete file

📁 Structure
cloud-box/
├── DataBases/
├── PXStorage/
├── scriptsWebLinux/
│   ├── main.py
│   ├── requirements.txt
│   └── logging.log
├── static/
│   ├── css/
│   │   ├── api-docs.css
│   │   ├── coming-soon.css
│   │   ├── log.css
│   │   ├── main.css
│   │   ├── page-not-found.css
│   │   ├── profile.css
│   │   └── reg.css
│   ├── js/
│   │   ├── api-docs.js
│   │   ├── coming-soon.js
│   │   ├── log.js
│   │   ├── main.js
│   │   ├── page-not-found.js
│   │   ├── profile.js
│   │   └── reg.js
│   └── photos/
│       ├── favicon/
│       │   ├── android-chrome-192x192.png
│       │   ├── android-chrome-512x512.png
│       │   ├── apple-touch-icon.png
│       │   ├── favicon-16x16.png
│       │   ├── favicon-32x32.png
│       │   └── favicon.ico
│       ├── API-removebg.png
│       ├── Cloud-removebg.png
│       └── LogoCloudBox-removebg.png
├── templates/
│   ├── api-docs.html
│   ├── coming-soon.html
│   ├── log.html
│   ├── main.html
│   ├── page-not-found.html
│   ├── profile.html
│   └── reg.html
├── LICENSE
└── README.md
```
## 💰 For Clients
This project shows I can:

- ✅ Full-stack development (frontend + backend)

- ✅ Database and file system work

- ✅ REST API design

- ✅ Security and authentication

- ✅ Clean maintainable code

Contact: [@wexxside](https://t.me/wexxside)
