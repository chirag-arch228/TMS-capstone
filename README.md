🚚 Transportation Management System (TMS)

Backend Transportation Management System built using Node.js, Express.js, PostgreSQL, MongoDB, Docker, and GitHub Actions.



✨ Features



👨‍✈️ Drivers Management

➕ Create Driver

📋 View Drivers

✏️ Update Driver

🗑️ Delete Driver



🚛 Vehicle Management

➕ Create Vehicle

📋 View Vehicles

✏️ Update Vehicle

🗑️ Delete Vehicle



🛣️ Trip Management

➕ Create Trips

👨‍✈️ Assign Drivers

🚛 Assign Vehicles

⏱️ Track Start Time

🏁 Track End Time



🛠️ Technology Stack

🟢 Node.js

⚡ Express.js

🐘 PostgreSQL

🍃 MongoDB

🐳 Docker

🔄 GitHub Actions

🌿 Git



📁 Project Structure

src/

├── config/

├── routes/

│   ├── drivers.js

│   ├── vehicles.js

│   └── trips.js

└── index.js



🚀 Run Locally

npm install

npm start



🔗 API Endpoints



👨‍✈️ Drivers

GET    /drivers

POST   /drivers

PUT    /drivers/:id

DELETE /drivers/:id



🚛 Vehicles

GET    /vehicles

POST   /vehicles

PUT    /vehicles/:id

DELETE /vehicles/:id



🛣️ Trips

GET    /trips

POST   /trips

PUT    /trips/:id

DELETE /trips/:id



⚡ Quick Start



1️⃣ Clone Repository

git clone https://github.com/chirag-arch228/tms-capstone.git



2️⃣ Navigate to Project

cd tms-capstone



3️⃣ Install Dependencies

npm install



4️⃣ Start Application



npm start



Expected output:



INDEX FILE LOADED

TMS API running on port 3000



🧪 Test URLs

After starting the application, test the following URLs in your browser or Postman:



🏠 Home



http://localhost:3000



Expected:



{

&#x20; "project": "Transportation Management System",

&#x20; "status": "Running"

}



👨‍✈️ Drivers



http://localhost:3000/drivers



🚛 Vehicles



http://localhost:3000/vehicles



🛣️ Trips



http://localhost:3000/trips



👨‍💻 Author



Chirag.N



💻 Backend Development

