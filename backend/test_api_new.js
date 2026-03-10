async function testBankApi() {
  const text = '문지운/국민/93770200612785/991230-1056312';
  
  try {
    const response = await fetch('http://localhost:3000/api/extract/bank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        dbNames: ['문지운'],
        dbProfiles: []
      })
    });

    const data = await response.json();
    console.log('API Response for single person:', JSON.stringify(data, null, 2));
  } catch(e) {
    console.error('Error:', e.message);
  }
}

testBankApi();
