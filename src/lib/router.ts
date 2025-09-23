import { useLocation, useNavigate, useSearchParams as useRRSearchParams } from 'react-router-dom'

export function useRouter() {
  const navigate = useNavigate()
  return {
    push: (to: string) => navigate(to),
    replace: (to: string) => navigate(to, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    prefetch: async () => {},
  }
}

export function usePathname() {
  const { pathname } = useLocation()
  return pathname
}

export function useSearchParams() {
  const [params] = useRRSearchParams()
  return params
}

