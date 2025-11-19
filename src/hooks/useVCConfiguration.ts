import { useState, useEffect } from 'react';
import { ConfigService } from '../services/configService';
import { VCConfiguration } from '../types/vc.types';

export const useVCConfiguration = (
    docType?: string,
    docSubtype?: string
) => {
    const [configuration, setConfiguration] =
        useState<VCConfiguration | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (docType && docSubtype) {
            fetchConfiguration(docType, docSubtype);
        }
    }, [docType, docSubtype]);

    const fetchConfiguration = async (docType: string, docSubtype: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const config = await ConfigService.getVCConfiguration(docType, docSubtype);
            setConfiguration(config);
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to load configuration';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        configuration,
        isLoading,
        error,
        refetch: () =>
            docType && docSubtype && fetchConfiguration(docType, docSubtype),
    };
};

