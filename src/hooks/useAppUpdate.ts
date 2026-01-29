import { useEffect, useState } from "react";

export function useAppUpdate(interval = 30000) {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState<string | null>(null);

    useEffect(() => {
        let timer: number;

        const checkVersion = async () => {
            const res = await fetch('/version.json', { cache: 'no-store' });
            const data = await res.json();

            setLatestVersion(data.version);

            const currentVersion =
                localStorage.getItem('APP_VERSION');

            if (!currentVersion) {
                localStorage.setItem('APP_VERSION', data.version);
                return;
            }

            if (data.version !== currentVersion) {
                setUpdateAvailable(true);
                clearInterval(timer);
            }
        };

        checkVersion();
        timer = window.setInterval(checkVersion, interval);

        return () => clearInterval(timer);
    }, [interval]);

    return { updateAvailable, latestVersion };
}
