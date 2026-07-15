// src/components/LongPressHint.js
//
// A WhatsApp-style long-press callout. Wrap any element with this and
// pass a `text` prop — on long-press, a small bubble pops up next to it
// explaining what it does. No permanent UI clutter, no extra icons.
//
// Usage:
//   <LongPressHint text="Your current search location — tap to change">
//     <View style={styles.locationPill}>...</View>
//   </LongPressHint>
//
// Works with any child (View, TouchableOpacity, etc). The child keeps its
// own onPress — long-press and tap don't conflict.

import React, { useRef, useState, cloneElement } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
    findNodeHandle,
    UIManager,
    Modal,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    Easing,
} from "react-native-reanimated";
import { COLORS } from "../constants";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BUBBLE_MAX_WIDTH = 240;
const BUBBLE_MARGIN = 30; // gap between target and bubble
const SCREEN_PADDING = 14; // keep bubble away from screen edges

export default function LongPressHint({
    text,
    children,
    disabled = false,
    delayLongPress = 350,
}) {
    const wrapperRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const [layout, setLayout] = useState(null); // measured position of the child
    const [placement, setPlacement] = useState("below"); // "above" | "below"

    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.92);
    const translateY = useSharedValue(4);

    function show() {
        if (disabled || !text) return;

        const handle = findNodeHandle(wrapperRef.current);
        if (!handle) return;

        UIManager.measureInWindow(handle, (x, y, width, height) => {
            // Decide whether the bubble fits below; otherwise place it above.
            const spaceBelow = SCREEN_HEIGHT - (y + height);
            const goesBelow = spaceBelow > 90;

            setPlacement(goesBelow ? "below" : "above");
            setLayout({ x, y, width, height });
            setVisible(true);

            opacity.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.ease) });
            scale.value = withSpring(1, { damping: 14, stiffness: 180 });
            translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
        });
    }

    function hide() {
        opacity.value = withTiming(0, { duration: 120 });
        scale.value = withTiming(0.92, { duration: 120 });
        // Unmount slightly after the fade completes
        setTimeout(() => setVisible(false), 130);
    }

    const bubbleAnimStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
    }));

    // ── Compute bubble position, clamped to screen bounds ──
    let bubbleStyle = {};
    let arrowStyle = {};
    let arrowPointsUp = placement === "below";

    if (layout) {
        const centerX = layout.x + layout.width / 2;
        let left = centerX - BUBBLE_MAX_WIDTH / 2;
        left = Math.max(SCREEN_PADDING, Math.min(left, SCREEN_WIDTH - BUBBLE_MAX_WIDTH - SCREEN_PADDING));

        const top =
            placement === "below"
                ? layout.y + layout.height + BUBBLE_MARGIN
                : layout.y - BUBBLE_MARGIN;

        bubbleStyle = {
            position: "absolute",
            left,
            top: placement === "below" ? top : undefined,
            bottom: placement === "above" ? SCREEN_HEIGHT - top : undefined,
            width: BUBBLE_MAX_WIDTH,
        };

        // Arrow should point at the target's horizontal center, clamped within the bubble
        const arrowLeft = Math.max(16, Math.min(centerX - left - 6, BUBBLE_MAX_WIDTH - 28));
        arrowStyle = {
            left: arrowLeft,
            ...(arrowPointsUp ? { top: -6 } : { bottom: -6 }),
        };
    }

    // Instead of wrapping the child in our own touchable (which would steal
    // the gesture from the child's own TouchableOpacity/Pressable), we clone
    // the child and merge our long-press handlers directly onto it. This way
    // there's only ONE interactive element, so both tap and long-press work.
    const childOnLongPress = children.props.onLongPress;
    const childOnPressOut = children.props.onPressOut;

    const mergedChild = cloneElement(children, {
        ref: wrapperRef,
        delayLongPress,
        onLongPress: (e) => {
            show();
            childOnLongPress?.(e);
        },
        onPressOut: (e) => {
            hide();
            childOnPressOut?.(e);
        },
    });

    return (
        <>
            {mergedChild}

            {visible && layout && (
                <Modal transparent visible animationType="none" statusBarTranslucent>
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        {/* Dimmed backdrop — subtle, just enough to draw focus to the bubble */}
                        <Animated.View
                            style={[styles.backdrop, { opacity: opacity.value * 0.15 }]}
                            pointerEvents="none"
                        />

                        <Animated.View style={[styles.bubble, bubbleStyle, bubbleAnimStyle]}>
                            <View style={[styles.arrow, arrowPointsUp ? styles.arrowUp : styles.arrowDown, arrowStyle]} />
                            <Text style={styles.bubbleText}>{text}</Text>
                        </Animated.View>
                    </View>
                </Modal>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#000",
    },
    bubble: {
        backgroundColor: COLORS.dark,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    bubbleText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 18,
    },
    arrow: {
        position: "absolute",
        width: 12,
        height: 12,
        backgroundColor: COLORS.dark,
        transform: [{ rotate: "45deg" }],
    },
    arrowUp: {
        // sits at the top edge of the bubble, pointing up toward the target
    },
    arrowDown: {
        // sits at the bottom edge of the bubble, pointing down toward the target
    },
});