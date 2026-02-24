'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { selectIsAuthenticated, selectUser, logout } from '../store/authSlice';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectUser);
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/categories', label: 'Categories' },
    { href: '/saved', label: 'Saved' },
    { href: '/profile', label: 'Profile' },
  ];

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          Mobile Dev News
        </Link>

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`} />
        </button>

        <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className={styles.authSection}>
            {isAuthenticated ? (
              <>
                <span className={styles.username}>{user?.username}</span>
                <button onClick={handleLogout} className={styles.authButton}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={styles.authButton}
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={styles.signUpButton}
                  onClick={() => setMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
