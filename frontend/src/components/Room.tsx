import { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";

const URL = process.env.REACT_APP_URL ||"http://localhost:4000";

export const Room = ({
  name,
  localAudioTrack,
  localVideoTrack,
  sendToNewRoom,
  exitRoom,
}: {
  name: string;
  localAudioTrack: MediaStreamTrack | null;
  localVideoTrack: MediaStreamTrack | null;
  sendToNewRoom: () => void;
  exitRoom: () => void;
}) => {
  const [lobby, setLobby] = useState(true);
  const [socket, setSocket] = useState<null | Socket>(null);
  const [, setSendingPc] = useState<null | RTCPeerConnection>(null);
  const [, setReceivingPc] = useState<null | RTCPeerConnection>(null);
  const [, setRemoteVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [, setRemoteAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [, setRemoteMediaStream] = useState<MediaStream | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>();
  const localVideoRef = useRef<HTMLVideoElement>();

  useEffect(() => {
    if (socket) return;
    const newSocket = io(URL);
    newSocket.on("send-offer", async ({ roomId }) => {
      console.log("sending offer");
      setLobby(false);
      const pc = new RTCPeerConnection();

      setSendingPc(pc);
      if (localVideoTrack) {
        console.error("added tack");
        console.log(localVideoTrack);
        pc.addTrack(localVideoTrack);
      }
      if (localAudioTrack) {
        console.error("added tack");
        console.log(localAudioTrack);
        pc.addTrack(localAudioTrack);
      }

      pc.onicecandidate = async (e) => {
        console.log("receiving ice candidate locally");
        if (e.candidate) {
          newSocket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "sender",
            roomId,
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        console.log("on negotiation neeeded, sending offer");
        const sdp = await pc.createOffer();
        pc.setLocalDescription(sdp);
        newSocket.emit("offer", {
          sdp,
          roomId,
        });
      };
    });

    newSocket.on("goToLobby", () => {
      console.log("going to lobby");
      newSocket.disconnect();
      sendToNewRoom();
    });

    newSocket.on("offer", async ({ roomId, sdp: remoteSdp }) => {
      console.log("received offer");
      setLobby(false);
      const pc = new RTCPeerConnection();
      pc.setRemoteDescription(remoteSdp);
      const sdp = await pc.createAnswer();
      pc.setLocalDescription(sdp);
      const stream = new MediaStream();
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }

      setRemoteMediaStream(stream);
      setReceivingPc(pc);
      pc.ontrack = () => {
        alert("ontrack");
      };

      pc.onicecandidate = async (e) => {
        if (!e.candidate) {
          return;
        }
        console.log("omn ice candidate on receiving seide");
        if (e.candidate) {
          newSocket.emit("add-ice-candidate", {
            candidate: e.candidate,
            type: "receiver",
            roomId,
          });
        }
      };

      newSocket.emit("answer", {
        roomId,
        sdp: sdp,
      });
      setTimeout(() => {
        const track1 = pc.getTransceivers()[0].receiver.track;
        const track2 = pc.getTransceivers()[1].receiver.track;
        console.log(track1);
        if (track1.kind === "video") {
          setRemoteAudioTrack(track2);
          setRemoteVideoTrack(track1);
        } else {
          setRemoteAudioTrack(track1);
          setRemoteVideoTrack(track2);
        }
        //@ts-ignore
        remoteVideoRef.current.srcObject.addTrack(track1);
        //@ts-ignore
        remoteVideoRef.current.srcObject.addTrack(track2);
        //@ts-ignore
        remoteVideoRef.current.play();
      }, 100);
    });

    // also getting roomId
    newSocket.on("answer", ({ sdp: remoteSdp }) => {
      setLobby(false);
      setSendingPc((pc) => {
        pc?.setRemoteDescription(remoteSdp);
        return pc;
      });
      console.log("loop closed");
    });

    newSocket.on("lobby", () => {
      setLobby(true);
    });

    newSocket.on("add-ice-candidate", ({ candidate, type }) => {
      console.log("add ice candidate from remote");
      console.log({ candidate, type });
      if (type == "sender") {
        setReceivingPc((pc) => {
          if (!pc) {
            console.error("receicng pc nout found");
          } else {
            console.error(pc.ontrack);
          }
          pc?.addIceCandidate(candidate);
          return pc;
        });
      } else {
        setSendingPc((pc) => {
          if (!pc) {
            console.error("sending pc nout found");
          } else {
            // console.error(pc.ontrack)
          }
          pc?.addIceCandidate(candidate);
          return pc;
        });
      }
    });

    setSocket(newSocket);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    if (localVideoRef.current) {
      if (localVideoTrack) {
        localVideoRef.current.srcObject = new MediaStream([localVideoTrack]);
        localVideoRef.current.play();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localVideoRef]);

  return (
    <>
      <h1 className="flex text-3xl font-bold mb-4">
        {lobby ? "Lobby" : "Live"}
      </h1>
      <button
        onClick={() => {
          exitRoom();
          socket?.disconnect();
        }}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded absolute top-4 right-2"
      >
        Exit
      </button>
      <div className="flex justify-center items-center">
        <div className="mr-4">
          {/* @ts-ignore */}
          <video autoPlay width={400} height={400} ref={localVideoRef} />
        </div>
        {lobby ? (
          <div
            className="flex items-center justify-center bg-gray-300 rounded sm:w-96 dark:bg-gray-700 animate-pulse"
            style={{ width: "400px", height: "300px" }}
          >
            <svg
              className="w-10 h-10 text-gray-200 dark:text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z" />
            </svg>
          </div>
        ) : (
          <div>
            {/* @ts-ignore */}
            <video autoPlay width={400} height={400} ref={remoteVideoRef} />
          </div>
        )}
      </div>
      <div className="flex">
        {lobby ? (
          <div className="ml-4">
            Hi {name}, Waiting to connect you to someone
          </div>
        ) : null}
      </div>
    </>
  );
};
