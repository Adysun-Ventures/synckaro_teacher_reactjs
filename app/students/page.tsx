"use client";

import {
  useState,
  useEffect,
  useMemo,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  ArrowUpTrayIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { SearchBar } from "@/components/common/SearchBar";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Toggle } from "@/components/common/Toggle";
import { PaginationFooter } from "@/components/common/PaginationFooter";
import { ConfirmDialog } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/common/Button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/common/Table";
import { cn } from "@/lib/utils";
import { isAuthenticated, getCurrentUser } from "@/services/authService";
import {
  getStudents,
  toggleStudentStatus,
  deleteStudent,
} from "@/services/studentService";
import { Student } from "@/types";

const PAGE_SIZE_OPTIONS = [50, 100, 200, 300];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function StudentsPage() {
  const router = useRouter();
  const user = getCurrentUser();
  const teacherId = user?.id || "";

  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkStatusConfirm, setBulkStatusConfirm] = useState<
    "active" | "inactive" | null
  >(null);

  // Check auth
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Load students for teacher
  useEffect(() => {
    if (teacherId) {
      const teacherStudents = getStudents(teacherId);
      setStudents(teacherStudents);
    }
  }, [teacherId]);

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.mobile.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  // Paginate students
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredStudents.slice(startIndex, startIndex + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));

  // Select all toggle
  const handleSelectAll = () => {
    if (selectedIds.length === paginatedStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedStudents.map((s) => s.id));
    }
  };

  // Individual select toggle
  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePageSizeChange = (nextSize: number) => {
    setPageSize(nextSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
    setCurrentPage((prev) => (prev > maxPage ? maxPage : prev));
  }, [filteredStudents, pageSize]);

  // Delete single student
  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (studentToDelete && teacherId) {
      deleteStudent(studentToDelete.id, teacherId);
      const updatedStudents = students.filter(
        (s) => s.id !== studentToDelete.id
      );
      setStudents(updatedStudents);

      // Also remove from selected if present
      setSelectedIds((prev) => prev.filter((id) => id !== studentToDelete.id));
    }
    setDeleteConfirmOpen(false);
    setStudentToDelete(null);
  };

  // Bulk delete
  const handleBulkDeleteClick = () => {
    setBulkDeleteOpen(true);
  };

  const confirmBulkDelete = () => {
    if (teacherId) {
      selectedIds.forEach((id) => {
        deleteStudent(id, teacherId);
      });
      const updatedStudents = students.filter(
        (s) => !selectedIds.includes(s.id)
      );
      setStudents(updatedStudents);
      setSelectedIds([]);
      setBulkDeleteOpen(false);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Toggle individual student status
  const handleStatusToggle = (studentId: string, enabled: boolean) => {
    if (teacherId) {
      toggleStudentStatus(studentId, enabled, teacherId);
      const updatedStudents = students.map((s) =>
        s.id === studentId ? { ...s, status: (enabled ? "active" : "inactive") as Student['status'] } : s
      );
      setStudents(updatedStudents);
    }
  };

  // Bulk status update
  const handleBulkStatus = (status: "active" | "inactive") => {
    if (selectedIds.length === 0) return;
    setBulkStatusConfirm(status);
  };

  const applyBulkStatusUpdate = (status: "active" | "inactive") => {
    if (selectedIds.length === 0 || !teacherId) return;

    selectedIds.forEach((id) => {
      toggleStudentStatus(id, status === "active", teacherId);
    });

    const updatedStudents = students.map((student) =>
      selectedIds.includes(student.id)
        ? { ...student, status }
        : student
    );

    setStudents(updatedStudents);
    setSelectedIds([]);
    setBulkStatusConfirm(null);
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <DashboardLayout title="Students">
      <Card padding="lg" className="border border-neutral-200 bg-white">
        <div className="space-y-6">
          {/* Page Header with Title and Actions */}
          <div className="space-y-3">
            <PageHeader
              title="Students"
              rightContent={
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/students/create")}
                    icon={<PlusIcon className="h-4 w-4" />}
                  >
                    Add Student
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/students/bulk-upload")}
                    icon={<ArrowUpTrayIcon className="h-4 w-4" />}
                  >
                    Bulk Upload
                  </Button>
                </div>
              }
            />

            {/* Search Bar - Aligned to Right */}
            <div className="flex justify-end">
              <div className="w-full max-w-md">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search students..."
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          {/* Bulk Actions Toolbar */}
          {selectedIds.length > 0 && (
            <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-neutral-900">
                    {selectedIds.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBulkStatus("active")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Activate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus("inactive")}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Deactivate
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkDeleteClick}
                    className="inline-flex items-center gap-1.5 rounded-full border border-danger-200 bg-danger-50 px-3 py-1.5 text-sm font-semibold text-danger-700 transition-transform hover:scale-[1.02] hover:bg-danger-100 hover:text-danger-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="px-6 py-16">
                <EmptyState
                  title="No students found"
                  description={
                    searchQuery
                      ? "Try adjusting your search criteria"
                      : "Add your first student to get started"
                  }
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          paginatedStudents.length > 0 &&
                          selectedIds.length === paginatedStudents.length
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead className="text-right">Capital</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.map((student) => (
                    <TableRow
                      key={student.id}
                      className={
                        selectedIds.includes(student.id) ? "bg-primary-50" : ""
                      }
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(student.id)}
                          onChange={() => handleSelect(student.id)}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-neutral-900">
                        {student.name}
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {student.email}
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {student.mobile}
                      </TableCell>
                      <TableCell className="text-right font-medium text-neutral-900">
                        {formatCurrency(student.currentCapital || student.initialCapital || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* <StatusBadge status={student.status} /> */}
                          <Toggle
                            enabled={student.status === "active"}
                            onChange={(enabled) =>
                              handleStatusToggle(student.id, enabled)
                            }
                            className="ml-2"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/students/${student.id}`)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-primary-200 bg-primary-50 text-primary-600 transition-colors hover:bg-primary-100"
                            aria-label="View details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/students/${student.id}/edit`)
                            }
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100"
                            aria-label="Edit student"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(student)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-danger-200 bg-danger-50 text-danger-600 transition-colors hover:bg-danger-100"
                            aria-label="Delete student"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
          />
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Student"
          message={`Are you sure you want to delete ${studentToDelete?.name}? This action cannot be undone.`}
          danger
        />

        {/* Bulk Delete Confirmation Dialog */}
        <ConfirmDialog
          open={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          onConfirm={confirmBulkDelete}
          title="Delete Multiple Students"
          message={`Are you sure you want to delete ${
            selectedIds.length
          } student${
            selectedIds.length !== 1 ? "s" : ""
          }? This action cannot be undone.`}
          danger
        />

        {/* Bulk Status Confirmation Dialog */}
        <ConfirmDialog
          open={bulkStatusConfirm !== null}
          onClose={() => setBulkStatusConfirm(null)}
          onConfirm={() =>
            bulkStatusConfirm && applyBulkStatusUpdate(bulkStatusConfirm)
          }
          title={
            bulkStatusConfirm
              ? `Update Status to ${bulkStatusConfirm === "active" ? "Active" : "Inactive"}`
              : "Update Status"
          }
          message={
            bulkStatusConfirm
              ? `Are you sure you want to mark ${selectedIds.length} student${
                  selectedIds.length !== 1 ? "s" : ""
                } as ${bulkStatusConfirm === "active" ? "Active" : "Inactive"}?`
              : "Confirm status change."
          }
          danger={bulkStatusConfirm === "inactive"}
          icon={
            bulkStatusConfirm === "active" ? (
              <CheckIcon className="h-6 w-6" />
            ) : (
              <XMarkIcon className="h-6 w-6" />
            )
          }
          iconWrapperClassName={
            bulkStatusConfirm === "active"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-rose-100 text-rose-600"
          }
        />
    </DashboardLayout>
  );
}

