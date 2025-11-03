'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, ArrowUpTrayIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/common/Table';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { bulkCreateStudents } from '@/services/studentService';
import { cn } from '@/lib/utils';

interface CSVRow {
  name: string;
  email: string;
  mobile: string;
  phone?: string;
  initialCapital?: number;
  riskPercentage?: number;
  strategy?: string;
  status?: 'active' | 'inactive';
}

export default function BulkUploadPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<Array<{ row: number; error: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    created: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthenticated() || !teacherId) {
    return null;
  }

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const requiredHeaders = ['name', 'email', 'mobile'];
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const rows: CSVRow[] = [];
    const rowErrors: Array<{ row: number; error: string }> = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (values.length !== headers.length) {
        rowErrors.push({
          row: i + 1,
          error: `Row has ${values.length} columns but expected ${headers.length}`,
        });
        continue;
      }

      const row: CSVRow = {
        name: '',
        email: '',
        mobile: '',
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        switch (header) {
          case 'name':
            row.name = value;
            break;
          case 'email':
            row.email = value.toLowerCase();
            break;
          case 'mobile':
            row.mobile = value;
            break;
          case 'phone':
            row.phone = value || undefined;
            break;
          case 'initialcapital':
          case 'initial_capital':
            row.initialCapital = value ? parseFloat(value) : undefined;
            break;
          case 'riskpercentage':
          case 'risk_percentage':
            row.riskPercentage = value ? parseFloat(value) : undefined;
            break;
          case 'strategy':
            row.strategy = value || undefined;
            break;
          case 'status':
            row.status = value === 'active' || value === 'inactive' ? value : undefined;
            break;
        }
      });

      // Validate required fields
      if (!row.name || !row.email || !row.mobile) {
        rowErrors.push({
          row: i + 1,
          error: 'Missing required fields: name, email, or mobile',
        });
        continue;
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        rowErrors.push({
          row: i + 1,
          error: `Invalid email format: ${row.email}`,
        });
        continue;
      }

      // Validate mobile format
      if (!/^[6-9]\d{9}$/.test(row.mobile)) {
        rowErrors.push({
          row: i + 1,
          error: `Invalid mobile number: ${row.mobile}`,
        });
        continue;
      }

      rows.push(row);
    }

    if (rowErrors.length > 0) {
      setErrors(rowErrors);
    } else {
      setErrors([]);
    }

    return rows;
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setCsvData([]);
    setErrors([]);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setCsvData(parsed);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to parse CSV file');
        setFile(null);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleUpload = async () => {
    if (csvData.length === 0) {
      alert('Please upload a valid CSV file first');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const studentData = csvData.map((row) => ({
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        phone: row.phone,
        status: (row.status || 'active') as 'active' | 'inactive',
        initialCapital: row.initialCapital || 0,
        currentCapital: row.initialCapital || 0,
        riskPercentage: row.riskPercentage || 10,
        strategy: row.strategy,
      }));

      const result = bulkCreateStudents(studentData, teacherId);
      setUploadResult(result);

      if (result.created.length > 0) {
        // Show success message and redirect after a delay
        setTimeout(() => {
          router.push('/students');
        }, 2000);
      }
    } catch (error) {
      console.error('Error uploading students:', error);
      alert('Failed to upload students. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DashboardLayout title="Bulk Upload Students">
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
            Bulk Upload Students
          </h2>

          {/* File Upload */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Upload CSV File
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {file && (
                  <span className="text-sm text-neutral-600">{file.name}</span>
                )}
              </div>
              <p className="mt-2 text-xs text-neutral-500">
                CSV file should have columns: name, email, mobile (required), phone, initialCapital, riskPercentage, strategy, status (optional)
              </p>
            </div>
          </div>

          {/* CSV Preview */}
          {csvData.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-4">
                Preview ({csvData.length} students)
              </h3>
              <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead className="text-right">Capital</TableHead>
                      <TableHead className="text-right">Risk %</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 10).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.mobile}</TableCell>
                        <TableCell className="text-right">
                          {row.initialCapital ? `₹${row.initialCapital.toLocaleString('en-IN')}` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.riskPercentage ? `${row.riskPercentage}%` : '-'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                              row.status === 'active'
                                ? 'bg-success-100 text-success-700'
                                : 'bg-neutral-100 text-neutral-700'
                            )}
                          >
                            {row.status || 'active'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {csvData.length > 10 && (
                  <div className="px-4 py-3 text-sm text-neutral-500 border-t border-neutral-200">
                    Showing first 10 of {csvData.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-6 rounded-lg border border-danger-200 bg-danger-50 p-4">
              <h4 className="text-sm font-medium text-danger-900 mb-2">
                Validation Errors ({errors.length})
              </h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {errors.map((error, index) => (
                  <div key={index} className="text-xs text-danger-700">
                    Row {error.row}: {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult && (
            <div
              className={cn(
                'mb-6 rounded-lg border p-4',
                uploadResult.created.length > 0
                  ? 'border-success-200 bg-success-50'
                  : 'border-danger-200 bg-danger-50'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {uploadResult.created.length > 0 ? (
                  <CheckIcon className="h-5 w-5 text-success-600" />
                ) : (
                  <XMarkIcon className="h-5 w-5 text-danger-600" />
                )}
                <h4
                  className={cn(
                    'text-sm font-medium',
                    uploadResult.created.length > 0
                      ? 'text-success-900'
                      : 'text-danger-900'
                  )}
                >
                  Upload {uploadResult.created.length > 0 ? 'Success' : 'Failed'}
                </h4>
              </div>
              <div className="text-sm text-neutral-700">
                <p>
                  Created: {uploadResult.created.length} student
                  {uploadResult.created.length !== 1 ? 's' : ''}
                </p>
                {uploadResult.errors.length > 0 && (
                  <p className="mt-1 text-danger-700">
                    Errors: {uploadResult.errors.length} row
                    {uploadResult.errors.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              loading={isUploading}
              disabled={csvData.length === 0 || errors.length > 0 || isUploading}
              icon={<ArrowUpTrayIcon className="h-4 w-4" />}
            >
              Upload Students
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

