'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createCrcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}

const CRC_TABLE = createCrcTable();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc >>> 0, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const rowPixels = Buffer.alloc(width * 4);
  for (let x = 0; x < width; x++) {
    const o = x * 4;
    rowPixels[o + 0] = rgba[0];
    rowPixels[o + 1] = rgba[1];
    rowPixels[o + 2] = rgba[2];
    rowPixels[o + 3] = rgba[3];
  }

  const scanlines = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const base = y * (width * 4 + 1);
    scanlines[base] = 0; // filter type 0 (None)
    rowPixels.copy(scanlines, base + 1);
  }

  const idatData = zlib.deflateSync(scanlines);

  const png = Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idatData),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  return png;
}

function createIcoFromPng(pngBuf) {
  // ICO header
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(1, 4); // image count

  // Directory entry
  const dir = Buffer.alloc(16);
  dir[0] = 0; // width: 0 means 256
  dir[1] = 0; // height: 0 means 256
  dir[2] = 0; // color count
  dir[3] = 0; // reserved
  dir.writeUInt16LE(1, 4); // planes
  dir.writeUInt16LE(32, 6); // bit count
  dir.writeUInt32LE(pngBuf.length, 8); // bytes in resource
  dir.writeUInt32LE(6 + 16, 12); // image offset (after header + dir)

  return Buffer.concat([header, dir, pngBuf]);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function main() {
  const width = 256;
  const height = 256;
  // A pleasant blue color with full opacity
  const rgba = [0x1E, 0x88, 0xE5, 0xFF];
  const png = createPng(width, height, rgba);
  const ico = createIcoFromPng(png);

  const outDir = path.join(__dirname, '..', 'resources');
  ensureDir(outDir);
  const outPath = path.join(outDir, 'icon.ico');
  fs.writeFileSync(outPath, ico);
  console.log(`Generated ${path.relative(process.cwd(), outPath)} (${ico.length} bytes)`);
}

if (require.main === module) {
  main();
}


