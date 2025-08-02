import api from './config';

export const updateProfile = async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
};

export const updateUserAvatar = async (avatarData) => {
    const response = await api.put('/user/avatar', avatarData);
    return response.data;
};