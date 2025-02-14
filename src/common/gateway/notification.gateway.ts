import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { Roles } from '@memory/shared';

@WebSocketGateway({ namespace: '/ws' })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  // 存储不同队列的连接信息
  private PublicQueue: Map<string, { id: string; username: string; socket: Socket }> = new Map();
  private AdminQueue: Map<string, { id: string; username: string; socket: Socket }> = new Map();

  // 监听连接事件
  handleConnection(client: Socket): void {
    const cookies = client.handshake.headers.cookie;

    if (cookies) {
      const parsedCookies = cookie.parse(cookies);
      const role = parsedCookies['Role'];

      try {
        const parsedRole = JSON.parse(role.slice(2)); // 解析 Role 字段，去掉前缀 "j:"

        const username = parsedRole.username;
        const userId = client.id; 
        const userType = Roles[parsedRole.role_id];

        const userData = { id: userId, username, socket: client };

        if (userType === 'admin') {
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
