import { deflateRawSync, inflateRawSync } from 'node:zlib';
import assert from 'node:assert/strict';

const table = Uint32Array.from({length:256},(_,value)=>{
  for(let i=0;i<8;i++) value=(value>>>1)^((value&1)?0xedb88320:0);
  return value>>>0;
});
export function crc32(bytes) {
  let crc=0xffffffff;
  for(const byte of bytes) crc=(crc>>>8)^table[(crc^byte)&255];
  return (crc^0xffffffff)>>>0;
}
export function createZip(name, body) {
  assert.match(name,/^SUN_\d+\.html$/);
  const filename=Buffer.from(name), data=Buffer.from(body), compressed=deflateRawSync(data,{level:9});
  const crc=crc32(data), local=Buffer.alloc(30), central=Buffer.alloc(46), end=Buffer.alloc(22);
  local.writeUInt32LE(0x04034b50,0); local.writeUInt16LE(20,4); local.writeUInt16LE(8,8);
  local.writeUInt16LE(33,12); local.writeUInt32LE(crc,14); local.writeUInt32LE(compressed.length,18);
  local.writeUInt32LE(data.length,22); local.writeUInt16LE(filename.length,26);
  central.writeUInt32LE(0x02014b50,0); central.writeUInt16LE(20,4); central.writeUInt16LE(20,6);
  central.writeUInt16LE(8,10); central.writeUInt16LE(33,14); central.writeUInt32LE(crc,16);
  central.writeUInt32LE(compressed.length,20); central.writeUInt32LE(data.length,24); central.writeUInt16LE(filename.length,28);
  end.writeUInt32LE(0x06054b50,0); end.writeUInt16LE(1,8); end.writeUInt16LE(1,10);
  end.writeUInt32LE(central.length+filename.length,12); end.writeUInt32LE(local.length+filename.length+compressed.length,16);
  return Buffer.concat([local,filename,compressed,central,filename,end]);
}
export function inspectZip(zip) {
  assert.ok(Buffer.isBuffer(zip)&&zip.length>=98,'Invalid ZIP');
  const end=zip.length-22;
  assert.equal(zip.readUInt32LE(end),0x06054b50,'ZIP end record');
  assert.equal(zip.readUInt16LE(end+4),0); assert.equal(zip.readUInt16LE(end+6),0);
  assert.equal(zip.readUInt16LE(end+8),1,'ZIP must have exactly one entry');
  assert.equal(zip.readUInt16LE(end+10),1,'ZIP must have exactly one entry');
  assert.equal(zip.readUInt16LE(end+20),0);
  const central=zip.readUInt32LE(end+16), centralSize=zip.readUInt32LE(end+12);
  assert.ok(central>=30 && central+centralSize===end,'Central directory bounds');
  assert.equal(zip.readUInt32LE(central),0x02014b50);
  assert.equal(zip.readUInt32LE(central+42),0); assert.equal(zip.readUInt16LE(central+34),0);
  assert.equal(zip.readUInt32LE(0),0x04034b50);
  assert.equal(zip.readUInt16LE(6),0); assert.equal(zip.readUInt16LE(central+8),0);
  assert.equal(zip.readUInt16LE(8),8); assert.equal(zip.readUInt16LE(central+10),8);
  const length=zip.readUInt16LE(26), name=zip.subarray(30,30+length).toString('utf8');
  assert.match(name,/^SUN_\d+\.html$/,'Unsafe or unexpected entry');
  assert.equal(zip.readUInt16LE(28),0); assert.equal(zip.readUInt16LE(central+30),0); assert.equal(zip.readUInt16LE(central+32),0);
  assert.equal(zip.readUInt16LE(central+28),length); assert.equal(centralSize,46+length);
  assert.equal(zip.subarray(central+46,central+46+length).toString('utf8'),name);
  const size=zip.readUInt32LE(22), compressed=zip.readUInt32LE(18), crc=zip.readUInt32LE(14);
  assert.ok(size<=1024*1024,'Expanded HTML exceeds budget');
  assert.equal(30+length+compressed,central);
  assert.equal(zip.readUInt32LE(central+20),compressed); assert.equal(zip.readUInt32LE(central+24),size); assert.equal(zip.readUInt32LE(central+16),crc);
  const data=inflateRawSync(zip.subarray(30+length,central),{maxOutputLength:1024*1024});
  assert.equal(data.length,size); assert.equal(crc32(data),crc,'ZIP CRC mismatch');
  return {name,data,entries:1,bytes:data.length,compressedBytes:compressed,crc32:crc.toString(16).padStart(8,'0')};
}
