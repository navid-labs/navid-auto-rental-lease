'use client';

type UploadStatusProps = {
  lastUploadTime: string | null;
};

export function UploadStatus({ lastUploadTime }: UploadStatusProps) {
  if (!lastUploadTime) {
    return (
      <p className="text-sm text-muted-foreground">업로드된 데이터 없음</p>
    );
  }

  const date = new Date(lastUploadTime);
  const formatted = date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <p className="text-sm text-muted-foreground">
      마지막 업데이트: {formatted}
    </p>
  );
}
