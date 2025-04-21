import React, { useState, useEffect } from 'react';

function CounterApp() {
  // useState: create a state variable named count
  const [count, setCount] = useState(0);

  // useEffect: runs after the component renders or updates
  useEffect(() => {
    document.title = `You clicked ${count} times`;
  }, [count]); // runs only when `count` changes

  return (
    <div className='min-h-screen text-center w-full max-w-7xl mx-auto text-3xl pt-16'>
      <h1>React Counter</h1>
      <p><b>You clicked {count} times</b></p>
      <button onClick={() => setCount(count + 1)}>
        Click Me
      </button>
    </div>
  );
}

export default CounterApp;
