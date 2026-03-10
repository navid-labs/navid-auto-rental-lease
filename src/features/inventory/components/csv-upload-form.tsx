'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { uploadInventoryCsv } from '../actions/inventory-upload';

type RowError = { row: number; message: string };

type UploadResult =
  | { success: true; count: number }
  | { success: false; error: string; rowErrors?: RowError[] };

export function CsvUploadForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await uploadInventoryCsv(formData);
      setResult(res);
      if (res.success && fileRef.current) {
        fileRef.current.value = '';
      }
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label
            htmlFor="csv-file"
            className="block text-sm font-medium text-foreground mb-1"
          >
            CSV 파일 선택
          </label>
          <input
            ref={fileRef}
            id="csv-file"
            name="file"
            type="file"
            accept=".csv"
            required
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/80 file:cursor-pointer"
          />
        </div>
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? '업로드 중...' : '업로드'}
        </Button>
      </form>

      {result && (
        <div
          className={`rounded-md p-3 text-sm ${
            result.success
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          }`}
        >
          {result.success ? (
            <p>{result.count}개 항목이 업로드되었습니다.</p>
          ) : (
            <div>
              <p className="font-medium">{result.error}</p>
              {result.rowErrors && result.rowErrors.length > 0 && (
                <ul className="mt-2 list-disc list-inside space-y-1">
                  {result.rowErrors.slice(0, 10).map((err) => (
                    <li key={err.row}>
                      {err.row}행: {err.message}
                    </li>
                  ))}
                  {result.rowErrors.length > 10 && (
                    <li>...외 {result.rowErrors.length - 10}건</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
