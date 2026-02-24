'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchUserProfile,
  updateProfile,
  logout,
  selectUser,
  selectAuthLoading,
  selectAuthError,
  clearError,
} from '@/store/authSlice';
import AuthGuard from '@/components/AuthGuard';
import LoadingSpinner from '@/components/LoadingSpinner';
import styles from './page.module.css';

function ProfileContent() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    if (!username.trim()) return;
    await dispatch(updateProfile({ username: username.trim() }));
    setEditing(false);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!user && loading) return <LoadingSpinner />;

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.username} className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarPlaceholder}>
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h2 className={styles.username}>{user?.username}</h2>
          <p className={styles.email}>{user?.email}</p>
          {user?.created_at && (
            <p className={styles.joined}>
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Profile Information</h3>
          {!editing && (
            <button className={styles.editBtn} onClick={() => { setEditing(true); dispatch(clearError()); }}>
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                className={styles.input}
                value={email}
                disabled
              />
              <span className={styles.hint}>Email cannot be changed</span>
            </div>
            <div className={styles.formActions}>
              <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button className={styles.cancelBtn} onClick={() => { setEditing(false); if (user) { setUsername(user.username); setEmail(user.email); } }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.info}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Username</span>
              <span>{user?.username}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email</span>
              <span>{user?.email}</span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <main className={styles.page}>
        <div className={styles.container}>
          <h1 className={styles.title}>Profile</h1>
          <ProfileContent />
        </div>
      </main>
    </AuthGuard>
  );
}
