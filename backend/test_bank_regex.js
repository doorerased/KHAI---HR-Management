const text = "농협은행 123-12-123456 800101-1234567 홍길동 (기타 소득)";
const rrnRegex = /(?:^|[^\d])(\d{6})[\s\-\/\.\_]*(\d{7})(?=[^\d]|$)/g;
let matches = [];
let match;
while ((match = rrnRegex.exec(text)) !== null) {
  console.log("Matched:", match[0], "lastIndex:", rrnRegex.lastIndex);
  const actualRaw = match[0].match(/(\d{6})[\s\-\/\.\_]*(\d{7})/)[0];
  console.log("actualRaw:", actualRaw);
}
console.log("Done");
