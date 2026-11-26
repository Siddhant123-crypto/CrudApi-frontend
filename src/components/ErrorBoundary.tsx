import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import i18n from '../i18n';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Global React ErrorBoundary (BUG-M16) protecting the navigation & provider tree from
 * uncaught render/lifecycle crashes. Displays a safe recovery UI with zero stack/token leakage.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    const errorType = error?.name || 'Error';
    const firstFrame = info?.componentStack
      ? info.componentStack
          .split('\n')
          .map(line => line.trim())
          .find(Boolean) || ''
      : '';
    // Log only non-sensitive diagnostic type and top component boundary (never error bodies, props, or tokens)
    console.error(`[ErrorBoundary] Caught render error (${errorType}) at ${firstFrame}`);
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.badge}>Farm2Home</Text>
            <Text style={styles.title}>
              {i18n.t('common.error', { defaultValue: 'Error' })}
            </Text>
            <Text style={styles.subtitle}>
              {i18n.t('errors.generic', {
                defaultValue: 'Something went wrong. Please try again.',
              })}
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={i18n.t('common.retry', { defaultValue: 'Retry' })}
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.85}
            >
              <Text style={styles.buttonText}>
                {i18n.t('common.retry', { defaultValue: 'Retry' })}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E8DFD1',
    alignItems: 'center',
  },
  badge: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A23A14',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#221C18',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F554D',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#A23A14',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
