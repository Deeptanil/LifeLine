import React from 'react';
import { Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';

interface WebSafeTouchableDismissProps {
  children: React.ReactNode;
}

/**
 * Disables TouchableWithoutFeedback click dismissal on Web so it doesn't steal clicks from inputs.
 */
export const WebSafeTouchableDismiss: React.FC<WebSafeTouchableDismissProps> = ({ children }) => {
  if (Platform.OS === 'web') return <>{children}</>;
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );
};

export default WebSafeTouchableDismiss;

