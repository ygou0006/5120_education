import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppConfig } from '../config';

const RequireUnlock = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isUnlockPage = location.pathname === '/unlock';
  const isLoginPage = location.pathname === '/login';
  const isRegisterPage = location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');
  
  useEffect(() => {
    if (!AppConfig.enablePasswordLock) {
      return;
    }
    
    if (isUnlockPage || isLoginPage || isRegisterPage || isAdminPage) {
      return;
    }
    
    const unlocked = sessionStorage.getItem('unlocked');
    if (unlocked !== 'true') {
      navigate('/unlock');
    }
  }, [location.pathname, isUnlockPage, isLoginPage, isRegisterPage, isAdminPage]);
  
  if (!AppConfig.enablePasswordLock) {
    return <>{children}</>;
  }
  
  if (isUnlockPage || isLoginPage || isRegisterPage || isAdminPage) {
    return <>{children}</>;
  }
  
  const unlocked = sessionStorage.getItem('unlocked');
  if (unlocked === 'true') {
    return <>{children}</>;
  }
  
  return null;
};

export default RequireUnlock;
