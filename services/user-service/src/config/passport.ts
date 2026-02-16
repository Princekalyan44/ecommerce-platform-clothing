import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { config } from './index';
import { OAuthUser } from '../types';

// Google OAuth Strategy
if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: config.oauth.google.callbackURL,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const user: OAuthUser = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          first_name: profile.name?.givenName || '',
          last_name: profile.name?.familyName || '',
        };
        return done(null, user);
      }
    )
  );
}

// Facebook OAuth Strategy
if (config.oauth.facebook.clientId && config.oauth.facebook.clientSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.oauth.facebook.clientId,
        clientSecret: config.oauth.facebook.clientSecret,
        callbackURL: config.oauth.facebook.callbackURL,
        profileFields: ['id', 'emails', 'name'],
      },
      (_accessToken, _refreshToken, profile, done) => {
        const user: OAuthUser = {
          id: profile.id,
          email: profile.emails?.[0]?.value || '',
          first_name: profile.name?.givenName || '',
          last_name: profile.name?.familyName || '',
        };
        return done(null, user);
      }
    )
  );
}

export default passport;
