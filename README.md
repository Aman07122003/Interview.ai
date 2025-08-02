# Smart Interview Prep App

## 📚 Project Description

**Smart Interview Prep App** is a **full-stack application designed to aid fresh graduates and prospective engineers in preparing for technical interviews**.  
The platform lets users:

✅ Signup or login safely with their credentials.  
✅ Select interview questions by topic (DSA, OOP, DBMS, etc.).  
✅ Provide their answers either by typing or by voice (with Whisper’s Speech-to-Text).  
✅ Receive automated, in-depth feedback powered by GPT-4 — scoring their answers and offering actionable suggestions for improvement.  
✅ View their progress through a rich, data-informed dashboard — track scores over time, identify weak areas, and celebrate strong points.

The application aims to empower users to become more **confident, prepared, and adaptable** for their technical interviews.

---

## 🔹Features

- **User Authentication (JWT) with Signup/Login**  
- **Question Bank by Topic (DSA, OOP, DBMS)**  
- **Voice Input with Whisper API** (optional)   
- **Automated Evaluation with GPT-4**   
- **Personalized Improvement Suggestions**   
- **Progress Dashboard with Charts (Recharts/Chart.js)**   
- **Full-Stack Application (React + Node + Express + MongoDB)**   
- **Scalable, Deployment-Ready architecture**    

---

## 🔹Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node + Express
- **AI**: GPT-4 API + Whisper
- **Database**: MongoDB (Atlas)
- **Auth**: JWT (JSON Web Token)

---

## 🔹API Endpoints (Brief)

✅ **POST** `/api/auth/Register` — Signup  
✅ **POST** `/api/auth/Login` — Login  
✅ **GET** `/api/questions` — Retrieve questions by topic or pagination  
✅ **POST** `/api/interview/feedback` — Submit answer for GPT-4 evaluation  
✅ **GET** `/api/interview/attempts/{userId}` — View previous attempts  
✅ **GET** `/api/analytics/{userId}` — View performance statistics

---

## 🔹Application Flow

1. **User Signup/Login**  
2. **Select Question or Topic**  
3. **Provide Answer (by Typing or Voice)**  
4. **Submit Answer for GPT-4 Evaluation**  
5. **View Score and Improvement Comments**  
6. **Analyze Overall Performance in Dashboard**  
7. **Repeat until Prepared!**  

---

## 🔹Installation

```bash
git clone <repo-name>
cd smart-interview-app
```

---

## 🔹Running the Application

### Frontend:

```bash
cd client
npm install
npm run dev
```

### Backend:

```bash
cd server
npm install
npm start
```

---

## 🔹Environment

Create a `.env` file in your root directory:

```txt
PORT=5000
DB_URI=<your-mongodb-atlas-connection-string>
JWT_SECRET=<your-jwt-secret>
GPT_API_KEY=<your-gpt-4_key>
WHISPER_API_KEY=<your-whisper_key>
```

---

## 🔹Contributing

Contributions are welcome! Please create a **Pull Request** or **open an Issue** with your suggestions or bug reports.

---

## 🔹License

This project is licensed under the **MIT License**.

---


