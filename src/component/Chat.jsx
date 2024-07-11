import React, { useContext } from 'react'
import Messages from './Messages'
import Input from './Input'
import { ChatContext } from '../context/ChatContext'

function Chat() {
  const {data} =useContext(ChatContext);
  return (
    <div className='chat'>
      <div className='chatInfo'>
      <span>{data.user?.displayName}</span>
      <div className='chatIcons'>
        <img src="https://img.icons8.com/?size=50&id=37839&format=png" alt="" />
        <img src="https://img.icons8.com/?size=50&id=7327&format=png" alt="" />
        <img src="https://img.icons8.com/?size=50&id=12620&format=png" alt="" />
      </div>
      </div>
      <Messages/>
      <Input/> 
    </div>
  )
}

export default Chat
