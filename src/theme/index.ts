import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, Theme } from './colors';

export const useTheme = (): Theme => {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};
