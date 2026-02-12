// Utility function to get auth token from localStorage
export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('authToken');
    }
    return null;
};

// Utility function to set auth token
export const setAuthToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', token);
    }
};

// Utility function to remove auth token
export const removeAuthToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
    }
};
