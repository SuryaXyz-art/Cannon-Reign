const WebSocket = require("ws");

function testWs(url) {
  return new Promise((resolve, reject) => {
    console.log(`\nTesting: ${url}`);
    const ws = new WebSocket(url);
    
    const timeout = setTimeout(() => {
      ws.close();
      resolve(`Timeout at ${url}`);
    }, 5000);

    ws.on("open", () => {
      clearTimeout(timeout);
      console.log(`✅ Success! Connected to ${url}`);
      ws.close();
      resolve();
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      console.error(`❌ Error connecting to ${url}: ${err.message}`);
      resolve(); // resolve so the loop continues
    });
    
    ws.on("unexpected-response", (req, res) => {
      clearTimeout(timeout);
      console.error(`❌ Unexpected response from ${url}: ${res.statusCode}`);
      resolve();
    });
  });
}

async function main() {
  const urls = [
    "wss://dream-rpc.somnia.network",
    "wss://dream-rpc.somnia.network/ws",
    "wss://rpc.testnet.somnia.network/ws",
    "wss://somnia-testnet.rpc.thirdweb.com",
    "wss://somnia.rpc.testnet.chain"
  ];

  for (const url of urls) {
    await testWs(url);
  }
}

main();
