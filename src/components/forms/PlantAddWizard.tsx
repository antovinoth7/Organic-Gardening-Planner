import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlantFormStateReturn } from "../../hooks/usePlantFormState";
import { createStyles } from "../../styles/plantFormStyles";
import { createWizardStyles } from "../../styles/plantAddWizardStyles";
import { WizardStep1 } from "./WizardStep1";
import { WizardStep2 } from "./WizardStep2";
import { WizardStep3 } from "./WizardStep3";

interface Props {
  formState: PlantFormStateReturn;
}

const STEP_LABELS = ["What", "Where", "How"];

export function PlantAddWizard({ formState }: Props): React.JSX.Element {
  const {
    theme,
    insets,
    wizardStep,
    slideX,
    slideOpacity,
    runSlideTransition,
    getWizardStepErrors,
    handleSave,
    navigateToPlantsAfterSave,
    loading,
    hasUnsavedChanges,
    handleBackPress,
  } = formState;

  const [stepError, setStepError] = useState<string | null>(null);
  const [saveBannerVisible, setSaveBannerVisible] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wizardStyles = useMemo(() => createWizardStyles(theme), [theme]);
  const formStyles = useMemo(() => createStyles(theme), [theme]);

  const showBanner = useCallback(() => {
    setSaveBannerVisible(true);
    bannerOpacity.setValue(1);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => {
      Animated.timing(bannerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setSaveBannerVisible(false);
        navigateToPlantsAfterSave();
      });
    }, 3100);
  }, [bannerOpacity, navigateToPlantsAfterSave]);

  const handleNext = useCallback(() => {
    const error = getWizardStepErrors(wizardStep);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    if (wizardStep < 3) {
      runSlideTransition("forward", (wizardStep + 1) as 2 | 3);
    }
  }, [wizardStep, getWizardStepErrors, runSlideTransition]);

  const handleBack = useCallback(() => {
    setStepError(null);
    if (wizardStep > 1) {
      runSlideTransition("back", (wizardStep - 1) as 1 | 2);
    } else {
      handleBackPress();
    }
  }, [wizardStep, runSlideTransition, handleBackPress]);

  const handleWizardSave = useCallback(() => {
    const error = getWizardStepErrors(3);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    handleSave(showBanner);
  }, [getWizardStepErrors, handleSave, showBanner]);

  return (
    <View style={wizardStyles.root}>
      <View style={[formStyles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={formStyles.headerIconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={wizardStep > 1 ? "chevron-back" : "close"}
            size={22}
            color={theme.textInverse}
          />
        </TouchableOpacity>
        <View style={formStyles.headerCenter}>
          <Text style={formStyles.title}>Add Plant</Text>
          {hasUnsavedChanges && <View style={formStyles.unsavedDot} />}
        </View>
        <View style={wizardStyles.wizardHeaderSpacer} />
      </View>

      <View style={wizardStyles.stepRow}>
        {STEP_LABELS.map((label, i) => {
          const step = (i + 1) as 1 | 2 | 3;
          const isActive = wizardStep === step;
          const isComplete = wizardStep > step;
          return (
            <React.Fragment key={step}>
              <View style={wizardStyles.stepCol}>
                <View
                  style={[
                    wizardStyles.stepDot,
                    isActive && wizardStyles.stepDotActive,
                    isComplete && wizardStyles.stepDotComplete,
                  ]}
                />
                <Text
                  style={[
                    wizardStyles.stepLabel,
                    isActive && wizardStyles.stepLabelActive,
                    isComplete && wizardStyles.stepLabelComplete,
                  ]}
                >
                  {label}
                </Text>
              </View>
              {i < STEP_LABELS.length - 1 && (
                <View
                  style={[
                    wizardStyles.stepConnector,
                    isComplete && wizardStyles.stepConnectorFilled,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={wizardStyles.stepContent}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={wizardStyles.stepScrollContent}
        >
          <Animated.View
            style={{
              opacity: slideOpacity,
              transform: [{ translateX: slideX }],
            }}
          >
            {wizardStep === 1 ? (
              <WizardStep1 formState={formState} />
            ) : wizardStep === 2 ? (
              <WizardStep2 formState={formState} />
            ) : (
              <WizardStep3 formState={formState} />
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View>
        {saveBannerVisible && (
          <Animated.View
            style={[wizardStyles.saveBanner, { opacity: bannerOpacity }]}
          >
            <Ionicons name="checkmark-circle" size={22} color={theme.success} />
            <Text style={wizardStyles.saveBannerText}>
              Plant saved! Going to your plants in a moment...
            </Text>
          </Animated.View>
        )}
        {stepError ? (
          <Text style={wizardStyles.stepErrorText}>{stepError}</Text>
        ) : null}
        <View
          style={[
            wizardStyles.wizardNavBar,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          <Text style={wizardStyles.wizardStepCounter}>
            {wizardStep} / {STEP_LABELS.length}
          </Text>

          {wizardStep === 3 ? (
            <TouchableOpacity
              style={[
                wizardStyles.wizardSaveBtn,
                loading && wizardStyles.wizardSaveBtnDisabled,
              ]}
              onPress={handleWizardSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={wizardStyles.wizardNextText}>
                {loading ? "Saving..." : "Save Plant"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={wizardStyles.wizardNextBtn}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={wizardStyles.wizardNextText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
