import { useState } from 'react'
import './App.css'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { MainContainer, ChatContainer, MessageList, Message, MessageInput, TypingIndicator } from '@chatscope/chat-ui-kit-react';

const systemMessage = {
  "role": "system", "content": `Eres un asistente amable y entusiasta encargado de dar recomendaciones a los usuarios basándote en el contexto proporcionado. Si consideras que el usuario no especificó sus preferencias o su pregunta no es muy precisa, hazle una pregunta adicional para comprender mejor sus preferencias o aclarar su consulta, y así puedas ofrecer una recomendación más acertada. 
  El contexto te va a retornar paginas de mi base de datos y va a estar ordenada de forma descendente por similitud vectorial a la consulta. Los datos de un restaurante va a estar separado en paginas por lo que tendras que conectar la informacion basado en el 'Nombre' de cada pagina. Solo tienes permitido recomendar restaurantes que esten en las paginas que se te dan. Algo novedoso esq tenemos el tiempo de espera promedio de algunos restaurantes por dia`
}

function App() {
  const [messages, setMessages] = useState([
    {
      message: "¡Hola! Estoy aquí para brindarte recomendaciones e información sobre los restaurantes que están en mi sistema. Recuerda que mientras más específico seas en tus gustos, podré ofrecerte respuestas más precisas. ¿En qué puedo ayudarte hoy? 😊",
      sentTime: "just now",
      sender: "ChatGPT"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (message) => {
    const newMessage = {
      message,
      direction: 'outgoing',
      sender: "user"
    };

    const newMessages = [...messages, newMessage];
    
    setMessages(newMessages);

    // Initial system message to determine ChatGPT functionality
    // How it responds, how it talks, etc.
    setIsTyping(true);
    await processMessageToChatGPT(newMessages);
  };

  async function processMessageToChatGPT(chatMessages) {
    // Format messages for chatGPT API
    let apiMessages = chatMessages.slice(1).map((messageObject) => {
      let role = "";
      if (messageObject.sender === "ChatGPT") {
        role = "assistant";
      } else {
        role = "user";
      }
      return { role: role, content: messageObject.message }
    });
  
    // Get the request body set up with the model we plan to use
    // and the messages which we formatted above. We add a system message in the front to
    // determine how we want chatGPT to act.
    const apiRequestBody = {
      "model": "gpt-3.5-turbo",
      "messages": [
        systemMessage,  // The system message DEFINES the logic of our chatGPT
        ...apiMessages // The messages from our chat with ChatGPT
      ]
    }

    const PROD_URL = 'https://hy0fvhzmw7.execute-api.us-east-1.amazonaws.com/prod/api/internal/chatbot'
  
    const serverUrl = PROD_URL; // Replace with your server URL if different

    const apikey = import.meta.env.VITE_API_KEY
  
    await fetch(`${import.meta.env.VITE_APP_API}api/internal/chatbot`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apikey
        },
        body: JSON.stringify(apiRequestBody)
      }).then((data) => {
        return data.json();
      }).then((data) => {
        console.log(data);
        setMessages([...chatMessages, {
          message: data.data.content,
          sender: "ChatGPT"
        }]);
        setIsTyping(false);
      });
  }

  return (
    <div className="App">
      <div style={{ position:"relative", height: "800px", width: "700px"  }}>
        <MainContainer>
          <ChatContainer>       
            <MessageList 
              scrollBehavior="smooth" 
              typingIndicator={isTyping ? <TypingIndicator content="ChatGPT is typing" /> : null}
            >
              {messages.map((message, i) => {
                console.log(message)
                return <Message key={i} model={message} />
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />        
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  )
}

export default App
