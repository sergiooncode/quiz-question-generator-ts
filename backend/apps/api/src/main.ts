import 'dotenv/config';
import { app } from './app';
import { prisma } from '../../../libs/db/src';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

async function shutdown() {
  console.log('Shutting down...');
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
