# 🏥 DocSpot - Doctor Appointment Booking System

A full-stack healthcare appointment management platform developed using the MERN Stack (MongoDB, Express.js, React.js, and Node.js). Built as part of the **APSCHE & SmartBridge Full Stack Development Internship Program**.

---

## 📌 Project Overview

DocSpot simplifies the process of booking doctor appointments and managing healthcare services through a modern web application.

The platform allows:
- **Patients**: To search doctors, book appointments, and view booking history.
- **Doctors**: To manage schedules, approve appointments, and set availability.
- **Admins**: To review doctor applications, manage users, and oversee system activity.

---

## 📁 Repository Structure

```
DocSpot-MERN/
├── client/           # React + TypeScript Frontend Application
│   ├── src/          # Components, Pages, Redux Store, & Services
│   └── package.json  # Frontend Dependencies
├── server/           # Node.js + Express Backend REST API
│   ├── models/       # MongoDB Schemas (User, Doctor, Appointment)
│   ├── routes/       # API Endpoints & Auth Controllers
│   └── package.json  # Backend Dependencies
├── Document/         # Internship Project Documentation & Reports
├── certificate/      # Internship Completion Certificate
├── Video_Demo.md     # Project Video Walkthrough Link
└── README.md         # Project Documentation
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js (v16+)
- MongoDB Instance (Local or MongoDB Atlas connection string)

### 1. Backend Setup (`server`)
```bash
cd server
npm install
# Create a .env file with MONGODB_URI and JWT_SECRET
npm start
```

### 2. Frontend Setup (`client`)
```bash
cd client
npm install
npm start
```

---

## ✨ Features & User Roles

### 👤 Patient
- Account Registration & JWT Login
- Search Doctors by Specialization
- Book & Cancel Appointments
- Real-time Status Notifications

### 👨‍⚕️ Doctor
- Submit Professional Doctor Application
- Set Daily Availability & Fee Structure
- View & Update Patient Appointments

### 🛡️ Admin Dashboard
- Review and Approve/Reject Doctor Applications
- Manage Registered Users and Doctor Listings

---

## 🛠️ Tech Stack

- **Frontend**: React.js, TypeScript, Redux Toolkit, Material UI, Axios
- **Backend**: Node.js, Express.js, JWT, Bcrypt.js
- **Database**: MongoDB (Mongoose ODM)

---

## 🎓 Internship & Certification

Developed during the **APSCHE & SmartBridge Full Stack Development Internship Program**.
- **Domain**: Full Stack Development (MERN)
- **Duration**: 2 Months (Completed July 2025)
- **Certificate**: Available under [`/certificate`](./certificate/) folder.

---

## 👩‍💻 Author

**H. Swathi**  
B.Tech - Information Technology  
Aditya College of Engineering & Technology
