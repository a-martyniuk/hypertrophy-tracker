import { useContext } from 'react';
import { ProfileContext } from '../context/ProfileContext';

export const useProfile = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        return {
            profile: null,
            loading: false,
            updateProfile: async () => {},
            refresh: async () => {}
        };
    }
    return context;
};

export const useProfileContext = useProfile;
