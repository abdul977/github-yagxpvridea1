import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/use-auth';
import { useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ReasoningResults from './pages/ReasoningResults';
import './App.css';

const AuthenticatedApp: React.FC = () => {
  const [isSideNavOpen, setIsSideNavOpen] = useState(false);
  const { user, signOut } = useAuth();

  const toggleSideNav = () => {
    setIsSideNavOpen(!isSideNavOpen);
  };

  return (
    <div className="flex h-screen">
      {/* Side Navigation */}
        <nav 
          className={`
            fixed inset-y-0 left-0 transform 
            ${isSideNavOpen ? 'translate-x-0' : '-translate-x-full'}
            w-[80vw] sm:w-72 md:w-64 
            bg-gradient-to-br from-indigo-800 via-purple-800 to-pink-800 
            text-white 
            transition-transform duration-300 ease-in-out 
            z-50 md:relative md:translate-x-0
            shadow-2xl
            overflow-y-auto
          `}
        >
        <div className="p-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-5 
            bg-clip-text text-transparent 
            bg-gradient-to-r from-pink-500 to-purple-500
            animate-gradient-x
            break-words
          ">
            Whimsical Idea Keeper
          </h2>
          <ul className="space-y-2 sm:space-y-3">
            <li>
              <Link 
                to="/" 
                className="
                  block py-2 px-3 
                  bg-white bg-opacity-10 hover:bg-opacity-20 
                  rounded transition 
                  transform hover:scale-105 
                  hover:shadow-lg
                "
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-green-500">
                  Home
                </span>
              </Link>
            </li>
            <li>
              <Link 
                to="/reasoning-results" 
                className="
                  block py-2 px-3 
                  bg-white bg-opacity-10 hover:bg-opacity-20 
                  rounded transition 
                  transform hover:scale-105 
                  hover:shadow-lg
                "
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                  Reasoning Results
                </span>
              </Link>
            </li>
            <li>
              <button 
                onClick={signOut}
                className="
                  block py-2 px-3 w-full text-left
                  bg-white bg-opacity-10 hover:bg-opacity-20 
                  rounded transition 
                  transform hover:scale-105 
                  hover:shadow-lg
                "
              >
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-500">
                  Logout
                </span>
              </button>
            </li>
          </ul>
          {user && (
            <div className="mt-4 text-sm text-white/70">
              Logged in as: {user.email}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Toggle and Overlay */}
      <>
        <button 
          onClick={toggleSideNav} 
          className="
            fixed top-3 sm:top-4 left-3 sm:left-4 z-50 
            md:hidden 
            bg-gradient-to-r from-pink-500 to-purple-500 
            text-white 
            p-2 
            rounded-full 
            shadow-lg 
            hover:scale-110 
            transition-transform
            text-sm sm:text-base
          "
        >
          {isSideNavOpen ? 'Close' : 'Menu'}
        </button>
        {/* Overlay */}
        {isSideNavOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" 
            onClick={toggleSideNav}
          />
        )}
      </>

      {/* Main Content Area */}
      <main 
        className={`
          flex-1 p-3 sm:p-4 md:p-5 
          ${isSideNavOpen ? 'md:ml-64' : 'md:ml-0'}
          transition-all duration-300
          relative
        `}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reasoning-results" element={<ReasoningResults />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="*" 
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
