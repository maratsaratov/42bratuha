export const fetchWithAuth = async (
    url: string,
    options: RequestInit = {},
    onUnauthorized: () => void
): Promise<Response> => {
    const token = localStorage.getItem('authToken');
    const headers = new Headers(options.headers || {});

    if (options.method && options.method.toUpperCase() !== 'GET' && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const finalOptions: RequestInit = { ...options, headers };

    try {
        const response = await fetch(url, finalOptions);
        if (response.status === 401) {
            onUnauthorized(); 
            throw new Error('401 Unauthorized'); 
        }
        return response;
    } catch (error) {
        if (error instanceof Error && error.message === '401 Unauthorized') {
            throw error;
        }
        console.error(`Fetch error to ${url}:`, error);
        throw error;
    }
};