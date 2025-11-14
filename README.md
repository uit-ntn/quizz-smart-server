# QuizSmart Server

This project is the backend server for the QuizzSmart application, which manages quizzes, users, and vocabulary entries.

## Features
- User management
- Vocabulary management
- Multiple choice and grammar quizzes
- RESTful API with Swagger documentation

## Setup Instructions

### Prerequisites
- **Node.js**: Ensure you have the latest version.
- **MongoDB**: Make sure MongoDB is running locally or update the connection string in the environment variables.

### Installation
1. **Clone the repository:**
   ```
   git clone <repository-url>
   ```
2. **Navigate to the project directory:**
   ```
   cd quizzsmart-server
   ```
3. **Install dependencies:**
   ```
   npm install
   ```

### Environment Variables
Create a `.env` file in the root directory and add the following:
```
MONGODB_URI=mongodb://localhost:27017/quizzsmart
PORT=8000
JWT_SECRET=
```

### Running the Server
To start the server, use:
```
npm start
```

The server will run on the port specified in the `.env` file or default to `8000`.

### Postman Collection
A Postman collection is available to test the API endpoints. Import `QuizzSmart.postman_collection.json` from the root directory.

## API Documentation
- Swagger documentation is available at `/api-docs` once the server is running.

## Usage Examples
- **User Registration:** Send a POST request to `/api/users/register` with JSON body containing `username`, `password`, and `email`.
- **Fetch Vocabulary:** GET request to `/api/vocabularies` to retrieve all vocabularies.

## Contribution
1. **Fork the repository**
2. **Create a new branch for your feature or bugfix:**
   ```
   git checkout -b feature/your-feature-name
   ```
3. **Commit your changes:**
   ```
   git commit -m "Description of changes"
   ```
4. **Push to the branch:**
   ```
   git push origin feature/<your-feature-name>
   ```
5. **Open a Pull Request**

Feel free to open issues and submit pull requests!
