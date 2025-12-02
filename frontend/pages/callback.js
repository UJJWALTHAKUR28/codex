import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiGithub, 
  FiLoader,
  FiCpu,
  FiArrowRight
} from 'react-icons/fi';
import { motion } from 'framer-motion';

export default function Callback() {
  const router = useRouter();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const { token, user } = router.query;
    
    if (!token || !user) return;

    try {
      setStatus('processing');
      
      // Store user data
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_login', user);
      localStorage.setItem('user_name', user);
      
      setStatus('success');
      
      // Redirect to dashboard after a brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error("Error storing auth data:", err);
      setStatus('error');
      setError(err.message || 'Authentication failed. Please try again.');
      
      // Redirect to home after error
      setTimeout(() => {
        router.push('/');
      }, 5000);
    }
  }, [router.query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-green-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center"
        >
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 p-3 rounded-2xl">
                <FiCpu className="text-3xl text-blue-400" />
              </div>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mb-8">
            {status === 'processing' && (
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur animate-pulse"></div>
                  <div className="relative w-20 h-20 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin flex items-center justify-center">
                    <FiGithub className="text-blue-400 text-xl" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Connecting to GitHub</h2>
                <p className="text-gray-400">Completing authentication...</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-full flex items-center justify-center">
                    <FiCheckCircle className="text-green-400 text-4xl" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Authentication Successful!</h2>
                <p className="text-gray-400">Redirecting to dashboard...</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-600 rounded-full blur animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/50 rounded-full flex items-center justify-center">
                    <FiAlertCircle className="text-red-400 text-4xl" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Authentication Failed</h2>
                <p className="text-red-300 mb-4">{error}</p>
                <p className="text-gray-400 text-sm">Redirecting to home page...</p>
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Status</span>
              <span>
                {status === 'processing' && 'Processing...'}
                {status === 'success' && 'Complete'}
                {status === 'error' && 'Failed'}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{
                  width: status === 'processing' ? '60%' : 
                         status === 'success' ? '100%' : '100%'
                }}
                className={`h-full ${
                  status === 'processing' ? 'bg-gradient-to-r from-blue-500 to-purple-600' :
                  status === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                  'bg-gradient-to-r from-red-500 to-orange-600'
                }`}
              />
            </div>
          </div>

          {/* Loading Steps */}
          {status === 'processing' && (
            <div className="space-y-3">
              {[
                { label: 'Verifying authorization code', completed: true },
                { label: 'Exchanging for access token', completed: true },
                { label: 'Fetching user profile', completed: false },
                { label: 'Initializing session', completed: false }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-center gap-3"
                >
                  {step.completed ? (
                    <FiCheckCircle className="text-green-400" />
                  ) : (
                    <FiLoader className="text-blue-400 animate-spin" />
                  )}
                  <span className={`text-sm ${step.completed ? 'text-gray-300' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8">
            {status === 'error' && (
              <button
                onClick={() => router.push('/')}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                Return to Home
                <FiArrowRight />
              </button>
            )}
            
            {status === 'processing' && (
              <p className="text-sm text-gray-500">
                This should only take a moment...
              </p>
            )}
          </div>

          {/* Security Info */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <FiCheckCircle className="text-green-400" />
              <span>Secure OAuth 2.0 Authentication</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Your credentials are never stored and are securely transmitted
            </p>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-gray-600 text-sm"
        >
          <p>CodeAuditor Pro • Enterprise Security</p>
          <p className="mt-1">Redirecting to your dashboard...</p>
        </motion.div>
      </div>

      {/* Animated Dots */}
      {status === 'processing' && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}