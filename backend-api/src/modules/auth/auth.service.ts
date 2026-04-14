import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    // Allow login with either username or email
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
        ],
      },
      include: { role: true },
    });

    if (!user) {
      return null;
    }

    if (!user.password) {
      throw new UnauthorizedException('La cuenta no tiene contraseña configurada o es legacy.');
    }

    const isMatch = bcrypt.compareSync(pass, user.password);
    if (isMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(user: any) {
    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role?.name,
      email: user.email 
    };
    return {
      accessToken: this.jwtService.sign(payload),
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name || 'ROLE_CLIENTE',
      tokenType: 'Bearer',
    };
  }
}
