# Chat App — Client (React + Vite)

This is the **frontend** of the real-time chat application built using **React, Vite, Socket.io-client, TailwindCSS**, and **WebRTC** for audio/video calling.

The client supports real-time messaging, pagination, message search, typing indicators, and optional advanced features.

---

## 🚀 Features (Client)

### **Core Features**
- Real-time messaging  
- Show recent messages when opening a chat  
- Smooth scrollbar + upward pagination  
- Seen/Delivered indicators  
- Responsive UI  
- Sidebar channel list  
- Clean WhatsApp-like interface  

---

## ⭐ Optional Features (Implemented)
> These are **additional advanced features** implemented beyond basic requirements.

- **Private channels UI**  
- **Typing indicators**  
- **Message editing**  
- **Message deletion**  
- **Message search**  
- **Voice call (WebRTC)**  
- **Video call (WebRTC)**  

---

## 🛠️ Tech Stack
- React.js  
- Vite  
- TailwindCSS  
- Socket.io-client  
- WebRTC API  
- Lucide icons  

---

## 📦 Setup & Installation

### Navigate to client folder
cd client

### Install dependencies
npm install

### Start the client
npm run dev

client/
│── public/
│── src/
│   │── components/
│   │── context/
│   │── api/
│   │── pages/
│   │── styles/
│   └── App.jsx
│
└── README.md

## 📌 Assumptions & Limitations

- Pagination loads messages only when scrolling upward  
- WebRTC voice/video calls are limited to 1-to-1 communication  
- Smooth scrolling depends on browser support and message load timing  
- Emoji picker is optional and not included by default  
- Image/file sharing is not enabled unless implemented separately  

