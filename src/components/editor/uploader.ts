import { uploadMediaAsset } from '@/lib/api-client';
import { resolveBackendUrl } from '@/lib/utils';

export const editorImageUploader = {
  async uploadByFile(file: File) {
    try {
      const mediaResult = await uploadMediaAsset(file);
      // Media result contains .url (e.g. /uploads/123-photo.jpg)
      const relativeUrl = mediaResult.url || mediaResult.data?.url;
      const fullUrl = resolveBackendUrl(relativeUrl);

      return {
        success: 1,
        file: {
          url: fullUrl,
          title: mediaResult.originalName || file.name,
        },
      };
    } catch (error: any) {
      console.error('EditorJS file upload failed:', error);
      return {
        success: 0,
        message: error.message || 'Image upload failed',
      };
    }
  },

  async uploadByUrl(url: string) {
    return {
      success: 1,
      file: {
        url: resolveBackendUrl(url),
      },
    };
  },
};
