export const getMeasurementsStorageKey = (userId?: string | null): string => {
    return `hypertrophy_measurements_${userId && userId !== 'guest' ? userId : 'guest'}`;
};

export const getProfileStorageKey = (userId?: string | null): string => {
    return `hypertrophy_profile_${userId && userId !== 'guest' ? userId : 'guest'}`;
};

export const getGoalsStorageKey = (userId?: string | null): string => {
    return `hypertrophy_goals_${userId && userId !== 'guest' ? userId : 'guest'}`;
};

export const getSkeletalStorageKey = (userId?: string | null): string => {
    return `skeletal_frame_${userId && userId !== 'guest' ? userId : 'guest'}`;
};

export const getSkeletalHeightKey = (userId?: string | null): string => {
    return `skeletal_height_${userId && userId !== 'guest' ? userId : 'guest'}`;
};
