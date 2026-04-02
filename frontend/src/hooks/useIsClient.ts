import { useState, useEffect } from 'react';

/**
 * Hook customizado para detectar se o código está rodando no cliente (browser)
 * e evitar problemas de hidratação no Next.js
 */
export function useIsClient(): boolean {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    return isClient;
}
