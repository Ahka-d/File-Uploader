// exports de las funciones del controlador de usuarios
const passport = require("../lib/passport.js");
const encrypt = require('../lib/encrypt.js');
const connection = require('../connection.js');
const { calculateExpirationDate } = require("../utils/expirationDate.js");
const crypto = require('crypto');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
});
const supabase = require("../storage.js");
const ErrorWrapper = require("../utils/errorWrapper.js");

// pagina de inicio
exports.home = async(req, res, next) => {
  try {
  res.render("index");
 } catch (error) {
    console.error(error);
    next(error);
   } 
}
// formulario de registro
exports.getSignUp = (req, res) => {res.render("sign-up-form",{error:null})};
// procesar formulario de registro
exports.postSignUp = async (req, res, next) => {   
 try {
  const hashedPassword = await encrypt.genPassword(req.body.password)
  const sameName = await connection.$queryRaw`SELECT * FROM "user" WHERE username = ${req.body.username}`
  const Id = crypto.randomUUID();
  if(sameName[0]){
    const err = new ErrorWrapper("Nombre de usuario usado, intente con otro", 400);
    err.validationError = true;
    throw err;
  }
  await connection.user.create({
   data: {
      id: Id,
      username:req.body.username,
      password:hashedPassword
   }
  })
   this.postLogIn(req, res, next);
 } catch (error) {
    console.error(error);
    next(error);
   }
}
// formulario de login
exports.getLogIn = (req, res) => {res.render("log-in")};
// procesar formulario de login
exports.postLogIn = passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/"
  });
// cerrar sesion
exports.getLogOut = (req, res, next) => {
  req.logout((err) => {
    try{
      if (err) {
        throw new ErrorWrapper("Error al cerrar sesión", 500);
      }
      res.redirect("/");
    } catch (error) {
    console.error(error);
    next(error);
   }
  });
}
// ver archivos del usuario
exports.getFiles = async (req,res,next) => {
  if(!req.user){
    throw new ErrorWrapper("Acceso denegado", 403);
  }
  try{
    const filesdata = await connection.$queryRaw`SELECT * FROM files WHERE "workspaceId" = ${req.params.id}`
    const shareFilesdata = await connection.$queryRaw`SELECT url FROM sharefiles WHERE "workspaceId" = ${req.params.id}`
    const shared = shareFilesdata[0] ? true : false;

  res.render("./actions/user-folder", {files:filesdata, shared:shared})
  } catch (error) {
    console.error(error);
    next(error);
   }
}
// subir archivos
exports.postFiles = [upload.array('uploaded_files', 10), async (req, res, next) => {
  const files = req.files;
  if (!files || files.length === 0) {
    throw new ErrorWrapper("No se han subido archivos.", 400);
  }

  const uploadedUrls = [];
  const bucketName = 'images';

  try {
  
    for (const file of files) {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
      const filePath = `public/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
        });

      if (error) {
        throw error;
      }
      
      const { publicUrl } = supabase.storage.from(bucketName).getPublicUrl(filePath).data;
      uploadedUrls.push(publicUrl);


      const userworkspace = await connection.$queryRaw`SELECT * FROM workspace WHERE "userId" = ${req.params.id}`
    if (!userworkspace[0]) {
      await connection.workspace.create({
        data: {
            userId: req.params.id,
          }
        })
      }
       await connection.files.create({
        data: {
            workspaceId: req.params.id,
            url: [publicUrl]
        }
      })
    }

    res.redirect(`/user-folder/${req.params.id}`);
  } catch (error) {
    console.error('Error al subir archivos:', err);
    next(error);
  }
}]
// compartir archivos
exports.postShareFiles = async (req, res, next) => {
  const bucketName = 'images';
  const sourceFolder = 'public';
  const destinationFolder = `share${req.params.id}`
  const shared = await connection.$queryRaw`SELECT * FROM sharefiles WHERE "workspaceId" = ${req.params.id}`
  if(!shared[0]){
  
  const date = calculateExpirationDate(req.body.exp)

    try {
      const { data: list, error: listError } = await supabase.storage
        .from(bucketName)
        .list(sourceFolder);
      if (listError) throw listError;
      
      if (!list || list.length === 0) {
        throw new ErrorWrapper("La carpeta está vacía. No hay nada que copiar.", 400);
      }

      const uploadedUrls = []
      for (const file of list) {
        const sourcePath = `${sourceFolder}/${file.name}`;
        const destinationPath = `${destinationFolder}/${file.name}`;

        const { data, error } = await supabase.storage
          .from(bucketName)
          .copy(sourcePath, destinationPath);

        if (error) {
          console.error(`Error al copiar el archivo ${file.name}:`, error);
        } else {
          const { publicUrl } = supabase.storage.from(bucketName).getPublicUrl(destinationPath).data
          uploadedUrls.push(publicUrl)
          
          console.log(`Archivo ${file.name} copiado con éxito.`);
        }
      }
      await connection.sharefiles.create({
            data: {
              workspaceId: req.params.id,
              expiresAt: date,
              url: uploadedUrls,
            }
          })
      
      console.log(`Carpeta "${sourceFolder}" copiada a "${destinationFolder}" con éxito.`);
      const filesdata = await connection.$queryRaw`SELECT url FROM files WHERE "workspaceId" = ${req.params.id}`
      res.render("./actions/user-folder", {files:filesdata,shared:true})
    } catch (error) {
      console.error('Error al copiar la carpeta');
      next(error);
    }
  }
}
// ver archivos compartidos
exports.getShareFiles = async (req,res,next) => {
  try{
    const filesdata = await connection.$queryRaw`SELECT url FROM sharefiles WHERE "workspaceId" = ${req.params.id}`
    if(!filesdata[0]){
      throw new ErrorWrapper("No hay archivos compartidos para este usuario.", 404);
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const originalUrl = req.originalUrl;
    const fullUrl = `${protocol}://${host}${originalUrl}`;

    res.render("./actions/shared-folder", {files:filesdata, url:fullUrl})
  } catch (error) {
    console.error(error);
    next(error);
   }
}