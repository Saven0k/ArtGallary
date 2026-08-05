// src/pages/Authors/components/AuthorList/AuthorList.tsx
import { useEffect, useState } from "react";
import "./AuthorList.scss";
import { useLanguage } from "../../../../hooks/useLanguage";
import { authorsTranslations } from "./lang";
import { getAuthors, type AuthorProfileResponse } from "../../../../api/authors/main.api";
import AuthorCard from "./components/AuthorCard/AuthorCard";

interface AuthorListProps {
    filter?: string;
}

const AuthorList = ({ filter = "" }: AuthorListProps) => {
    const { language } = useLanguage();
    const t = authorsTranslations[language].authorList;

    const [authors, setAuthors] = useState<AuthorProfileResponse[]>([]);
    const [allAuthors, setAllAuthors] = useState<AuthorProfileResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const authorsPerPage = 4;

    useEffect(() => {
        const getAuthorList = async () => {
            setLoading(true);
            try {
                const data = await getAuthors(1, 100);
                if (data) {
                    setAllAuthors(data.data || []);
                }
            } catch (error) {
                console.error("getAuthorList error:", error);
            } finally {
                setLoading(false);
            }
        };

        getAuthorList();
    }, []);

    useEffect(() => {
        if (!filter || filter === "Все") {
            setAuthors(allAuthors);
            return;
        }

        const filtered = allAuthors.filter(
            (author) => author.authorProfile?.profession?.name === filter
        );
        setAuthors(filtered);
        setCurrentPage(1);
    }, [filter, allAuthors]);

    const totalPages = Math.ceil(authors.length / authorsPerPage);
    const startIndex = (currentPage - 1) * authorsPerPage;
    const endIndex = startIndex + authorsPerPage;
    const currentAuthors = authors.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleShowMore = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const getVisiblePages = (): (number | string)[] => {
        if (totalPages <= 0) return [];

        const pages: (number | string)[] = [1];

        if (currentPage > 3) {
            pages.push('...');
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
                pages.push(i);
            }
        }

        if (currentPage < totalPages - 2) {
            pages.push('...');
        }

        if (totalPages > 1 && !pages.includes(totalPages)) {
            pages.push(totalPages);
        }

        return pages;
    };

    if (loading) {
        return (
            <div className="author-list">
                <div className="author-list__loading">{t.loading}</div>
            </div>
        );
    }

    return (
        <div className="author-list">
            {authors.length > 0 ? (
                <>
                    <ul className="author-list__grid">
                        {currentAuthors.map((author) => (
                            <AuthorCard key={author.id} author={author} arts={[]} />
                        ))}
                    </ul>

                    {totalPages > 1 && (
                        <div className="author-list__pagination">
                            <button
                                className="author-list__pagination-btn"
                                onClick={handleShowMore}
                                disabled={currentPage >= totalPages}
                            >
                                {t.showMore}
                            </button>

                            <ul className="author-list__pagination-list">
                                {getVisiblePages().map((page, index) => (
                                    <li key={index} className="author-list__pagination-item">
                                        {typeof page === 'number' ? (
                                            <button
                                                className={`author-list__pagination-number ${
                                                    page === currentPage
                                                        ? 'author-list__pagination-number--active'
                                                        : ''
                                                }`}
                                                onClick={() => handlePageChange(page)}
                                            >
                                                {page}
                                            </button>
                                        ) : (
                                            <span className="author-list__pagination-dots">{page}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </>
            ) : (
                <span className="author-list__empty">{t.empty}</span>
            )}
        </div>
    );
};

export default AuthorList;