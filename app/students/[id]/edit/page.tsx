'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Toggle } from '@/components/common/Toggle';
import { ConfirmDialog } from '@/components/common/Modal';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { getStudent, updateStudent, deleteStudent } from '@/services/studentService';
import { Student } from '@/types';
import { cn } from '@/lib/utils';

const TRADING_STRATEGIES = ['Conservative', 'Moderate', 'Aggressive', 'Momentum', 'Swing'];

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [student, setStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    phone: '',
    brokerName: '',
    brokerApiKey: '',
    brokerApiSecret: '',
    initialCapital: '',
    currentCapital: '',
    riskPercentage: '10',
    strategy: '',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (studentId && teacherId) {
      const foundStudent = getStudent(studentId, teacherId);
      if (!foundStudent) {
        router.push('/students');
        return;
      }
      setStudent(foundStudent);
      setFormData({
        name: foundStudent.name || '',
        email: foundStudent.email || '',
        mobile: foundStudent.mobile || '',
        phone: '',
        brokerName: '',
        brokerApiKey: '',
        brokerApiSecret: '',
        initialCapital: (foundStudent.initialCapital || 0).toString(),
        currentCapital: (foundStudent.currentCapital || foundStudent.initialCapital || 0).toString(),
        riskPercentage: (foundStudent.riskPercentage || 10).toString(),
        strategy: foundStudent.strategy || '',
        isActive: foundStudent.status === 'active',
      });
    }
  }, [studentId, teacherId, router]);

  if (!isAuthenticated() || !teacherId || !student) {
    return null;
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (formData.currentCapital) {
      const capital = parseFloat(formData.currentCapital);
      if (isNaN(capital) || capital < 0) {
        newErrors.currentCapital = 'Please enter a valid positive number';
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
      const updateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        status: formData.isActive ? ('active' as const) : ('inactive' as const),
        initialCapital: formData.initialCapital ? parseFloat(formData.initialCapital) : 0,
        currentCapital: formData.currentCapital ? parseFloat(formData.currentCapital) : 0,
        riskPercentage: formData.riskPercentage ? parseFloat(formData.riskPercentage) : 10,
        strategy: formData.strategy.trim() || undefined,
      };

      updateStudent(studentId, updateData, teacherId);

      // Redirect to student details
      router.push(`/students/${studentId}`);
    } catch (error) {
      console.error('Error updating student:', error);
      setErrors({ submit: 'Failed to update student. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (studentId && teacherId) {
      deleteStudent(studentId, teacherId);
      router.push('/students');
    }
    setDeleteConfirmOpen(false);
  };

  return (
    <DashboardLayout title="Edit Student">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex h-9 items-center gap-2 rounded-3xl border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Edit Student
            </h2>
            <Button
              variant="danger"
              onClick={handleDelete}
              icon={<TrashIcon className="h-4 w-4" />}
            >
              Delete
            </Button>
          </div>

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
                  required
                />
                <Input
                  label="Email *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  error={errors.email}
                  required
                />
                <Input
                  label="Mobile *"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleChange('mobile', e.target.value)}
                  error={errors.mobile}
                  maxLength={10}
                  required
                />
                <Input
                  label="Phone (Optional)"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Trading Configuration */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4">
                Trading Configuration
              </h3>
              <div className="grid gap-4 md:grid-cols-4">
                <Input
                  label="Initial Capital (₹)"
                  type="number"
                  value={formData.initialCapital}
                  onChange={(e) => handleChange('initialCapital', e.target.value)}
                  error={errors.initialCapital}
                  min="0"
                  step="0.01"
                />
                <Input
                  label="Current Capital (₹)"
                  type="number"
                  value={formData.currentCapital}
                  onChange={(e) => handleChange('currentCapital', e.target.value)}
                  error={errors.currentCapital}
                  min="0"
                  step="0.01"
                />
                <Input
                  label="Risk Percentage (%)"
                  type="number"
                  value={formData.riskPercentage}
                  onChange={(e) => handleChange('riskPercentage', e.target.value)}
                  error={errors.riskPercentage}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Trading Strategy
                  </label>
                  <select
                    value={formData.strategy}
                    onChange={(e) => handleChange('strategy', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 text-neutral-700 bg-white border rounded-lg transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-offset-0',
                      'border-neutral-300 focus:ring-primary-600 focus:border-primary-600'
                    )}
                  >
                    <option value="">Select a strategy</option>
                    {TRADING_STRATEGIES.map((strategy) => (
                      <option key={strategy} value={strategy}>
                        {strategy}
                      </option>
                    ))}
                  </select>
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
                  {formData.isActive ? 'Student is active' : 'Student is inactive'}
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
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Student"
          message={`Are you sure you want to delete ${student?.name}? This action cannot be undone.`}
          danger
        />
      </div>
    </DashboardLayout>
  );
}

