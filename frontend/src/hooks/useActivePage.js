import { useParams, useNavigate } from 'react-router-dom';

export function useActivePage(basePath, defaultPage) {
  const { id, page } = useParams();
  const navigate = useNavigate();

  const activePage = page ?? defaultPage;
  const setActivePage = (newPage) => navigate(`${basePath}/${id}/${newPage}`);

  return [activePage, setActivePage, id];
}
