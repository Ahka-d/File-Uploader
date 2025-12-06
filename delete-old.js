const cron = require('node-cron');
const { PrismaClient } = require("./generated/prisma/client");

const prisma = new PrismaClient();

const deleteSupabaseOldPosts = async () => {
  const sharefiles = await prisma.sharefiles.findMany({
  where: {
    expiresAt: {
      lte: new Date(),
    },
  },
  select: {
    workspaceId: true,
  },
});
  if(!sharefiles[0]){
    console.log('No hay archivos para eliminar en este momento.');
  }else{
    sharefiles.forEach(async (file) => {
      const bucket = 'images';
      const pathPrefix = `share${file.workspaceId}`;
      try {
        if (!bucket || !pathPrefix) {
          return new Response(JSON.stringify({ error: 'Faltan parámetros: bucket y pathPrefix' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400
          });
        }

        // Lista los archivos dentro del prefijo (la "carpeta")
        const { data: listData, error: listError } = await supabase.storage
          .from(bucket)
          .list(pathPrefix);

        if (listError) {
          console.error('Error al listar archivos:', listError.message);
          return new Response(JSON.stringify({ error: listError.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
          });
        }

        if (listData.length === 0) {
          console.log(`No se encontraron archivos en el prefijo '${pathPrefix}' del bucket '${bucket}'.`);
          return new Response(JSON.stringify({ message: 'No hay archivos para borrar.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200
          });
        }

        const filesToDelete = listData.map((file) => `${pathPrefix}/${file.name}`);

        // Elimina los archivos encontrados
        const { data: deleteData, error: deleteError } = await supabase.storage
          .from(bucket)
          .remove(filesToDelete);

        if (deleteError) {
          console.error('Error al eliminar archivos:', deleteError.message);
          return new Response(JSON.stringify({ error: deleteError.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500
          });
        }

        console.log(`Se eliminaron ${filesToDelete.length} archivos del prefijo '${pathPrefix}' en el bucket '${bucket}'.`);
        return new Response(JSON.stringify({ data: deleteData }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (err) {
        console.error('Error general:', err);
        return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 500
        });
      }
    })
  }
}

exports.startCronJobs = async () => {

  cron.schedule('0 * * * *', async () => {
    const now = new Date();
    console.log(`Ejecutando tarea de eliminación de posts a las: ${now.toISOString()}`);
    deleteSupabaseOldPosts();
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
  deleteSupabaseOldPosts();
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
