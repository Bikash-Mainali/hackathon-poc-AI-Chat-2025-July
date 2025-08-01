import './App.css';
import ChatbotWidget from './components/ChatWidget';

function App() {
  return (
<div
  className="min-h-screen bg-cover bg-center"
  style={{
    backgroundImage: "url('/images/image.png')", // Update the path to your image
  }}
>
  <ChatbotWidget />
</div>  );
}

export default App;
