'use client';

import { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, CheckCircle, File, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';

interface FileUploadProps {
  onFileProcessed?: (result: { documentId: string; filename: string }) => void;
  maxSize?: number;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  documentId?: string;
}

const FileUploaded = ({
  onFileProcessed,
  maxSize = 100 * 1024 * 1024,
}: FileUploadProps) => {
  const [currentFile, setCurrentFile] = useState<UploadFile | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    // ondrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformat-officedocument.wordprocessingml.document':
        ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
    maxSize,
    multiple: false,
  });

  return (
    <div className="w-full space-y-4">
      <Card className="border-2 border-dashed border-gray-300 transition-colors hover:border-gray-400">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`cursor-pointer text-center space-y-4 p-8 rounded-lg transition-colors ${isDragActive ? 'bg-gray-50 border-gray-400' : 'hover:bg-gray-50/50'}`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto w-12 h-12 text-gray-500">
              <Upload className="w-full h-full" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop file here' : 'Upload your document'}
              </h3>
              <p className="text-sm text-gray-600">
                Drag & drop file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Support PDF, DOCX, TXT, MD . Max {maxSize / 1024 / 1024}MB . One
                file at a time
              </p>
            </div>
            <Button
              variant="outline"
              type="button"
              className="border-gary-300 text-gray-700 hover:bg-gray-500 cursor-pointer"
            >
              Choose File
            </Button>
          </div>

          {/* current files */}
          {currentFile && (
            <Card>
              <CardContent className="p-4">
                ,<h4 className="font-medium mb-3">Current File</h4>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <File className="w-5 h-5 text-gray-600 flex-shrink-0" />

                  <div className="flex-1 min-w-0">
                    {/* badge & file name */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {currentFile.file.name}
                      </span>
                      <Badge
                        variant={
                          currentFile.status === 'completed'
                            ? 'default'
                            : currentFile.status === 'error'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {currentFile.status}
                      </Badge>
                    </div>
                    {/* file size */}
                    <div className="text-xs text-gray-500">
                      {(currentFile.file.size / 1024 / 1024).toFixed(1)}MB
                    </div>

                    {/* progress bar */}
                    {(currentFile.status === 'uploading' ||
                      currentFile.status === 'processing') && (
                      <div className="mt-2">
                        <Progress
                          value={currentFile.progress}
                          className="h-1"
                        />
                        <div className="text-xs text-gray-500 mb-1">
                          {currentFile.status === 'uploading'
                            ? 'Uploading...'
                            : 'Processing...'}
                        </div>
                      </div>
                    )}

                    {currentFile.error && (
                      <Alert className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {currentFile.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {currentFile.status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {currentFile.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        //   onClick={retryFile}
                      >
                        Retry
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      // onClick={removeFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileUploaded;
