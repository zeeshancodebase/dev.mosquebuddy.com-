import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { COLORS } from "../constants";

const Input = forwardRef(function Input(
  {
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = "default",
    autoCapitalize = "none",
    autoCorrect = false,
    returnKeyType = "next",
    onSubmitEditing,
    error = null,
    hint = null,
    showToggle = false,
    leftIcon = null,
    editable = true,
    multiline = false,
    numberOfLines = 1,
    style = {},
  },
  ref
) {
  const [showText, setShowText] = useState(false);
  const borderColor = useRef(new Animated.Value(0)).current;

  function handleFocus() {
    Animated.timing(borderColor, {
      toValue: 1,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }

  function handleBlur() {
    Animated.timing(borderColor, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }

  const animatedBorderColor = borderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [
      error ? COLORS.error : COLORS.borderLight,
      error ? COLORS.error : COLORS.primary,
    ],
  });

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Animated.View
        style={[
          styles.container,
          { borderColor: animatedBorderColor },
          !editable && styles.containerDisabled,
          multiline && styles.containerMultiline,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          ref={ref}
          style={[
            styles.input,
            leftIcon && styles.inputWithLeft,
            showToggle && styles.inputWithRight,
            multiline && styles.inputMultiline,
          ]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />

        {showToggle && (
          <TouchableOpacity
            onPress={() => setShowText(!showText)}
            style={styles.toggleButton}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>{showText ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
});

export default Input;

import { forwardRef } from "react";

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
  },
  containerDisabled: {
    backgroundColor: COLORS.surface,
    opacity: 0.7,
  },
  containerMultiline: {
    height: "auto",
    minHeight: 100,
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    height: "100%",
  },
  inputWithLeft: {
    marginLeft: 4,
  },
  inputWithRight: {
    paddingRight: 8,
  },
  inputMultiline: {
    height: "auto",
    textAlignVertical: "top",
  },
  toggleButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 6,
    marginLeft: 2,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
    marginLeft: 2,
  },
});