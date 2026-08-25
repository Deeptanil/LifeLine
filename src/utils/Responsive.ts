import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Guideline sizes are based on standard iPhone width (375)
const guidelineBaseWidth = 375;

const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

/**
 * RF (Responsive Factor) - Scales font size based on screen width.
 * @param size The desired font size for a 375px wide screen.
 */
export function RF(size: number) {
  const newSize = scale(size);
  
  // Platform specific adjustment: iOS screens are often narrower/denser 
  // and the user perceives the text as too large there.
  let finalSize = Platform.OS === 'ios' ? newSize * 0.9 : newSize;
  
  // Subtle adjustment for tablets to avoid overly large text
  if (SCREEN_WIDTH > 500) {
    finalSize = finalSize * 0.85;
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(finalSize));
}
