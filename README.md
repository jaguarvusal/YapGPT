# YapGPT - README

# CI/CD Deployment Setup  
**GitHub Actions for Cypress Tests & Render Deployment**

This repository demonstrates a CI/CD pipeline using GitHub Actions to automate testing and deployment. Cypress component tests run automatically on every Pull Request to the `develop` branch. When changes are merged from `develop` to `main`, the application is automatically deployed to https://yapgpt-kmgv.onrender.com.

---

## License  
This project is licensed under the MIT License.

---

## Table of Contents  
- [Features](#features)  
- [Installation](#installation)  
- [Technologies Used](#technologies-used)  
- [CI/CD Configuration](#cicd-configuration)  
- [License](#license)  

---

## Features  

### YapGPT Overview  
- A speech improvement web app that helps you speak better — professionally *and* unprofessionally 😏  
- Two distinct modes:  
  - **Flirt Mode**: Practice charming AI personalities  
  - **Speech Coach Mode**: Get real feedback on your filler words, pacing, and clarity  

### GitHub Actions Test Workflow  
- Triggered on Pull Requests to the `develop` branch  
- Runs Cypress component tests  
- Ensures code quality and prevents breaking changes  

### GitHub Actions Deploy Workflow  
- Triggered when `develop` is merged into `main`  
- Deploys the latest code to Render automatically  
- Uses Render Deploy Hook with a secure API key  

---

## Installation  

**Clone the repository:**  
```bash
git clone https://github.com/your-username/yapgpt.git
```

**Navigate into the project directory:**  
```bash
cd yapgpt
```

**Install dependencies:**  
```bash
npm install
```

**Set environment variables:**  
Create a `.env` file in the root directory if required by your project.

---

## Technologies Used  

- React (Frontend Framework)  
- OpenAI API (Conversation + Charm/Clarity Analysis)  
- ElevenLabs API (AI Voice Responses)  
- Web Speech API / Whisper (Voice Input)  
- GitHub Actions (CI/CD)  
- Cypress (Component Testing)  
- Render (Hosting & Deployment)  

---

## CI/CD Configuration  

### ✅ Test Workflow  
Runs Cypress component tests on **Pull Requests to the `develop` branch**.

---

### 🚀 Deploy Workflow  
Deploys to Render **when `develop` is merged into `main`**.

> Add your Render Deploy hook to GitHub repo secrets.

---

## License  
This project is licensed under the MIT License.
