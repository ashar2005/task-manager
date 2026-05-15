\# Task Management System



A full-stack task management application built with React.js and Node.js.



\## Tech Stack

\- \*\*Frontend:\*\* React.js, Tailwind CSS, Axios

\- \*\*Backend:\*\* Node.js, Express.js

\- \*\*Database:\*\* MongoDB Atlas

\- \*\*Auth:\*\* JWT (JSON Web Tokens)



\## Features

\- Create, Read, Update, Delete tasks

\- Search tasks by title or description

\- Filter by status (Pending, In Progress, Completed)

\- Progress bar showing % of completed tasks

\- JWT Authentication (Register/Login)

\- Responsive UI



\## How to Run Locally



\### Backend

```bash

cd backend

npm install

npm run dev

```



\### Frontend

```bash

cd client

npm install

npm start

```





\## API Endpoints

| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | /api/tasks | Create task |

| GET | /api/tasks | Get all tasks |

| GET | /api/tasks/:id | Get single task |

| PUT | /api/tasks/:id | Update task |

| DELETE | /api/tasks/:id | Delete task |

