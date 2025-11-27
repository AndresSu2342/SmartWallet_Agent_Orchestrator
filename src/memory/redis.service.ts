import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: parseInt(this.config.get('REDIS_PORT', '6379')),
      password: this.config.get('REDIS_PASSWORD'), // Opcional
    });
  }

  async getEpisodic(userId: string): Promise<any> {
    const data = await this.redis.get(`episodic:${userId}`);
    return data ? JSON.parse(data) : null; // Retorna eventos recientes o null
  }

  async storeEpisodic(userId: string, events: any): Promise<void> {
    await this.redis.set(
      `episodic:${userId}`,
      JSON.stringify(events),
      'EX',
      86400,
    ); // Expira en 24h
  }

  // Método para limpiar si necesario
  async clearEpisodic(userId: string): Promise<void> {
    await this.redis.del(`episodic:${userId}`);
  }
}
