import { OAuth2Client } from 'google-auth-library';

export const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
};

export const googleClient = new OAuth2Client(
  GOOGLE_CONFIG.clientId,
  GOOGLE_CONFIG.clientSecret,
  GOOGLE_CONFIG.redirectUri
);

export const getGoogleAuthUrl = () => {
  return googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });
};

export const getGoogleUserInfo = async (code: string) => {
  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  const { data } = await googleClient.request({
    url: 'https://www.googleapis.com/oauth2/v2/userinfo'
  });

  return data as {
    id: string;
    email: string;
    name: string;
    picture: string;
    verified_email: boolean;
  };
}; 