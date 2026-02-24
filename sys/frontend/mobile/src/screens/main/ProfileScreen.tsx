/**
 * Profile Screen
 * User profile and settings
 */
import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from '../../components/icons/Icon';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  logout,
  fetchUserProfile,
  selectUser,
  selectAuthLoading,
} from '../../store/slices/authSlice';
import {RootStackParamList} from '../../navigation/RootNavigator';
import {colors, spacing, fontSize} from '../../theme';
import {Button, LoadingSpinner} from '../../components';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector(selectUser);
  const loading = useAppSelector(selectAuthLoading);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      await dispatch(fetchUserProfile()).unwrap();
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await dispatch(logout()).unwrap();
            } catch {
              // logout API may fail but we still want to navigate out
            }
            navigation.reset({index: 0, routes: [{name: 'Login'}]});
          },
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Profile editing will be available soon!');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && !user) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username || 'Unknown User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user?.username || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {user?.created_at ? formatDate(user.created_at) : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.actionCard} onPress={handleEditProfile}>
          <Icon name="create-outline" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Edit Profile</Text>
          <Icon name="chevron-forward" size={24} color={colors.gray[400]} />
        </TouchableOpacity>
      </View>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        fullWidth
        style={styles.logoutButton}
      />

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: fontSize['3xl'],
    fontWeight: '700',
    color: colors.white,
  },
  username: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  actionText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    fontWeight: '600',
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default ProfileScreen;
