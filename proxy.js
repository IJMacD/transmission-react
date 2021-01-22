const http = require('http');
const path = require('path');

if (process.argv.length < 3) {
	console.error(`Usage: node ${path.basename(process.argv[1])} <PROXY_ROOT>`);
	process.exit();
}


const server = http.createServer((request, response) => {
    const { url, headers } = request;

    console.log(`${new Date().toISOString()}: ${request.method} ${url}`);

    if (request.method === "OPTIONS") {
        response.writeHead(204, "No Content", {
            "Access-Control-Allow-Origin": request.headers.origin,
            "Access-Control-Allow-Method": request.headers['access-control-request-method'],
            "Access-Control-Allow-Headers": request.headers['access-control-request-headers'],
            "Access-Control-Max-Age": 600,
            "Access-Control-Allow-Credentials": "true",
        });

        response.end();

        return;
    }

    const req = http.request(
        `${process.argv[2]}${url}`,
        {
            method: request.method,
            headers,
        }, (res) => {
            response.writeHead(res.statusCode, res.statusMessage, {
                ...res.headers,
                "Access-Control-Allow-Origin": request.headers.origin,
                "Access-Control-Expose-Headers": "x-transmission-session-id",
                "Access-Control-Allow-Credentials": "true",
            });

            res.pipe(response, { end: true });
        });

    request.pipe(req, { end: true });
});

const port = 8010;
server.listen(port);
console.log(`Proxying ${process.argv[2]} on ${port}`);