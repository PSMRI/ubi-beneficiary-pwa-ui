import * as pdfjsLib from 'pdfjs-dist';

// Use local worker file from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface PDFConversionOptions {
    scale?: number;
    quality?: number;
    format?: 'jpeg' | 'png';
}

export const convertPDFToImage = async (
    file: File,
    options: PDFConversionOptions = {}
): Promise<File> => {
    const {
        scale = 2.0, // Higher scale for better quality
        quality = 0.8,
        format = 'jpeg'
    } = options;

    try {
        console.log('Starting PDF conversion for file:', file.name);

        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer();
        console.log('File converted to array buffer, size:', arrayBuffer.byteLength);

        // Load the PDF document
        console.log('Loading PDF document...');
        const pdf = await pdfjsLib.getDocument({
            data: arrayBuffer
        }).promise;
        console.log(`PDF loaded successfully, total pages: ${pdf.numPages}`);

        // Array to store all page canvases
        const pageCanvases: HTMLCanvasElement[] = [];
        let maxWidth = 0;
        let totalHeight = 0;

        // Render all pages
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            console.log(`Rendering page ${pageNum}/${pdf.numPages}...`);
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });

            // Create canvas for this page
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
                throw new Error('Could not get canvas context');
            }

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Track dimensions for combined canvas
            maxWidth = Math.max(maxWidth, viewport.width);
            totalHeight += viewport.height;

            // Render the page
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                canvas: canvas,
            };

            await page.render(renderContext).promise;
            pageCanvases.push(canvas);
            console.log(`✓ Page ${pageNum} rendered (${viewport.width}x${viewport.height})`);
        }

        // Create combined canvas with all pages stacked vertically
        console.log(`Creating combined image: ${maxWidth}x${totalHeight}`);
        const combinedCanvas = document.createElement('canvas');
        const combinedContext = combinedCanvas.getContext('2d');

        if (!combinedContext) {
            throw new Error('Could not get combined canvas context');
        }

        combinedCanvas.width = maxWidth;
        combinedCanvas.height = totalHeight;

        // Fill with white background
        combinedContext.fillStyle = 'white';
        combinedContext.fillRect(0, 0, maxWidth, totalHeight);

        // Draw all pages onto combined canvas
        let currentY = 0;
        pageCanvases.forEach((canvas, index) => {
            combinedContext.drawImage(canvas, 0, currentY);
            console.log(`✓ Page ${index + 1} added at Y position: ${currentY}`);
            currentY += canvas.height;
        });

        console.log('✓ All pages combined into single image');

        // Convert combined canvas to blob
        return new Promise((resolve, reject) => {
            combinedCanvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('Failed to convert canvas to blob'));
                        return;
                    }

                    // Create a new File object with the converted image
                    const outputFileName = file.name.replace(/\.pdf$/i, `.${format}`);
                    const imageFile = new File(
                        [blob],
                        outputFileName,
                        {
                            type: `image/${format}`,
                            lastModified: Date.now(),
                        }
                    );

                    console.log(`✓ Conversion complete! File size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
                    resolve(imageFile);
                },
                `image/${format}`,
                quality
            );
        });
    } catch (error) {
        console.error('Error converting PDF to image:', error);
        throw new Error('Failed to convert PDF to image');
    }
};