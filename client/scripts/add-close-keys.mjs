import fs from 'fs';
const enFile = 'D:/ki-shikhle/client/src/messages/en.json';
const bnFile = 'D:/ki-shikhle/client/src/messages/bn.json';
const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const bn = JSON.parse(fs.readFileSync(bnFile, 'utf8'));

// The strings the new error toasts need.
en.common.close = 'Close';
bn.common.close = 'বন্ধ করুন';
en.common.dismiss = 'Dismiss';
bn.common.dismiss = 'বাতিল করুন';

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(bnFile, JSON.stringify(bn, null, 2) + '\n');
console.log('ok');
