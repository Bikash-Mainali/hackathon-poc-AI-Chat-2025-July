import react from 'react';


export const Loader = () => {
    return (
  <span className="">
    <span className="sr-only">....</span>
    <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s] scale-100 opacity-80"></span>
    <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s] scale-100 opacity-90"></span>
    <span className="h-2 w-2 bg-purple-500 rounded-full animate-bounce scale-100 opacity-100"></span>
  </span>
    );
}