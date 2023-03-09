const setCameraBtn = document.getElementById("setCameraBtn");
const setAudioBtn = document.getElementById("setAudioBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");

let localVideo = document.getElementById("localVideo");
let remoteVideo = document.getElementById("remoteVideo");

let localStream;
let remoteStream;

let isCameraOn = false;
let isVoiceOn = false;
let constraint = { video: isCameraOn, audio: isVoiceOn };

// 테스트용으로 하드코딩한 값
let userName = "client1";
let createRoomId = "room";   //생성한 방
let joinRoomId = ""; //접속하려는 방(남이 만든 방)

setCameraBtn.addEventListener("click", setCamera);
setAudioBtn.addEventListener("click", setAudio);
createRoomBtn.addEventListener("click", createRoom);
joinRoomBtn.addEventListener("click", joinRoom);

const socket = io("localhost:3000/video", {  transports: ['websocket'] });

//통신 시작
socket.on("connect", () => {
    console.log(socket.id); 
});

//통신 종료
socket.on("disconnect", () => {
    console.log('client1 disconnected'); // undefined
});

//방 생성/입장 후 방&접속자 정보를 받음
socket.on("getRoomState", (data) => {
    console.log(data);
});

socket.on("recvRemoteStream", (stream) => {
    remoteStream = stream;
    remoteVideo.srcObject = remoteStream;
})

//private room 생성
function createRoom() {
    //사실 여기서 초대자 쪽에서 자체적으로 roomId를 생성해줘야 하는데
    //일단 로컬변수 사용..

    socket.emit('createRoom', JSON.stringify({
        "roomId": createRoomId,
        "userName": userName
    }));
}

//실제 서비스에선 room Id를 
//초대링크나 방입장 버튼 클릭할 때 얻어야할듯
function joinRoom() {
    socket.emit('joinRoom', JSON.stringify({
        "roomId": joinRoomId,
        "userName": userName,
    }));
}

//서버로 데이터 스트림(영상,음성) 전송
function sendStream(roomId, localStream) {
    socket.emit('sendStream', JSON.stringify({
        "roomId": roomId,
        "localStream": localStream
    }));
}

//카메라 ON/OFF
async function setCamera() {
    isCameraOn = isCameraOn ? false : true;
    constraint = { video: isCameraOn, audio: isVoiceOn };

    localStream = await getMedia(constraint);
    localVideo.srcObject = localStream;

    sendStream(joinRoomId, localStream);
}

//마이크 ON/OFF
async function setAudio() {
    isVoiceOn = isVoiceOn ? false : true;
    constraint = { video: isCameraOn, audio: isVoiceOn };

    localStream = await getMedia(constraint);
    localVideo.srcObject = localStream;

    sendStream(joinRoomId, localStream);
}

async function getMedia(constraint) {
    const mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
    return mediaStream;
}

async function getDevices() {
    //사용자의 PC에서 사용 가능한 미디어 장치들을 가져온다
    //어떤 장치를 사용해서 영상/음성 송출을 할 건지 선택권을 줄 수 도 있다.
    const devices = await navigator.mediaDevices.enumerateDevices();
    console.log(devices);

    return devices;
}

// 채팅방을 식별할 id (room의 id)
function uuid() {
    function s4() {
      return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}