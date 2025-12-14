import React, { useState } from 'react';
import {
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Eye,
  Trash2,
  File,
  FileText,
  Image,
  Video,
  FolderOpen,
} from "lucide-react";
import { mockFiles } from '../data/mockData';
import { useDeviceDetection } from "../hooks/useDeviceDetection";

export default function Storage() {
  const { isMobile } = useDeviceDetection();
  const [files, setFiles] = useState(mockFiles);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (type: string) => {
    if (type.includes("image"))
      return <Image className="w-6 h-6 text-blue-500 dark:text-blue-400" />;
    if (type.includes("video"))
      return <Video className="w-6 h-6 text-purple-500 dark:text-purple-400" />;
    if (type.includes("pdf"))
      return <FileText className="w-6 h-6 text-red-500 dark:text-red-400" />;
    return <File className="w-6 h-6 text-gray-500 dark:text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(e.target.files || []);
    const newFiles = uploadedFiles.map(file => ({
      id: Date.now() + Math.random().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      uploadedBy: 'Sarah Johnson'
    }));
    setFiles([...files, ...newFiles]);
  };

  return (
    <div className="space-y-4 mobile:space-y-4 md:space-y-6">
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Cloud Storage
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your files and documents
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors shadow-lg hover:shadow-xl">
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Mobile Upload Button */}
      {isMobile && (
        <label className="w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 cursor-pointer transition-all shadow-lg hover:shadow-xl touch-target">
          <Upload className="w-5 h-5 mr-2" />
          Upload Files
          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      )}

      {/* Toolbar */}
      <div
        className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${
          isMobile ? "mobile-card" : "bg-white dark:bg-gray-800"
        }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-700">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}>
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length === 0 ? (
        <div
          className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center ${
            isMobile ? "mobile-card" : "bg-white dark:bg-gray-800"
          }`}>
          <FolderOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
            No files found
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
            {searchTerm
              ? "Try adjusting your search criteria"
              : "Upload your first file to get started"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 mobile:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mobile:gap-3 md:gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 mobile:p-3 md:p-4 hover:shadow-md dark:hover:shadow-lg transition-all ${
                isMobile ? "mobile-card" : "bg-white dark:bg-gray-800"
              }`}>
              <div className="flex items-center justify-between mb-3">
                {getFileIcon(file.type)}
                <div className="flex items-center space-x-1">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                    <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                {file.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {formatFileSize(file.size)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Uploaded by {file.uploadedBy} •{" "}
                {file.uploadedAt.toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={`rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${
            isMobile ? "mobile-card" : "bg-white dark:bg-gray-800"
          }`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uploaded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileIcon(file.type)}
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                          {file.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {file.uploadedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {file.uploadedAt.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                          <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                          <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
                          <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}