// Fixture stand-in: the app itself is not the point of demo-shop.
require("http").createServer((_, res) => res.end("demo-shop")).listen(process.env.PORT || 3000);
