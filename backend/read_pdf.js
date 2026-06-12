const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const dirPath = path.join(__dirname, '../docs/algoritma/laporan');

async function readPdfs() {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.pdf'));
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer, { max: 1 }); // only parse first page
            console.log(`\n--- FILE: ${file} ---`);
            // Print first 500 characters of the first page to get the title
            console.log(data.text.trim().substring(0, 500).replace(/\n/g, ' '));
        } catch (e) {
            console.log(`\n--- FILE: ${file} ---`);
            console.log("Error reading PDF:", e.message);
        }
    }
}

readPdfs();
