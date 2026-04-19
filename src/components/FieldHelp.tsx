import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { createStyles } from "../styles/fieldHelpStyles";

interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  description: string;
  title?: string;
  accessibilityLabel?: string;
  compact?: boolean;
}

const SCREEN_PADDING = 16;
const VERTICAL_OFFSET = 10;
const DEFAULT_POPOVER_WIDTH = 260;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function FieldHelp({
  description,
  title,
  accessibilityLabel,
  compact = false,
}: Props): React.JSX.Element | null {
  const trimmedDescription = description.trim();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const triggerRef = useRef<View>(null);
  const [visible, setVisible] = useState(false);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const [popoverHeight, setPopoverHeight] = useState(0);

  const closePopover = useCallback(() => {
    setVisible(false);
  }, []);

  const openPopover = useCallback(() => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchorRect({ x, y, width, height });
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    if (!visible) {
      setPopoverHeight(0);
    }
  }, [visible]);

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();
      if (!trimmedDescription) return;
      if (visible) {
        closePopover();
        return;
      }
      openPopover();
    },
    [closePopover, openPopover, trimmedDescription, visible],
  );

  const popoverPosition = useMemo(() => {
    if (!anchorRect) return null;

    const popoverWidth = Math.min(DEFAULT_POPOVER_WIDTH, windowWidth - SCREEN_PADDING * 2);
    const estimatedHeight = popoverHeight || 108;
    const spaceBelow =
      windowHeight - insets.bottom - SCREEN_PADDING - (anchorRect.y + anchorRect.height);
    const canShowAbove =
      anchorRect.y - estimatedHeight - VERTICAL_OFFSET > insets.top + SCREEN_PADDING;
    const shouldShowAbove = spaceBelow < estimatedHeight && canShowAbove;

    const top = shouldShowAbove
      ? anchorRect.y - estimatedHeight - VERTICAL_OFFSET
      : anchorRect.y + anchorRect.height + VERTICAL_OFFSET;
    const left = clamp(
      anchorRect.x + anchorRect.width / 2 - popoverWidth / 2,
      SCREEN_PADDING,
      windowWidth - SCREEN_PADDING - popoverWidth,
    );

    return {
      top: clamp(
        top,
        insets.top + SCREEN_PADDING,
        windowHeight - insets.bottom - SCREEN_PADDING - estimatedHeight,
      ),
      left,
      width: popoverWidth,
    };
  }, [anchorRect, insets.bottom, insets.top, popoverHeight, windowHeight, windowWidth]);

  if (!trimmedDescription) {
    return null;
  }

  return (
    <>
      <View ref={triggerRef} collapsable={false} style={styles.anchor}>
        <TouchableOpacity
          accessibilityHint="Opens a help popover"
          accessibilityLabel={
            accessibilityLabel ??
            (title ? `More information about ${title}` : "More information")
          }
          accessibilityRole="button"
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handlePress}
          style={[styles.trigger, compact && styles.triggerCompact]}
        >
          <Ionicons
            name="information-circle-outline"
            size={compact ? 16 : 18}
            color={theme.textTertiary}
          />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="fade"
        hardwareAccelerated
        onRequestClose={closePopover}
        statusBarTranslucent
        transparent
        visible={visible}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closePopover} />
          {popoverPosition ? (
            <View
              onLayout={(event) => setPopoverHeight(event.nativeEvent.layout.height)}
              style={[
                styles.popover,
                {
                  left: popoverPosition.left,
                  top: popoverPosition.top,
                  width: popoverPosition.width,
                },
              ]}
            >
              {title ? <Text style={styles.popoverTitle}>{title}</Text> : null}
              <Text style={styles.popoverText}>{trimmedDescription}</Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}