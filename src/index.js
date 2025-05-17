const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { setupSwagger } = require('./config/swagger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Swagger settings
setupSwagger(app);

app.get('/', (req, res) => {
  res.json({ message: 'Job Concurrency Manager API' });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}. `);
  console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
});
