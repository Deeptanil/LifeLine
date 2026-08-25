import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  hideBackButton?: boolean;
}

export function NavigationHeader({ title, subtitle, hideBackButton }: NavigationHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { C, isDark } = useTheme();

  // Hide header on home screen
  if (pathname === '/') return null;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const showBack = !hideBackButton;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mainRow}>
          {showBack && (
            <TouchableOpacity 
              onPress={handleBack} 
              style={[styles.backBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={C.textMain} />
            </TouchableOpacity>
          )}
          
          <Text style={[styles.title, { color: C.textMain }]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        
        {subtitle && (
          <Text style={[styles.subtitle, { color: C.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 100,
    paddingTop: Platform.OS === 'ios' ? 0 : 10,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: -2,
    opacity: 0.8,
    marginLeft: 44, // Align with the start of the title text (back button 32px + gap 12px)
  },
});
