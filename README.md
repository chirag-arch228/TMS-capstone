\# 🚚 Transportation Management System (TMS)



A backend Transportation Management System built with Node.js, Express.js, PostgreSQL, MongoDB, Docker, and GitHub Actions.



This project demonstrates REST API development, database integration, containerization, and CI/CD practices commonly used in modern backend and cloud environments.



\---



\## ✨ Features



\### 👨‍✈️ Driver Management

\- Create Drivers

\- View Drivers

\- Update Driver Information

\- Delete Drivers



\### 🚛 Vehicle Management

\- Create Vehicles

\- View Vehicles

\- Update Vehicle Information

\- Delete Vehicles



\### 🛣️ Trip Management

\- Create Trips

\- Assign Drivers to Trips

\- Assign Vehicles to Trips

\- Track Trip Start Time

\- Track Trip End Time



\### 🗄️ Database Integration

\- PostgreSQL for relational data storage

\- MongoDB integration for logging and future analytics



\### ⚙️ DevOps Features

\- Docker Compose support

\- GitHub Actions CI/CD pipeline

\- Git version control



\---



\## 🛠️ Technology Stack



| Technology | Purpose |

|-----------|-----------|

| Node.js | Backend Runtime |

| Express.js | REST API Framework |

| PostgreSQL | Relational Database |

| MongoDB | Logging \& Analytics |

| Docker | Containerization |

| GitHub Actions | CI/CD Automation |

| Git | Version Control |



\---



\## 📁 Project Structure



```text

tms-capstone

│

├── src

│   ├── config

│   ├── routes

│   │   ├── drivers.js

│   │   ├── vehicles.js

│   │   └── trips.js

│   └── index.js

│

├── .github

│   └── workflows

│

├── package.json

├── README.md

└── .gitignore



\## ⚡ Quick Start



Get the project running locally in a few simple steps.



\### Clone the Repository



```bash

git clone https://github.com/chirag-arch228/tms-capstone.git

```



\### Navigate to the Project Directory



```bash

cd tms-capstone

```



\### Install Dependencies



```bash

npm install

```



\### Start the Application



```bash

npm start

```



\### Expected Output



```text

INDEX FILE LOADED

TMS API running on port 3000

```



\---



\## 🧪 Test URLs



After starting the application, open the following URLs in your browser or Postman.



\### 🏠 Home



```text

http://localhost:3000

```



\*\*Expected Response\*\*



```json

{

&#x20; "project": "Transportation Management System",

&#x20; "status": "Running"

}

```



\### 👨‍✈️ Drivers



```text

http://localhost:3000/drivers

```



\### 🚛 Vehicles



```text

http://localhost:3000/vehicles

```



\### 🛣️ Trips



```text

http://localhost:3000/trips

```



\---



\## 👨‍💻 Author



\*\*Chirag\*\*

&#x20; 

💻 Backend Development 



\*\*GitHub\*\*  

https://github.com/chirag-arch228



