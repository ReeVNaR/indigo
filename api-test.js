const url = 'https://cyjcprpvwlsrhmkftcoi.supabase.co/rest/v1/';
console.log('Fetching', url);
fetch(url).then(res => {
    console.log('Status:', res.status);
}).catch(err => {
    console.error('Error:', err.message);
});
