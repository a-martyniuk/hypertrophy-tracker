import { supabase } from '../lib/supabaseClient';

export const useStorage = () => {
    const uploadPhoto = async (file: File, path: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('body_photos')
                .upload(path, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error('Error uploading photo:', error);
                throw error;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('body_photos')
                .getPublicUrl(data.path);

            return publicUrl;
        } catch (error: any) {
            console.error('Storage upload detailed error:', error);
            throw error;
        }
    };

    const deletePhoto = async (path: string) => {
        const { error } = await supabase.storage
            .from('body_photos')
            .remove([path]);

        if (error) {
            console.error('Error deleting photo:', error);
            return false;
        }
        return true;
    };

    return {
        uploadPhoto,
        deletePhoto
    };
};
