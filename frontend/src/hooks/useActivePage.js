import { useParams, useNavigate } from 'react-router-dom';

export function useActivePage(basePath, defaultPage) {
  const { page } = useParams();
  const navigate  = useNavigate();

  const activePage    = page ?? defaultPage;
  const setActivePage = (newPage) => navigate(`${basePath}/${newPage}`);

  return [activePage, setActivePage];
}
