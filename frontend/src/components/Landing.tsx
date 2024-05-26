import { useEffect, useRef, useState } from "react"
import { Room } from "./Room";

export const Landing = () => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setlocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [joined, setJoined] = useState(false);

    const getCam = async () => {
        const stream = await window.navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        })
        // MediaStream
        const audioTrack = stream.getAudioTracks()[0]
        const videoTrack = stream.getVideoTracks()[0]
        setLocalAudioTrack(audioTrack);
        setlocalVideoTrack(videoTrack);
        if (!videoRef.current) {
            return;
        }
        videoRef.current.srcObject = new MediaStream([videoTrack])
        videoRef.current.play();
        // MediaStream
    }

    useEffect(() => {
        if (videoRef && videoRef.current) {
            getCam()
        }
    }, [videoRef]);

    function sendToNewRoom() {
        setJoined(false);
        setTimeout(() =>{
            setJoined(true)
        }, 100)
    }

    if (!joined) {
      return (
        <div>
          {loading && <div>Loading...</div>}
          {!loading && (
            <>
              <video autoPlay ref={videoRef}></video>
              <input
                type="text"
                onChange={(e) => {
                  setName(e.target.value);
                }}
              ></input>
              <button
                onClick={() => {
                  setJoined(true);
                  setLoading(true);
                }}
              >
                Join
              </button>
            </>
          )}
        </div>
      );
    }

    return <Room name={name} localAudioTrack={localAudioTrack} localVideoTrack={localVideoTrack} sendToNewRoom={sendToNewRoom} />
}