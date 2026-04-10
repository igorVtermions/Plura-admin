import React from 'react'
import { Link as RouterLink, LinkProps as RouterLinkProps } from 'react-router-dom'

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement>

type Props = Omit<AnchorProps, 'href'> & {
  href: RouterLinkProps['to']
}

export default function Link({ href, children, ...rest }: Props) {
  return (
    <RouterLink to={href as RouterLinkProps['to']} {...(rest as any)}>
      {children}
    </RouterLink>
  )
}

