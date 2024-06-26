 import { User } from "./UserManger";

let GLOBAL_ROOM_ID = 1;

interface Room {
    user1: User,
    user2: User,
}

export class RoomManager {
    private rooms: Map<string, Room>
    constructor() {
        this.rooms = new Map<string, Room>()
    }

    createRoom(user1: User, user2: User) {
        const roomId = this.generate().toString();
        user1.roomId = roomId;
        user2.roomId = roomId;
        this.rooms.set(roomId.toString(), {
            user1, 
            user2,
        })

        user1.socket.emit("message", {
            msg: `Hi, My name is ${user2.name}.`,
            from: `${user2.name}`
        })

        user2.socket.emit("message", {
            msg: `Hi, My name is ${user1.name}.`,
            from: `${user1.name}`
        })

        user1.socket.emit("send-offer", {
            roomId
        })

        user2.socket.emit("send-offer", {
            roomId
        })
    }

    onOffer(roomId: string, sdp: string, senderSocketid: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;
        receivingUser?.socket.emit("offer", {
            sdp,
            roomId
        })
    }
    
    onAnswer(roomId: string, sdp: string, senderSocketid: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;

        receivingUser?.socket.emit("answer", {
            sdp,
            roomId
        });
    }

    onIceCandidates(roomId: string, senderSocketid: string, candidate: any, type: "sender" | "receiver") {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2: room.user1;
        receivingUser.socket.emit("add-ice-candidate", ({candidate, type}));
    }

    onMessage(roomId: string, msg: string, from: string, socketId: string) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === socketId ? room.user2: room.user1;
        receivingUser.socket.emit("message", ({msg, from}));
    }

    generate() {
        return GLOBAL_ROOM_ID++;
    }

}