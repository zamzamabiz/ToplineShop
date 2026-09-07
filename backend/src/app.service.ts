import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot(): { message: string; status: string } {
    return {
      message: 'ToplineShop backend bootstrap is running',
      status: 'ok',
    };
  }
}
