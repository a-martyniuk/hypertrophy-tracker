import { useProfileContext } from '../context/ProfileContext';

/**
 * Hook to access the global User Profile context.
 * Now wraps useProfileContext to maintain backward compatibility.
 */
export const useProfile = () => {
    return useProfileContext();
};
