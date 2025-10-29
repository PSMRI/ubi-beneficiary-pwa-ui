/**
 * Image compression utility for optimizing images before upload
 * Maintains quality suitable for OCR and document processing
 */

import imageCompression from 'browser-image-compression';

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeMB?: number;
}

/**
 * Compresses an image file while maintaining quality for OCR processing
 * @param file - The original image file
 * @param options - Compression options
 * @returns Compressed image file
 */
export const compressImage = async (
    file: File,
    options: CompressionOptions = {}
): Promise<File> => {
    const {
        maxWidth = 1920, // Good balance for OCR
        maxHeight = 1920,
        quality = 0.85, // High quality for text recognition
        maxSizeMB = 2,
    } = options;

    try {
        const compressionOptions = {
            maxSizeMB: maxSizeMB,
            maxWidthOrHeight: Math.max(maxWidth, maxHeight),
            useWebWorker: true, // Use worker thread for better performance
            initialQuality: quality,
            alwaysKeepResolution: false, // Allow resolution reduction if needed
            fileType: 'image/jpeg', // Convert to JPEG for better compression
        };

        console.log('Starting image compression:', {
            originalSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
            fileName: file.name,
        });

        const compressedFile = await imageCompression(file, compressionOptions);

        console.log('Image compression complete:', {
            originalSize: (file.size / (1024 * 1024)).toFixed(2) + 'MB',
            compressedSize: (compressedFile.size / (1024 * 1024)).toFixed(2) + 'MB',
            reduction: (((file.size - compressedFile.size) / file.size) * 100).toFixed(1) + '%',
        });

        return compressedFile;
    } catch (error) {
        console.error('Image compression failed:', error);
        // Fallback: return original file if compression fails
        return file;
    }
};

/**
 * Quick validation to check if compression is needed
 */
export const shouldCompressImage = (file: File, maxSizeMB: number = 2): boolean => {
    const sizeMB = file.size / (1024 * 1024);
    return sizeMB > maxSizeMB * 0.8; // Compress if over 80% of limit
};

/**
 * Get optimal compression settings based on file size
 */
export const getOptimalCompressionSettings = (
    fileSizeMB: number
): CompressionOptions => {
    if (fileSizeMB > 5) {
        return {
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 0.75,
            maxSizeMB: 2,
        };
    } else if (fileSizeMB > 3) {
        return {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8,
            maxSizeMB: 2,
        };
    } else {
        return {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            maxSizeMB: 2,
        };
    }
};
