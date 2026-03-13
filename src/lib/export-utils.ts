import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { InspectionEnvironment } from '@/types';

/**
 * Optimizes an image (base64 or URL) for PDF inclusion using Canvas.
 */
export async function optimizeImage(src: string, quality = 0.8, maxWidth = 1200): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth * height) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = src;
    });
}

/**
 * Downloads all inspection photos as a ZIP file.
 */
export async function downloadAllPhotos(environments: InspectionEnvironment[], fileName = 'fotos-vistoria.zip') {
    const zip = new JSZip();
    const folder = zip.folder('fotos');

    let photoCount = 0;
    for (const env of environments) {
        // General Photos
        if (env.generalPhotos && env.generalPhotos.length > 0) {
            for (let i = 0; i < env.generalPhotos.length; i++) {
                try {
                    const response = await fetch(env.generalPhotos[i]);
                    const blob = await response.blob();
                    folder?.file(`${env.name}/GERAL_${i + 1}.jpg`.replace(/\s+/g, '_'), blob);
                    photoCount++;
                } catch {
                    console.error('Failed to add general photo', env.name);
                }
            }
        }

        // Item Photos
        for (const item of env.items) {
            if (item.photo) {
                try {
                    const response = await fetch(item.photo);
                    const blob = await response.blob();
                    const cleanName = `${env.name}/${item.name}-${item.status === 'not_ok' ? (item.defect || 'defeito') : 'ok'}.jpg`.replace(/\s+/g, '_');
                    folder?.file(cleanName, blob);
                    photoCount++;
                } catch {
                    console.error('Failed to add photo to zip', item.name);
                }
            }
        }
    }

    if (photoCount > 0) {
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, fileName);
        return true;
    }
    return false;
}

/**
 * Simulates uploading to Google Drive.
 */
export async function uploadToGoogleDrive(file: Blob, fileName: string) {
    // Mock logic
    console.log(`Uploading ${fileName} to Google Drive...`);
    await new Promise(r => setTimeout(r, 2000));
    return { success: true, url: 'https://drive.google.com/mock-folder/123' };
}
