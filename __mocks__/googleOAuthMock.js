// Mock for googleOAuth utility
export const getGoogleOAuthURL = jest.fn().mockReturnValue('https://mock-google-oauth-url.com');
export const handleGoogleOAuthCallback = jest.fn().mockResolvedValue({ success: true });
