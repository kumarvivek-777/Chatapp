import React, { useContext, useState, useRef, useEffect } from 'react';
import Messages from './Messages';
import Input from './Input';
import { ChatContext } from '../context/ChatContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import Draggable from 'react-draggable';

function Chat() {
  const videoContainerRef = useRef(null);
  const { data } = useContext(ChatContext);
  const [roomID, setRoomID] = useState('');
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  let myMeeting = async (element) => {
    const appID = 774210992;
    const serverSecret = "a28b2a2f99b019ea90248be3a4f39615";
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID, Date.now().toString(), "vivek");
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
    });
  }

  const handleJoin = () => {
    setIsVideoVisible(true);
    if (videoContainerRef.current) {
      myMeeting(videoContainerRef.current);
    }
  }

  return (
    <div className='chat'>
      <div className='chatInfo'>
        <span>{data.user?.displayName}</span>
        <div className='chatIcons'>
          <input 
            placeholder='Room ID' 
            type='text'
            value={roomID}
            onChange={(e) => setRoomID(e.target.value)}
            style={{ width: '100px', marginRight: '10px' }}
          />
          <button onClick={handleJoin} style={{ marginRight: '10px' }}>Join</button>
          {isVideoVisible && (
            <Draggable>
              <div
                ref={videoContainerRef}
                style={{
                  width: '800px',
                  height: '600px',
                  //border: '1px solid',
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 1000, // Ensure it appears on top
                }}
              ></div>
            </Draggable>
          )}
          <img src="https://img.icons8.com/?size=50&id=37839&format=png" alt="" />
          <img src="https://img.icons8.com/?size=50&id=7327&format=png" alt="" />
          <img src="https://img.icons8.com/?size=50&id=12620&format=png" alt="" />
        </div>
      </div>
      <Messages />
      <Input />
    </div>
  );
}

export default Chat;
