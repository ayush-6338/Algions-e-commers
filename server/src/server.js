import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from '../../database/connection.js';

const port = Number(process.env.PORT || 4000);
connectDatabase().then(() => app.listen(port, () => console.log(`SkyKart API listening on http://localhost:${port}`))).catch((error) => {
  console.error('Could not connect to MongoDB:', error.message);
  process.exitCode = 1;
});
