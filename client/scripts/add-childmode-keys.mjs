import fs from 'fs';
const enFile = 'D:/ki-shikhle/client/src/messages/en.json';
const bnFile = 'D:/ki-shikhle/client/src/messages/bn.json';
const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const bn = JSON.parse(fs.readFileSync(bnFile, 'utf8'));

en.childMode = {
  enter: 'Open child portal',
  exit: 'Back to parent account',
  pin_placeholder: 'PIN (if set)',
  enter_failed: 'Could not enter child mode',
};
bn.childMode = {
  enter: 'শিশুর পোর্টাল খুলুন',
  exit: 'প্যারেন্ট অ্যাকাউন্টে ফিরুন',
  pin_placeholder: 'পিন (থাকলে)',
  enter_failed: 'শিশু মোডে প্রবেশ করা যায়নি',
};

en.notes = en.notes || {};
bn.notes = bn.notes || {};
en.notes.subject_name = 'Subject name';
bn.notes.subject_name = 'বিষয়ের নাম';

fs.writeFileSync(enFile, JSON.stringify(en, null, 2) + '\n');
fs.writeFileSync(bnFile, JSON.stringify(bn, null, 2) + '\n');
console.log('ok');
