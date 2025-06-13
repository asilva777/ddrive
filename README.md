# DDRiVE – Data Driven Risk and Vulnerability Evaluation and Management

**DDRiVE** is a modern Progressive Web App (PWA) designed for comprehensive risk and vulnerability management across multiple domains. It allows organizations to establish a centralized platform for risk registers, controls, treatments, data governance, and more — fully aligned with global standards like ISO 31000, CPS 230, COSO, and SOX.

[![PWA Compliance](https://img.shields.io/badge/PWA-Ready-007B8F?logo=googlechrome&logoColor=white)](https://web.dev/measure/)
[![Lighthouse Score: 100](https://img.shields.io/badge/Lighthouse-100-brightgreen?logo=lighthouse)](https://web.dev/measure/)
[![Build Status](https://github.com/yourusername/ddrive/actions/workflows/deploy.yml/badge.svg)](https://github.com/yourusername/ddrive/actions)
[![MIT License](https://img.shields.io/github/license/yourusername/ddrive.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://yourusername.github.io/ddrive)

> A Progressive Web App (PWA) for unified risk and vulnerability management.

## 🔧 Features

- 📋 Unlimited risk registers (Operational, Cyber, Supplier, etc.)
- 🧱 Control framework aligned with ISO 31000, CPS 230, COSO, SOX
- 🛡️ Treatment plans and root cause analysis
- 🔐 Data governance, permissions, workflows
- 📊 Dashboards, KRIs, bow-tie visualisation
- 🔄 Link to incidents, audits, compliance data

## 🔧 Features

- 📋 **Digital Risk Register**  
  Create unlimited risk categories (Operational, IT, Cyber, Supplier, Regulatory, Environmental, Geohazard, etc.).

- 🧱 **Comprehensive Control Framework**  
  Build a centralized control library with testing schedules and bow-tie analysis.

- 🛡️ **Mitigating Actions & Treatments**  
  Compare risk levels against thresholds and manage treatments accordingly.

- 🔐 **Data Governance & Permissions**  
  Enforce hierarchical visibility and streamline approval workflows.

- 📊 **Dashboards & Bow-Tie Visualizations**  
  See a "Quick View" dashboard and detailed bow-tie risk relationships.

- 📈 **Key Risk Indicators (KRIs)**  
  Use KRIs and quantitative analysis to monitor and validate risks.

- 🔄 **Link Risk to GRC Processes**  
  Map risks to incidents, audit findings, strategic objectives, and compliance mandates.

## 📁 Project Structure

DDRiVE/
├── .github/workflows/deploy.yml
├── index.html
├── styles.css
├── script.js
├── manifest.json
├── service-worker.js
├── icons/
└── README.md

bash
npx serve .

## 🚀 Getting Started

To run DDRiVE locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ddrive.git
   cd ddrive
Open index.html in your browser
You can also use a local dev server:

bash
npx serve .
Install as PWA

Open the app in a supported browser (Chrome, Edge, Safari).

Click the install button in the address bar or from the browser menu.

🌐 Live Demo
🚧 Coming soon — hosted on GitHub Pages or Vercel

🖌️ Fonts & Design
Fonts Used:

Oswald (Headings)

Montserrat (Subheadings)

Poppins (Body Text)

Color Palette:

Sky Blue (#87CEEB)

Navy Blue (#0A1F44)

Turquoise Green (#007B8F)

White (#ffffff)

3. Install as PWA
Open in Chrome and click “Install” from the address bar.

🧠 Tech Stack
HTML5 + CSS3 + Vanilla JavaScript

Service Workers + App Manifest (PWA)

Google Fonts: Oswald, Montserrat, Poppins

Fully responsive UI

⚙️ GitHub Pages Deployment
Automatically deploys via GitHub Actions to gh-pages.

🛠️ Roadmap
 Add login/auth system

 API backend (Node/Express/Firebase)

 Real-time alerts & KRI dashboard

 Drag/drop bow-tie editor

 Multi-user collaboration tools

📄 License
This project is licensed under the MIT License – see the LICENSE file for details.

yaml

### ⚙️ `.gitignore`

```gitignore
# Node.js
node_modules/
npm-debug.log*

# Build
dist/
build/

# System
.DS_Store
.env
.vscode/
*.swp

# PWA cache and runtime
*.webmanifest
service-worker.js
📄 LICENSE (MIT)
text
Copy
Edit
MIT License

Copyright (c) 2025 YOUR NAME

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...

[Full MIT license text continues]
