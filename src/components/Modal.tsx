import React, { useEffect, useState } from 'react';
import { Platform, Modal as RNModal, ModalProps, View, StyleSheet } from 'react-native';
import ReactDOM from 'react-dom';

/**
 * Cross-platform Modal component.
 * On Native (iOS/Android): uses standard React Native Modal.
 * On Web: uses React Portal into '#phone-modal-root' inside the phone frame,
 * avoiding react-native-web's ModalFocusTrap freeze and full-window escape glitches.
 */
export const Modal: React.FC<ModalProps> = (props) => {
  const { visible = true, children, onRequestClose } = props;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && visible && onRequestClose && typeof document !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onRequestClose();
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onRequestClose]);

  if (Platform.OS !== 'web') {
    return <RNModal {...props} />;
  }

  if (!visible) return null;

  const content = (
    <View 
      style={[
        StyleSheet.absoluteFill, 
        { 
          zIndex: 99999, 
          elevation: 99999,
          display: 'flex',
          overflow: 'hidden',
          borderRadius: 40,
        }
      ]}
      pointerEvents="box-none"
    >
      {children}
    </View>
  );

  if (mounted && typeof document !== 'undefined') {
    const modalRoot = document.getElementById('phone-modal-root');
    if (modalRoot) {
      return ReactDOM.createPortal(content, modalRoot);
    }
  }

  return content;
};

export default Modal;

