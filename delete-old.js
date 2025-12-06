const cron = require('node-cron');
const { PrismaClient } = require("./generated/prisma/client");

const prisma = new PrismaClient();

exports.startCronJobs = async () => {

  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    console.log(`Ejecutando tarea de eliminación de posts a las: ${now.toISOString()}`);
    try {
      const { count } = await prisma.sharefiles.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      console.log(`Se eliminaron ${count} posts expirados.`);
    } catch (error) {
      console.error('Error al eliminar posts expirados:', error);
    }
  });
  console.log('Tarea de cron para posts expirados programada.');
  const now = new Date();
    try {
      const { count } = await prisma.sharefiles.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      });
      console.log(`Se eliminaron ${count} posts expirados.`);
    } catch (error) {
      console.error('Error al eliminar posts expirados:', error);
    };
    
};
