import { useRef, useEffect } from "react";

export function PeerStats ({ torrents }) {
    const peers = getPeers(torrents);

    const ipv4Peers = peers.filter(p => isIPv4(p.address));
    const ipv6Peers = peers.filter(p => isIPv6(p.address));

    ipv4Peers.sort((a,b) => parseIPv4(a.address) - parseIPv4(b.address));

    return (
        <div>
            <p>Share: {ipv6Peers.length} IPv6 / {ipv4Peers.length} IPv4</p>
            <ul>
                {
                    ipv6Peers.map(p => <li key={p.address}>[{p.address}]:{p.port} - {p.torrents.length} torrents</li>)
                }
            </ul>
            <ul>
                {
                    ipv4Peers.map(p => <li key={p.address}>[{p.address}]:{p.port} - {p.torrents.length} torrents ({p.torrents.map(t => t.name).join(", ")})</li>)
                }
            </ul>
            <IPv4Map peers={ipv4Peers} />
        </div>
    );
}

function IPv4Map ({ peers }) {
    /** @type {import("react").MutableRefObject<HTMLCanvasElement>} */
    const ref = useRef();

    const width = 1024;
    const height = 1024;

    useEffect(() => {
        if (ref.current) {

            const pixelWidth = width * devicePixelRatio;
            const pixelHeight = height * devicePixelRatio;

            const ctx = ref.current.getContext("2d");

            ctx.globalAlpha = 0.5;

            ref.current.width = pixelWidth;
            ref.current.height = pixelHeight;

            for (const peer of peers) {
                const octets = peer.address.split(".").map(s => parseInt(s, 10));

                let [x, y, w, h] = ipv4Block2Area(octets.slice(0,1), pixelWidth, pixelHeight);

                ctx.fillStyle = "#FCC";
                ctx.fillRect(x, y, w, h);

                [x, y, w, h] = ipv4Block2Area(octets.slice(0,2), pixelWidth, pixelHeight);

                ctx.fillStyle = "#C88";
                ctx.fillRect(x, y, w, h);
            }

            markReserved(ctx, [0], pixelWidth, pixelHeight);
            markReserved(ctx, [10], pixelWidth, pixelHeight);
            for (let i = 64; i < 128; i++) {
                markReserved(ctx, [100,i], pixelWidth, pixelHeight);
            }
            markReserved(ctx, [127], pixelWidth, pixelHeight);
            markReserved(ctx, [169,254], pixelWidth, pixelHeight);
            for (let i = 16; i < 32; i++) {
                markReserved(ctx, [172,i], pixelWidth, pixelHeight);
            }
            markReserved(ctx, [192,168], pixelWidth, pixelHeight);
            markReserved(ctx, [198,18], pixelWidth, pixelHeight);
            markReserved(ctx, [198,19], pixelWidth, pixelHeight);
            for (let i = 224; i < 256; i++) {
                markReserved(ctx, [i], pixelWidth, pixelHeight);
            }
        }
    }, [peers, width, height]);

    return <canvas ref={ref} style={{width, height}}/>;
}

/**
 * Mark a /8 octet as reserved
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} octet
 * @param {number} dX
 * @param {number} dY
 */
function markReserved (ctx, octets, width, height) {
    const [x, y, w, h] = ipv4Block2Area(octets, width, height);

    ctx.strokeStyle = "#F00";
    ctx.lineWidth = devicePixelRatio;

    ctx.beginPath();

    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y);

    ctx.stroke();
}

function ipv4Block2Area (octets, width, height) {
    let x = 0;
    let y = 0;

    let dX = width;
    let dY = height;

    for (let ii = 0; ii < octets.length; ii++) {
        dX /= 16;
        dY /= 16;

        const i = octets[ii] % 16;
        const j = (octets[ii] / 16) | 0;

        x += i * dX;
        y += j * dY;
    }

    return [x, y, dX, dY];
}

function getPeers(torrents) {
    const map = new Map();

    for (const torrent of torrents) {
        for (const peer of torrent.peers) {
            const key = `[${peer.address}]:${peer.port}`;

            if (map.has(key)) {
                const p = map.get(key);
                p.torrents.push(torrent);
            } else {
                peer.torrents = [torrent];
                map.set(key, peer);
            }
        }
    }

    return [...map.values()];
}

function getPeersSimple (torrents) {
    return [].concat(...torrents.map(t => t.peers));
}

/**
 *
 * @param {string} address
 */
function isIPv4 (address) {
    return address.indexOf(":") === -1;
}

/**
 *
 * @param {string} address
 */
function isIPv6 (address) {
    return address.indexOf(":") !== -1;
}

function parseIPv4 (address) {
    const octets = address.split(".").map(s => parseInt(s, 10));

    return (octets[0] * Math.pow(2,24)) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
}