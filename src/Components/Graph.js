import { useRef, useEffect } from "react";

// default: {
//     limit = 60,
//     colour = ["#8F8","#F88"],
//     horizontalGridlines = 0,
//     style = "area",
// } = {}

/**
 *
 * @param {object} param0
 */
export function Graph ({ data, options }) {
    const {
        limit = 10 * 60 * 1000,
        colour = ["#8F8","#F88"],
        horizontalGridlines = 0,
        style = "area",
    } = options;

    /** @type {React.MutableRefObject<HTMLCanvasElement>} */
    const ref = useRef();

    useEffect(() => {
        if (ref.current) {
            const ctx = ref.current.getContext("2d");
            const width = ref.current.clientWidth * devicePixelRatio;
            const height = 200 * devicePixelRatio;
            ref.current.width = width;
            ref.current.height = height;
            const xMax = Date.now();
            const xMin = xMax - limit;
            const xStep = width / limit;
            const maxVal = getMaxValue(data);
            const yScale = height / maxVal;

            ctx.clearRect(0,0,width,height);

            for (let s = 1; s < data.length; s++) {
                const dataPoints = data[s];

                const st = style instanceof Array ? style[s - 1] : style;
                const co = colour instanceof Array ? colour[s - 1] : colour;

                ctx.beginPath();
                if (st === "area" && dataPoints.length > 0) {
                    const x = data[0][0];
                    ctx.moveTo(x > xMin ? (x - xMin) * xStep : 0, height);
                }
                // else if (dataPoints.length > 0) {
                //     ctx.moveTo(0, height - dataPoints[0] * yScale)
                // }

                for (let i = 0; i < dataPoints.length; i++) {
                    const x = data[0][i];
                    if (x > xMin) {
                        ctx.lineTo((x - xMin) * xStep, height - dataPoints[i] * yScale);
                    }
                }

                if (st === "area") {
                    ctx.lineTo(width, height);
                    ctx.closePath();

                    ctx.globalAlpha = 0.5;

                    ctx.fillStyle = co;
                    ctx.fill();
                } else {

                    ctx.globalAlpha = 1;

                    ctx.lineWidth = devicePixelRatio;

                    ctx.strokeStyle = co;
                    ctx.stroke();
                }
            }

            if (horizontalGridlines > 0) {
                ctx.beginPath();

                for (let y = 0; y <= maxVal; y += horizontalGridlines) {
                    ctx.moveTo(0, height - (y * yScale));
                    ctx.lineTo(width, height - (y * yScale));
                }

                ctx.strokeStyle = "#999";
                ctx.stroke();
            }
        }
    }, [data, limit, colour, horizontalGridlines, style]);

    return (
        <canvas ref={ref} />
    );
}

function getMaxValue(dataSeries) {
    return Math.max(...dataSeries.slice(1).map(series => Math.max(...series)));
}
