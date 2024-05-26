import { useEffect, useRef, useState } from "react";
import { Room } from "./Room";

export const Landing = () => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<MediaStreamTrack | null>(null);
  const [localVideoTrack, setlocalVideoTrack] =
    useState<MediaStreamTrack | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [hotReloaded, setHotReloaded] = useState(true);
  const [joined, setJoined] = useState(false);

  const getCam = async () => {
    const stream = await window.navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    const audioTrack = stream.getAudioTracks()[0];
    const videoTrack = stream.getVideoTracks()[0];
    setLocalAudioTrack(audioTrack);
    setlocalVideoTrack(videoTrack);
    if (videoRef.current) {
      videoRef.current.srcObject = new MediaStream([videoTrack]);
      videoRef.current.play();
    }
  };

  useEffect(() => {
    getCam();
    fetch("https://omniegli.onrender.com").then(() => {
      setHotReloaded(false);
    });
  }, []);

  function sendToNewRoom() {
    setJoined(false);
    setTimeout(() => {
      setJoined(true);
    }, 1000);
  }

  function exitRoom() {
    setJoined(false);
    setLoading(false);
    getCam();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 relative">
      {hotReloaded && <h1>The APP is hot reloading</h1>}
      {!hotReloaded && !joined && (
        <>
          <h1 className="flex text-3xl font-bold mt-4">Omniegli Room</h1>
          <div className="flex flex-col items-center">
            {loading && <div>Loading...</div>}
            {!loading && (
              <>
                <video
                  autoPlay
                  ref={videoRef}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                ></video>
              </>
            )}
          </div>
          {!loading && (
            <>
              <div className="mt-auto">
                <input
                  type="text"
                  placeholder="Enter your name"
                  onChange={(e) => {
                    setName(e.target.value);
                  }}
                  className="border border-gray-300 rounded px-4 py-2 mb-4 mr-2"
                />
                <button
                  onClick={() => {
                    setJoined(true);
                    setLoading(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                >
                  Join
                </button>
              </div>
            </>
          )}
        </>
      )}
      {joined && (
        <Room
          name={name}
          localAudioTrack={localAudioTrack}
          localVideoTrack={localVideoTrack}
          sendToNewRoom={sendToNewRoom}
          exitRoom={exitRoom}
        />
      )}
    </div>
  );
};
