import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    // This payload is exactly what we signed in auth.service.ts
    // passport-jwt will automatically assign this return value to req.user
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role,
      email: payload.email,
    };
  }
}
