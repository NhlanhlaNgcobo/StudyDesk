"use client";

import React, { useState, useCallback, useRef } from "react";
import { Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DocumentUploaderProps {
  onUploadComplete: (url: string) => void;
  className?: string;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function DocumentUploader({ onUploadComplete, className }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    const validExtensions = [".pdf", ".docx", ".doc"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) {
      setUploadState("error");
      setErrorMessage("Invalid file type. Only PDF and DOCX are allowed.");
      return;
    }

    setUploadState("uploading");
    setProgress(0);
    setErrorMessage("");

    try {
      // 1. Fetch short-lived signature and keys
      setProgress(10);
      const signRes = await fetch("/api/upload/sign?folder=studydesk/modules");
      if (!signRes.ok) {
        throw new Error("Failed to get upload credentials.");
      }
      const { signature, timestamp, cloudName, apiKey, folder } = await signRes.json();
      setProgress(30);

      // 2. Prepare FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", folder);

      // 3. Upload raw file directly to Cloudinary using XHR to track progress
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 70);
            setProgress(30 + percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            setProgress(100);
            setUploadState("success");
            onUploadComplete(response.secure_url);
            resolve();
          } else {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error?.message || "Cloudinary upload failed."));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during file upload."));
        };

        xhr.send(formData);
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadState("error");
      setErrorMessage(error.message || "An unexpected error occurred during upload.");
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (uploadState === "uploading" || uploadState === "success") return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        uploadFile(files[0]);
      }
    },
    [uploadState] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
  };

  return (
    <div className={cn("w-full relative h-full flex flex-col", className)}>
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (uploadState === "idle" || uploadState === "error") {
            fileInputRef.current?.click();
          }
        }}
        animate={{
          borderColor: isDragging ? "var(--primary)" : "var(--border)",
        }}
        className={cn(
          "h-full w-full rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 flex flex-col items-center justify-center text-center py-20 group transition-all shadow-sm",
          (uploadState === "idle" || uploadState === "error") &&
            "cursor-pointer hover:border-primary hover:bg-primary/5",
          isDragging && "border-primary bg-primary/5"
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {uploadState === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload size={36} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tight text-slate-900 dark:text-white">
                Drop your PDFs here
              </h3>
              <p className="text-text-secondary font-medium max-w-xs mx-auto">
                Upload lecture notes, slides, or chapters to start generating AI study kits.
              </p>
              <div className="mt-8 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-base font-black uppercase text-xs tracking-widest shadow-lg shadow-slate-200/20 group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all text-slate-800 dark:text-slate-200">
                Browse Local Files
              </div>
            </motion.div>
          )}

          {uploadState === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-6 w-full max-w-xs justify-center h-full"
            >
              <Loader2 size={48} className="text-primary animate-spin" />
              <div className="w-full space-y-3">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>Uploading securely...</span>
                  <span className="text-primary">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {uploadState === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 justify-center h-full"
            >
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-2">
                <CheckCircle size={40} />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-green-600 dark:text-green-500">
                Upload Complete!
              </h3>
              <p className="text-sm font-bold text-slate-500">
                Processing your file for AI power-ups.
              </p>
            </motion.div>
          )}

          {uploadState === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4 justify-center h-full"
            >
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-2">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-xl font-black tracking-tight text-red-600 dark:text-red-500">
                Upload Failed
              </h3>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center max-w-xs leading-relaxed">
                {errorMessage}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadState("idle");
                }}
                className="mt-6 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-base font-black uppercase text-xs tracking-widest hover:border-slate-300 dark:hover:border-slate-600 transition-all text-slate-800 dark:text-slate-200"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
