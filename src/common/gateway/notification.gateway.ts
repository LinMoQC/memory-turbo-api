import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Roles } from '@memory/shared';
import { verifyAccessToken } from 'src/utils/jwt-utils';

@WebSocketGateway({ namespace: '/ws' })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // 存储不同队列的连接信息
  private PublicQueue: Map<string, { id: string; username: string; socket: Socket }> = new Map();
  private AdminQueue: Map<string, { id: string; username: string; socket: Socket }> = new Map();

  // 监听连接事件
  async handleConnection(client: Socket): Promise<void> {

    const token = client.handshake.auth.accessToken;

    if (token) {
      const userInfo = await verifyAccessToken(token)
      const role = userInfo.role

      try {
        const username = userInfo.username
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
      } catch (error) {
        console.error('Invalid role cookie:', role);
      }
    }
  }

  // 监听断开连接事件
  handleDisconnect(client: Socket): void {
    // 先从管理员队列中查找
    for (const [username, userData] of this.AdminQueue) {
      if (userData.id === client.id) {
        this.AdminQueue.delete(username);
        return;
      }
    }

    // 再从普通用户队列中查找
    for (const [username, userData] of this.PublicQueue) {
      if (userData.id === client.id) {
        this.PublicQueue.delete(username);
        return;
      }
    }
  }

  // 监听 'message' 事件，并根据用户类型发送消息
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: string, @ConnectedSocket() client: Socket): void {
    console.log('Received message:', data);

    // 获取用户信息
    let userType = null;
    let username = null;

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

    // 广播消息
    if (userType === 'admin') {
      this.AdminQueue.forEach(({ socket }) => {
        socket.emit('message', { sender: username, data });
      });
    } else {
      this.PublicQueue.forEach(({ socket }) => {
        socket.emit('message', { sender: username, data });
      });
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
