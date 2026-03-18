const fs = require('fs');
const content = fs.readFileSync('c:/Users/immju/OneDrive/바탕 화면/평가 위원 관리 자동화/backend/routes/extractor.js', 'utf8');
let balance = 0;
let line = 1;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') balance++;
    if (content[i] === '}') balance--;
    if (content[i] === '\n') line++;
    if (balance < 0) {
        console.log(`Unexpected } at line ${line}`);
        process.exit(1);
    }
}
if (balance > 0) {
    console.log(`Unclosed { remaining: ${balance}`);
    process.exit(1);
}
console.log('Balance OK');
