/**
 * Theme colors for dark and light mode
 */

export const lightTheme = {
  // Background colors
  background: '#f5f5f5',
  backgroundSecondary: '#fff',
  backgroundTertiary: '#e8f5e9',
  
  // Text colors
  text: '#333',
  textSecondary: '#666',
  textTertiary: '#999',
  textInverse: '#fff',
  
  // Primary colors
  primary: '#2e7d32',
  primaryLight: '#e8f5e9',
  primaryDark: '#1b5e20',
  
  // Border colors
  border: '#ddd',
  borderLight: '#eee',
  borderDark: '#e0e0e0',
  
  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // Special colors
  overlay: 'rgba(0,0,0,0.5)',
  shadow: '#000',
  
  // Input colors
  inputBackground: '#fff',
  inputText: '#333',
  inputPlaceholder: '#999',
  inputBorder: '#ddd',
  
  // Picker colors
  pickerBackground: '#fff',
  pickerText: '#333',
  pickerBorder: '#ddd',
  
  // Tab bar
  tabBarActive: '#2e7d32',
  tabBarInactive: 'gray',
  tabBarBackground: '#fff',
};

export const darkTheme = {
  // Background colors
  background: '#121212',
  backgroundSecondary: '#1e1e1e',
  backgroundTertiary: '#2d4a2e',
  
  // Text colors
  text: '#e0e0e0',
  textSecondary: '#b0b0b0',
  textTertiary: '#808080',
  textInverse: '#000',
  
  // Primary colors
  primary: '#4caf50',
  primaryLight: '#2d4a2e',
  primaryDark: '#66bb6a',
  
  // Border colors
  border: '#404040',
  borderLight: '#333',
  borderDark: '#505050',
  
  // Status colors
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350',
  info: '#42a5f5',
  
  // Special colors
  overlay: 'rgba(0,0,0,0.8)',
  shadow: '#000',
  
  // Input colors
  inputBackground: '#2a2a2a',
  inputText: '#e0e0e0',
  inputPlaceholder: '#808080',
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
