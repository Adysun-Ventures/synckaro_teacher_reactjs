'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Toggle } from '@/components/common/Toggle';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { createStudent } from '@/services/studentService';
import { cn } from '@/lib/utils';

export default function CreateStudentPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    phone: '',
    brokerName: '',
    brokerApiKey: '',
    brokerApiSecret: '',
    initialCapital: '',
    riskPercentage: '10',
    strategy: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated() || !teacherId) {
    return null;
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (formData.initialCapital) {
      const capital = parseFloat(formData.initialCapital);
      if (isNaN(capital) || capital < 0) {
        newErrors.initialCapital = 'Please enter a valid positive number';
      }
    }

    if (formData.riskPercentage) {
      const risk = parseFloat(formData.riskPercentage);
      if (isNaN(risk) || risk < 0 || risk > 100) {
        newErrors.riskPercentage = 'Risk percentage must be between 0 and 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const studentData = {
        teacherId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        phone: formData.phone.trim() || undefined,
        status: formData.isActive ? ('active' as const) : ('inactive' as const),
        initialCapital: formData.initialCapital ? parseFloat(formData.initialCapital) : 0,
        currentCapital: formData.initialCapital ? parseFloat(formData.initialCapital) : 0,
        riskPercentage: formData.riskPercentage ? parseFloat(formData.riskPercentage) : 10,
        strategy: formData.strategy.trim() || undefined,
      };

      createStudent(studentData);

      // Redirect to students list
      router.push('/students');
    } catch (error) {
      console.error('Error creating student:', error);
      setErrors({ submit: 'Failed to create student. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create Student">
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
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">
            Create New Student
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4">
                Personal Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Name *"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Enter student name"
                  required
                />
                <Input
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={errors.email}
                  placeholder="student@example.com"
                  required
                />
                <Input
                  label="Mobile *"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  error={errors.mobile}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  required
                />
                <Input
                  label="Phone (Optional)"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Alternative phone number"
                />
              </div>
            </div>

            {/* Broker Configuration */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4">
                Broker Configuration
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Broker Name"
                  type="text"
                  value={formData.brokerName}
                  onChange={(e) => handleChange('brokerName', e.target.value)}
                  placeholder="e.g., Zerodha, Upstox, Angel One"
                />
                <Input
                  label="API Key"
                  type="text"
                  value={formData.brokerApiKey}
                  onChange={(e) => handleChange('brokerApiKey', e.target.value)}
                  placeholder="Broker API key"
                />
                <Input
                  label="API Secret"
                  type="password"
                  value={formData.brokerApiSecret}
                  onChange={(e) => handleChange('brokerApiSecret', e.target.value)}
                  placeholder="Broker API secret"
                />
              </div>
            </div>

            {/* Trading Configuration */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4">
                Trading Configuration
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Initial Capital (₹)"
                  type="number"
                  value={formData.initialCapital}
                  onChange={(e) => handleChange('initialCapital', e.target.value)}
                  error={errors.initialCapital}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <Input
                  label="Risk Percentage (%)"
                  type="number"
                  value={formData.riskPercentage}
                  onChange={(e) => handleChange('riskPercentage', e.target.value)}
                  error={errors.riskPercentage}
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <div className="md:col-span-2">
                  <Input
                    label="Trading Strategy"
                    type="text"
                    value={formData.strategy}
                    onChange={(e) => handleChange('strategy', e.target.value)}
                    placeholder="e.g., Swing Trading, Day Trading"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4">
                Status
              </h3>
              <div className="flex items-center gap-3">
                <Toggle
                  enabled={formData.isActive}
                  onChange={(enabled) => handleChange('isActive', enabled)}
                  label="Active Status"
                />
                <span className="text-sm text-neutral-600">
                  {formData.isActive ? 'Student will be active' : 'Student will be inactive'}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-sm text-danger-700">
                {errors.submit}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                Create Student
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}

