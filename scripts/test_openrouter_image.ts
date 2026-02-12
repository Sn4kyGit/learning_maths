
const OPENROUTER_API_KEY = process.env.VITE_OPENROUTER_API_KEY;

const generateImage = async () => {
    console.log('Sending request to OpenRouter...'); // Debug log
    try {
        const response = await fetch("https://openrouter.ai/api/v1/images/generations", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "black-forest-labs/flux-1-schnell",
                prompt: "comic illustration, cartoon style, funny, supermarket, for kids: A friendly cashier",
            })
        });

        console.log('Status Code:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
};

generateImage();
