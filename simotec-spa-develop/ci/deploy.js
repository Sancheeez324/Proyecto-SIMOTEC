import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: "us-east-1",
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;
const distPath = "dist";

async function clearBucket() {
  const { Contents: bucketFiles } = await s3
    .listObjectsV2({ Bucket: bucketName })
    .promise();

  if (bucketFiles.length === 0) {
    console.log("El bucket ya está vacío.");
    return;
  }

  const chunks = [];
  for (let i = 0; i < bucketFiles.length; i += 1000) {
    chunks.push(bucketFiles.slice(i, i + 1000));
  }

  for (const chunk of chunks) {
    const deleteParams = {
      Bucket: bucketName,
      Delete: { Objects: [] },
    };

    chunk.forEach(({ Key }) => {
      if (!Key.startsWith("site-media/")) {
        deleteParams.Delete.Objects.push({ Key });
      }
    });

    if (deleteParams.Delete.Objects.length > 0) {
      try {
        await s3.deleteObjects(deleteParams).promise();
        console.log("Contenido del bucket limpiado exitosamente.");
      } catch (err) {
        console.error("Error al eliminar el contenido del bucket:", err);
      }
    }
  }
}

async function uploadToS3(directoryPath) {
  await clearBucket();
  const files = fs.readdirSync(directoryPath);

  for (const item of files) {
    const itemPath = path.join(directoryPath, item);
    const key = path.relative(distPath, itemPath).replace(/\\/g, "/");

    if (fs.statSync(itemPath).isDirectory()) {
      await uploadToS3(itemPath);
    } else {
      const params = {
        Bucket: bucketName,
        Key: key,
        Body: fs.readFileSync(itemPath),
        ContentType: getContentType(itemPath),
      };

      try {
        await s3.upload(params).promise();
      } catch (err) {
        console.error("Error al subir el archivo a S3:", err);
      }
    }
  }
}

function getContentType(filePath) {
  const extname = path.extname(filePath).toLowerCase();
  switch (extname) {
    case ".html":
      return "text/html";
    case ".css":
      return "text/css";
    case ".js":
      return "application/javascript";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

async function main() {
  const totalFiles = fs.readdirSync(distPath, { recursive: true }).length;
  try {
    await uploadToS3(distPath);
    console.log(`Subida de ${totalFiles} archivos completada. ✅`);
  } catch (err) {
    console.error("Error al subir archivos a S3:", err);
  }
}

main();
