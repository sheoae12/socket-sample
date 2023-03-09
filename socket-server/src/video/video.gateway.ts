import { Logger } from '@nestjs/common';
import { 
  SubscribeMessage, 
  WebSocketGateway, 
  OnGatewayInit, 
  OnGatewayConnection, 
  OnGatewayDisconnect, 
  WebSocketServer, 
  ConnectedSocket, 
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'video' })
export class VideoGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VideoGateway.name);

  afterInit() {
    this.logger.debug('Connection to Live Video Chat...');
  }

  handleConnection(@ConnectedSocket() client: Socket) {
    this.logger.debug(`${client.id} is connected`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.debug(`${client.id} has left`);
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @ConnectedSocket() client: Socket, 
    @MessageBody() payload: any
  ) {
    this.logger.debug(`client ${client.id} send ${payload}`);
    const data = JSON.parse(payload);
    const { roomId, userName } = data;

    client.join(roomId);
    //방 생성 기록, 현재 생성된 방 정보 db에 저장할 것

    this.logger.debug(`room created: ${roomId}`);

    //const allRooms = this.server.sockets.adapter.rooms;
    //let usersInCurrentRoom = Array.from(allRooms.get(roomId));

    let usersInCurrentRoom = 2;

    this.server.to(roomId).emit('getRoomState', {
      roomId,
      usersInCurrentRoom
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    this.logger.debug(`client ${client.id} send ${payload}`);
    const data = JSON.parse(payload);
    const { roomId, userName, localStream } = data;

    client.join(roomId);
    //방 입장 기록 db 저장, 현재 방 정보 업데이트

    this.logger.debug(`client ${client.id} join ${roomId}`);

    // const allRooms = this.server.sockets.adapter.rooms;
    // let usersInCurrentRoom = Array.from(allRooms.get(roomId));
    let usersInCurrentRoom = 2;

    this.server.to(roomId).emit('getRoomState', {
      roomId,
      usersInCurrentRoom,
      localStream
    });
  }

  @SubscribeMessage('sendStream')
  handleStream(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ) {
    this.logger.debug(`client ${client.id} send datastream...`);
    let data = JSON.parse(payload);
    let { roomId, localStream } = data;

    this.server.to(roomId).emit('recvRemoteStream', localStream);
  }
}
