// Small, dependency-free ZIP writer (stored entries, UTF-8 filenames).
// A single download avoids browser restrictions on multiple file downloads.
window.nameplateZip = async function(files) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  const parts = [], central = []; let offset = 0, centralSize = 0;
  for (const file of files) {
    const data = new Uint8Array(await file.blob.arrayBuffer()), name = new TextEncoder().encode(file.name);
    let crc = 0xffffffff;
    for (const byte of data) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
    crc = (crc ^ 0xffffffff) >>> 0;
    const local = new Uint8Array(30), l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true);
    l.setUint16(12, 33, true); l.setUint32(14, crc, true); l.setUint32(18, data.length, true);
    l.setUint32(22, data.length, true); l.setUint16(26, name.length, true);
    parts.push(local, name, data);
    const header = new Uint8Array(46), c = new DataView(header.buffer);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
    c.setUint16(8, 0x800, true); c.setUint16(14, 33, true); c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true); central.push(header, name);
    offset += local.length + name.length + data.length; centralSize += header.length + name.length;
  }
  const end = new Uint8Array(22), e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
  e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], {type: 'application/zip'});
};
