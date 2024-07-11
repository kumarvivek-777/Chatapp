import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import { Timestamp, arrayUnion, doc, serverTimestamp, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { v4 as uuid } from 'uuid';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize GoogleGenerativeAI with your API key
const genAI = new GoogleGenerativeAI('AIzaSyC3OvMMrhUUTsm-l6ftcLgFRHlmV_bLakw');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Function to fetch response from Gemini API using GoogleGenerativeAI
const fetchGeminiResponse = async (question) => {
  try {
    const result = await model.generateContent(question);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error fetching response from Gemini:', error);
    return null;
  }
};

// Vigenère cipher encryption
const vigenereEncrypt = (text, key) => {
  let encryptedText = '';
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    encryptedText += String.fromCharCode((char + keyChar) % 256);
  }
  return encryptedText;
};

// Vigenère cipher decryption
const vigenereDecrypt = (encryptedText, key) => {
  let decryptedText = '';
  for (let i = 0; i < encryptedText.length; i++) {
    const char = encryptedText.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    decryptedText += String.fromCharCode((char - keyChar + 256) % 256);
  }
  return decryptedText;
};

function Input() {
  const [text, setText] = useState('');
  const [img, setImg] = useState(null);
  const { currentUser } = useContext(AuthContext);
  const { data } = useContext(ChatContext);

  const handleSend = async () => {
    const messageId = uuid();
    console.log('Generated messageId:', messageId); // Log generated key

    // Function to store message in Firebase
    const storeMessage = async (message) => {
      try {
        console.log('Storing message:', message); // Debug log

        // Check if chat document exists, if not, create it
        const chatDocRef = doc(db, 'chats', data.chatId);
        const chatDoc = await getDoc(chatDocRef);
        if (!chatDoc.exists()) {
          await setDoc(chatDocRef, { messages: [] });
        }

        // Update chat document with new message
        await updateDoc(chatDocRef, {
          messages: arrayUnion({
            id: uuid(), // Ensure a new unique ID is used here
            text: message.text || '',
            senderId: message.senderId || '',
            date: message.date || Timestamp.now(),
            img: message.img || null,
          }),
        });

        // Update user chat documents
        const currentUserChatDocRef = doc(db, 'userChats', currentUser.uid);
        const userChatDocRef = doc(db, 'userChats', data.user.uid);

        // Check if current user chat document exists, if not, create it
        const currentUserChatDoc = await getDoc(currentUserChatDocRef);
        if (!currentUserChatDoc.exists()) {
          await setDoc(currentUserChatDocRef, {});
        }

        // Check if other user chat document exists, if not, create it
        const userChatDoc = await getDoc(userChatDocRef);
        if (!userChatDoc.exists()) {
          await setDoc(userChatDocRef, {});
        }

        await updateDoc(currentUserChatDocRef, {
          [`${data.chatId}.lastMessage`]: {
            text: message.text || '',
          },
          [`${data.chatId}.date`]: serverTimestamp(),
        });

        await updateDoc(userChatDocRef, {
          [`${data.chatId}.lastMessage`]: {
            text: message.text || '',
          },
          [`${data.chatId}.date`]: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error storing message in Firebase:', error);
      }
    };

    // Function to get all messages
    const getAllMessages = async () => {
      const chatDocRef = doc(db, 'chats', data.chatId);
      const chatDoc = await getDoc(chatDocRef);
      if (chatDoc.exists()) {
        return chatDoc.data().messages || [];
      }
      return [];
    };

    // Encrypt or decrypt all messages
    const encryptionKey = 'mySecretKey'; // Replace with your own secret key

    if (text === '@encrypt') {
      const messages = await getAllMessages();
      const encryptedMessages = messages.map((msg) => ({
        ...msg,
        text: vigenereEncrypt(msg.text, encryptionKey),
      }));
      await setDoc(doc(db, 'chats', data.chatId), { messages: encryptedMessages });
      setText('');
      return;
    }

    if (text === '@decrypt') {
      const messages = await getAllMessages();
      const decryptedMessages = messages.map((msg) => ({
        ...msg,
        text: vigenereDecrypt(msg.text, encryptionKey),
      }));
      await setDoc(doc(db, 'chats', data.chatId), { messages: decryptedMessages });
      setText('');
      return;
    }

    const message = {
      text,
      senderId: currentUser.uid,
      date: Timestamp.now(),
    };

    // Handle image upload if any
    if (img) {
      const storageRef = ref(storage, messageId);
      const uploadTask = uploadBytesResumable(storageRef, img);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Optionally handle progress here
        },
        (error) => {
          console.error('Upload failed:', error);
          // TODO: Handle error appropriately
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            message.img = downloadURL;
            await storeMessage(message);
          } catch (error) {
            console.error('Error getting download URL:', error);
          }
        }
      );
    } else {
      await storeMessage(message);
    }

    // Check if the message is directed to Gemini
    if (text.startsWith('@gemini')) {
      const question = text.replace('@gemini', '').trim();
      console.log('Sending question to Gemini:', question); // Debug log

      try {
        const geminiResponse = await fetchGeminiResponse(question);
        console.log('Gemini response:', geminiResponse); // Debug log

        const geminiMessage = {
          text: geminiResponse,
          senderId: 'gemini',
          date: Timestamp.now(),
        };
        await storeMessage(geminiMessage);
      } catch (error) {
        console.error('Error fetching response from Gemini:', error); // Debug log
      }
    }

    setText('');
    setImg(null);
  };

  return (
    <div className='input'>
      <input
        type='text'
        placeholder='Type something...'
        onChange={(e) => setText(e.target.value)}
        value={text}
      />
      <div className='send'>
        <img src='https://img.icons8.com/?size=64&id=Uboc7f1oa4JX&format=png' alt='' />
        <input
          type='file'
          style={{ display: 'none' }}
          id='file'
          onChange={(e) => setImg(e.target.files[0])}
        />
        <label htmlFor='file'>
          <img src='https://img.icons8.com/?size=50&id=11322&format=png' alt='' />
        </label>
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default Input;
