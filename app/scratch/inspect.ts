import * as xlsx from 'xlsx';

function run() {
  const wb = xlsx.readFile('../Inventaire CE 2026.xlsx');
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // read as array of arrays
  
  console.log('--- HEADERS (Row 1) ---');
  console.log(data[0]);
  console.log('\n--- FIRST 3 ROWS ---');
  for (let i = 1; i <= 3; i++) {
      console.log(data[i]);
  }
}
run();
