# SolarScope

SolarScope is a responsive web application built with HTML, CSS, and JavaScript that helps users **estimate solar potential, understand feasibility, and visualize basic solar energy benefits** through a simple and interactive interface.

🔗 **Live Preview:** https://solarscope-one.vercel.app

---

## 🚀 Features

- ☀️ **Solar Potential Estimator** — Estimates solar energy output based on user input.
- 📊 **Instant Calculations** — Results update instantly in the browser.
- 💻 **Fully Responsive UI** — Works on desktop and mobile.
- 🎨 **Clean UI Design** — Focused on clarity and usability.
- ⚡ **No Backend Required** — Runs completely on the client side.

---

## 🛠️ Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript

---

## 🧠 Calculation Architecture

SolarScope follows a **simple, transparent, and modular calculation flow**:

### 1️⃣ User Input Layer
The user provides:
- Roof area / panel count (or similar capacity input)
- Average sunlight hours
- Basic efficiency assumptions

These inputs are collected via HTML form elements.

---

### 2️⃣ Processing Layer (JavaScript Logic)

Inside `app.js`:

- Input values are:
  - Validated
  - Normalized (converted to numbers, units adjusted)
- Core formula is applied:

Estimated Energy = Panel Area × Efficiency × Sunlight Hours


Or in simplified form:

Estimated Output = Capacity × Sun Hours × System Efficiency

---

### 3️⃣ Output Layer

- The calculated result is:
  - Displayed instantly on the UI
  - Shown in a user-friendly format
  - Optionally used to show:
    - Daily / Monthly / Yearly estimation
    - Basic impact metrics

---

### 4️⃣ Design Philosophy

- ⚙️ All calculations are:
  - Client-side
  - Transparent
  - Easy to modify or extend
- 🧩 Logic is kept modular so future features can include:
  - Location-based solar data
  - Cost estimation
  - CO₂ savings

---

## 🌍 Social Impact

SolarScope is not just a technical project — it is built with **real-world impact in mind**:

### 🌱 Why This Matters

- Many people want to install solar panels but:
  - Don’t understand feasibility
  - Can’t visualize benefits
  - Are confused by complex calculators

SolarScope solves this by:

- Making solar estimation:
  - Simple
  - Visual
  - Understandable to non-technical users

---

### 💡 Impact Goals

- Encourage **renewable energy adoption**
- Help users:
  - Understand their solar potential
  - Make informed decisions
- Spread awareness about:
  - Clean energy
  - Sustainability
  - Reduced carbon footprint

---

### ♻️ Bigger Vision

With further development, SolarScope can become:

- A decision-making tool for homes and institutions
- A solar awareness platform
- A planning assistant for green energy adoption

---

## 🧑‍💻 How to Run Locally

1. **Clone the repository**

```bash
git clone https://github.com/aadil2codes/SolarScope.git
Open the project folder

bash
Copy code
cd SolarScope
Run



