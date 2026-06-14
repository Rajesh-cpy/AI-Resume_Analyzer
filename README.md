# ✦ ResumeATS | AI-Powered Resume Analyzer

A full-stack, production-ready MERN application that leverages Google's Gemini AI to analyze resumes (PDFs) against target job descriptions. Get instant ATS compatibility scores, pinpoint missing keywords, and receive AI-driven suggestions to optimize bullet points.

## ✨ Features
- **PDF Parsing:** Extracts text seamlessly from uploaded resume PDFs.
- **Dynamic Job Matching:** Paste any job description to get a tailored ATS analysis.
- **AI-Powered Insights:** Uses Gemini 2.5 Flash to generate actionable insights, identify missing/extra skills, and rewrite weak bullet points.
- **Secure Authentication:** JWT-based authentication with `bcryptjs` password hashing.
- **Premium UI/UX:** Sleek, dark-mode interface with glassmorphism, smooth animations, and responsive design.

## 🛠️ Tech Stack
- **Frontend:** React.js, Vite, React Router, CSS3 (Custom Glassmorphism Design)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **AI Integration:** Google Generative AI (`@google/generative-ai`)
- **Utilities:** `multer` (file uploads), `pdf-parse` (text extraction), `jsonwebtoken` & `bcryptjs` (auth)

## 🚀 Local Development Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas)
- Google Gemini API Key

### 2. Install Dependencies
Open your terminal and run the following commands:
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Environment Variables
Create a `.env` file in the `server` directory and add the following:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Run the Application
Start both the client and the server.

**Backend:**
```bash
cd server
npm start
```

**Frontend:**
```bash
cd client
npm run dev
```
The frontend will be available at `http://localhost:5173/`.

## ☁️ Deployment (Render)

This application is configured for easy deployment on [Render](https://render.com/).
1. **Web Service (Backend):** Point the Root Directory to `server`. Set the Start Command to `npm start`. Add your environment variables.
2. **Static Site (Frontend):** Point the Root Directory to `client`. Set the Build Command to `npm install && npm run build`. Add `VITE_API_URL` to point to your live backend URL. Ensure you add a Rewrite Rule (`/*` to `/index.html`).

---
*Made with ❤️ for jobseekers worldwide.*
