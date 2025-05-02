import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [full_name, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    let error;

    if (isLogin) {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = loginError;
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, full_name },
        },
      });

      error = signUpError;

      if (!error && data?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id, // match with auth.user id
            email,
            username,
            full_name,
          },
        ]);
      
        if (profileError) {
          console.error('❌ Failed to create profile:', profileError.message);
        } else {
          console.log('✅ Profile created in Supabase!');
        }
      }
      
    }

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(isLogin ? 'Logged in!' : 'Check your email to confirm!');
    }

    if (!error) {
        window.location.href = '/dashboard';
      }      

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-6">{isLogin ? 'Login' : 'Sign Up'}</h2>

        {message && <div className="mb-4 text-sm text-red-500">{message}</div>}

        {!isLogin && (
          <>
            <input
              type="text"
              placeholder="Username"
              className="w-full mb-4 p-2 border border-gray-300 rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Full Name"
              className="w-full mb-4 p-2 border border-gray-300 rounded"
              value={full_name}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-2 border border-gray-300 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-2 border border-gray-300 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'}
        </button>

        <p className="mt-4 text-sm text-center">
          {isLogin ? 'No account?' : 'Have an account?'}{' '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </form>
    </div>
  );
}
