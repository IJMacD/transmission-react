import { useCallback, useEffect, useState } from "react";

export function useSavedState (key, initialValue) {
    const [ state, setState ] = useState(() => {
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }

        return initialValue;
    });

    const setSavedState = useCallback(newValue => {
        if (newValue instanceof Function) {
            setState(oldValue => {
                const nv = newValue(oldValue);

                localStorage.setItem(key, JSON.stringify(nv));

                return nv;
            });
        } else {
            setState(newValue);

            localStorage.setItem(key, newValue);
        }
    }, [key, setState]);

    useEffect(() => {
        const callback = e => setState(e.newValue);

        window.addEventListener("storage", callback);

        return () => window.removeEventListener("storage", callback);
    }, []);

    return [ state, setSavedState ];
}