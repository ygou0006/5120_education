# Prospect – Career Exploration Platform

## Overview
Prospect is a full-stack web application designed to help Australian secondary school students explore career pathways based on their subject choices and interests.

The system integrates real-world datasets to provide personalised career recommendations, employment trends, and salary insights.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Flask + SQLAlchemy
- Database: MySQL
- Data Source: Australian Bureau of Statistics (ABS)

## Features
- Career recommendation based on subjects and interests
- User authentication (login/register)
- Career comparison and detailed insights
- Personal dashboard and favourites
- Admin management system

## Project Structure
- backend/ → Flask API and database logic
- frontend/ → React user interface
- backend/data/ → Data import scripts and datasets

## How to Run

### Backend
cd backend  
pip install -r requirements.txt  
python run.py  

### Frontend
cd frontend  
npm install  
npm run dev  

## Notes
This project follows a staged Git workflow to simulate real-world software development practices, including backend setup, API implementation, data pipeline integration, frontend development, and deployment.