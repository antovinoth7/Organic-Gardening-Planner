/**
 * Sentry Testing Utilities
 * Helper functions to test Sentry integration in development
 */

import * as Sentry from "@sentry/react-native";

export const testSentryLogging = {
  /**
   * Test info-level message
   */
  testInfo: () => {
    Sentry.captureMessage("Test info message from Settings", {
      level: "info",
      tags: { test_type: "info", source: "settings_test" },
      contexts: {
        test: {
          timestamp: new Date().toISOString(),
          purpose: "Development testing",
        },
      },
    });

    Sentry.addBreadcrumb({
      category: "test",
      message: "Info test triggered",
      level: "info",
    });

    if (__DEV__) {
      console.log("✅ Sentry info test sent");
    }
  },

  /**
   * Test warning-level message
   */
  testWarning: () => {
    Sentry.captureMessage("Test warning from Settings", {
      level: "warning",
      tags: { test_type: "warning", source: "settings_test" },
      contexts: {
        test: {
          timestamp: new Date().toISOString(),
          purpose: "Development testing",
        },
      },
    });

    Sentry.addBreadcrumb({
      category: "test",
      message: "Warning test triggered",
      level: "warning",
    });

    if (__DEV__) {
      console.log("⚠️  Sentry warning test sent");
    }
  },

  /**
   * Test error exception
   */
  testError: () => {
    const testError = new Error("Test error from Settings page");

    Sentry.captureException(testError, {
      tags: { test_type: "error", source: "settings_test" },
      contexts: {
        test: {
          timestamp: new Date().toISOString(),
          purpose: "Development testing",
          errorType: "intentional",
        },
      },
    });

    Sentry.addBreadcrumb({
      category: "test",
      message: "Error test triggered",
      level: "error",
    });

    if (__DEV__) {
      console.log("🔴 Sentry error test sent");
    }
  },

  /**
   * Test breadcrumb tracking
   */
  testBreadcrumbs: () => {
    // Add multiple breadcrumbs
    Sentry.addBreadcrumb({
      category: "navigation",
      message: "User opened Settings",
      level: "info",
    });

    Sentry.addBreadcrumb({
      category: "user",
      message: "User clicked test button",
      level: "info",
      data: {
        buttonId: "sentry_test",
      },
    });

    Sentry.addBreadcrumb({
      category: "test",
      message: "Testing breadcrumb chain",
      level: "info",
    });

    // Then send an event so breadcrumbs are visible
    Sentry.captureMessage("Breadcrumb test completed", {
      level: "info",
      tags: { test_type: "breadcrumbs" },
    });

    if (__DEV__) {
      console.log(
        "🍞 Sentry breadcrumbs test sent (check event for breadcrumb trail)"
      );
    }
  },

  /**
   * Test with custom context
   */
  testWithContext: () => {
    Sentry.setContext("app_state", {
      screen: "Settings",
      timestamp: new Date().toISOString(),
      testMode: true,
    });

    Sentry.setTag("test_feature", "context_test");

    Sentry.captureMessage("Test with custom context and tags", {
      level: "info",
      tags: { test_type: "context" },
      extra: {
        customData: {
          userAction: "test_context",
          deviceInfo: "React Native",
        },
      },
    });

    if (__DEV__) {
      console.log(
        "📊 Sentry context test sent (check for custom context in event)"
      );
    }
  },

  /**
   * Test production logging (gated by env flag in UI)
   */
  testProduction: async () => {
    const timestamp = new Date().toISOString();

    Sentry.captureMessage(`Production test ping ${timestamp}`, {
      level: "info",
      tags: { test_type: "production", source: "settings_test" },
      contexts: {
        test: {
          timestamp,
          purpose: "Production verification",
        },
      },
    });

    try {
      await Sentry.flush();
    } catch {
      // Ignore flush errors to avoid blocking UI
    }
  },
};
