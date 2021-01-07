import { useRef, useState, useEffect, useCallback } from "react";

export function useGraph ({
    limit = 60,
    colour = ["#8F8","#F88"],
    horizontalGridlines = 0,
    style = "area",
} = {}) {
    /** @type {React.MutableRefObject<HTMLCanvasElement>} */
    const ref = useRef();
    /** @type {[number[][], (number[][]) => void]} */
    const [ dataSeries, setDataSeries ] = useState([]);

    /**
     *
     * @param  {number[]} values
     */
    const pushData = useCallback((...values) => {

        setDataSeries(dataSeries => {
            /** @type {number[][]}] */
            const newDataSeries = [];

            for (let i = 0; i < values.length; i++) {
                const newPoints = [ values[i], ...(dataSeries[i] || []) ];
                if (newPoints.length > limit) {
                    newPoints.length = limit;
                }
                newDataSeries[i] = newPoints;
            }

            return newDataSeries
        });
    }, [setDataSeries, limit]);

    useEffect(() => {
        if (ref.current) {
            const ctx = ref.current.getContext("2d");
            const width = ref.current.clientWidth * devicePixelRatio;
            const height = 200 * devicePixelRatio;
            ref.current.width = width;
            ref.current.height = height;
            const xStep = width / limit;
            const maxVal = getMaxValue(dataSeries);
            const yScale = height / maxVal;

            ctx.clearRect(0,0,width,height);

            for (let s = 0; s < dataSeries.length; s++) {
                const dataPoints = dataSeries[s];

                const st = style instanceof Array ? style[s] : style;
                const co = colour instanceof Array ? colour[s] : colour;

                ctx.beginPath();
                if (st === "area") {
                    ctx.moveTo(0, height);
                } else if (dataPoints.length > 0) {
                    ctx.moveTo(0, height - dataPoints[0] * yScale)
                }

                for (let i = 0; i < dataPoints.length; i++) {
                    ctx.lineTo(i * xStep, height - dataPoints[i] * yScale);
                }

                if (st === "area") {
                    ctx.lineTo((dataPoints.length - 1) * xStep, height);
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
    }, [dataSeries, limit, colour, horizontalGridlines, style]);

    return [ ref, pushData ];
}

function getMaxValue(dataSeries) {
    return Math.max(...dataSeries.map(series => Math.max(...series)));
}
