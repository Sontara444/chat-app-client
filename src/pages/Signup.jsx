import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/api';
import { MessageSquare } from 'lucide-react';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const response = await api.post('/auth/register', { username, email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-600 p-3 rounded-full">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>
                {error && <div className="bg-red-500 text-white p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
                            placeholder="Choose a username"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-green-500"
                            placeholder="Create a password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition duration-200"
                    >
                        Sign Up
                    </button>
                </form>
                <p className="mt-4 text-center text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-green-400 hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
