export const SESSION_COOKIE_NAME = 'session';
export const SESSION_EXPIRATION_SECONDS = 7 * 24 * 60 * 60 * 1000;
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  maxAge: SESSION_EXPIRATION_SECONDS ,
};
