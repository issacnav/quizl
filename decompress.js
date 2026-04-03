const fs = require('fs');
const zlib = require('zlib');

const inputPath = 'c:\\Users\\naval\\Downloads\\db_cluster-15-12-2025@04-53-39.backup (1).gz';
const outputPath = 'c:\\Users\\naval\\Downloads\\db_cluster_dump.sql';

const readStream = fs.createReadStream(inputPath);
const writeStream = fs.createWriteStream(outputPath);
const gunzip = zlib.createGunzip();

readStream.pipe(gunzip).pipe(writeStream);

writeStream.on('finish', () => {
  console.log('Decompression complete.');
});
