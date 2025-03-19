# JobAI

JobAI is a comprehensive web application designed to assist users in optimizing their job search process. It leverages AI-powered tools to enhance resumes, generate tailored cover letters, and track job applications efficiently.

## Features

- **AI Resume Optimization**: Get instant feedback and suggestions to improve your resume using advanced AI algorithms.
- **Smart Cover Letters**: Generate customized cover letters that align with job descriptions.
- **Application Tracking**: Keep track of all your job applications in one centralized location.
- **User Authentication**: Secure login and signup with support for Google OAuth.
- **Responsive Design**: Fully responsive UI built with Next.js and Tailwind CSS.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: NextAuth.js with JWT strategy
- **AI Integration**: OpenAI API for resume and cover letter enhancements
- **Deployment**: Vercel for frontend, render for backend

## Installation

### Prerequisites

- Node.js and npm installed
- MongoDB instance running

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://git@github.com:BalasimJasim/JobAi.git
   cd jobai
   ```

2. **Install dependencies**:
   ```bash
   # For client
   cd client
   npm install

   # For server
   cd ../server
   npm install
   ```

3. **Environment Variables**:
   - Create a `.env` file in the `server` directory and a `.env.local` file in the `client` directory.
   - Add the necessary environment variables as specified in the `.env.example` files.

4. **Run the application**:
   ```bash
   # Start the server
   cd server
   npm run dev

   # Start the client
   cd ../client
   npm run dev
   ```

5. **Access the application**:
   - Open your browser and navigate to `http://localhost:3000`.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. 