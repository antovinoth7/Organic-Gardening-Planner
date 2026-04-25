/**
 * Theme colors for dark and light mode
 */

export const lightTheme = {
  // Background colors
  background: '#faf6f0',
  backgroundSecondary: '#ffffff',
  backgroundTertiary: '#edf7f2',

  // Text colors
  text: '#1a110a',
  textSecondary: '#4a3828',
  textTertiary: '#7a6858',
  textInverse: '#ffffff',

  // Primary colors
  primary: '#1a4a2e',
  primaryLight: '#edf7f2',
  primaryDark: '#0f2d1a',

  // Accent colors
  accent: '#c8842a',
  accentLight: '#fff8ed',

  // Border colors
  border: '#e8ddd4',
  borderLight: '#f0e8dc',
  borderDark: '#ddd0c4',
  
  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  warningLight: '#fff3e0',
  errorLight: '#ffebee',
  coconut: '#8B5A2B',
  
  // Special colors
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000',

  // Card & button
  card: '#ffffff',
  buttonText: '#ffffff',
  
  // Input colors
  inputBackground: '#ffffff',
  inputText: '#1a1a1a',
  inputPlaceholder: '#7a6858',
  inputBorder: '#e8ddd4',

  // Picker colors
  pickerBackground: '#ffffff',
  pickerText: '#1a110a',
  pickerBorder: '#e8ddd4',

  // Tab bar
  tabBarActive: '#1a4a2e',
  tabBarInactive: '#7a6858',
  tabBarBackground: '#faf6f0',
};

export const darkTheme = {
  // Background colors
  background: '#121212',
  backgroundSecondary: '#1a1a1a',
  backgroundTertiary: '#2d4a2e',
  
  // Text colors
  text: '#fafafa',
  textSecondary: '#d6d6d6',
  textTertiary: '#b8b8b8',
  textInverse: '#ffffff',
  
  // Primary colors
  primary: '#4caf50',
  primaryLight: '#2d4a2e',
  primaryDark: '#66bb6a',

  // Accent colors
  accent: '#e08b4f',
  accentLight: '#55321b',
  
  // Border colors
  border: '#404040',
  borderLight: '#333333',
  borderDark: '#505050',
  
  // Status colors
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350',
  info: '#42a5f5',
  warningLight: '#4a3a1f',
  errorLight: '#4a1f1f',
  coconut: '#A67B5B',
  
  // Special colors
  overlay: 'rgba(0,0,0,0.8)',
  shadow: '#000',

  // Card & button
  card: '#1e1e1e',
  buttonText: '#ffffff',
  
  // Input colors
  inputBackground: '#222',
  inputText: '#f5f5f5',
  inputPlaceholder: '#b0b0b0',
  inputBorder: '#404040',
  
  // Picker colors
  pickerBackground: '#2a2a2a',
  pickerText: '#e0e0e0',
  pickerBorder: '#404040',
  
  // Tab bar
  tabBarActive: '#4caf50',
  tabBarInactive: '#808080',
  tabBarBackground: '#1e1e1e',
};

export type Theme = typeof lightTheme;
