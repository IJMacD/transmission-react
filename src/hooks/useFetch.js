import { useState, useEffect } from 'react';

/**
 * @param {string} url
 * @returns {[ any, boolean, Error|null ]}
 */
export function useFetch (url) {
    const [ data, setData ] = useState(/** @type {any?} */(null));
    const [ loading, setLoading ] = useState(true);
    const [ error, setError ] = useState(/** @type {Error?} */(null));

    useEffect(() => {
        let current = true;
        setLoading(true);

        fetch(url)
            .then(r => {
                if (current) {
                    if (r.headers.get("Content-Type") === "application/json") {
                        return r.json().then(data => {
                            if (current) {
                                setData(data);
                            }
                        });
                    } else {
                        return r.text().then(data => {
                            if (current) {
                                setData(data);
                            }
                        });
                    }
                }
            })
            .catch(e => {
                if (current) {
                    setError(e);
                }
            })
            .finally(() => {
                if (current) {
                    setLoading(false);
                }
            });

        return () => { current = false; }
    }, [url]);

    return [ data, loading, error ];
}