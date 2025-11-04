'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card } from '@/components/common/Card';
import { PageHeader } from '@/components/common/PageHeader';
import { SegmentedToggle } from '@/components/common/SegmentedToggle';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { TradeListHeader } from '@/components/teachers/TradeListHeader';
import { CompactTradeRow } from '@/components/teachers/CompactTradeRow';
import { PaginationFooter } from '@/components/common/PaginationFooter';
import { isAuthenticated, getCurrentUser } from '@/services/authService';
import { storage } from '@/lib/storage';
import { Trade } from '@/types';
import { cn } from '@/lib/utils';

const STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'HINDUNILVR', 'ICICIBANK',
  'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'AXISBANK',
  'ASIANPAINT', 'MARUTI', 'TITAN', 'NESTLEIND', 'ULTRACEMCO',
  'SUNPHARMA', 'WIPRO', 'POWERGRID', 'ONGC', 'ADANIENT', 'NTPC',
  'JSWSTEEL', 'TATAMOTORS', 'HDFCLIFE', 'HCLTECH', 'BAJFINANCE',
];

const PAGE_SIZE_OPTIONS = [50, 100, 200, 300];

export default function TradingPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || '';

  const [formData, setFormData] = useState({
    stock: '',
    quantity: '',
    exchange: 'NSE' as 'NSE' | 'BSE',
    orderType: 'BUY' as 'BUY' | 'SELL',
    price: '',
  });

  const [stockSuggestions, setStockSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (teacherId) {
      // Load teacher's recent trades
      const allTrades = (storage.getItem('trades') || []) as Trade[];
      const teacherTrades = allTrades
        .filter((t) => t.teacherId === teacherId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentTrades(teacherTrades);
    }
  }, [teacherId]);

  // Stock autocomplete
  useEffect(() => {
    if (formData.stock.trim()) {
      const query = formData.stock.toUpperCase();
      const filtered = STOCKS.filter((stock) =>
        stock.startsWith(query)
      ).slice(0, 5);
      setStockSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setStockSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.stock]);

  if (!isAuthenticated() || !teacherId) {
    return null;
  }

  const handleChange = (field: string, value: string | 'NSE' | 'BSE' | 'BUY' | 'SELL') => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleStockSelect = (stock: string) => {
    setFormData((prev) => ({ ...prev, stock }));
    setShowSuggestions(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.stock.trim()) {
      newErrors.stock = 'Stock symbol is required';
    } else if (!STOCKS.includes(formData.stock.toUpperCase())) {
      newErrors.stock = 'Please select a valid stock';
    }

    if (!formData.quantity.trim()) {
      newErrors.quantity = 'Quantity is required';
    } else {
      const qty = parseInt(formData.quantity);
      if (isNaN(qty) || qty <= 0) {
        newErrors.quantity = 'Please enter a valid quantity';
      }
    }

    if (formData.price && formData.price.trim()) {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = 'Please enter a valid price';
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
      const allTrades = (storage.getItem('trades') || []) as Trade[];
      const newTrade: Trade = {
        id: `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        teacherId,
        teacherName: user?.name || 'Teacher',
        stock: formData.stock.toUpperCase(),
        quantity: parseInt(formData.quantity),
        price: formData.price ? parseFloat(formData.price) : undefined,
        type: formData.orderType,
        exchange: formData.exchange,
        status: 'pending',
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        pnl: 0, // Will be calculated later
      };

      allTrades.push(newTrade);
      storage.setItem('trades', allTrades);

      // Update recent trades
      const updatedTrades = [newTrade, ...recentTrades];
      setRecentTrades(updatedTrades);

      // Reset form
      setFormData({
        stock: '',
        quantity: '',
        exchange: 'NSE',
        orderType: 'BUY',
        price: '',
      });

      alert('Trade executed successfully!');
    } catch (error) {
      console.error('Error executing trade:', error);
      setErrors({ submit: 'Failed to execute trade. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paginate recent trades
  const paginatedTrades = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return recentTrades.slice(startIndex, startIndex + pageSize);
  }, [recentTrades, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(recentTrades.length / pageSize));

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(recentTrades.length / pageSize));
    setCurrentPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [recentTrades.length, pageSize]);

  return (
    <DashboardLayout title="Trading">
      <div className="space-y-6">
        {/* Trade Execution Form */}
        <Card padding="lg">
          <PageHeader title="Execute Trade" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
            {/* Stock Search with Autocomplete */}
              <div className="relative md:col-span-4">
                <div className="mb-1.5">
                  <label className="block text-sm font-medium text-neutral-700">
                    Stock Symbol <span className="text-danger-500">*</span>
                  </label>
                </div>
              <Input
                type="text"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value.toUpperCase())}
                onFocus={() => setShowSuggestions(true)}
                error={errors.stock}
                placeholder="Search stock (e.g., RELIANCE, TCS)"
                required
              />
              {showSuggestions && stockSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-neutral-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                  {stockSuggestions.map((stock) => (
                    <button
                      key={stock}
                      type="button"
                      onClick={() => handleStockSelect(stock)}
                      className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      {stock}
                    </button>
                  ))}
                </div>
              )}
            </div>

              {/* Quantity */}
              <div>
                <div className="mb-1.5">
                  <label className="block text-sm font-medium text-neutral-700">
                    Quantity <span className="text-danger-500">*</span>
                  </label>
                </div>
              <Input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                error={errors.quantity}
                placeholder="Number of shares"
                min="1"
                required
              />
              </div>

              {/* Price */}
              <div>
              <Input
                label="Price (Optional)"
                type="number"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                error={errors.price}
                placeholder="Limit price (optional)"
                min="0"
                step="0.01"
              />
            </div>

            {/* Exchange Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Exchange <span className="text-danger-500">*</span>
                </label>
                <SegmentedToggle
                  options={[
                    { value: 'NSE', label: 'NSE' },
                    { value: 'BSE', label: 'BSE' },
                  ]}
                  value={formData.exchange}
                  onChange={(value) => handleChange('exchange', value as 'NSE' | 'BSE')}
                  variant="primary"
                  />
            </div>

            {/* Order Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Order Type <span className="text-danger-500">*</span>
                </label>
                <SegmentedToggle
                  options={[
                    { value: 'BUY', label: 'BUY' },
                    { value: 'SELL', label: 'SELL' },
                  ]}
                  value={formData.orderType}
                  onChange={(value) => handleChange('orderType', value as 'BUY' | 'SELL')}
                  variant={(value) => (value === 'BUY' ? 'success' : 'danger')}
                />
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
                className={cn(
                  formData.orderType === 'BUY' && 'bg-success-600 hover:bg-success-700',
                  formData.orderType === 'SELL' && 'bg-danger-500 hover:bg-danger-600'
                )}
              >
                Execute {formData.orderType}
              </Button>
            </div>
          </form>
        </Card>

        {/* Recent Trades */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              Recent Trades
            </h3>
            <Button
              variant="ghost"
              onClick={() => router.push('/trading/history')}
              size="sm"
            >
              View All
            </Button>
          </div>

          {recentTrades.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              No trades yet. Execute your first trade above.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              <TradeListHeader />
              <div className="divide-y divide-neutral-100">
                {paginatedTrades.slice(0, 5).map((trade) => (
                  <CompactTradeRow key={trade.id} trade={trade} />
                ))}
              </div>
              {recentTrades.length > 5 && (
                <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3 text-center">
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/trading/history')}
                    size="sm"
                  >
                    View All {recentTrades.length} Trades
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

      </div>
    </DashboardLayout>
  );
}

