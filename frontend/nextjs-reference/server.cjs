const { createServer } = require("node:http");
const next = require("next");

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || "0.0.0.0";
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((request, response) => handle(request, response)).listen(port, hostname, () => {
    console.log(`UrbanHelpHub web app listening on ${hostname}:${port}`);
  });
});
