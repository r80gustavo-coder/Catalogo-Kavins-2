import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LogOut, User, PlusCircle, Search, X } from 'lucide-react';
import { CATEGORIES, APP_NAME } from '../constants';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Todos';
  
  // Search state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  // Sync local state with URL param
  useEffect(() => {
    setSearchTerm(searchParams.get('q') || '');
  }, [searchParams]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category === 'Todos') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    
    // Maintain search query if exists, or clear it? Usually keeping it is better UX.
    navigate(`/?${params.toString()}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    
    // If not on home, go to home
    if (location.pathname !== '/') {
      navigate(`/?${params.toString()}`);
    } else {
      setSearchParams(params);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    const params = new URLSearchParams(searchParams);
    params.delete('q');
    setSearchParams(params);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between md:h-20 items-center py-4 md:py-0 gap-4 md:gap-0">
          
          <div className="flex items-center justify-between w-full md:w-auto">
            {/* Logo */}
            <div className="flex items-center cursor-pointer flex-shrink-0 mr-6" onClick={() => navigate('/')}>
              <span className="font-serif text-3xl font-bold text-primary tracking-tighter">
                {APP_NAME}
              </span>
            </div>

            {/* Mobile Actions (Right aligned on mobile) */}
            <div className="flex items-center md:hidden gap-2">
               {user ? (
                  <button onClick={handleLogout} className="p-2 text-gray-500"><LogOut size={20}/></button>
               ) : (
                  <Link to="/login" className="p-2 text-gray-500"><User size={20}/></Link>
               )}
            </div>
          </div>

          {/* Search Bar - Centered/Flexible */}
          <div className="w-full md:w-96 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-full leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition duration-150 ease-in-out"
              placeholder="Buscar por nome ou referência..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            {searchTerm && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={clearSearch}>
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </div>
            )}
          </div>

          {/* Right Actions (Desktop) */}
          <div className="hidden md:flex items-center space-x-4 flex-shrink-0 ml-4">
            {user?.role === UserRole.ADMIN && (
              <Link
                to="/admin"
                className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 focus:outline-none"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span className="inline">Admin</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex flex-col text-right hidden lg:block">
                  <span className="text-sm font-medium text-gray-900">{user.username}</span>
                  <span className="text-xs text-secondary font-semibold uppercase">{user.role}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 focus:outline-none"
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center text-gray-500 hover:text-primary transition-colors"
              >
                <User className="h-5 w-5 mr-1" />
                <span className="text-sm font-medium">Entrar</span>
              </Link>
            )}
          </div>
        </div>
        
        {/* Categories Row */}
        <div className="flex items-center overflow-x-auto no-scrollbar mask-gradient space-x-2 pb-3 md:pb-0 md:h-12 border-t border-gray-100 mt-2 md:mt-0 pt-2 md:pt-0">
             {location.pathname === '/' && (
               <>
                 <button
                    onClick={() => handleCategoryClick('Todos')}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border ${
                      activeCategory === 'Todos' 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                 >
                   Todos
                 </button>
                 {CATEGORIES.map(cat => (
                   <button
                     key={cat}
                     onClick={() => handleCategoryClick(cat)}
                     className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border ${
                       activeCategory === cat 
                         ? 'bg-primary text-white border-primary' 
                         : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
               </>
             )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;