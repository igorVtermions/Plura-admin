import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const renderPageNumbers = () => {
    const pages: (number | "dots")[] = [];

    for (let i = 1; i <= totalPages; i++) {
      const isEdge = i === 1 || i === totalPages;
      const isNearCurrent = Math.abs(i - currentPage) <= 1;

      if (isEdge || isNearCurrent) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "dots") {
        pages.push("dots");
      }
    }

    return pages.map((page, index) =>
      page === "dots" ? (
        <span key={`dots-${index}`} className="text-[#A196CE]">
          ...
        </span>
      ) : (
        <Button
          key={page}
          variant={page === currentPage ? "default" : "ghost"}
          className={`h-9 w-9 rounded-full text-base ${
            page === currentPage
              ? "bg-[#A277FF] text-white"
              : "text-[#7A6BAF]"
          }`}
          onClick={() => goToPage(page)}
        >
          {page}
        </Button>
      ),
    );
  };

  return (
    <div className="mt-10 flex justify-center">
      <nav className="flex items-center gap-3 text-[#1F1235]">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-[#E3DBFF] text-[#7A6BAF]"
          onClick={() => goToPage(currentPage - 1)}
        >
          {"<"}
        </Button>
        {renderPageNumbers()}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full border border-[#E3DBFF] text-[#7A6BAF]"
          onClick={() => goToPage(currentPage + 1)}
        >
          {">"}
        </Button>
      </nav>
    </div>
  );
};