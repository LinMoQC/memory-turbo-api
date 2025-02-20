import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Roles } from '@memory/shared';
import { verifyAccessToken } from 'src/utils/jwt-utils';
import { RedisService } from 'src/modules/redis/redis.service';
import { UnauthorizedException } from '@nestjs/common';

@WebSocketGateway({ namespace: '/ws' })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // 存储不同队列的连接信息
  private PublicQueue: Map<string, { id: string; username: string; socket: Socket }> = new Map();
  private AdminQueue: Map<string, { id: string; username: string; socket: Socket }> = new Map();

  constructor(private readonly redisService: RedisService) {}  

  // 监听连接事件
  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth.accessToken;

    if (token) {
      try {
        const userInfo = await verifyAccessToken(token);
        const role = userInfo.role;
        const username = userInfo.username;
        const userId = client.id;
        const userType = Roles[role];

        const userData = { id: userId, username, socket: client };

        if (userType === 'admin' || userType === 'super') {
          this.AdminQueue.set(username, userData);
        } else {
          this.PublicQueue.set(username, userData);
        }

        // 连接成功后发送消息给客户端
        client.emit('connectionSuccess', { message: `Welcome to MF! ${username}` });

        // 订阅 Redis 消息
        this.redisService.subscribe(username, (message) => {
          client.emit('message', message);
        });
      } catch (error) {
        throw new UnauthorizedException('验证错误')
      }
    }
  }

  // 监听断开连接事件
  handleDisconnect(client: Socket): void {
    // 从队列中删除连接
    for (const [username, userData] of this.AdminQueue) {
      if (userData.id === client.id) {
        this.AdminQueue.delete(username);
        return;
      }
    }

    for (const [username, userData] of this.PublicQueue) {
      if (userData.id === client.id) {
        this.PublicQueue.delete(username);
        return;
      }
    }

    // 取消 Redis 订阅
    this.redisService.unsubscribe(client.id);
  }

  // 监听 'message' 事件，并根据用户类型发送消息
  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket): Promise<void> {
    console.log('Received message:', data);

    let userType = null;
    let username = null;

    // 获取用户类型
    for (const [name, userData] of this.AdminQueue) {
      if (userData.id === client.id) {
        userType = 'admin';
        username = name;
        break;
      }
    }

    if (!userType) {
      for (const [name, userData] of this.PublicQueue) {
        if (userData.id === client.id) {
          userType = 'public';
          username = name;
          break;
        }
      }
    }

    if (!userType || !username) {
      console.warn('Unknown user:', client.id);
      return;
    }

    console.log(`Message from ${username} (${userType}):`, data);

    // 使用 Redis 发布消息
    if (userType === 'admin') {
      this.redisService.publish('admin-channel', JSON.stringify({ sender: username, data }));
    } else {
      this.redisService.publish('public-channel', JSON.stringify({ sender: username, data }));
    }
  }

  // 向管理员发送消息
  sendToAdmin(username: string, message: string): void {
    const adminData = this.AdminQueue.get(username);
    if (adminData) {
      adminData.socket.emit('requst-message', message);
    }
  }

  // 向普通用户发送消息
  sendToPublic(username: string, message: string): void {
    const publicData = this.PublicQueue.get(username);
    if (publicData) {
      publicData.socket.emit('template-change-message', message);
    }
  }
}
