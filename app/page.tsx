'use client';

import { useState, useEffect, useMemo } from 'react';
import React from 'react';

// Define the User type for better type safety
interface User {
  id: number;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
}

const PAGE_SIZE = 8; // Number of items per page

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMessage, setShowExportMessage] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/users');
        const data = await res.json();
        // Add a random 'status' field to each user
        const usersWithStatus = data.map((user: User) => ({
          ...user,
          status: Math.random() > 0.5 ? 'Active' : 'Inactive',
        }));
        setUsers(usersWithStatus);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtering logic based on search term and status
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by search term (case-insensitive)
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status dropdown
    if (statusFilter !== 'All') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    return filtered;
  }, [users, searchTerm, statusFilter]);

  // Sorting logic
  const sortedUsers = useMemo(() => {
    if (!sortConfig) {
      return filteredUsers;
    }
    return [...filteredUsers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredUsers, sortConfig]);

  // Pagination logic
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return sortedUsers.slice(start, end);
  }, [sortedUsers, currentPage]);

  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE);

  // Function to handle row selection
  const handleSelectRow = (userId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedRows([...selectedRows, userId]);
    } else {
      setSelectedRows(selectedRows.filter((id) => id !== userId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedRows(paginatedUsers.map((user) => user.id));
    } else {
      setSelectedRows([]);
    }
  };

  // Action handlers
  const handleEdit = (user: User) => {
    console.log('Editing user:', user);
    // In a real app, this would open a modal or navigate to an edit page.
  };

  const handleDelete = (userId: number) => {
    const newUsers = users.filter((user) => user.id !== userId);
    setUsers(newUsers);
    setSelectedRows(selectedRows.filter(id => id !== userId));
  };

  const handleToggleStatus = (userId: number) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === 'Active' ? 'Inactive' : 'Active',
            }
          : user
      )
    );
  };

  // Sort handler
  const requestSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof User) => {
    if (sortConfig?.key !== key) {
      return '';
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  // Export to CSV
  const handleExport = (exportAll: boolean) => {
    const dataToExport = exportAll
      ? users
      : users.filter((user) => selectedRows.includes(user.id));

    if (dataToExport.length === 0) {
      setShowExportMessage(true);
      setTimeout(() => setShowExportMessage(false), 3000);
      return;
    }

    const headers = ['ID', 'Name', 'Email', 'Status'];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...dataToExport.map((user) =>
          [user.id, user.name, user.email, user.status].join(',')
        ),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'user_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen p-4 bg-blue-50 text-gray-900 font-sans flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-black">
          Dynamic User Table
        </h1>
        {showExportMessage && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-lg animate-fade-in-down transition-all">
                Please select at least one row to export.
            </div>
        )}

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full sm:w-1/2 p-2.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
          />
          <div className="flex w-full sm:w-auto items-center space-x-4">
            <select
              className="w-full sm:w-auto p-2.5 rounded-lg border border-gray-300 bg-white transition-all shadow-sm"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1); // Reset to first page on filter change
              }}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
              <button
                onClick={() => handleExport(false)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedRows.length === 0}
              >
                Export Selected
              </button>
              <button
                onClick={() => handleExport(true)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors"
              >
                Export All
              </button>
            </div>
          </div>
        </div>
        
        {/* Table Section */}
        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && selectedRows.length === paginatedUsers.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none group"
                  onClick={() => requestSort('id')}
                >
                  <div className="flex items-center">
                    ID {getSortIcon('id')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none group"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    Name {getSortIcon('name')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer select-none group"
                  onClick={() => requestSort('email')}
                >
                  <div className="flex items-center">
                    Email {getSortIcon('email')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-sm text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(user.id)}
                        onChange={(e) => handleSelectRow(user.id, e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.id}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 transition-colors font-medium"
                          title="Edit"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zm-3.793 3.793l-4.243 4.243a1 1 0 00-.282.53l-.5 2.5a1 1 0 00.928 1.157l2.5-.5a1 1 0 00.53-.282l4.243-4.243a1 1 0 000-1.414l-2.828-2.828a1 1 0 00-1.414 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className="text-orange-500 hover:text-orange-700 transition-colors font-medium"
                          title="Toggle Status"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 12a9 9 0 0 0-9-9c-3.34 0-6.18 2.37-7.16 5.5l-1.44-1.44m-.02 6.54A9 9 0 0 0 12 21c3.34 0 6.18-2.37 7.16-5.5l1.44 1.44"/></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900 transition-colors font-medium"
                          title="Delete"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-sm text-gray-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg bg-blue-200 text-blue-800 hover:bg-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg bg-blue-200 text-blue-800 hover:bg-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
