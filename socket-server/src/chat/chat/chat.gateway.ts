import { 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  OnGatewayInit, 
  SubscribeMessage, 
  WebSocketGateway, 
  WebSocketServer,
  ConnectedSocket, 
  MessageBody
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

//@WebSocketGateway({ namespace: 'chat' })
@WebSocketGateway({ transports: ['websocket'] })
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {

  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit() {
    this.logger.debug(`Socket Server Init Complete`);
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.debug(
      `${client.id} is connected!`
    );

    this.server.emit('msgToClient',  `${client.id} join chat`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`${client.id} is disconnected...`);
  }

  @SubscribeMessage('msgToServer')
  handleMessage(
    @ConnectedSocket() client: Socket, 
    @MessageBody() payload: any,
  ): void {
    this.logger.debug(`${client.id} : ${payload}`);
    const data = JSON.parse(payload);
    const { chatRoomId } = data;

    this.server.to(chatRoomId).emit('msgToClient', `[${data.username}]: ${data.data}`);
  }

  @SubscribeMessage('join')
  joinToChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const data = JSON.parse(payload);
    const { chatRoomId, username } = data;
    client.data.chatRoomId = chatRoomId;
    client.data.username = username;

    this.logger.debug(`${username} joined room ${chatRoomId}`);

    client.join(chatRoomId);

    const allRooms = this.server.sockets.adapter.rooms;
    let usersInCurrentChatRoom = Array.from(allRooms.get(chatRoomId));
    this.logger.debug(`${chatRoomId} : ${usersInCurrentChatRoom}`);

    this.server.to(chatRoomId).emit('newChatter',`'${username}' joined chatRoom`);
    this.server.to(chatRoomId).emit('getChatRoomUsers', {
      chatRoomId,
      userList: usersInCurrentChatRoom,
      userCount : usersInCurrentChatRoom.length
    });
  }
}
