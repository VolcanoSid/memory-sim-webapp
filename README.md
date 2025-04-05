# 💻 Memory Allocation Techniques Simulator

This project simulates memory allocation strategies: **First-Fit, Best-Fit, and Worst-Fit** using a full stack web application.

---

## 🔧 Tech Stack

| Layer     | Tech                         |
|-----------|------------------------------|
| Frontend  | React + TypeScript + Tailwind + Chart.js |
| Backend   | FastAPI (Python)             |

---

## 🚀 How to Run

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # or source venv/bin/activate on Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
