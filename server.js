const express = require('express');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// API routes
app.use('/api', routes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

startServer();
