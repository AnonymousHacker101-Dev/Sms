// api/send.js
// Vercel serverless proxy for SMS Bomber API

export default async function handler(req, res) {
    // Allow requests from any frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Get phone and count from query parameters
    const { phone, count } = req.query;

    if (!phone || !count) {
        res.status(400).json({
            status: 'error',
            message: 'Missing phone or count parameter'
        });
        return;
    }

    try {
        // Call the real SMS API from the server (no CORS issues server-side)
        const apiUrl = `https://smsbomberapi-ruby.vercel.app/api/send?phone=${phone}&count=${count}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Send the API's response back to the browser
        res.status(response.ok ? 200 : response.status).json(data);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Proxy error: ' + error.message
        });
    }
}
