import Link from "next/link";

import type { ProductSizeGuide } from "@shared/config";
import { Button } from "@shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@shared/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@shared/ui/table";

const linkClass = "text-300 underline underline-offset-4 hover:no-underline";

/** «Таблица размеров»: ссылка на страницу с таблицей или таблица во всплывающем окне */
export function SizeGuide({ guide }: { guide: ProductSizeGuide }) {
  if ("href" in guide) {
    return (
      <Link href={guide.href} className={linkClass}>
        {guide.label}
      </Link>
    );
  }

  const [head = [], ...rows] = guide.table;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="bare" size="bare" className={linkClass}>
          {guide.label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-600 font-normal">{guide.title}</DialogTitle>
          {guide.note ? <DialogDescription className="text-300">{guide.note}</DialogDescription> : null}
        </DialogHeader>
        <Table className="text-300">
          <TableHeader>
            <TableRow>
              {head.map((cell) => (
                <TableHead key={cell} className="font-normal text-muted-foreground">
                  {cell}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.join("|")}>
                {row.map((cell, index) => (
                  <TableCell key={`${index}-${cell}`}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
