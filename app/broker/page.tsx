'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { storage } from '@/lib/storage';
import { BrokerConfig } from '@/types';
import { cn } from '@/lib/utils';

const BROKER_PROVIDERS = [
  'Zerodha',
  'Upstox',
  'Angel One',
  'IIFL',
  'HDFC Securities',
  'ICICI Direct',
  'Other',
];

export default function BrokerPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [formData, setFormData] = useState({
    brokerProvider: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing' | null>(null);
  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (teacherId) {
      // Load existing broker config for teacher
      const allConfigs = (storage.getItem('brokerConfigs') || []) as BrokerConfig[];
      const config = allConfigs.find((c) => c.userId === teacherId);
      if (config) {
        setBrokerConfig(config);
        setFormData({
          brokerProvider: config.brokerProvider || '',
          apiKey: config.apiKey || '',
          apiSecret: config.apiSecret || '',
          accessToken: config.accessToken || '',
        });
        setConnectionStatus(config.isConnected ? 'connected' : 'disconnected');
      }
    }
  }, [teacherId]);

  if (!isAuthenticated() || !teacherId) {
    return null;
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    // Reset connection status when form changes
    if (connectionStatus === 'connected' || connectionStatus === 'disconnected') {
      setConnectionStatus(null);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brokerProvider.trim()) {
      newErrors.brokerProvider = 'Broker provider is required';
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = 'API key is required';
    }

    if (!formData.apiSecret.trim()) {
      newErrors.apiSecret = 'API secret is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }

    setIsTesting(true);
    setConnectionStatus('testing');

    // Simulate connection test
    setTimeout(() => {
      // For now, assume connection succeeds if all fields are filled
      const success = formData.apiKey.trim().length > 0 && formData.apiSecret.trim().length > 0;
      setConnectionStatus(success ? 'connected' : 'disconnected');
      setIsTesting(false);
    }, 2000);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const allConfigs = (storage.getItem('brokerConfigs') || []) as BrokerConfig[];
      const existingIndex = allConfigs.findIndex((c) => c.userId === teacherId);

      const config: BrokerConfig = {
        userId: teacherId,
        brokerProvider: formData.brokerProvider,
        apiKey: formData.apiKey,
        apiSecret: formData.apiSecret,
        accessToken: formData.accessToken || undefined,
        isConnected: connectionStatus === 'connected',
        lastChecked: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        allConfigs[existingIndex] = config;
      } else {
        allConfigs.push(config);
      }

      storage.setItem('brokerConfigs', allConfigs);
      setBrokerConfig(config);

      // Show success message
      alert('Broker configuration saved successfully!');
    } catch (error) {
      console.error('Error saving broker config:', error);
      setErrors({ submit: 'Failed to save broker configuration. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Broker Configuration">
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          icon={<ArrowLeftIcon className="h-4 w-4" />}
        >
          Back
        </Button>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Your Broker Configuration
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                Configure your broker credentials to execute trades
              </p>
            </div>
            {/* Connection Status */}
            {connectionStatus && (
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-success-600" />
                    <span className="text-sm font-medium text-success-700">Connected</span>
                  </>
                ) : connectionStatus === 'testing' ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                    <span className="text-sm font-medium text-neutral-700">Testing...</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-5 w-5 text-danger-600" />
                    <span className="text-sm font-medium text-danger-700">Disconnected</span>
                  </>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Broker Provider */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Broker Provider *
              </label>
              <select
                value={formData.brokerProvider}
                onChange={(e) => handleChange('brokerProvider', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 text-neutral-700 bg-white border rounded-lg transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-0',
                  errors.brokerProvider
                    ? 'border-danger-300 focus:ring-danger-500 focus:border-danger-500'
                    : 'border-neutral-300 focus:ring-primary-600 focus:border-primary-600'
                )}
                required
              >
                <option value="">Select broker provider</option>
                {BROKER_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
              {errors.brokerProvider && (
                <p className="mt-1.5 text-sm text-danger-600">{errors.brokerProvider}</p>
              )}
            </div>

            {/* API Key */}
            <Input
              label="API Key *"
              type="text"
              value={formData.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              error={errors.apiKey}
              placeholder="Enter your API key"
              required
            />

            {/* API Secret */}
            <Input
              label="API Secret *"
              type="password"
              value={formData.apiSecret}
              onChange={(e) => handleChange('apiSecret', e.target.value)}
              error={errors.apiSecret}
              placeholder="Enter your API secret"
              required
            />

            {/* Access Token (Optional) */}
            <Input
              label="Access Token (Optional)"
              type="text"
              value={formData.accessToken}
              onChange={(e) => handleChange('accessToken', e.target.value)}
              placeholder="OAuth access token (if applicable)"
              helperText="Required for OAuth-based broker connections"
            />

            {/* Error Message */}
            {errors.submit && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
                {errors.submit}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleTestConnection}
                loading={isTesting}
                disabled={isTesting || isSubmitting}
              >
                Test Connection
              </Button>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.back()}
                  disabled={isSubmitting || isTesting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={isSubmitting || isTesting}
                >
                  Save Configuration
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

