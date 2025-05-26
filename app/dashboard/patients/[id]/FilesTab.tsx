"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface File {
  id: string;
  fileName: string;
  fileUrl: string;
  description?: string | null;
  uploadedBy?: string | null;
  createdAt: string;
}

interface FilesTabProps {
  files: File[];
}

export const FilesTab = ({ files }: FilesTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Файлы</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя файла</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead>Загрузил</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Ссылка</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Нет
                </TableCell>
              </TableRow>
            ) : (
              files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.fileName}</TableCell>
                  <TableCell>{file.description || "Нет"}</TableCell>
                  <TableCell>{file.uploadedBy || "Не указан"}</TableCell>
                  <TableCell>
                    {new Date(file.createdAt).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Скачать
                    </a>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
